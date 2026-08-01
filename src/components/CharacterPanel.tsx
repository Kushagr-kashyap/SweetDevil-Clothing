import type { Character } from "@/lib/characters";

/**
 * The character behind a garment, told on its product page.
 *
 * Sits above Shipping deliberately: by the time someone scrolls past the buy
 * box they've either decided or they're looking for a reason. The story is the
 * reason. Shipping and returns are for people who've already decided.
 *
 * Collapsible at the owner's request — not everyone wants to read it. It starts
 * OPEN rather than closed: a story nobody notices is a story nobody reads, and
 * this is the reason the product exists. Anyone uninterested closes it in one
 * tap, which is the cost of one tap; hiding it by default costs every reader
 * who never knew it was there.
 *
 * Built on <details>, so it opens and closes with no JavaScript at all.
 */
export default function CharacterPanel({ character }: { character: Character }) {
  return (
    <details
      open
      className="chassis cut-4 group relative overflow-hidden p-5 md:p-7"
      style={{
        ["--cut" as string]: "20px",
        ["--chassis-fill" as string]: "var(--color-void-deep)",
      }}
    >
      <span
        aria-hidden
        className="bloom absolute -right-16 -top-20 h-64 w-64 opacity-30"
      />

      <summary className="relative flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <span className="readout text-ember">about character</span>
        <span className="bg-line/60 h-px flex-1" />
        <span className="readout text-bone-faint group-open:hidden">read</span>
        <span className="readout text-bone-faint hidden group-open:inline">close</span>
        {/* Rotates to an × when open. A plain +/- swap flickers; a rotation reads
            as the same control changing state. */}
        <span
          aria-hidden
          className="text-bone-faint grid h-8 w-8 shrink-0 place-items-center text-lg leading-none transition-transform duration-300 group-open:rotate-45"
        >
          +
        </span>
      </summary>

      <div className="relative">
        <div className="border-line/60 mt-3 border-b pb-1" />

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
    </details>
  );
}
