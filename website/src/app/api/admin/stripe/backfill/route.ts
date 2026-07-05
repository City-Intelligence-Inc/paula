import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";
import { getStripe, ensureDefaultCard } from "@/lib/server/stripe";

// POST /api/admin/stripe/backfill?dryRun=1  (master admin only)
//
// One-time reconciliation: the app has ~100 families whose parent rows never
// got a stripeCustomerId, even though those clients already exist in Stripe
// (with cards) from before the app managed billing. Without the link the
// charge path reports "No Stripe customer on file". This matches each unlinked
// parent to an existing Stripe customer BY EMAIL and, when that customer has a
// card on file, writes the link back so the family becomes chargeable — no
// re-entering cards.
//
// dryRun=1 (default) previews without writing. Pass ?dryRun=0 to commit.
// Never charges anything; only reads Stripe + links customer IDs.

interface ParentRow {
  id: string;
  email?: string;
  familyId?: string;
  stripeCustomerId?: string;
}

export async function POST(request: Request) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isMaster) {
    return forbidden("Only the super admin can run the Stripe backfill.");
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") !== "0";
  const stripe = await getStripe();
  const c = ddb();

  // All parents (full scan — no Limit; a filtered/limited scan silently drops
  // rows, see the charge-path fix).
  const scan = await c.send(new ScanCommand({ TableName: Tables.parents }));
  const parents = (scan.Items || []) as ParentRow[];

  let alreadyLinked = 0;
  let noEmail = 0;
  let linkedWithCard = 0;
  let matchedNoCard = 0;
  let noStripeMatch = 0;
  const linked: { parentId: string; email: string; customerId: string }[] = [];
  const skippedNoCard: { parentId: string; email: string; customerId: string }[] = [];

  for (const p of parents) {
    if (p.stripeCustomerId) {
      alreadyLinked++;
      continue;
    }
    const email = (p.email || "").trim().toLowerCase();
    if (!email) {
      noEmail++;
      continue;
    }

    // Find existing Stripe customers with this email.
    let customers: { id: string; created: number }[] = [];
    try {
      const list = await stripe.customers.list({ email, limit: 20 });
      customers = list.data.map((cu) => ({ id: cu.id, created: cu.created }));
    } catch {
      noStripeMatch++;
      continue;
    }
    if (customers.length === 0) {
      noStripeMatch++;
      continue;
    }

    // Prefer a customer that actually has a card; newest first.
    customers.sort((a, b) => b.created - a.created);
    let chosen: string | null = null;
    for (const cu of customers) {
      try {
        const pms = await stripe.paymentMethods.list({
          customer: cu.id,
          type: "card",
          limit: 1,
        });
        if (pms.data.length > 0) {
          chosen = cu.id;
          break;
        }
      } catch {
        // ignore this candidate
      }
    }

    if (!chosen) {
      // A customer exists but has no card — linking wouldn't make them
      // chargeable, so record it but don't link (they still need a card).
      matchedNoCard++;
      skippedNoCard.push({ parentId: p.id, email, customerId: customers[0].id });
      continue;
    }

    if (!dryRun) {
      await c.send(
        new UpdateCommand({
          TableName: Tables.parents,
          Key: { id: p.id },
          UpdateExpression: "SET stripeCustomerId = :s, updatedAt = :u",
          ExpressionAttributeValues: {
            ":s": chosen,
            ":u": new Date().toISOString(),
          },
        }),
      );
      // Keep the single-default-card invariant intact for the linked customer.
      await ensureDefaultCard(stripe, chosen).catch(() => {});
    }
    linkedWithCard++;
    linked.push({ parentId: p.id, email, customerId: chosen });
  }

  return Response.json({
    dryRun,
    totals: {
      parentsScanned: parents.length,
      alreadyLinked,
      noEmail,
      linkedWithCard,
      matchedNoCard,
      noStripeMatch,
    },
    linked,
    skippedNoCard,
  });
}
