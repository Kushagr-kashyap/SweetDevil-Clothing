import "server-only";
import { after } from "next/server";
import { getOrderByRazorpayOrderId, markOrderFailed, markOrderPaid } from "./orders";
import { verifyPaymentSignature } from "./razorpay";
import { markRewardUsed } from "./rewards";

/**
 * Confirming a payment, in one place.
 *
 * THREE different things can tell us a payment succeeded, and all three are
 * live at once because none of them is reliable alone:
 *
 *   1. the browser callback  — fastest, but never fires if Razorpay redirects
 *                              away (mobile netbanking) or the tab is closed
 *   2. the return redirect   — fires on mobile, but not if the customer loses
 *                              signal on the way back
 *   3. the webhook           — server-to-server, fires regardless of the
 *                              customer's browser. The actual source of truth.
 *
 * They race, and that's fine: markOrderPaid() only updates a row that is still
 * pending with no payment id, so whichever arrives first wins and the rest are
 * no-ops. Duplicating this logic per entry point is how one of them ends up
 * skipping the signature check.
 */

export type ConfirmResult =
  | { ok: true; orderId: string; alreadyConfirmed: boolean }
  | { ok: false; reason: "unknown-order" | "bad-signature" | "error" };

export async function confirmPayment(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): Promise<ConfirmResult> {
  const order = await getOrderByRazorpayOrderId(input.razorpayOrderId);
  if (!order) return { ok: false, reason: "unknown-order" };

  let valid: boolean;
  try {
    valid = await verifyPaymentSignature({
      orderId: input.razorpayOrderId,
      paymentId: input.razorpayPaymentId,
      signature: input.signature,
    });
  } catch (err) {
    console.error("confirm: signature check errored", err);
    return { ok: false, reason: "error" };
  }

  if (!valid) {
    console.error("confirm: INVALID signature", {
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
    });
    await markOrderFailed(input.razorpayOrderId);
    return { ok: false, reason: "bad-signature" };
  }

  const updated = await markOrderPaid({
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
  });

  if (updated) {
    // Spend the game reward HERE, not when the order was created. An abandoned
    // checkout must leave the code still winnable — burning it at order
    // creation would take the discount away from someone who never paid.
    //
    // Gated on `updated`: the UPDATE behind markOrderPaid matches only a row
    // still pending with no payment id, so only the call that actually flips
    // the row spends the code.
    if (order.reward_code) {
      const code = order.reward_code;
      after(async () => {
        try {
          const spent = await markRewardUsed(code, order.id);
          // Already spent means the customer got the discount twice across two
          // orders. They have paid the discounted amount either way, so this is
          // a note to reconcile, never a reason to fail a confirmed payment.
          if (!spent) console.warn("reward already spent", { code, orderId: order.id });
        } catch (err) {
          console.error("reward: could not mark used", { code, orderId: order.id }, err);
        }
      });
    }
  }

  // Not updated + already paid = another path got here first. That's success,
  // not a failure — say so, or the customer sees an error over a real payment.
  return { ok: true, orderId: order.id, alreadyConfirmed: !updated };
}
