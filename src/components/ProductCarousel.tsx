"use client";

import { useSmooothy } from "@/hooks/useSmooothy";
import { products, inr } from "@/lib/products";

export default function ProductCarousel() {
  const { ref, slider } = useSmooothy({
    infinite: true,
    snap: true,
    lerpFactor: 0.28,
  });

  return (
    <section id="shop" className="relative py-24 md:py-32">
      <div className="mx-auto mb-12 flex max-w-[1400px] items-end justify-between px-5 md:px-10">
        <div>
          <p className="eyebrow text-ink-dim">The drop</p>
          <h2 className="display mt-3 text-5xl md:text-7xl">
            Latest <span className="text-devil">heat</span>
          </h2>
        </div>
        <div className="hidden gap-3 md:flex">
          <button
            aria-label="Previous"
            onClick={() => slider?.goToPrev()}
            className="grid h-12 w-12 place-items-center rounded-full border border-line transition-colors hover:border-devil hover:text-devil"
          >
            ←
          </button>
          <button
            aria-label="Next"
            onClick={() => slider?.goToNext()}
            className="grid h-12 w-12 place-items-center rounded-full border border-line transition-colors hover:border-devil hover:text-devil"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className="flex w-screen cursor-grab overflow-x-hidden px-[calc(50%-44vw)] active:cursor-grabbing md:px-[calc(50%-22vw)]"
      >
        {products.map((p) => (
          <div
            key={p.slug}
            className="w-[82vw] shrink-0 px-2 md:w-[40vw] lg:w-[26vw]"
          >
            <article className="group">
              <div
                className="relative aspect-[4/5] overflow-hidden rounded-2xl"
                style={{
                  background: `linear-gradient(150deg, ${p.gradient[0]}, ${p.gradient[1]})`,
                }}
              >
                {/* placeholder "tee" mark */}
                <div className="absolute inset-0 grid place-items-center">
                  <span className="display select-none px-6 text-center text-3xl text-white/90 mix-blend-overlay md:text-4xl">
                    {p.name}
                  </span>
                </div>
                {p.tag && (
                  <span className="absolute left-4 top-4 rounded-full bg-bg/70 px-3 py-1 text-xs font-medium backdrop-blur">
                    {p.tag}
                  </span>
                )}
                <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <button className="w-full rounded-xl bg-ink py-3 font-semibold text-bg">
                    Add to cart · {inr(p.price)}
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between px-1">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-sm text-ink-dim">{p.collection}</p>
                </div>
                <span className="font-mono text-sm">{inr(p.price)}</span>
              </div>
            </article>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-ink-dim">
        Drag, fling, or use the arrows — it&apos;s a vibe.
      </p>
    </section>
  );
}
