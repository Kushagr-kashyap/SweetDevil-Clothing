/**
 * Razorpay client — REST over fetch, HMAC over Web Crypto.
 *
 * Deliberately NOT the `razorpay` npm SDK: it targets Node's crypto and http
 * modules, and this runs on Cloudflare Workers. Two endpoints and one HMAC do
 * not justify shimming a Node runtime into the bundle.
 *
 * SERVER ONLY. Nothing in this file may be imported by a client component —
 * RAZORPAY_KEY_SECRET is the credential that authorises charges, and a single
 * accidental import would bundle it into JavaScript served to the public. The
 * key id is public by design and is exposed deliberately via `publicKeyId()`.
 */

import "server-only";

const API = "https://api.razorpay.com/v1";

export class RazorpayConfigError extends Error {}
export class RazorpayApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new RazorpayConfigError(
      `${name} is not set. Add it with: npx wrangler secret put ${name}`,
    );
  }
  return v;
}

/** Safe to send to the browser — Razorpay's checkout widget needs it. */
export const publicKeyId = () => requireEnv("RAZORPAY_KEY_ID");

/** True when both credentials are present, so the UI can say "not live yet". */
export const isConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

/** `rzp_test_...` keys only ever touch Razorpay's simulator. */
export const isTestMode = () =>
  (process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_test_");

function authHeader(): string {
  const id = requireEnv("RAZORPAY_KEY_ID");
  const secret = requireEnv("RAZORPAY_KEY_SECRET");
  return `Basic ${btoa(`${id}:${secret}`)}`;
}

/* ── orders ────────────────────────────────────────────────────────────── */

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string;
};

/**
 * `amountPaise` must already be server-computed — see priceCart(). Passing a
 * client-supplied amount here is the whole vulnerability this codebase avoids.
 */
export async function createOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise <= 0) {
    throw new RazorpayApiError("Order amount must be a positive whole paise value.", 400);
  }

  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt.slice(0, 40), // Razorpay caps receipt length
      notes: input.notes ?? {},
    }),
  });

  if (!res.ok) {
    // Razorpay's error body can name the account; keep it in logs, not in the
    // response the customer sees.
    const detail = await res.text().catch(() => "");
    console.error("razorpay: order creation failed", res.status, detail);
    throw new RazorpayApiError("Could not create the payment order.", res.status);
  }

  return (await res.json()) as RazorpayOrder;
}

/* ── signature verification ────────────────────────────────────────────── */

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Constant-time compare. A plain `===` on a signature leaks, through timing,
 * how many leading characters were right, which is enough to forge one guess at
 * a time. Length is compared first because it isn't secret.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * THE security boundary of the whole checkout.
 *
 * After payment, the browser hands back an order id, a payment id and a
 * signature. Only Razorpay can produce that signature, because only Razorpay and
 * this server know the key secret. Without this check, anyone can POST
 * "I paid, ship my order" and be believed.
 *
 * Never treat a payment as real on the strength of the browser saying so.
 */
export async function verifyPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<boolean> {
  const secret = requireEnv("RAZORPAY_KEY_SECRET");
  const expected = await hmacSha256Hex(secret, `${input.orderId}|${input.paymentId}`);
  return timingSafeEqual(expected, input.signature.toLowerCase());
}

/**
 * Webhooks are signed with a *different* secret than payments, over the raw
 * request body. Pass the body exactly as received — re-serialising parsed JSON
 * reorders keys and the signature stops matching.
 */
export async function verifyWebhookSignature(input: {
  rawBody: string;
  signature: string;
}): Promise<boolean> {
  const secret = requireEnv("RAZORPAY_WEBHOOK_SECRET");
  const expected = await hmacSha256Hex(secret, input.rawBody);
  return timingSafeEqual(expected, input.signature.toLowerCase());
}
