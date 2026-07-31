import { confirmPayment } from "@/lib/confirm";

/**
 * Where Razorpay sends the customer back after a redirect-style payment.
 *
 * Mobile netbanking leaves our site entirely for the bank's page, so the
 * in-page success handler never runs — the customer ends up stranded on
 * api.razorpay.com looking at "PAYMENT SUCCESSFUL" with no way back to their
 * order. Razorpay POSTs the result here instead, form-encoded.
 *
 * This fixes the customer's *journey*. The webhook fixes the *data*. Both are
 * needed: this one can still be lost if they close the tab on the way back.
 */

const seeOther = (location: string) =>
  new Response(null, { status: 303, headers: { location, "cache-control": "no-store" } });

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return seeOther("/checkout?error=1");
  }

  const razorpayOrderId = String(form.get("razorpay_order_id") ?? "");
  const razorpayPaymentId = String(form.get("razorpay_payment_id") ?? "");
  const signature = String(form.get("razorpay_signature") ?? "");

  if (!razorpayOrderId || !razorpayPaymentId || !signature) {
    // A cancelled or failed redirect payment lands here with nothing useful.
    return seeOther("/checkout?error=cancelled");
  }

  const result = await confirmPayment({
    razorpayOrderId,
    razorpayPaymentId,
    signature,
  });

  if (!result.ok) {
    console.error("callback: could not confirm", { razorpayOrderId, reason: result.reason });
    return seeOther("/checkout?error=unverified");
  }

  // 303 so the browser follows with GET — a 302 here would re-POST the form
  // data to the order page.
  return seeOther(`/order/${result.orderId}`);
}
