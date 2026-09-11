"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import Field, { CONTROL } from "./Field";
import { lineId, useCart } from "@/lib/cart";
import { bySlug, inr } from "@/lib/products";
import { validateCustomer, type CustomerErrors } from "@/lib/customer";
import { clearReward, countdown, useReward } from "@/lib/reward";
import { discountPaiseFor } from "@/lib/reward-tiers";

/**
 * Checkout: collect the address, create the order server-side, hand off to
 * Razorpay, then verify.
 *
 * The client never computes or sends a price — it posts the cart contents and
 * the server decides what that costs. The `amount` shown here is for the
 * customer's benefit only; if it ever disagreed with the server, the server
 * would win and Razorpay would charge the server's figure.
 */

const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (r: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
  /**
   * Where Razorpay returns the customer when the payment leaves our site —
   * mobile netbanking goes to the bank's own page and `handler` never runs.
   * Without this the customer is stranded on api.razorpay.com.
   */
  callback_url?: string;
  redirect?: boolean;
};

type RazorpayCtor = new (o: RazorpayOptions) => {
  open: () => void;
  on: (event: string, cb: (e: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

/** Loads Razorpay's widget once, on demand — not on every page of the site. */
function loadRazorpay(): Promise<RazorpayCtor> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SRC}"]`,
    );
    const onLoad = () =>
      window.Razorpay
        ? resolve(window.Razorpay)
        : reject(new Error("Razorpay failed to initialise."));

    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", () => reject(new Error("blocked")), {
        once: true,
      });
      return;
    }

    const s = document.createElement("script");
    s.src = RAZORPAY_SRC;
    s.async = true;
    s.addEventListener("load", onLoad, { once: true });
    s.addEventListener("error", () => reject(new Error("blocked")), { once: true });
    document.head.appendChild(s);
  });
}

