"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const line =
  "Some run cold. You run hot. Sweet Devil is for the loud ones, the unserious ones, the ones who'd rather be a little bad than boring.";

export default function Manifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.4"],
  });

  const words = line.split(" ");

  return (
    <section id="manifesto" ref={ref} className="mx-auto max-w-5xl px-5 py-32 md:px-10 md:py-44">
      <p className="eyebrow mb-10 text-devil">The manifesto</p>
      <p className="display flex flex-wrap gap-x-4 gap-y-2 text-4xl leading-tight md:text-6xl">
        {words.map((w, i) => {
          const start = i / words.length;
          const end = start + 1 / words.length;
          return <Word key={i} progress={scrollYProgress} range={[start, end]} word={w} />;
        })}
      </p>
    </section>
  );
}

function Word({
  progress,
  range,
  word,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  range: [number, number];
  word: string;
}) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  const devil = word.toLowerCase().includes("devil") || word.toLowerCase().includes("bad");
  return (
    <motion.span style={{ opacity }} className={devil ? "text-devil" : ""}>
      {word}
    </motion.span>
  );
}
