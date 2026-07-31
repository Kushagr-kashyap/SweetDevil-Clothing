import Reveal from "./Reveal";

const LINE =
  "Some run cold. You run hot. Sweet Devil is for the loud ones, the unserious ones, the ones who'd rather be a little bad than boring.";

/**
 * Words fade up in sequence when the paragraph enters view. The stagger is CSS
 * `transition-delay`, so the copy is legible at full contrast if scripting
 * never runs — the previous scroll-scrubbed version left it at 12% opacity.
 */
export default function Manifesto() {
  const words = LINE.split(" ");

  return (
    <section id="manifesto" className="px-[max(1.25rem,5vw)] py-20 md:py-32">
      <div className="border-line/60 mb-8 flex items-center gap-3 border-b pb-3">
        <span className="readout text-ember">MFT</span>
        <span className="bg-line/60 h-px flex-1" />
        <span className="readout text-bone-faint">about</span>
      </div>

      <Reveal
        as="p"
        className="words display flex max-w-4xl flex-wrap gap-x-3 gap-y-1 text-[length:var(--step-2)] leading-[1.15]"
      >
        {words.map((w, i) => (
          <span
            key={i}
            style={{ ["--i" as string]: i }}
            className={/devil|bad|hot/i.test(w) ? "text-ember" : "text-bone"}
          >
            {w}
          </span>
        ))}
      </Reveal>
    </section>
  );
}
