"use client";

import Image from "next/image";
import { useSmooothy } from "@/hooks/useSmooothy";
import ProductCard from "./ProductCard";
import Reveal from "./Reveal";
import { Readout, SectionHead, Ticks } from "./hud";
import { cardImage, discount, inr, productsIn, sku } from "@/lib/products";

const buyUrl = (slug: string) => `/products/${slug}`;

/* ── Devil's Club: a draggable rail. Seven tees, kinetic, the flagship. ─────── */

function DevilsClub() {
  const items = productsIn("devils-club");
  // Bounded, not infinite: wrapping clones leave a sliver of the last card
  // poking through the left inset, which reads as a rendering artefact.
  const { ref, slider } = useSmooothy({
    infinite: false,
    snap: true,
    lerpFactor: 0.28,
  });

  return (
    <section id="devils-club" className="py-14 md:py-20">
      <div className="px-[max(1.25rem,5vw)]">
        <SectionHead
          code="DVL"
          title="Devil's Club"
          blurb="Band-grade graphics for the gloriously unholy."
          count={items.length}
        />
      </div>

      <div
        ref={ref}
        className="flex w-full cursor-grab overflow-x-hidden px-[max(1.25rem,5vw)] active:cursor-grabbing"
      >
        {items.map((p) => (
          <div key={p.slug} className="w-[70vw] shrink-0 pr-3 sm:w-[46vw] lg:w-[27vw]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between px-[max(1.25rem,5vw)]">
        <p className="readout text-bone-faint">drag to browse</p>
        <div className="flex gap-2">
          <button
            aria-label="Previous product"
            onClick={() => slider?.goToPrev()}
            className="chassis cut text-bone-dim hover:text-ember grid h-10 w-10 place-items-center transition-colors"
            style={{ ["--cut" as string]: "8px" }}
          >
            ←
          </button>
          <button
            aria-label="Next product"
            onClick={() => slider?.goToNext()}
            className="chassis cut text-bone-dim hover:text-ember grid h-10 w-10 place-items-center transition-colors"
            style={{ ["--cut" as string]: "8px" }}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Brainrot Club: a tight two-up grid. Deliberately a different rhythm. ──── */

function BrainrotClub() {
  const items = productsIn("brainrot-club");
  return (
    <section id="brainrot-club" className="px-[max(1.25rem,5vw)] py-14 md:py-20">
      <SectionHead
        code="BRN"
        title="Brainrot Club"
        blurb="Terminally online. Proudly unserious."
        count={items.length}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((p, i) => (
          <Reveal key={`${p.slug}-${i}`} delay={i * 60}>
            {/* two-up on phones, four-up on desktop — much narrower than the rail */}
            <ProductCard product={p} sizes="(max-width: 1024px) 45vw, 23vw" />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── Limited Edition: one item, given the whole stage. ─────────────────────── */

function LimitedEdition() {
  const p = productsIn("limited-edition")[0];
  if (!p) return null;

  return (
    <section id="limited-edition" className="px-[max(1.25rem,5vw)] py-14 md:py-20">
      <SectionHead
        code="LTD"
        title="Limited Edition"
        blurb="Numbered drops. Once they're gone, they're gone."
        count={1}
      />

      <Reveal
        as="a"
        href={buyUrl(p.slug)}
        className="chassis chassis-hot cut-4 group relative block overflow-hidden md:grid md:grid-cols-[1.1fr_1fr] md:items-center"
        style={{ ["--cut" as string]: "22px" }}
      >
        <span className="bg-panel relative block aspect-square overflow-hidden">
          <span
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--color-panel-hi),var(--color-panel)_72%)]"
          />
          <Image
            src={cardImage(p)}
            alt={p.name}
            width={1000}
            height={1000}
            sizes="(max-width: 768px) 90vw, 45vw"
            className="relative h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
          />
          <Ticks />
        </span>

        <span className="block p-5 md:p-8">
          <span className="readout text-ember">limited — numbered run</span>
          <span className="display text-bone mt-3 block text-[length:var(--step-3)]">
            {p.name}
          </span>
          <span className="mt-4 flex items-baseline gap-3">
            <span className="text-bone text-2xl font-semibold">{inr(p.price)}</span>
            <span className="text-bone-faint line-through">{inr(p.mrp)}</span>
            <span className="readout text-flare">−{discount(p)}%</span>
          </span>

          <span className="mt-6 block">
            <Readout label="sku" value={sku(p)} />
            <Readout label="run" value="numbered" hot />
            <Readout label="restock" value="never" hot />
          </span>

          <span
            className="cut bg-bone text-void label mt-6 flex items-center justify-center gap-2 py-3.5"
            style={{ ["--cut" as string]: "12px" }}
          >
            Claim yours
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </span>
      </Reveal>
    </section>
  );
}

export default function Catalogue() {
  return (
    <div id="catalogue">
      <DevilsClub />
      <BrainrotClub />
      <LimitedEdition />
    </div>
  );
}
