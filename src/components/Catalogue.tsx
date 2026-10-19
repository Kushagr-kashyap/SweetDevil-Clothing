"use client";

import Link from "next/link";
import { useSmooothy } from "@/hooks/useSmooothy";
import ProductCard from "./ProductCard";
import { SectionHead } from "./hud";
import { productsByCut, productsIn, winterByLine, type Product } from "@/lib/products";

/**
 * A draggable rail of cards.
 *
 * Extracted so every section can have one. Minimalist renders a rail per
 * garment type and the number of those is data, not code — hooks cannot be
 * called in a loop, so each rail has to be its own component instance with its
 * own useSmooothy.
 *
 * `cardClass` carries the width because that is the one thing that differs
 * between rails: Devil's Club shows one big card at a time because the artwork
 * is the product, while Minimalist shows two narrow ones because the choice
 * there is a colour and colours are judged side by side.
 */
function Rail({
  items,
  cardClass,
  sizes,
  label,
}: {
  items: Product[];
  cardClass: string;
  sizes?: string;
  label: string;
}) {
  // Bounded, not infinite: wrapping clones leave a sliver of the last card
  // poking through the left inset, which reads as a rendering artefact.
  const { ref, slider } = useSmooothy({ infinite: false, snap: true, lerpFactor: 0.28 });

  return (
    <>
      <div
        ref={ref}
        className="flex w-full cursor-grab overflow-x-hidden px-[max(1.25rem,5vw)] active:cursor-grabbing"
      >
        {items.map((p) => (
          <div key={p.slug} className={`${cardClass} shrink-0 pr-3`}>
            <ProductCard product={p} sizes={sizes} />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between px-[max(1.25rem,5vw)]">
        <p className="readout text-bone-faint">drag to browse</p>
        <div className="flex gap-2">
          <button
            aria-label={`Previous ${label}`}
            onClick={() => slider?.goToPrev()}
            className="chassis cut text-bone-dim hover:text-ember grid h-10 w-10 place-items-center transition-colors"
            style={{ ["--cut" as string]: "8px" }}
          >
            ←
          </button>
          <button
            aria-label={`Next ${label}`}
            onClick={() => slider?.goToNext()}
            className="chassis cut text-bone-dim hover:text-ember grid h-10 w-10 place-items-center transition-colors"
            style={{ ["--cut" as string]: "8px" }}
          >
            →
          </button>
        </div>
      </div>
    </>
  );
}

/* Card widths. Devil's Club keeps the large card at the owner's direction; the
   narrow one matches the 2 / 3 / 5-up grid Minimalist used before it became a
   rail, so the cards are the size they already were. */
const WIDE = "w-[70vw] sm:w-[46vw] lg:w-[27vw]";
const WIDE_SIZES = "(max-width: 640px) 70vw, (max-width: 1024px) 46vw, 27vw";
const NARROW = "w-[45vw] md:w-[31vw] lg:w-[19vw]";
const NARROW_SIZES = "(max-width: 768px) 45vw, (max-width: 1024px) 31vw, 19vw";

/** Heading that opens the group's own page. */
function GroupLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Link href={`/collections/${id}`} className="group/h inline-flex items-baseline gap-2">
      {children}
      <span
        aria-hidden
        className="text-bone-faint group-hover/h:text-ember transition-all duration-300 group-hover/h:translate-x-0.5"
      >
        →
      </span>
    </Link>
  );
}

/* ── Devil's Club: a draggable rail. The flagship, on the big card. ────────── */

function DevilsClub() {
  const items = productsIn("devils-club");
  if (!items.length) return null;

  return (
    <section id="devils-club" className="py-14 md:py-20">
      <div className="px-[max(1.25rem,5vw)]">
        <GroupLink id="devils-club">
          <SectionHead
            code="DVL"
            title="Devil's Club"
            blurb="Band-grade graphics for the gloriously unholy."
            count={items.length}
          />
        </GroupLink>
      </div>
      <Rail items={items} cardClass={WIDE} sizes={WIDE_SIZES} label="product" />
    </section>
  );
}

/* ── Minimalist: one wordmark, a rail per garment type. ───────────────────── */

function Minimalist() {
  const groups = productsByCut("minimalist");
  if (!groups.length) return null;
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <section id="minimalist" className="py-14 md:py-20">
      <div className="px-[max(1.25rem,5vw)]">
        <GroupLink id="minimalist">
          <SectionHead
            code="MIN"
            title="Minimalist"
            blurb="The wordmark, clean. Pick your cut and your colour."
            count={total}
          />
        </GroupLink>
      </div>

      {/*
        One rail per garment type, not one grid for everything.

        Devil's Club groups by design because the artwork is what differs there.
        Here the wordmark is constant, so the garment IS the choice — and
        someone deciding between a boxy tee and a waffle full-sleeve is making a
        different decision from someone picking a colour. A flat run of cards
        asks them to do both jobs at once.

        Groups come from CUTS and only render when they hold stock, so a garment
        type with nothing in it stays invisible until it has something.
      */}
      {groups.map(({ cut, items }) => (
        <div key={cut.id} id={cut.id} className="mt-12 first:mt-0">
          <div className="px-[max(1.25rem,5vw)]">
            <div className="border-line/60 mb-4 flex items-baseline gap-3 border-b pb-2">
              <GroupLink id={cut.id}>
                <h3 className="display text-bone hover:text-ember text-[1.1rem] leading-none transition-colors">
                  {cut.name}
                </h3>
              </GroupLink>
              <span className="bg-line/60 h-px flex-1" />
              <span className="readout text-bone-faint">
                {String(items.length).padStart(2, "0")}
              </span>
            </div>
          </div>
          <Rail items={items} cardClass={NARROW} sizes={NARROW_SIZES} label={cut.name} />
        </div>
      ))}
    </section>
  );
}

