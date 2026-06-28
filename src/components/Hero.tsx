"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

export default function Hero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 15 });
  const sy = useSpring(my, { stiffness: 60, damping: 15 });

  const tx = useTransform(sx, [-0.5, 0.5], [-18, 18]);
  const ty = useTransform(sy, [-0.5, 0.5], [-12, 12]);
  const txInverse = useTransform(sx, [-0.5, 0.5], [14, -14]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  return (
    <section
      id="top"
      onMouseMove={onMove}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pt-24"
    >
      {/* glow */}
      <motion.div
        style={{ x: tx, y: ty }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[60vw] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-devil/20 blur-[120px]"
      />

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="eyebrow z-10 mb-6 text-ink-dim"
      >
        Graphic tees · est. for sinners
      </motion.p>

      <motion.h1
        style={{ x: tx }}
        className="display z-10 text-center text-[18vw] leading-[0.82] md:text-[15vw]"
      >
        <motion.span
          initial={{ opacity: 0, y: "30%" }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="block"
        >
          Sweet
        </motion.span>
        <motion.span
          initial={{ opacity: 0, y: "30%" }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="block text-devil"
          style={{ x: txInverse }}
        >
          Devil
        </motion.span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="z-10 mt-8 max-w-md text-center text-lg text-ink-dim"
      >
        Unleash your inner devil. Loud graphics, limited drops, zero apologies.
      </motion.p>

      <motion.a
        href="#shop"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="group z-10 mt-10 flex items-center gap-3 rounded-full bg-ink px-7 py-3.5 font-semibold text-bg transition-transform hover:scale-[1.03]"
      >
        Enter the drop
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </motion.a>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="eyebrow flex flex-col items-center gap-2 text-ink-dim">
          Scroll
          <span className="h-10 w-px animate-pulse bg-line" />
        </div>
      </motion.div>
    </section>
  );
}
