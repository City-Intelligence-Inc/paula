import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type Stripe from "stripe";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";
import { getStripe, isStripeConfigured } from "@/lib/server/stripe";

// GET /api/admin/stripe/diagnostics
//   → overview: every family, with DB-only flags (no Stripe calls) so it's
//     cheap to scan. Flags families where >1 parent carries a Stripe customer
//     (the duplicate-customer case behind "cards not syncing").
//
// GET /api/admin/stripe/diagnostics?familyId=fam_...
//   → detail: pulls each parent's Stripe customer + cards + default PM and
//     computes per-parent and family-level mismatch flags.
//
// Read-only. Never mutates Stripe or DynamoDB.

interface ParentRow {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  clerkUserId?: string;
  stripeCustomerId?: string;
  familyId?: string;
}

interface FamilyRow {
  id: string;
  primaryPayerId?: string;
}

function parentName(p: ParentRow): string {
  const n = `${p.firstName || ""} ${p.lastName || ""}`.trim();
  return n || p.email || p.id;
}

function familyLabel(parents: ParentRow[], familyId: string): string {
  const last = parents.map((p) => p.lastName).filter(Boolean) as string[];
  if (last.length) {
    // Most common last name wins (handles step-families with mixed names).
    const counts = new Map<string, number>();
    for (const l of last) counts.set(l, (counts.get(l) || 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    return `${top} family`;
  }
  return familyId;
}

async function scanAll<T>(table: string): Promise<T[]> {
  const out: T[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const r = await ddb().send(
      new ScanCommand({ TableName: table, ExclusiveStartKey }),
    );
    out.push(...((r.Items as T[]) || []));
    ExclusiveStartKey = r.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);
  return out;
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  if (!(await isStripeConfigured())) {
    return Response.json(
      { error: "Stripe is not configured." },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const familyId = searchParams.get("familyId") || undefined;

  try {
    return familyId
      ? await detail(familyId)
      : await overview();
  } catch (err) {
    console.error("[stripe/diagnostics]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Diagnostics failed" },
      { status: 500 },
    );
  }
}

// ---- Overview (DB-only) --------------------------------------------------

async function overview(): Promise<Response> {
  const [parents, families] = await Promise.all([
    scanAll<ParentRow>(Tables.parents),
    scanAll<FamilyRow>(Tables.families),
  ]);

  const byFamily = new Map<string, ParentRow[]>();
  for (const p of parents) {
    if (!p.familyId) continue;
    const arr = byFamily.get(p.familyId) || [];
    arr.push(p);
    byFamily.set(p.familyId, arr);
  }

  const famPrimary = new Map<string, string | undefined>();
  for (const f of families) famPrimary.set(f.id, f.primaryPayerId);

  const items = [...byFamily.entries()].map(([fid, fParents]) => {
    const distinctCustomers = new Set(
      fParents.map((p) => p.stripeCustomerId).filter(Boolean) as string[],
    );
    const primaryPayerId = famPrimary.get(fid);
    const primary = fParents.find((p) => p.id === primaryPayerId);

    const flags: string[] = [];
    if (distinctCustomers.size > 1) flags.push("multiple-customers");
    if (primaryPayerId && primary && !primary.stripeCustomerId) {
      flags.push("primary-payer-no-customer");
    }
    if (!primaryPayerId && distinctCustomers.size > 0) {
      flags.push("no-primary-payer-set");
    }

    return {
      familyId: fid,
      label: familyLabel(fParents, fid),
      primaryPayerId: primaryPayerId || null,
      parentCount: fParents.length,
      distinctCustomerCount: distinctCustomers.size,
      flags,
    };
  });

  // Families with flags float to the top, then by label.
  items.sort((a, b) => {
    if ((b.flags.length > 0 ? 1 : 0) !== (a.flags.length > 0 ? 1 : 0)) {
      return (b.flags.length > 0 ? 1 : 0) - (a.flags.length > 0 ? 1 : 0);
    }
    return a.label.localeCompare(b.label);
  });

  return Response.json({
    mode: "overview",
    familyCount: items.length,
    flaggedCount: items.filter((i) => i.flags.length > 0).length,
    families: items,
  });
}

// ---- Detail (hits Stripe for one family) ---------------------------------

async function detail(familyId: string): Promise<Response> {
  const c = ddb();
  const [famR, parentsR] = await Promise.all([
    c.send(new GetCommand({ TableName: Tables.families, Key: { id: familyId } })),
    c.send(
      new ScanCommand({
        TableName: Tables.parents,
        FilterExpression: "familyId = :f",
        ExpressionAttributeValues: { ":f": familyId },
      }),
    ),
  ]);

  const family = (famR.Item as FamilyRow) || { id: familyId };
  const parents = ((parentsR.Items as ParentRow[]) || []).slice();
  if (parents.length === 0) {
    return Response.json({ error: "No parents on this family." }, { status: 404 });
  }

  const stripe = await getStripe();
  const primaryPayerId = family.primaryPayerId;

  const parentDetails = await Promise.all(
    parents.map(async (p) => {
      const isPrimaryPayer = p.id === primaryPayerId;
      const base = {
        id: p.id,
        name: parentName(p),
        email: p.email || null,
        clerkUserId: p.clerkUserId || null,
        isPrimaryPayer,
        stripeCustomerId: p.stripeCustomerId || null,
      };

      if (!p.stripeCustomerId) {
        const flags: string[] = [];
        if (isPrimaryPayer) flags.push("primary-payer-no-customer");
        return { ...base, customerExists: false, customerDeleted: false, defaultPaymentMethodId: null, cards: [], flags };
      }

      let customerDeleted = false;
      let customerExists = true;
      let defaultPaymentMethodId: string | null = null;
      let cards: Array<{
        id: string;
        brand?: string;
        last4?: string;
        expMonth?: number;
        expYear?: number;
        isDefault: boolean;
        created: string;
      }> = [];

      try {
        const customer = await stripe.customers.retrieve(p.stripeCustomerId);
        if ("deleted" in customer && customer.deleted) {
          customerDeleted = true;
          customerExists = false;
        } else {
          const cust = customer as Stripe.Customer;
          const raw = cust.invoice_settings?.default_payment_method;
          defaultPaymentMethodId =
            typeof raw === "string" ? raw : raw?.id || null;
          const pmList = await stripe.paymentMethods.list({
            customer: p.stripeCustomerId,
            type: "card",
            limit: 20,
          });
          cards = pmList.data.map((pm) => ({
            id: pm.id,
            brand: pm.card?.brand,
            last4: pm.card?.last4,
            expMonth: pm.card?.exp_month,
            expYear: pm.card?.exp_year,
            isDefault: pm.id === defaultPaymentMethodId,
            created: new Date(pm.created * 1000).toISOString(),
          }));
        }
      } catch (err) {
        // A customer ID that Stripe can't resolve (wrong mode, deleted, typo).
        console.warn("[diagnostics] customer fetch failed", p.stripeCustomerId, err);
        customerExists = false;
      }

      const flags: string[] = [];
      if (customerDeleted) flags.push("customer-deleted");
      else if (!customerExists) flags.push("customer-unresolvable");
      if (customerExists) {
        if (cards.length > 0 && !isPrimaryPayer) flags.push("has-card-not-primary");
        if (cards.length > 0 && !defaultPaymentMethodId) flags.push("no-default-set");
        if (
          defaultPaymentMethodId &&
          !cards.some((card) => card.id === defaultPaymentMethodId)
        ) {
          flags.push("default-not-attached");
        }
        if (isPrimaryPayer && cards.length === 0) flags.push("primary-payer-no-card");
      }

      return {
        ...base,
        customerExists,
        customerDeleted,
        defaultPaymentMethodId,
        cards,
        flags,
      };
    }),
  );

  const distinctCustomers = new Set(
    parents.map((p) => p.stripeCustomerId).filter(Boolean) as string[],
  );
  const familyFlags: string[] = [];
  if (distinctCustomers.size > 1) familyFlags.push("multiple-customers");
  if (!primaryPayerId) familyFlags.push("no-primary-payer-set");
  const anyCardOffPrimary = parentDetails.some((p) =>
    p.flags.includes("has-card-not-primary"),
  );
  if (anyCardOffPrimary) familyFlags.push("card-on-non-primary-payer");

  return Response.json({
    mode: "detail",
    familyId,
    label: familyLabel(parents, familyId),
    primaryPayerId: primaryPayerId || null,
    distinctCustomerCount: distinctCustomers.size,
    flags: familyFlags,
    parents: parentDetails,
  });
}