/* ── Winter: hoodies and heavy knits. Its own section, not a cut. ─────────── */

function Winter() {
  const groups = winterByLine();
  if (!groups.length) return null;
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <section id="winter" className="py-14 md:py-20">
      <div className="px-[max(1.25rem,5vw)]">
        <GroupLink id="winter">
          <SectionHead
            code="WTR"
            title="Winter Collection"
            blurb="Hoodies and heavy knits for when it finally turns."
            count={total}
          />
        </GroupLink>
      </div>

      {/*
        Two lines, Loud first.

        Same 360 GSM blank underneath, but a full illustrated back and a small
        wordmark are not the same product — different work, different price.
        Loud leads because it is the stronger piece and the dearer one, and
        someone opening Winter should meet Ruthless before a plain script.

        Like the Minimalist cuts, a line with no stock simply does not render.
      */}
      {groups.map(({ line, items }) => (
        <div key={line.id} id={line.id} className="mt-12 first:mt-0">
          <div className="px-[max(1.25rem,5vw)]">
            <div className="border-line/60 mb-4 flex items-baseline gap-3 border-b pb-2">
              <GroupLink id={line.id}>
                <h3 className="display text-bone hover:text-ember text-[1.1rem] leading-none transition-colors">
                  {line.name}
                </h3>
              </GroupLink>
              <span className="text-bone-faint hidden text-[0.8rem] sm:block">
                {line.blurb}
              </span>
              <span className="bg-line/60 h-px flex-1" />
              <span className="readout text-bone-faint">
                {String(items.length).padStart(2, "0")}
              </span>
            </div>
          </div>
          <Rail items={items} cardClass={NARROW} sizes={NARROW_SIZES} label={line.name} />
        </div>
      ))}
    </section>
  );
}

export default function Catalogue() {
  return (
    <div id="catalogue">
      <DevilsClub />
      <Minimalist />
      <Winter />
    </div>
  );
}
