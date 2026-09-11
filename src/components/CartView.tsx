"use client";

import Image from "next/image";
import Link from "next/link";
import { lineId, useCart } from "@/lib/cart";
import { bySlug, inr } from "@/lib/products";
import { countdown, useReward } from "@/lib/reward";
import { discountPaiseFor } from "@/lib/reward-tiers";

export default function CartView() {
  const { lines, ready, count, subtotal, setQty, remove } = useCart();
  const { reward, msLeft } = useReward();

  // The SAME function the server prices with, fed the same paise. Computing it
  // in rupees here instead would round differently and quietly show a total a
  // few paise off what Razorpay charges.
  const discount = reward ? discountPaiseFor(Math.round(subtotal * 100), reward.pct) / 100 : 0;
  const total = subtotal - discount;

  // Until localStorage is read we can't know the cart, and guessing would cause
  // a hydration mismatch. Reserve the space instead of flashing an empty state.
  if (!ready) {
    return (
      <div className="readout text-bone-faint px-[max(1.25rem,5vw)] py-20">
        Loading cart…
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="px-[max(1.25rem,5vw)] pb-20">
        <div
          className="chassis cut-4 p-8 text-center md:p-14"
          style={{ ["--cut" as string]: "20px" }}
        >
          <p className="readout text-bone-faint">cart empty</p>
          <p className="display text-bone mt-3 text-[length:var(--step-2)]">
            Nothing in here yet
          </p>
          <p className="text-bone-dim prose-body mx-auto mt-3 text-[0.95rem]">
            Ten designs, printed in small runs. Go pick a fight with your wardrobe.
          </p>
          <Link
            href="/products"
            className="cut bg-bone text-void label mt-7 inline-flex items-center gap-2 px-6 py-3.5"
            style={{ ["--cut" as string]: "12px" }}
          >
            Browse the drop <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[max(1.25rem,5vw)] pb-20">
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-10">
        {/* ── lines ── */}
        <ul className="space-y-3">
          {lines.map((l) => {
            const p = bySlug(l.slug);
            if (!p) return null;
            const id = lineId(l);

            return (
              <li
                key={id}
                className="chassis cut flex gap-3 p-3"
                style={{ ["--cut" as string]: "12px" }}
              >
                {/* `self-start` matters: the flex row stretches children by
                    default, which would override aspect-square. And the black
                    garments need the lit plate or they vanish into the panel. */}
                <Link
                  href={`/products/${p.slug}`}
                  className="cut bg-panel relative block aspect-square w-24 shrink-0 self-start overflow-hidden sm:w-28"
                  style={{ ["--cut" as string]: "7px" }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,var(--color-panel-hi),var(--color-panel)_70%)]"
                  />
                  <Image
                    src={p.image}
                    alt={p.name}
                    width={1000}
                    height={1000}
                    sizes="112px"
                    className="relative h-full w-full object-cover"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/products/${p.slug}`}
                      className="display text-bone hover:text-ember text-[1.05rem] leading-tight transition-colors"
                    >
                      {p.name}
                    </Link>
                    {/* 44px hit area, pulled into the corner with negative
                        margins so it doesn't push the title around */}
                    <button
                      type="button"
                      onClick={() => remove(id)}
                      aria-label={`Remove ${p.name} from cart`}
                      className="text-bone-faint hover:text-flare -mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center text-xl leading-none transition-colors"
                    >
                      ×
                    </button>
                  </div>

                  {(l.size || l.fit) && (
                    <p className="readout text-bone-faint mt-1.5">
                      {[l.fit, l.size].filter(Boolean).join(" · ")}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQty(id, l.qty - 1)}
                        className="chassis cut text-bone-dim hover:text-ember grid h-11 w-11 place-items-center transition-colors"
                        style={{ ["--cut" as string]: "6px" }}
                      >
                        −
                      </button>
                      <span className="readout text-bone w-8 text-center tabular-nums">
                        {String(l.qty).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQty(id, l.qty + 1)}
                        className="chassis cut text-bone-dim hover:text-ember grid h-11 w-11 place-items-center transition-colors"
                        style={{ ["--cut" as string]: "6px" }}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-bone font-semibold">
                      {inr(p.price * l.qty)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* ── summary ── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div
            className="chassis cut-4 p-5 md:p-6"
            style={{
              ["--cut" as string]: "18px",
              ["--chassis-fill" as string]: "var(--color-void-deep)",
            }}
          >
            <div className="border-line/60 mb-4 flex items-center gap-3 border-b pb-3">
              <span className="readout text-ember">SUM</span>
              <span className="bg-line/60 h-px flex-1" />
              <span className="readout text-bone-faint">
                {String(count).padStart(2, "0")} items
              </span>
            </div>

            <div className="border-line/60 flex items-baseline justify-between border-b py-2.5">
              <span className="readout text-bone-faint">subtotal</span>
              <span className="text-bone font-semibold">{inr(subtotal)}</span>
            </div>
            <div className="border-line/60 flex items-baseline justify-between border-b py-2.5">
              <span className="readout text-bone-faint">shipping</span>
              <span className="readout text-ember">free</span>
            </div>

            {reward && (
              <div className="border-line/60 flex items-baseline justify-between gap-3 border-b py-2.5">
                <span className="min-w-0">
                  <span className="readout text-ember block">
                    devil&apos;s aim −{reward.pct}%
                  </span>
                  <span className="readout text-bone-faint mt-0.5 block">
                    {reward.code} · expires in {countdown(msLeft)}
                  </span>
                </span>
                <span className="text-ember shrink-0 font-semibold">−{inr(discount)}</span>
              </div>
            )}

            <div className="flex items-baseline justify-between py-4">
              <span className="label text-bone">Total</span>
              <span className="display text-bone text-2xl">{inr(total)}</span>
            </div>

            <Link
              href="/checkout"
              className="cut bg-bone text-void label group flex items-center justify-center gap-2 py-4"
              style={{ ["--cut" as string]: "14px" }}
            >
              Checkout
              <span
                aria-hidden
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>

            <p className="readout text-bone-faint mt-4 leading-relaxed">
              free shipping · delivered in 3–7 business days
            </p>

            <Link
              href="/products"
              className="text-bone-dim hover:text-ember mt-3 inline-flex min-h-11 items-center text-[0.9rem] transition-colors"
            >
              ← Keep shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
