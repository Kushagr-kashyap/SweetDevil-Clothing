import Image from "next/image";
import Link from "next/link";
import FireBackdrop from "./FireBackdrop";
import Glitch from "./Glitch";
import { Ticks } from "./hud";
import { cardImage, products, type Product } from "@/lib/products";

/**
 * The entrance is a pure CSS animation with `animation-fill-mode: both`, not a
 * JS one. If scripting fails the hero still paints — which is not true of a
 * Motion `initial`/`animate` pair, where a dead script leaves opacity at 0.
 */
const at = (ms: number, extra: Record<string, string> = {}) =>
  ({ ["--d"]: `${ms}ms`, ...extra }) as React.CSSProperties;

/**
 * Four tees pulled forward as the "loadout" strip beneath the hero.
 *
 * PICKS is editorial — the owner's choice of what leads the page. It is
 * RESOLVED, never asserted: this list used to end in `find(...)!`, and on
 * 2026-09-21, when the range was replaced, all four slugs stopped existing at
 * once. The non-null assertion turned that into `undefined.slug` and took the
 * whole home page down with a 500 — a retired tee should cost a thumbnail, not
 * the front door.
 *
 * Anything missing is dropped and the strip is topped up from the range, so it
 * survives the next range change too. Custom-design tiers are excluded: they
 * are a service, not a tee, and the strip is a shelf.
 */
const PICKS = [
  "killswitch-engage",
  "satan-s-child",
  "bound-2",
  "professional-tweeter",
];

const isTee = (p: Product) => p.collection !== "custom";

const LOADOUT: Product[] = [
  ...PICKS.map((s) => products.find((p) => p.slug === s)).filter(
    (p): p is Product => p !== undefined,
  ),
  ...products.filter((p) => isTee(p) && !PICKS.includes(p.slug)),
].slice(0, 4);

export default function Hero() {
  return (
    <section
      id="top"
      className="relative px-[max(1.25rem,5vw)] pb-16 pt-24 md:pb-24 md:pt-28"
    >
      {/* The "SD—01 · est. 2024 · made in india" strip that sat here was removed
          at the owner's request — it pushed the wordmark down the fold on a
          phone for a line nobody reads. The same facts live on /about. */}
      <Glitch
        as="h1"
        lines={["Sweet", "Devil"]}
        style={at(120)}
        className="rise display text-bone flex flex-col items-start text-[length:var(--step-4)]"
      />

      <p
        style={at(200)}
        className="rise text-bone-dim prose-body mt-5 max-w-[46ch] text-[length:var(--step-0)] md:mt-7"
      >
        Most clothes are built to help you blend in. These aren&apos;t. Oversized
        cuts, graphics loud enough to start something, printed in small runs and
        never restocked.
      </p>

      {/* ── the subject ── */}
      <div
        style={at(300, { "--cut": "20px" })}
        className="rise chassis cut-4 relative mt-9 aspect-[4/5] w-full overflow-hidden sm:aspect-[16/11] md:mt-12"
      >
        <div className="absolute inset-px overflow-hidden">
          <FireBackdrop className="scale-110 opacity-70" />
          {/* darken the plate so the mascot and type stay readable over fire */}
          <div className="from-void via-void/45 absolute inset-0 bg-gradient-to-t to-transparent" />
          <div className="bloom pointer-events-none absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 opacity-70" />

          <Image
            src="/brand/devil.png"
            alt="The Sweet Devil mascot, wings spread, holding two fireballs"
            width={1563}
            height={1563}
            priority
            // without this the LCP image is fetched at the top breakpoint (3840w)
            sizes="(max-width: 640px) 100vw, 60vw"
            className="absolute left-1/2 top-1/2 h-[105%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_0_40px_rgba(255,60,30,0.35)]"
          />

          <span
            aria-hidden
            className="animate-sweep via-flare/25 absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent to-transparent"
          />
        </div>

        <Ticks />

        <span className="readout text-bone-faint absolute bottom-3 left-4">
          unleash your inner devil
        </span>
      </div>

      {/* ── loadout strip ── */}
      {/* Four across, so anything short of four is hidden rather than shown
          ragged — an empty column reads as a failed image, not as a choice. */}
      {LOADOUT.length === 4 && (
      <div style={at(380)} className="rise mt-4 grid grid-cols-4 gap-2 md:gap-3">
        {LOADOUT.map((p) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            className="chassis cut-4 group relative aspect-square overflow-hidden"
            style={{ ["--cut" as string]: "9px" }}
          >
            <span className="absolute inset-px overflow-hidden">
              <Image
                src={cardImage(p)}
                alt={p.name}
                width={1000}
                height={1000}
                sizes="25vw"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </span>
          </Link>
        ))}
      </div>
      )}

      {/* ── CTA ── */}
      <Link
        style={at(460, { "--cut": "16px" })}
        href="/products"
        className="rise cut bg-bone text-void group mt-4 flex items-center justify-center gap-3 py-4 md:py-5"
      >
        <span className="label text-[0.8rem] md:text-sm">Shop the collection</span>
        <span
          aria-hidden
          className="transition-transform duration-300 group-hover:translate-x-1"
        >
          →
        </span>
      </Link>
    </section>
  );
}