const FIELDS = [
  { name: "name", label: "Full name", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  { name: "addressLine", label: "Address", type: "text", autoComplete: "street-address" },
  { name: "city", label: "City", type: "text", autoComplete: "address-level2" },
  { name: "state", label: "State", type: "text", autoComplete: "address-level1" },
  { name: "pincode", label: "PIN code", type: "text", autoComplete: "postal-code" },
] as const;

type FieldName = (typeof FIELDS)[number]["name"];
const EMPTY: Record<FieldName, string> = {
  name: "",
  email: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
};

export default function CheckoutForm() {
  const router = useRouter();
  const { lines, ready, count, subtotal, clear } = useCart();
  const { reward, msLeft } = useReward();

  // The SAME function the server prices with — see the note in CartView.
  const discount = reward ? discountPaiseFor(Math.round(subtotal * 100), reward.pct) / 100 : 0;
  const total = subtotal - discount;

  const [values, setValues] = useState<Record<FieldName, string>>(EMPTY);
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Guards against a second tap opening a second Razorpay order. */
  const inFlight = useRef(false);

  const set = useCallback((k: FieldName, v: string) => {
    setValues((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
    setStatus(null);
  }, []);

  async function pay() {
    if (inFlight.current) return;

    // Same rules the server runs. This is for a fast, friendly error — the
    // server re-validates regardless.
    const check = validateCustomer(values);
    if (!check.ok) {
      setErrors(check.errors);
      setStatus("Please check the highlighted fields.");
      return;
    }

    inFlight.current = true;
    setBusy(true);
    setStatus("Starting secure payment…");

    try {
      const res = await fetch("/api/checkout/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: values,
          cart: lines.map((l) => ({
            slug: l.slug,
            size: l.size,
            fit: l.fit,
            qty: l.qty,
            note: l.note,
          })),
          // The code only. The server reads the percentage off its own row —
          // see the comment in the order route.
          rewardCode: reward?.code ?? null,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        fields?: CustomerErrors;
        orderId?: string;
        razorpayOrderId?: string;
        amountPaise?: number;
        discountPct?: number;
        discountPaise?: number;
        keyId?: string;
        customer?: { name: string; email: string; phone: string };
      };

      if (!res.ok || !data.razorpayOrderId || !data.keyId) {
        if (data.fields) setErrors(data.fields);
        setStatus(data.error ?? "Could not start the payment.");
        return;
      }

      // The server decides the discount, and its answer is already baked into
      // the amount Razorpay is about to charge. If the 30-minute timer lapsed
      // between the cart and this click it applies nothing — drop the local
      // copy so the page stops advertising a discount that isn't happening.
      if (reward && !data.discountPaise) {
        clearReward();
        setStatus("Your game discount expired. Continuing at the normal price.");
      }

      const Razorpay = await loadRazorpay();
      setStatus(null);

      const rzp = new Razorpay({
        key: data.keyId,
        amount: data.amountPaise!,
        currency: "INR",
        name: "Sweet Devil",
        description: `Order ${data.orderId}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: data.customer?.name,
          email: data.customer?.email,
          contact: data.customer?.phone,
        },
        notes: { order_id: data.orderId! },
        theme: { color: "#8B0000" },
        // Only used when Razorpay redirects away (bank pages on mobile). When
        // the in-page flow works, `handler` runs and this never fires.
        callback_url: `${window.location.origin}/api/checkout/callback`,
        modal: {
          ondismiss: () => {
            inFlight.current = false;
            setBusy(false);
            setStatus("Payment cancelled. Your cart is still here.");
          },
        },
        handler: (r) => {
          // Fire-and-forget is wrong here: the customer must not see a success
          // page until the server has verified the signature.
          setStatus("Confirming your payment…");
          void (async () => {
            try {
              const v = await fetch("/api/checkout/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(r),
              });
              const out = (await v.json()) as { ok?: boolean; orderId?: string; error?: string };

              if (!v.ok || !out.ok) {
                setStatus(
                  out.error ??
                    "We couldn't confirm that payment. Please contact us before trying again.",
                );
                inFlight.current = false;
                setBusy(false);
                return;
              }
              clear();
              // Spent. The server has already marked the code used; this stops
              // the cart showing it again on the way back.
              clearReward();
              router.push(`/order/${out.orderId}`);
            } catch {
              // The money may well have left. Never tell them to just retry.
              setStatus(
                "Payment went through but confirmation failed. Please contact us with your payment id — do not pay again.",
              );
              inFlight.current = false;
              setBusy(false);
            }
          })();
        },
      });

      rzp.on("payment.failed", () => {
        inFlight.current = false;
        setBusy(false);
        setStatus("That payment didn't go through. You can try again.");
      });

      rzp.open();
    } catch (err) {
      inFlight.current = false;
      setBusy(false);
      setStatus(
        err instanceof Error && err.message === "blocked"
          ? "The payment window was blocked. Turn off your ad blocker and try again."
          : "Something went wrong starting the payment. Please try again.",
      );
    }
  }

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
          <p className="readout text-bone-faint">nothing to pay for</p>
          <p className="display text-bone mt-3 text-[length:var(--step-2)]">
            Your cart is empty
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
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
        {/* ── delivery details ── */}
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void pay();
          }}
          className="chassis cut-4 p-5 md:p-7"
          style={{
            ["--cut" as string]: "20px",
            ["--chassis-fill" as string]: "var(--color-void-deep)",
          }}
        >
          <div className="border-line/60 mb-5 flex items-center gap-3 border-b pb-3">
            <span className="readout text-ember">DLV</span>
            <span className="bg-line/60 h-px flex-1" />
            <span className="readout text-bone-faint">where it goes</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div
                key={f.name}
                className={f.name === "addressLine" ? "sm:col-span-2" : ""}
              >
                <Field label={f.label}>
                  <input
                    type={f.type}
                    name={f.name}
                    autoComplete={f.autoComplete}
                    value={values[f.name]}
                    onChange={(e) => set(f.name, e.target.value)}
                    aria-invalid={Boolean(errors[f.name])}
                    aria-describedby={errors[f.name] ? `err-${f.name}` : undefined}
                    inputMode={
                      f.name === "pincode" || f.name === "phone" ? "numeric" : undefined
                    }
                    className={CONTROL}
                  />
                </Field>
                {errors[f.name] && (
                  <p id={`err-${f.name}`} role="alert" className="readout text-flare mt-1.5">
                    {errors[f.name]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <p className="readout text-bone-faint mt-5 leading-relaxed">
            we deliver across india · free shipping
          </p>

          {status && (
            <p role="status" className="readout text-flare mt-4 leading-relaxed">
              {status}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="cut bg-bone text-void label group mt-6 flex w-full items-center justify-center gap-3 py-4 disabled:opacity-60"
            style={{ ["--cut" as string]: "14px" }}
          >
            {busy ? "Working…" : `Pay ${inr(total)}`}
            {!busy && (
              <span
                aria-hidden
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            )}
          </button>

          <p className="readout text-bone-faint mt-4 leading-relaxed">
            payments handled by razorpay · we never see your card
          </p>
        </form>

        {/* ── what you're buying ── */}
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

            <ul className="space-y-3">
              {lines.map((l) => {
                const p = bySlug(l.slug);
                if (!p) return null;
                return (
                  <li key={lineId(l)} className="flex items-center gap-3">
                    <span
                      className="cut bg-panel relative block aspect-square w-12 shrink-0 overflow-hidden"
                      style={{ ["--cut" as string]: "5px" }}
                    >
                      <Image
                        src={p.image}
                        alt=""
                        width={1000}
                        height={1000}
                        sizes="48px"
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-bone block truncate text-[0.92rem]">
                        {p.name}
                      </span>
                      <span className="readout text-bone-faint">
                        {[l.fit, l.size].filter(Boolean).join(" · ")} × {l.qty}
                      </span>
                    </span>
                    <span className="text-bone-dim shrink-0 text-[0.9rem]">
                      {inr(p.price * l.qty)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="border-line/60 mt-4 flex items-baseline justify-between border-t pt-3">
              <span className="readout text-bone-faint">shipping</span>
              <span className="readout text-ember">free</span>
            </div>

            {reward && (
              <div className="flex items-baseline justify-between gap-3 pt-2">
                <span className="min-w-0">
                  <span className="readout text-ember block">
                    devil&apos;s aim −{reward.pct}%
                  </span>
                  <span className="readout text-bone-faint mt-0.5 block">
                    expires in {countdown(msLeft)}
                  </span>
                </span>
                <span className="text-ember shrink-0 font-semibold">−{inr(discount)}</span>
              </div>
            )}

            <div className="flex items-baseline justify-between py-3">
              <span className="label text-bone">Total</span>
              <span className="display text-bone text-2xl">{inr(total)}</span>
            </div>

            <Link
              href="/cart"
              className="text-bone-dim hover:text-ember inline-flex min-h-11 items-center text-[0.9rem] transition-colors"
            >
              ← Back to cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
