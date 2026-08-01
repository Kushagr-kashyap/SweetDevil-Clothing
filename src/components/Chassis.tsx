"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { useCart } from "@/lib/cart";
import { collections } from "@/lib/products";

/**
 * The chassis: a fixed, chamfered hairline frame drawn around the viewport,
 * with the wordmark silkscreened into the top bezel.
 *
 * The frame is built from eight 1px elements — four edges and four rotated
 * corner diagonals — rather than a clipped box, because clip-path also clips
 * the border and would leave the corners open.
 *
 * Nothing here animates via JS. The menu bars are CSS transforms so they render
 * as three bars even if scripting never boots; only the open/closed toggle
 * needs React.
 */

const NAV = [
  { label: "Home", href: "/" },
  { label: "All Products", href: "/products" },
  { label: "Custom Designs", href: "/custom" },
  { label: "About", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

const EASE = "cubic-bezier(0.16,1,0.3,1)";

function Edge({ className }: { className: string }) {
  return <span aria-hidden className={`bg-line absolute ${className}`} />;
}

/** One 45° corner diagonal, sized to bridge the two edges it joins. */
function Corner({ position, rotate }: { position: string; rotate: number }) {
  return (
    <span
      aria-hidden
      className={`absolute h-[var(--frame-cut)] w-[var(--frame-cut)] ${position}`}
    >
      <span
        className="bg-line absolute left-1/2 top-1/2 h-px w-[calc(var(--frame-cut)*1.4142)] origin-center"
        style={{ transform: `translate(-50%,-50%) rotate(${rotate}deg)` }}
      />
    </span>
  );
}

export default function Chassis() {
  const [open, setOpen] = useState(false);
  const lenis = useLenis();
  const pctRef = useRef<HTMLSpanElement>(null);
  const { count, ready } = useCart();

  // Freeze the page behind the menu.
  useEffect(() => {
    if (!lenis) return;
    if (open) lenis.stop();
    else lenis.start();
    return () => lenis.start();
  }, [open, lenis]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Scroll telemetry, written straight to the DOM to avoid re-rendering the
  // whole chassis on every scroll frame.
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const v = max > 0 ? window.scrollY / max : 0;
      if (pctRef.current) {
        pctRef.current.textContent = String(Math.round(v * 100)).padStart(3, "0");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] [--frame-cut:18px] [--frame-inset:8px] md:[--frame-cut:26px] md:[--frame-inset:14px]">
      {/* ── top bezel: a short fade so the bar stays legible over artwork.
           Painted before the frame so the frame's corners stay crisp on top.
           Kept shallow — a tall gradient washes out headings scrolling under. */}
      <div
        aria-hidden
        className="from-void via-void/75 absolute inset-x-0 top-0 h-[74px] bg-gradient-to-b to-transparent"
      />

      {/* ── hairline frame ── */}
      <div aria-hidden className="absolute inset-[var(--frame-inset)]">
        <Edge className="left-[var(--frame-cut)] right-[var(--frame-cut)] top-0 h-px" />
        <Edge className="bottom-0 left-[var(--frame-cut)] right-[var(--frame-cut)] h-px" />
        <Edge className="bottom-[var(--frame-cut)] left-0 top-[var(--frame-cut)] w-px" />
        <Edge className="bottom-[var(--frame-cut)] right-0 top-[var(--frame-cut)] w-px" />
        <Corner position="left-0 top-0" rotate={-45} />
        <Corner position="right-0 top-0" rotate={45} />
        <Corner position="bottom-0 right-0" rotate={-45} />
        <Corner position="bottom-0 left-0" rotate={45} />
      </div>

      {/* ── wordmark ──
           py-2 gives the mark a 42px hit area; the top offset drops by the same
           8px so the lettering stays optically where it was in the bezel. */}
      <Link
        href="/"
        onClick={() => setOpen(false)}
        className="pointer-events-auto absolute left-1/2 top-[calc(var(--frame-inset)+2px)] z-10 flex min-h-11 -translate-x-1/2 items-center px-3"
      >
        <span className="display text-bone text-[1.05rem] tracking-[0.02em] md:text-xl">
          SWEETDEVIL
        </span>
      </Link>

      {/* ── cart ──
           The badge only renders once localStorage has been read, otherwise the
           server would render 0 and the client a different number. */}
      <Link
        href="/cart"
        onClick={() => setOpen(false)}
        aria-label={ready && count > 0 ? `Cart, ${count} items` : "Cart"}
        className="pointer-events-auto group absolute left-[calc(var(--frame-inset)+8px)] top-[calc(var(--frame-inset)+4px)] z-10 flex h-12 items-center gap-2 px-2"
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          aria-hidden
          className="text-bone group-hover:text-ember transition-colors"
        >
          <path d="M6 7h12l-1.2 12.2a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3Z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
        {ready && count > 0 && (
          <span className="readout text-ember tabular-nums">
            {String(count).padStart(2, "0")}
          </span>
        )}
      </Link>

      {/* ── scroll telemetry (desktop — on mobile the bezel belongs to the burger) ── */}
      <div
        aria-hidden
        className="absolute bottom-[calc(var(--frame-inset)+12px)] right-[calc(var(--frame-inset)+16px)] hidden md:block"
      >
        <span ref={pctRef} className="readout text-bone-faint">
          000
        </span>
      </div>

      {/* ── search ──
           Sits left of the burger rather than in the hero. The hero band is the
           first thing every visitor sees and a full-width search field there
           would cost the wordmark its fold on a phone — for a catalogue this
           size, an icon one tap from every page is enough. */}
      <Link
        href="/search"
        onClick={() => setOpen(false)}
        aria-label="Search products"
        className="pointer-events-auto group absolute right-[calc(var(--frame-inset)+56px)] top-[calc(var(--frame-inset)+4px)] z-10 grid h-12 w-12 place-items-center"
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          aria-hidden
          className="text-bone group-hover:text-ember transition-colors"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </Link>

      {/* ── menu trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="pointer-events-auto absolute right-[calc(var(--frame-inset)+8px)] top-[calc(var(--frame-inset)+4px)] z-10 grid h-12 w-12 place-items-center"
      >
        <span aria-hidden className="relative block h-[14px] w-[26px]">
          <span
            className={`bg-bone absolute left-0 top-0 block h-[2px] w-full transition-transform duration-300 ${open ? "translate-y-[6px] rotate-45" : ""}`}
            style={{ transitionTimingFunction: EASE }}
          />
          <span
            className={`bg-bone absolute left-0 top-[6px] block h-[2px] w-full transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`}
          />
          <span
            className={`bg-bone absolute left-0 top-[12px] block h-[2px] w-full transition-transform duration-300 ${open ? "-translate-y-[6px] -rotate-45" : ""}`}
            style={{ transitionTimingFunction: EASE }}
          />
        </span>
      </button>

      {/* ── menu panel ── */}
      {open && (
        <nav
          className="pointer-events-auto bg-void-deep/97 absolute inset-0 backdrop-blur-sm"
          style={{ animation: `riseIn 0.28s ${EASE} both` }}
        >
          <div className="flex h-full flex-col justify-center overflow-y-auto px-[max(1.75rem,8vw)] pb-16 pt-24">
            {/* A plain GET form, not a controlled input — it submits and works
                with scripting dead, same rule as everything else on the site. */}
            <form
              action="/search"
              method="get"
              role="search"
              className="rise mb-8 flex items-stretch gap-2"
              style={{ ["--d" as string]: "40ms" }}
              onSubmit={() => setOpen(false)}
            >
              <span
                className="chassis cut focus-within:bg-ember block min-w-0 flex-1 transition-colors"
                style={{ ["--cut" as string]: "8px" }}
              >
                <input
                  type="search"
                  name="q"
                  placeholder="Search tees, designs…"
                  aria-label="Search products"
                  // 16px minimum or iOS zooms the page on focus
                  className="text-bone placeholder:text-bone-faint w-full bg-transparent px-3 py-3 text-base outline-none"
                />
              </span>
              <button
                type="submit"
                className="cut bg-bone text-void label shrink-0 px-5"
                style={{ ["--cut" as string]: "8px" }}
              >
                Go
              </button>
            </form>

            <p className="readout text-bone-faint mb-8">Navigation</p>

            <ul className="flex flex-col">
              {NAV.map((l, i) => (
                <li
                  key={l.href}
                  className="rise border-line/50 border-b"
                  style={{ ["--d" as string]: `${60 + i * 50}ms` }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-baseline gap-4 py-4"
                  >
                    <span className="readout text-bone-faint group-hover:text-ember w-6 shrink-0 transition-colors">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="display text-bone group-hover:text-ember text-[length:var(--step-2)] transition-colors">
                      {l.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="rise mt-10" style={{ ["--d" as string]: "360ms" }}>
              <p className="readout text-bone-faint mb-3">Collections</p>
              <div className="flex flex-wrap gap-2">
                {collections.map((c) => (
                  <Link
                    key={c.id}
                    href={`/products#${c.id}`}
                    onClick={() => setOpen(false)}
                    className="chassis cut label text-bone-dim hover:text-bone px-3 py-2 transition-colors"
                    style={{ ["--cut" as string]: "10px" }}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
