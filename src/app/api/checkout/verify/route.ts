import { confirmPayment } from "@/lib/confirm";

/**
 * Called by the browser when Razorpay's in-page checkout reports success.
 *
 * This is the FASTEST confirmation path, not the most reliable one — it only
 * runs if the customer's browser is still on our page. The webhook is what
 * guarantees the order is recorded. All the real work (signature check, marking
 * paid) lives in confirmPayment() so every path enforces it identically.
 */

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

const str = (v: unknown) => (typeof v === "string" ? v : "");

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Malformed request." }, 400);
  }

  const p =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  const razorpayOrderId = str(p.razorpay_order_id);
  const razorpayPaymentId = str(p.razorpay_payment_id);
  const signature = str(p.razorpay_signature);

  if (!razorpayOrderId || !razorpayPaymentId || !signature) {
    return json({ error: "Missing payment details." }, 400);
  }

  const result = await confirmPayment({
    razorpayOrderId,
    razorpayPaymentId,
    signature,
  });

  if (!result.ok) {
    if (result.reason === "unknown-order") return json({ error: "Unknown order." }, 404);
    if (result.reason === "bad-signature") {
      return json({ error: "Payment could not be verified." }, 400);
    }
    return json({ error: "Could not verify the payment." }, 500);
  }

  return json({ ok: true, orderId: result.orderId });
}
