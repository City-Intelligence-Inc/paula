// Pure field-projection helpers — role-based stripping of student/session rows
// before they cross the wire. Deliberately dependency-free (no Clerk, no ddb,
// no "@/" runtime imports) so it loads directly under `node --test`. access.ts
// re-exports these; call sites import them from either place.

// Pricing/billing fields a tutor must never see (5/17 Paula — pricing blind to
// tutors). Master admin + admin keep them.
export function stripPricingFromStudent<T extends Record<string, unknown>>(
  student: T,
): T {
  const { rate: _r, stripeCustomerId: _s, primaryPayerParentId: _p, ...rest } =
    student as Record<string, unknown>;
  void _r;
  void _s;
  void _p;
  return rest as T;
}

// Contact channels a tutor must never see (R-5 — "Tutors CANNOT access parent
// or student emails and/or other contact details"). Names are kept (a tutor
// needs to know whose session it is); only the contact channels are removed.
// Master admin + admin/office staff keep them.
export function stripContactFromStudent<T extends Record<string, unknown>>(
  student: T,
): T {
  const { parentEmail: _pe, parentPhone: _pp, studentEmail: _se, ...rest } =
    student as Record<string, unknown>;
  void _pe;
  void _pp;
  void _se;
  return rest as T;
}

export function stripPricingFromSession<T extends Record<string, unknown>>(
  session: T,
): T {
  const { rate: _r, amountCents: _a, payers: _p, ...rest } =
    session as Record<string, unknown>;
  void _r;
  void _a;
  void _p;
  return rest as T;
}
