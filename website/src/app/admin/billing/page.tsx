import { redirect } from "next/navigation";

// The session-based "Billing approval queue" was removed (Paula, 2026-07-05).
// Charging now lives entirely on the Payments tab — per-student monthly charges
// plus the flat-rate / one-off charger moved there. Keep this route as a
// redirect so any bookmark or old link lands in the right place.
export default function AdminBillingRedirect() {
  redirect("/admin/payments");
}
