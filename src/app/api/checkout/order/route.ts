import { validateCustomer } from "@/lib/customer";
import { createPendingOrder, newOrderId } from "@/lib/orders";
import { isPricingError, priceCart, withReward } from "@/lib/pricing";
import { findRedeemableReward } from "@/lib/rewards";
import {
  createOrder,
  isConfigured,
  isTestMode,
  publicKeyId,
  RazorpayConfigError,
} from "@/lib/razorpay";

/**
 * Step 1 of checkout: turn a cart into a payable Razorpay order.
 *
 * The request says WHAT is being bought. It does not say what that costs — the
 * total is computed here from the catalogue and is the only figure sent to
 * Razorpay. See priceCart().
 *
 * POST is never cached by Next.js, so no route config is needed to keep this
 * dynamic.
 */

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function POST(request: Request) {
  if (!isConfigured()) {
    return json(
      { error: "Payments aren't switched on yet. Please contact us to order." },
      503,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Malformed request." }, 400);
  }

  const payload =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  // ── who's ordering ──
  const customerResult = validateCustomer(payload.customer);
  if (!customerResult.ok) {
    return json(
      { error: "Please check your delivery details.", fields: customerResult.errors },
      400,
    );
  }

  // ── what it costs (server-side, always) ──
  const base = priceCart(payload.cart);
  if (isPricingError(base)) return json({ error: base.error }, 400);

  /**
   * ── the game discount ──
   *
   * The body carries a CODE, never a percentage. The percentage is read off
   * the game_rewards row the server wrote when the round finished, so editing
   * the request can at most name a code you already hold.
   *
   * An unknown, spent or expired code is silently ignored rather than
   * rejected: the response reports the discount actually applied, and the
   * checkout UI reconciles against that. Failing the whole order because a
   * 30-minute timer lapsed mid-checkout would lose a sale over a discount.
   */
  const rewardCode =
    typeof payload.rewardCode === "string" ? payload.rewardCode.trim().toUpperCase() : "";
  const reward = rewardCode ? await findRedeemableReward(rewardCode) : null;
  const priced = reward ? withReward(base, reward.pct) : base;

  const orderId = newOrderId();

  try {
    const rzpOrder = await createOrder({
      amountPaise: priced.totalPaise,
      receipt: orderId,
      // Shown against the payment in the Razorpay dashboard, so a payment can
      // be traced back to an order without opening the admin page.
      notes: { order_id: orderId, customer: customerResult.customer.name },
    });

    // Written BEFORE payment. An abandoned checkout then leaves a 'pending' row
    // rather than no evidence at all, which is what makes an unmatched payment
    // in the Razorpay dashboard traceable later.
    await createPendingOrder({
      id: orderId,
      razorpayOrderId: rzpOrder.id,
      amountPaise: priced.totalPaise,
      testMode: isTestMode(),
      customer: customerResult.customer,
      lines: priced.lines,
      rewardCode: reward?.code ?? null,
      discountPaise: priced.discountPaise,
    });

    return json({
      orderId,
      razorpayOrderId: rzpOrder.id,
      amountPaise: priced.totalPaise,
      // Echoed back so checkout shows the discount that was actually applied,
      // not the one the browser hoped for.
      subtotalPaise: priced.subtotalPaise,
      discountPct: priced.discountPct,
      discountPaise: priced.discountPaise,
      currency: "INR",
      keyId: publicKeyId(), // public by design — the checkout widget needs it
      testMode: isTestMode(),
      customer: {
        name: customerResult.customer.name,
        email: customerResult.customer.email,
        phone: customerResult.customer.phone,
      },
    });
  } catch (err) {
    if (err instanceof RazorpayConfigError) {
      console.error("razorpay: misconfigured —", err.message);
      return json({ error: "Payments aren't configured yet." }, 503);
    }
    console.error("checkout/order failed", err);
    return json({ error: "Could not start the payment. Please try again." }, 502);
  }
}
