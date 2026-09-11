import { createReward } from "@/lib/rewards";

/**
 * Turns a finished round of "Devil's Aim" into a redeemable discount.
 *
 * The request says how many skulls were hit. It does NOT say what that is
 * worth — the percentage is decided by createReward() from the shared tier
 * table and stored server-side, exactly the way priceCart() refuses to read a
 * price out of a cart payload.
 *
 * POST is never cached by Next.js, so no route config is needed to keep this
 * dynamic.
 */

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Malformed request." }, 400);
  }

  const payload =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  // Number(true) is 1 and Number("") is 0 — check the type before coercing.
  if (typeof payload.hits !== "number" || !Number.isFinite(payload.hits)) {
    return json({ error: "Invalid score." }, 400);
  }

  // Cloudflare sets this and strips any client-supplied copy, so it can't be
  // spoofed to dodge the flood guard. Absent when running `next dev` locally.
  const ip = request.headers.get("cf-connecting-ip");

  let result;
  try {
    result = await createReward({ hits: payload.hits, ip });
  } catch (err) {
    // A failed reward must never break the game. The player keeps their score
    // and simply doesn't get a code.
    console.error("game/reward failed", err);
    return json({ error: "Could not save your reward." }, 500);
  }

  if (!result.ok) {
    if (result.reason === "invalid-score") return json({ error: "Invalid score." }, 400);
    // Not an error the player should see as a failure — they genuinely didn't
    // clear the lowest tier.
    if (result.reason === "no-tier") return json({ reward: null });
    return json({ error: "Too many rounds just now. Try again shortly." }, 429);
  }

  return json({
    reward: { code: result.code, pct: result.pct, expiresAt: result.expiresAt },
  });
}
