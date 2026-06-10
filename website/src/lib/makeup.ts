// Makeup-session policy: a parent who cancels a scheduled session with at
// least MAKEUP_NOTICE_DAYS of advance notice earns a makeup credit (the
// session is rescheduled, no penalty). Less notice → the session is forfeited.
//
// ASSUMPTION (pending the contract in StarDrop): the threshold is 30 calendar
// days and notice is measured as whole days between the cancellation moment
// and the session's start. Change MAKEUP_NOTICE_DAYS here when the contract is
// confirmed — the API + UI read from this constant.

export const MAKEUP_NOTICE_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type MakeupStatus = "available" | "scheduled" | "not-eligible";

export interface CancellationEvaluation {
  /** Whole days of notice (session start − cancellation), floored. Negative if cancelled after the session. */
  noticeDays: number;
  /** True when noticeDays ≥ MAKEUP_NOTICE_DAYS. */
  makeupEligible: boolean;
  /** Resolved makeup status for a freshly cancelled session. */
  makeupStatus: MakeupStatus;
}

/**
 * Whole days of advance notice between a cancellation and the session start.
 * Floored, so 30 days minus one minute counts as 29. Returns 0 for unparseable
 * input and a negative number if the cancellation is after the session.
 */
export function computeNoticeDays(
  sessionDateTime: string,
  cancelledAt: string,
): number {
  const session = new Date(sessionDateTime).getTime();
  const cancelled = new Date(cancelledAt).getTime();
  if (Number.isNaN(session) || Number.isNaN(cancelled)) return 0;
  return Math.floor((session - cancelled) / MS_PER_DAY);
}

export function isMakeupEligible(noticeDays: number): boolean {
  return noticeDays >= MAKEUP_NOTICE_DAYS;
}

/** Evaluate a cancellation into the fields stored on the session record. */
export function evaluateCancellation(
  sessionDateTime: string,
  cancelledAt: string,
): CancellationEvaluation {
  const noticeDays = computeNoticeDays(sessionDateTime, cancelledAt);
  const makeupEligible = isMakeupEligible(noticeDays);
  return {
    noticeDays,
    makeupEligible,
    makeupStatus: makeupEligible ? "available" : "not-eligible",
  };
}
