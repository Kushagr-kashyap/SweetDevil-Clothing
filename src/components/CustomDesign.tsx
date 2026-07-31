import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";
import { SectionHead } from "./hud";
import { discount, inr, productsIn } from "@/lib/products";

const STEPS = [
  {
    title: "Fill the form",
    body: "Got an idea? Let's hear it. Pick your t-shirt size, and tell us exactly what you're envisioning — the colours, the vibe, the message, or even a mood. You can add anything that inspires you, from hand-drawn sketches to Pinterest screenshots. If you can picture it, we can create it.",
  },
  {
    title: "Get your designs",
    body: "Once we've got your brief, our creative team gets to work. We'll design 2–3 unique concepts tailored just for you and send them straight to your inbox. This is your chance to play art director: choose the one you love, or send feedback for tweaks. We won't stop until the design feels like you.",
  },
  {
    title: "Make it real",
    body: "After your final approval, the design heads to our production floor. Every print is crafted with premium materials so it looks as good in person as it did in your imagination. In a short time you'll be wearing a one-of-a-kind t-shirt that's yours and yours alone.",
  },
];

export default function CustomDesign({
  /** Off on /custom, where the page masthead already carries the title. */
  heading = true,
}: {
  heading?: boolean;
} = {}) {
  const tiers = productsIn("custom");

  return (
    <section id="custom" className="px-[max(1.25rem,5vw)] py-14 md:py-20">
      {heading ? (
        <SectionHead
          code="CST"
          title="Custom Designs"
          blurb="Your idea, drawn by our team, printed once. Pick how much of the shirt you want to take over."
          count={tiers.length}
        />
      ) : (
        <div className="border-line/60 mb-7 flex items-center gap-3 border-b pb-3">
          <span className="readout text-ember">CST</span>
          <span className="bg-line/60 h-px flex-1" />
          <span className="readout text-bone-faint">choose a print area</span>
        </div>
      )}

      {/* ── tiers ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {tiers.map((p, i) => (
          <Reveal key={p.slug} delay={i * 70}>
            <Link
              href={`/products/${p.slug}`}
              className="chassis cut group flex h-full items-center gap-3 p-3 transition-colors"
              style={{ ["--cut" as string]: "12px" }}
            >
              <span
                className="cut bg-panel relative block aspect-square w-16 shrink-0 overflow-hidden"
                style={{ ["--cut" as string]: "6px" }}
              >
                <Image
                  src={p.image}
                  alt=""
                  width={1000}
                  height={1000}
                  sizes="80px"
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="display text-bone group-hover:text-ember block text-[1.05rem] leading-tight transition-colors">
                  {p.name}
                </span>
                <span className="mt-1 flex flex-wrap items-baseline gap-2">
                  <span className="text-bone text-sm font-semibold">
                    {inr(p.price)}
                  </span>
                  <span className="text-bone-faint text-xs line-through">
                    {inr(p.mrp)}
                  </span>
                  <span className="readout text-flare">−{discount(p)}%</span>
                </span>
              </span>
              <span
                aria-hidden
                className="text-bone-faint group-hover:text-ember shrink-0 transition-all duration-300 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </Reveal>
        ))}
      </div>

      {/* ── process ── */}
      <div className="mt-14">
        <h3 className="display text-bone text-[length:var(--step-2)]">
          How to make a unique design
        </h3>
        <ol className="mt-6 grid gap-6 md:grid-cols-3 md:gap-5">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 80}>
              <div className="border-line/60 mb-3 flex items-center gap-3 border-b pb-2">
                <span className="display text-ember text-3xl leading-none">
                  {i + 1}
                </span>
                <span className="bg-line/60 h-px flex-1" />
              </div>
              <h4 className="display text-bone text-[1.3rem]">{s.title}</h4>
              <p className="text-bone-dim prose-body mt-2 text-[0.95rem]">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
