/**
 * What a score in "Devil's Aim" is worth.
 *
 * Imported by BOTH the game and the server, deliberately. The game uses it to
 * show the reward climbing while you play; the server uses it to decide what
 * actually gets written to the database. Two copies would drift the first time
 * anyone retunes the game, and then the discount a customer is promised stops
 * matching the discount they are given.
 *
 * Retune HERE and nowhere else. No percentage is hardcoded downstream.
 *
 * Pure data — no `server-only`, no imports. It has to be reachable from a
 * client component.
 */

/** Shots in a round. The server rejects any score above this. */
export const TOTAL_SHOTS = 15;

/**
 * Hits needed for each tier, richest first.
 *
 * The 5-hit floor is low on purpose: a round should almost never be a waste of
 * time, and missing it by one is a reason to press "play again" rather than a
 * reason to leave. 20% needs 14 of 15 — you are allowed exactly one miss.
 */
export const TIERS = [
  { min: 14, pct: 20 },
  { min: 10, pct: 15 },
  { min: 5, pct: 10 },
] as const;

/** Independent ceiling, re-checked when pricing. A retune here can raise the
    tiers but can never hand out more than the business agreed to. */
export const MAX_PCT = 20;

export const tierFor = (hits: number) => TIERS.find((t) => hits >= t.min) ?? null;

/** 0 when the round didn't clear the lowest tier. */
export const pctForHits = (hits: number) => tierFor(hits)?.pct ?? 0;

/** The next tier up, for the "2 more for 15%" nudge mid-round. */
export const nextTier = (hits: number) => {
  const above = TIERS.filter((t) => hits < t.min);
  return above.length ? above[above.length - 1] : null;
};

/**
 * What a reward takes off a subtotal, in paise.
 *
 * Rounded to whole RUPEES on purpose. Every price on this store is a whole
 * number of rupees and inr() prints no paise, so 10% of ₹1,998 landing at
 * ₹199.80 would render as "−₹200 / total ₹1,798" next to a Razorpay page
 * charging ₹1,798.20. Rounding to the rupee keeps what the customer reads and
 * what they are charged the same number.
 *
 * Shared by the cart, the checkout summary and the server precisely so those
 * three can never disagree — a discount computed in two places is a discount
 * that eventually differs.
 */
export function discountPaiseFor(subtotalPaise: number, pct: number): number {
  const safePct = Math.min(Math.max(Math.floor(pct), 0), MAX_PCT);
  if (safePct <= 0 || subtotalPaise <= 0) return 0;
  return Math.round((subtotalPaise * safePct) / 100 / 100) * 100;
}

/**
 * How long a won reward lasts.
 *
 * This is a conversion tool, not a security control. Nothing here resists a
 * determined player — the point is that a discount with a clock on it gets
 * spent now instead of forgotten.
 */
export const REWARD_TTL_MS = 30 * 60 * 1000;
