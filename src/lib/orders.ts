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

/* ── dashboard reads ───────────────────────────────────────────────────── */

export type Stats = {
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  /** Live orders only — test-mode money is not money. */
  revenuePaise: number;
  avgOrderPaise: number;
  unitsSold: number;
};

/**
 * Revenue deliberately counts `test_mode = 0` only. A dashboard that folds
 * simulated payments into the takings is worse than no dashboard.
 */
export async function getStats(): Promise<Stats> {
  const row = await db()
    .prepare(
      `SELECT
         SUM(CASE WHEN status = 'paid'    THEN 1 ELSE 0 END) AS paid,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN status = 'failed'  THEN 1 ELSE 0 END) AS failed,
         COALESCE(SUM(CASE WHEN status = 'paid' AND test_mode = 0
                           THEN amount_paise ELSE 0 END), 0) AS revenue,
         SUM(CASE WHEN status = 'paid' AND test_mode = 0 THEN 1 ELSE 0 END) AS paid_live
       FROM orders`,
    )
    .first<{
      paid: number | null;
      pending: number | null;
      failed: number | null;
      revenue: number | null;
      paid_live: number | null;
    }>();

  const paidLive = row?.paid_live ?? 0;
  const revenuePaise = row?.revenue ?? 0;

  // Units need the item JSON, so they're counted in JS rather than SQL.
  const paidRows = await db()
    .prepare(`SELECT items_json FROM orders WHERE status = 'paid'`)
    .all<{ items_json: string }>();

  let unitsSold = 0;
  for (const r of paidRows.results ?? []) {
    try {
      const items: unknown = JSON.parse(r.items_json);
      if (Array.isArray(items)) {
        for (const l of items as PricedLine[]) unitsSold += l.qty ?? 0;
      }
    } catch {
      /* a corrupt row shouldn't zero the whole figure */
    }
  }

  return {
    paidCount: row?.paid ?? 0,
    pendingCount: row?.pending ?? 0,
    failedCount: row?.failed ?? 0,
    revenuePaise,
    avgOrderPaise: paidLive > 0 ? Math.round(revenuePaise / paidLive) : 0,
    unitsSold,
  };
}

export type CustomerSummary = {
  email: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  orders: number;
  spentPaise: number;
  lastOrderAt: string;
};

/**
 * There is no customers table — accounts don't exist, so a "customer" is just
 * the distinct email addresses that have ordered. Grouping in SQL keeps this
 * correct as the order count grows.
 */
export async function listCustomers(limit = 200): Promise<CustomerSummary[]> {
  const res = await db()
    .prepare(
      `SELECT
         customer_email AS email,
         MAX(customer_name)  AS name,
         MAX(customer_phone) AS phone,
         MAX(city)  AS city,
         MAX(state) AS state,
         COUNT(*)   AS orders,
         COALESCE(SUM(CASE WHEN status = 'paid' AND test_mode = 0
                           THEN amount_paise ELSE 0 END), 0) AS spentPaise,
         MAX(created_at) AS lastOrderAt
       FROM orders
       GROUP BY customer_email
       ORDER BY spentPaise DESC, lastOrderAt DESC
       LIMIT ?1`,
    )
    .bind(Math.min(Math.max(1, limit), 500))
    .all<CustomerSummary>();
  return res.results ?? [];
}

/** Best-selling products, counted across paid orders. */
export async function topProducts(): Promise<
  { name: string; qty: number; revenuePaise: number }[]
> {
  const res = await db()
    .prepare(`SELECT items_json, test_mode FROM orders WHERE status = 'paid'`)
    .all<{ items_json: string; test_mode: number }>();

  const tally = new Map<string, { qty: number; revenuePaise: number }>();
  for (const r of res.results ?? []) {
    try {
      const items: unknown = JSON.parse(r.items_json);
      if (!Array.isArray(items)) continue;
      for (const l of items as PricedLine[]) {
        const cur = tally.get(l.name) ?? { qty: 0, revenuePaise: 0 };
        cur.qty += l.qty ?? 0;
        if (r.test_mode === 0) cur.revenuePaise += l.linePaise ?? 0;
        tally.set(l.name, cur);
      }
    } catch {
      /* skip corrupt rows */
    }
  }

  return [...tally.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty);
}

/**
 * Free-text order lookup for the dashboard — order id, name, email or phone.
 * Parameterised, never interpolated: this string comes from a form field.
 */
export async function searchOrders(query: string, limit = 100): Promise<OrderRow[]> {
  const like = `%${query.trim().toLowerCase()}%`;
  const res = await db()
    .prepare(
      `SELECT * FROM orders
        WHERE LOWER(id) LIKE ?1
           OR LOWER(customer_name)  LIKE ?1
           OR LOWER(customer_email) LIKE ?1
           OR customer_phone        LIKE ?1
           OR LOWER(razorpay_payment_id) LIKE ?1
        ORDER BY created_at DESC
        LIMIT ?2`,
    )
    .bind(like, Math.min(Math.max(1, limit), 500))
    .all<OrderRow>();
  return res.results ?? [];
}

export async function listOrdersByStatus(
  status: OrderStatus,
  limit = 200,
): Promise<OrderRow[]> {
  const res = await db()
    .prepare(
      `SELECT * FROM orders WHERE status = ?1 ORDER BY created_at DESC LIMIT ?2`,
    )
    .bind(status, Math.min(Math.max(1, limit), 500))
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
