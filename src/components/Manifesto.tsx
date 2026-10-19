import Reveal from "./Reveal";

const LINE =
  "Every design here was drawn by us. Printed once. Never run again. No catalogue, no copies, no restocks — what you wear, nobody else can get.";

/**
 * The words that land in ember.
 *
 * An explicit set, not a regex over the copy. The previous version matched
 * /devil|bad|hot/ and the emphasis moved on its own whenever a word was
 * changed; here the four load-bearing words are chosen with the sentence —
 * who made it, how many exist, whether it returns, and who else can have it.
 */
const HOT = new Set(["us", "once", "never", "nobody"]);

const bare = (w: string) => w.toLowerCase().replace(/[^a-z]/g, "");

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
            className={HOT.has(bare(w)) ? "text-ember" : "text-bone"}
          >
            {w}
          </span>
        ))}
      </Reveal>
    </section>
  );
}
