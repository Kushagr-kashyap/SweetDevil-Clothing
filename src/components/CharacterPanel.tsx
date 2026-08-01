import type { Character } from "@/lib/characters";

/**
 * The character behind a garment, told on its product page.
 *
 * Sits above Shipping deliberately: by the time someone scrolls past the buy
 * box they've either decided or they're looking for a reason. The story is the
 * reason. Shipping and returns are for people who've already decided.
 *
 * Rendered open and inline rather than inside a <details> — a story nobody
 * expands is a story nobody reads, and this is the whole point of the product.
 */
export default function CharacterPanel({ character }: { character: Character }) {
  return (
    <section
      className="chassis cut-4 relative overflow-hidden p-5 md:p-7"
      style={{
        ["--cut" as string]: "20px",
        ["--chassis-fill" as string]: "var(--color-void-deep)",
      }}
      aria-labelledby={`char-${character.id}`}
    >
      <span
        aria-hidden
        className="bloom absolute -right-16 -top-20 h-64 w-64 opacity-30"
      />

      <div className="relative">
        <div className="border-line/60 flex items-center gap-3 border-b pb-3">
          <span className="readout text-ember">the character</span>
          <span className="bg-line/60 h-px flex-1" />
          <span className="readout text-bone-faint">01</span>
        </div>

        <h2
          id={`char-${character.id}`}
          className="display text-bone mt-4 text-[length:var(--step-3)] leading-[0.9]"
        >
          {character.name}
        </h2>

        {/* Dossier. `dl` rather than a table — this is labelled data, not a grid. */}
        <dl className="border-line/60 mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-b pb-4 sm:grid-cols-3">
          <div>
            <dt className="readout text-bone-faint">real name</dt>
            <dd className="text-bone mt-0.5 text-[0.95rem]">{character.realName}</dd>
          </div>
          <div>
            <dt className="readout text-bone-faint">age</dt>
            <dd className="text-bone mt-0.5 text-[0.95rem]">{character.age}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="readout text-bone-faint">occupation</dt>
            <dd className="text-bone mt-0.5 text-[0.95rem]">{character.occupation}</dd>
          </div>
        </dl>

        {/* The quote leads. It's the line people screenshot. */}
        <blockquote className="mt-5">
          <p className="display text-ember whitespace-pre-line text-[length:var(--step-1)] leading-[1.15]">
            “{character.quote}”
          </p>
        </blockquote>

        <div className="text-bone-dim prose-body mt-5 max-w-[62ch] space-y-3.5 text-[0.98rem]">
          {character.story.map((para) => (
            <p key={para.slice(0, 32)}>{para}</p>
          ))}
        </div>

        <p className="readout text-bone-faint border-line/60 mt-6 border-t pt-3">
          wear the story
        </p>
      </div>
    </section>
  );
}
