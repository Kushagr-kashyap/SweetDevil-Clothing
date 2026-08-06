"use client";

import { useEffect, useRef } from "react";
import { lineId, useCart } from "@/lib/cart";
import type { Fit, Size } from "@/lib/products";

/**
 * Takes the paid-for lines out of the cart when a confirmation page loads.
 *
 * CheckoutForm's in-page Razorpay handler already calls clear(), but a redirect
 * payment never runs it: UPI and netbanking on a phone leave the site for the
 * bank app, and the customer comes back through /api/checkout/callback, so the
 * browser that lands here has run no JavaScript from checkout at all. Without
 * this they read "Order confirmed" with the tee they just bought still sitting
 * in the cart badge — one tap away from buying it twice.
 *
 * Removes only the lines that were on THIS order rather than calling clear(),
 * so re-opening an old confirmation link — from history, or a forwarded URL —
 * can't wipe a cart that has nothing to do with it.
 *
 * Renders nothing, so it cannot hide content behind JavaScript. See the note on
 * reveals in globals.css.
 */

export type PaidLine = {
  slug: string;
  size: Size | null;
  fit: Fit | null;
  note?: string;
};

export default function ClearPaidLines({ lines }: { lines: PaidLine[] }) {
  const { ready, remove } = useCart();
  // The store notifies every listener on each removal, so without this the
  // effect would re-enter mid-loop.
  const done = useRef(false);

  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;

    for (const l of lines) {
      // null is what the database round-trip gives back; lineId's cart-side
      // type uses undefined for the same "not set".
      remove(
        lineId({
          slug: l.slug,
          size: l.size ?? undefined,
          fit: l.fit ?? undefined,
          note: l.note,
        }),
      );
    }
  }, [ready, lines, remove]);

  return null;
}
