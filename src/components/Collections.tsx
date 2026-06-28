"use client";

import { motion } from "motion/react";
import { collections } from "@/lib/products";

export default function Collections() {
  return (
    <section id="collections" className="mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-32">
      <div className="mb-14 flex flex-col gap-4">
        <p className="eyebrow text-ink-dim">Pick your poison</p>
        <h2 className="display max-w-3xl text-5xl md:text-7xl">
          Three clubs.
          <br />
          One <span className="text-devil">unholy</span> wardrobe.
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {collections.map((c, i) => (
          <motion.a
            key={c.name}
            href="#shop"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-3xl border border-line p-7"
            style={{
              background: `linear-gradient(160deg, ${c.gradient[0]}22, ${c.gradient[1]})`,
            }}
          >
            <div
              className="absolute -right-10 -top-10 h-48 w-48 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-90"
              style={{ background: c.gradient[0], opacity: 0.4 }}
            />
            <span className="eyebrow relative text-ink-dim">0{i + 1}</span>
            <h3 className="display relative mt-3 text-4xl">{c.name}</h3>
            <p className="relative mt-3 max-w-xs text-ink-dim">{c.blurb}</p>
            <span className="relative mt-6 flex items-center gap-2 font-medium text-ink">
              Shop collection
              <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                →
              </span>
            </span>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
