import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { PricedLine } from "./pricing";

/**
 * Order persistence (Cloudflare D1).
 *
 * SERVER ONLY — this reads the D1 binding and returns customer addresses and
 * phone numbers. It must never be reachable from a client component.
 *
 * Amounts are whole paise everywhere, matching the schema. See
 * migrations/0001_create_orders.sql for why nothing here is a float.
 */

export type OrderStatus = "pending" | "paid" | "failed";

export type Customer = {
  name: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
};

export type OrderRow = {
  id: string;
  created_at: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  status: OrderStatus;
  amount_paise: number;
  currency: string;
  test_mode: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  items_json: string;
  notes: string | null;
};

const db = () => getCloudflareContext().env.DB;

/**
 * Human-facing order number. Crockford-style alphabet: no I, L, O, U, so a
 * customer reading one down the phone can't turn it into a different order.
 *
 * Eight characters, not six. The confirmation page is reachable by order id, so
 * the id doubles as the capability to view that order — 32^8 (~1.1 trillion)
 * makes enumeration impractical, where 32^6 (~1 billion) is within reach of a
 * determined scraper.
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export function newOrderId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `SD-${out}`;
}

/** Written before the customer pays, so an abandoned payment still leaves a trace. */
export async function createPendingOrder(input: {
  id: string;
  razorpayOrderId: string;
  amountPaise: number;
  testMode: boolean;
  customer: Customer;
  lines: PricedLine[];
}): Promise<void> {
  await db()
    .prepare(
      `INSERT INTO orders (
         id, created_at, razorpay_order_id, status, amount_paise, currency,
         test_mode, customer_name, customer_email, customer_phone,
         address_line, city, state, pincode, items_json
       ) VALUES (?1, ?2, ?3, 'pending', ?4, 'INR', ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`,
    )
    .bind(
      input.id,
      new Date().toISOString(),
      input.razorpayOrderId,
      input.amountPaise,
      input.testMode ? 1 : 0,
      input.customer.name,
      input.customer.email,
      input.customer.phone,
      input.customer.addressLine,
      input.customer.city,
      input.customer.state,
      input.customer.pincode,
      JSON.stringify(input.lines),
    )
    .run();
}

/**
 * Promotes a pending order to paid, and is the last line of defence against a
 * replayed payment.
 *
 * The `razorpay_payment_id IS NULL` guard makes this idempotent: a double-tap,
 * a refresh, or a webhook retry updates zero rows the second time instead of
 * re-confirming an order. It also stops one payment id being pinned onto a
 * second order, because the column is UNIQUE.
 *
 * Returns false when nothing was updated — the caller must treat that as
 * "already handled", not as success.
 */
export async function markOrderPaid(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
}): Promise<boolean> {
  const res = await db()
    .prepare(
      `UPDATE orders
          SET status = 'paid', razorpay_payment_id = ?1
        WHERE razorpay_order_id = ?2
          AND status = 'pending'
          AND razorpay_payment_id IS NULL`,
    )
    .bind(input.razorpayPaymentId, input.razorpayOrderId)
    .run();

  return (res.meta.changes ?? 0) > 0;
}

export async function markOrderFailed(razorpayOrderId: string): Promise<void> {
  await db()
    .prepare(
      `UPDATE orders SET status = 'failed'
        WHERE razorpay_order_id = ?1 AND status = 'pending'`,
    )
    .bind(razorpayOrderId)
    .run();
}

export async function getOrderById(id: string): Promise<OrderRow | null> {
  return await db()
    .prepare(`SELECT * FROM orders WHERE id = ?1`)
    .bind(id)
    .first<OrderRow>();
}

export async function getOrderByRazorpayOrderId(
  razorpayOrderId: string,
): Promise<OrderRow | null> {
  return await db()
    .prepare(`SELECT * FROM orders WHERE razorpay_order_id = ?1`)
    .bind(razorpayOrderId)
    .first<OrderRow>();
}

/** Admin listing — newest first, served by idx_orders_created_at. */
export async function listOrders(limit = 100): Promise<OrderRow[]> {
  const res = await db()
    .prepare(`SELECT * FROM orders ORDER BY created_at DESC LIMIT ?1`)
    .bind(Math.min(Math.max(1, limit), 500))
    .all<OrderRow>();
  return res.results ?? [];
}

/** Items are stored as a JSON snapshot; a corrupt row must not break the page. */
export function parseItems(row: OrderRow): PricedLine[] {
  try {
    const parsed: unknown = JSON.parse(row.items_json);
    return Array.isArray(parsed) ? (parsed as PricedLine[]) : [];
  } catch {
    return [];
  }
}
