import { bySlug, FITS, SIZES, type Fit, type Size } from "./products";
import { discountPaiseFor, MAX_PCT } from "./reward-tiers";

/**
 * The single source of truth for what an order costs.
 *
 * THE RULE: the browser sends *what* is being bought (slug, size, fit, qty).
 * It never sends *what it costs*. Every rupee here is looked up from the
 * catalogue on the server. A cart posted with `"price": 1` is priced exactly the
 * same as one posted honestly, because the incoming price is never read.
 *
 * Everything is in PAISE as integers. Razorpay's API takes the smallest currency
 * unit, and floating-point rupees are how a ₹1,299.00 order becomes ₹1,298.99 —
 * so rupees never enter the arithmetic at all.
 */

/** Matches the cart's own clamp, so an honest cart can never trip the guard. */
const MAX_QTY_PER_LINE = 20;

/** A real order has a handful of lines. Anything past this is someone probing. */
const MAX_LINES = 50;

/** A custom-design brief travels with the order; cap it so it can't be a payload. */
const MAX_NOTE = 2000;

/**
 * Sanity ceiling on a single order (₹5,00,000). Not a business rule — a
 * blast-radius limit, so a pricing bug can't ever create a gigantic charge.
 */
const MAX_TOTAL_PAISE = 500_000 * 100;

export type PricedLine = {
  slug: string;
  name: string;
  size: Size | null;
  fit: Fit | null;
  qty: number;
  unitPaise: number;
  linePaise: number;
  note?: string;
};

export type PricedCart = {
  lines: PricedLine[];
  subtotalPaise: number;
  /** Free across India — kept explicit so the total is auditable, not implied. */
  shippingPaise: number;
  /** 0 unless a Devil's Aim reward was redeemed. See withReward(). */
  discountPct: number;
  discountPaise: number;
  totalPaise: number;
};

export type PricingError = { error: string };

export const isPricingError = (r: PricedCart | PricingError): r is PricingError =>
  "error" in r;

/** Narrow an unknown JSON value without trusting any of its fields. */
function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

/**
 * Prices an untrusted cart payload. Returns a PricingError rather than throwing
 * so the route can answer 400 with a reason instead of leaking a stack trace.
 */
export function priceCart(incoming: unknown): PricedCart | PricingError {
  if (!Array.isArray(incoming)) return { error: "Cart must be a list of items." };
  if (incoming.length === 0) return { error: "Your cart is empty." };
  if (incoming.length > MAX_LINES) return { error: "Too many items in the cart." };

  const lines: PricedLine[] = [];
  let subtotalPaise = 0;

  for (const raw of incoming) {
    const l = asRecord(raw);
    if (!l) return { error: "Malformed cart item." };

    if (typeof l.slug !== "string") return { error: "Malformed cart item." };
    const product = bySlug(l.slug);
    if (!product) return { error: `That product is no longer available.` };

    // Number(true) is 1 and Number("") is 0 — check the type before coercing.
    if (typeof l.qty !== "number" || !Number.isFinite(l.qty)) {
      return { error: "Invalid quantity." };
    }
    const qty = Math.floor(l.qty);
    if (qty < 1 || qty > MAX_QTY_PER_LINE) {
      return { error: `Quantity must be between 1 and ${MAX_QTY_PER_LINE}.` };
    }

    // A size/fit that isn't on the size chart means a hand-edited payload.
    const size =
      l.size === undefined || l.size === null
        ? null
        : SIZES.includes(l.size as Size)
          ? (l.size as Size)
          : undefined;
    if (size === undefined) return { error: "Unknown size." };

    const fit =
      l.fit === undefined || l.fit === null
        ? null
        : FITS.includes(l.fit as Fit)
          ? (l.fit as Fit)
          : undefined;
    if (fit === undefined) return { error: "Unknown fit." };

    if (!size || !fit) return { error: `Pick a size and fit for ${product.name}.` };

    let note: string | undefined;
    if (l.note !== undefined && l.note !== null) {
      if (typeof l.note !== "string") return { error: "Invalid design brief." };
      note = l.note.trim().slice(0, MAX_NOTE);
    }
    // Custom tiers are meaningless without the brief that defines them.
    if (product.needsBrief && (!note || note.length < 10)) {
      return { error: `Add a design brief for ${product.name}.` };
    }

    // ── the only place a price is ever read ──
    const unitPaise = Math.round(product.price * 100);
    const linePaise = unitPaise * qty;

    subtotalPaise += linePaise;
    lines.push({
      slug: product.slug,
      name: product.name,
      size,
      fit,
      qty,
      unitPaise,
      linePaise,
      ...(note ? { note } : {}),
    });
  }

  const shippingPaise = 0; // free across India — see the shipping policy
  const totalPaise = subtotalPaise + shippingPaise;

  if (totalPaise <= 0) return { error: "Order total must be greater than zero." };
  if (totalPaise > MAX_TOTAL_PAISE) return { error: "Order total is too large." };

  return { lines, subtotalPaise, shippingPaise, discountPct: 0, discountPaise: 0, totalPaise };
}

/**
 * Applies a discount won in "Devil's Aim" to an already-priced cart.
 *
 * Kept separate from priceCart() so that function stays pure and synchronous:
 * the percentage comes from a database row, and threading an `await` through
 * the one place that decides what things cost is how a pricing bug hides.
 *
 * `pct` must come from the game_rewards row, never from the request. It is
 * clamped again here anyway — this is the last code that touches the number
 * before it becomes a charge, so it re-checks rather than assuming its caller
 * did.
 */
export function withReward(cart: PricedCart, pct: number): PricedCart {
  const safePct = Math.min(Math.max(Math.floor(pct), 0), MAX_PCT);
  if (safePct <= 0) return cart;

  // Subtract the DISCOUNT rather than rounding the total, so
  // subtotal − discount === total exactly and the three numbers on a
  // confirmation email always add up.
  const discountPaise = discountPaiseFor(cart.subtotalPaise, safePct);
  return {
    ...cart,
    discountPct: safePct,
    discountPaise,
    totalPaise: cart.subtotalPaise - discountPaise + cart.shippingPaise,
  };
}

/** For emails and the dashboard, where rupees are what a human wants to read. */
export const paiseToRupees = (paise: number) => paise / 100;

export const formatPaise = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
