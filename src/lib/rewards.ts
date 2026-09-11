import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { pctForHits, REWARD_TTL_MS, TOTAL_SHOTS } from "./reward-tiers";

/**
 * Game rewards (Cloudflare D1).
 *
 * SERVER ONLY. The rule that makes this safe is the same one pricing.ts
 * follows: the browser says WHAT happened (a score), never what it is worth.
 * `pct` is computed here from the shared tier table and read back from the
 * database at checkout, so a hand-edited request body can't price anything.
 *
 * See migrations/0002_game_rewards.sql for the schema and why a code is
 * deliberately a bearer token.
 */

export type RewardRow = {
  code: string;
  created_at: string;
  expires_at: string;
  pct: number;
  hits: number;
  used_at: string | null;
  order_id: string | null;
  ip: string | null;
};

const db = () => getCloudflareContext().env.DB;

/**
 * Same alphabet as order ids — no I, L, O, U — so a code read down the phone
 * or typed off a screenshot can't turn into a different one.
 *
 * 32^6 is ~1 billion. Guessing is not the threat here (every visitor can win
 * one by playing), so this only has to make accidental collisions impossible.
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `DEVIL-${out}`;
}

/**
 * Rows one origin may mint per hour.
 *
 * NOT anti-cheat — the discount is meant to be winnable by anyone, repeatedly,
 * and that is a business decision already taken. This exists purely so a script
 * in a loop can't fill the table. A real player replaying hard tops out around
 * one round a minute.
 */
const MAX_PER_IP_PER_HOUR = 40;

export type CreateRewardResult =
  | { ok: true; code: string; pct: number; expiresAt: string }
  | { ok: false; reason: "invalid-score" | "no-tier" | "rate-limited" };

/**
 * Turns a finished round into a stored reward.
 *
 * `hits` is the only thing taken from the caller, and it is bounded by the same
 * TOTAL_SHOTS the game enforces — a score of 900 is a tampered payload, not a
 * very good player.
 */
export async function createReward(input: {
  hits: number;
  ip: string | null;
}): Promise<CreateRewardResult> {
  const hits = Math.floor(input.hits);
  if (!Number.isFinite(hits) || hits < 0 || hits > TOTAL_SHOTS) {
    return { ok: false, reason: "invalid-score" };
  }

  const pct = pctForHits(hits);
  if (pct <= 0) return { ok: false, reason: "no-tier" };

  const now = new Date();
  const nowIso = now.toISOString();

  if (input.ip) {
    const since = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const row = await db()
      .prepare(`SELECT COUNT(*) AS n FROM game_rewards WHERE ip = ?1 AND created_at > ?2`)
      .bind(input.ip, since)
      .first<{ n: number }>();
    if ((row?.n ?? 0) >= MAX_PER_IP_PER_HOUR) {
      return { ok: false, reason: "rate-limited" };
    }
  }

  const code = newCode();
  const expiresAt = new Date(now.getTime() + REWARD_TTL_MS).toISOString();

  await db()
    .prepare(
      `INSERT INTO game_rewards (code, created_at, expires_at, pct, hits, ip)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(code, nowIso, expiresAt, pct, hits, input.ip)
    .run();

  return { ok: true, code, pct, expiresAt };
}

/**
 * The reward a code can still be spent on, or null.
 *
 * Unused and unexpired are both checked in SQL rather than in JS, so there is
 * one definition of "redeemable" and pricing can't accidentally use a looser
 * one. ISO-8601 UTC strings are fixed-width, so a lexicographic `>` is a
 * chronological comparison — the same property `ORDER BY created_at` already
 * relies on in orders.ts.
 */
export async function findRedeemableReward(code: string): Promise<RewardRow | null> {
  if (!code) return null;
  return await db()
    .prepare(
      `SELECT * FROM game_rewards
        WHERE code = ?1 AND used_at IS NULL AND expires_at > ?2`,
    )
    .bind(code.trim().toUpperCase(), new Date().toISOString())
    .first<RewardRow>();
}

/**
 * Spends a code, once.
 *
 * `used_at IS NULL` makes this idempotent the same way markOrderPaid() is: of
 * the racing confirmation paths exactly one updates a row. Returns false when
 * the code was already spent — which the caller must NOT treat as an error,
 * because by then the customer has already paid the discounted amount.
 */
export async function markRewardUsed(code: string, orderId: string): Promise<boolean> {
  const res = await db()
    .prepare(
      `UPDATE game_rewards SET used_at = ?1, order_id = ?2
        WHERE code = ?3 AND used_at IS NULL`,
    )
    .bind(new Date().toISOString(), orderId, code)
    .run();
  return (res.meta.changes ?? 0) > 0;
}
