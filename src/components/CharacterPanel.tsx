import type { Character } from "@/lib/characters";

/**
 * The character behind a garment — the CONTENTS of a panel, not the panel.
 *
 * This deliberately renders no wrapper, no chamfer and no toggle. It sits
 * inside the same `Panel` as Product info, Shipping and Returns, so it matches
 * them by construction rather than by me re-deriving the same border radius,
 * padding and heading treatment and getting them subtly wrong — which is
 * exactly what happened the first time.
 *
 * The story is the owner's own copy. Do not rewrite it, tighten it, or "improve"
 * the voice. Paragraph breaks are presentation; the words are not ours.
 */
export default function CharacterPanel({ character }: { character: Character }) {
  return (
    <div>
      <h3 className="display text-bone text-[length:var(--step-2)] leading-[0.95]">
        {character.name}
      </h3>

      {/* Dossier. `dl` rather than a table — this is labelled data, not a grid. */}
      <dl className="border-line/60 mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-b pb-4 sm:grid-cols-3">
        <div>
          <dt className="readout text-bone-faint">real name</dt>
          <dd className="text-bone-dim mt-0.5 text-[0.92rem]">{character.realName}</dd>
        </div>
        {/* Age is optional — a character whose age wasn't supplied shows no age,
            rather than an invented one or an empty labelled row. */}
        {character.age !== undefined && (
          <div>
            <dt className="readout text-bone-faint">age</dt>
            <dd className="text-bone-dim mt-0.5 text-[0.92rem]">{character.age}</dd>
          </div>
        )}
        <div className="col-span-2 sm:col-span-1">
          <dt className="readout text-bone-faint">occupation</dt>
          <dd className="text-bone-dim mt-0.5 text-[0.92rem]">{character.occupation}</dd>
        </div>
      </dl>

      {/* The quote leads. It's the line people screenshot. */}
      <blockquote className="mt-4">
        <p className="display text-ember whitespace-pre-line text-[1.15rem] leading-[1.2]">
          “{character.quote}”
        </p>
      </blockquote>

      <div className="text-bone-dim prose-body mt-4 space-y-3 text-[0.95rem]">
        {character.story.map((para) => (
          <p key={para.slice(0, 32)}>{para}</p>
        ))}
      </div>
    </div>
  );
}
