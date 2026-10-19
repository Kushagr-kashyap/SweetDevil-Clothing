import { after } from "next/server";
import { sendOrderConfirmation } from "@/lib/email";
import {
  getOrderByRazorpayOrderId,
  markOrderFailed,
  markOrderPaid,
} from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * Razorpay webhook — the source of truth for whether a payment happened.
 *
 * The browser callback fires only if the customer's browser makes it back to
 * our site. On mobile netbanking Razorpay redirects to the bank and often never
 * returns, which is precisely how a real test payment ended up recorded as
 * `pending` with the money already taken. This endpoint does not care what the
 * browser does: Razorpay calls it server-to-server.
 *
 * Configure at Razorpay Dashboard → Settings → Webhooks:
 *   URL     https://<site>/api/razorpay/webhook
 *   Events  payment.captured, payment.failed
 *   Secret  → npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
 */

type RazorpayWebhookBody = {
  event?: string;
  payload?: {
    payment?: {
      entity?: { id?: string; order_id?: string; status?: string };
    };
  };
};

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!signature) return new Response("Missing signature", { status: 400 });

  // MUST be the raw text. Parsing to JSON and re-serialising reorders keys and
  // the HMAC stops matching — the classic way webhook verification silently
  // "stops working" after a refactor.
  const rawBody = await request.text();

  let valid = false;
  try {
    valid = await verifyWebhookSignature({ rawBody, signature });
  } catch (err) {
    // Almost always RAZORPAY_WEBHOOK_SECRET missing. Answer 500 so Razorpay
    // retries later rather than 200, which would discard the event for good.
    console.error("webhook: verification errored", err);
    return new Response("Cannot verify", { status: 500 });
  }

  if (!valid) {
    console.error("webhook: INVALID signature — ignoring");
    return new Response("Invalid signature", { status: 401 });
  }

  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(rawBody) as RazorpayWebhookBody;
  } catch {
    return new Response("Malformed body", { status: 400 });
  }

  const payment = body.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id;
  const razorpayPaymentId = payment?.id;

  if (!razorpayOrderId || !razorpayPaymentId) {
    // Some events carry no payment entity. Nothing to do, but 200 so Razorpay
    // stops retrying an event we've deliberately ignored.
    return Response.json({ ok: true, ignored: body.event ?? "unknown" });
  }

  switch (body.event) {
    case "payment.captured":
    case "order.paid": {
      // The signature above already proves this came from Razorpay, so the
      // per-payment signature isn't re-checked here — a different, equally
      // strong secret authenticated the whole request.
      const updated = await markOrderPaid({ razorpayOrderId, razorpayPaymentId });
      console.log("webhook: payment captured", {
        razorpayOrderId,
        updated, // false = another path confirmed it first, which is fine
      });

      // Only the path that actually flipped the row sends the email — same
      // guard as confirm.ts. Both events we subscribe to (payment.captured and
      // order.paid) land here for a single payment, so without this a customer
      // would get two confirmations from the webhook alone.
      //
      // The row is re-read rather than threaded through markOrderPaid: this
      // branch runs only once per order, so the extra query costs nothing worth
      // reshaping an API for.
      if (updated) {
        const order = await getOrderByRazorpayOrderId(razorpayOrderId);
        // A payment with no order of ours is a payment link, not a store
        // order — see the ₹1 webhook test. Nothing to confirm to anyone.
        if (order) after(() => sendOrderConfirmation(order));
      }
      break;
    }
    case "payment.failed": {
      await markOrderFailed(razorpayOrderId);
      console.log("webhook: payment failed", { razorpayOrderId });
      break;
    }
    default:
      break;
  }

  // Always 200 once handled, or Razorpay keeps retrying a processed event.
  return Response.json({ ok: true });
}
