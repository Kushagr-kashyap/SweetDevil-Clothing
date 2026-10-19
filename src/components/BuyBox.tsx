"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import {
  fitsFor,
  sizesFor,
  inr,
  type Fit,
  type Product,
  type Size,
} from "@/lib/products";

/**
 * The only part of a product page that needs JavaScript. Everything above it —
 * photo, price, description, specs, policies — is server-rendered, so the page
 * still sells the product if this never boots.
 */
export default function BuyBox({ product: p }: { product: Product }) {
  const { add } = useCart();
  const [size, setSize] = useState<Size | null>(null);
  /* One fit is the normal case, so it is chosen already and shown as a fact
     below rather than asked for. Only a garment genuinely made in two gets a
     set of buttons. */
  const fits = fitsFor(p);
  const [fit, setFit] = useState<Fit | null>(fits.length === 1 ? fits[0] : null);
  const [qty, setQty] = useState(1);
  const [brief, setBrief] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  function onAdd() {
    if (!size) return setError("Pick a size first.");
    if (!fit) return setError("Pick a fit.");
    if (p.needsBrief && brief.trim().length < 10) {
      return setError("Tell us what you want printed — a sentence is enough.");
    }
    setError(null);
    add({
      slug: p.slug,
      size,
      fit,
      qty,
      note: p.needsBrief ? brief.trim() : undefined,
    });
    setAdded(true);
  }

  /* What the supplier actually cuts for this garment, which is not the

     shop's full size list — nothing is made in XS, and ringers, hoodies

     and zips stop at XL. Offering a size we cannot ship is an order we

     have to refund. */

  const sizes = sizesFor(p);


  return (
    <div className="mt-8">
      {/* ── size ── */}
      <fieldset>
        <legend className="readout text-bone-faint mb-2">
          Size <span className="text-ember">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={size === s}
              onClick={() => {
                setSize(s);
                setError(null);
                setAdded(false);
              }}
              className={`chassis cut label inline-flex min-h-11 min-w-[3.4rem] items-center justify-center px-3 transition-colors ${
                size === s
                  ? "chassis-hot text-bone"
                  : "text-bone-dim hover:text-bone"
              }`}
              style={{ ["--cut" as string]: "7px" }}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      {/* ── fit ──
           A single-fit garment states its fit; it does not offer it. The
           selector used to render FITS globally, so a boxy tee and a hoodie
           both asked "Regular or Oversized?" and the honest answer was
           neither. */}
      {fits.length === 1 ? (
        <div className="mt-6">
          <p className="readout text-bone-faint mb-2">Type</p>
          <p className="label text-bone">{fits[0]}</p>
        </div>
      ) : (
        <fieldset className="mt-6">
          <legend className="readout text-bone-faint mb-2">
            Type <span className="text-ember">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {fits.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={fit === f}
                onClick={() => {
                  setFit(f);
                  setError(null);
                  setAdded(false);
                }}
                className={`chassis cut label inline-flex min-h-11 items-center justify-center px-4 transition-colors ${
                  fit === f
                    ? "chassis-hot text-bone"
                    : "text-bone-dim hover:text-bone"
                }`}
                style={{ ["--cut" as string]: "7px" }}
              >
                {f}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* ── design brief, custom tiers only ── */}
      {p.needsBrief && (
        <div className="mt-6">
          <label className="block">
            <span className="readout text-bone-faint mb-2 block">
              Describe your design <span className="text-ember">*</span>
            </span>
            <span
              className="chassis cut focus-within:bg-ember block transition-colors"
              style={{ ["--cut" as string]: "8px" }}
            >
              <textarea
                rows={4}
                value={brief}
                onChange={(e) => {
                  setBrief(e.target.value);
                  setError(null);
                  setAdded(false);
                }}
                placeholder="Go wild — the colours, the vibe, the message, even a mood."
                className="text-bone placeholder:text-bone-faint block w-full resize-y bg-transparent px-3 py-3 text-base outline-none"
              />
            </span>
          </label>
          <p className="readout text-bone-faint mt-2 leading-relaxed">
            after checkout we&apos;ll email you to collect sketches and
            references
          </p>
        </div>
      )}

      {/* ── quantity ── */}
      <div className="mt-6">
        <p className="readout text-bone-faint mb-2">Quantity</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="chassis cut text-bone-dim hover:text-ember grid h-11 w-11 place-items-center text-lg transition-colors"
            style={{ ["--cut" as string]: "7px" }}
          >
            −
          </button>
          <span
            aria-live="polite"
            className="readout text-bone w-12 text-center text-[0.9rem]"
          >
            {String(qty).padStart(2, "0")}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            className="chassis cut text-bone-dim hover:text-ember grid h-11 w-11 place-items-center text-lg transition-colors"
            style={{ ["--cut" as string]: "7px" }}
          >
            +
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="readout text-flare mt-4">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="cut bg-bone text-void label group mt-6 flex w-full items-center justify-center gap-3 py-4"
        style={{ ["--cut" as string]: "14px" }}
      >
        Add to cart · {inr(p.price * qty)}
        <span
          aria-hidden
          className="transition-transform duration-300 group-hover:translate-x-1"
        >
          →
        </span>
      </button>

      {added && (
        <div
          role="status"
          className="chassis chassis-hot cut rise mt-4 flex flex-wrap items-center justify-between gap-3 p-4"
          style={{ ["--cut" as string]: "10px" }}
        >
          <span className="readout text-bone">Added to cart</span>
          <Link
            href="/cart"
            className="label text-ember inline-flex items-center gap-1.5"
          >
            View cart <span aria-hidden>→</span>
          </Link>
        </div>
      )}
    </div>
  );
}
