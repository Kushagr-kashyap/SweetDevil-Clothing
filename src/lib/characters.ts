/**
 * The cast.
 *
 * Each character belongs to a garment and is told on that product's page. The
 * story is the reason to read a product page rather than scan it, so the copy
 * here is the owner's own — do not rewrite it, tighten it, or "improve" the
 * voice. Paragraph breaks are presentation; the words are not ours.
 *
 * A character is linked FROM a product (`Product.character`), not the other way
 * round, so a design can exist without a character and a character can later be
 * moved to a different garment without touching the catalogue.
 */

export type Character = {
  id: string;
  /** The alias, printed loud. */
  name: string;
  realName: string;
  age: number;
  occupation: string;
  /** One entry per rendered paragraph. */
  story: string[];
  /** Their line. Rendered as a pull quote. */
  quote: string;
};

export const characters: Character[] = [
  {
    id: "nyx",
    name: "NYX",
    realName: "Aanya Khanna",
    age: 23,
    occupation: "Architecture Student",
    story: [
      "At sixteen, Aanya's closest friend disappeared after school. No clues. No witnesses. No goodbye. One moment she was there. The next, she was simply... gone.",
      "The city searched. The police searched. Her family searched. But as weeks became months, hope faded. Missing posters disappeared. People stopped asking questions. Everyone moved on.",
      "Except Aanya. She refused to believe someone could vanish without leaving something behind.",
      "Years later, her Inner Devil awakened, giving her the power to sense the emotional echoes people leave behind—fear, hope, grief, love. Following those fragments instead of footprints, she searched every place they had once shared. The truth never came all at once. Only enough to keep her searching.",
      "She made herself one promise: if she couldn't save the person she loved most, she would never let another family lose hope the way hers did.",
      "Since then, she has helped find the missing, comfort the grieving, and uncover truths the world had abandoned. Every life she saves is a promise kept. Every mystery she solves brings her one step closer to the only one that still remains.",
      "The world has moved on. She hasn't. Somewhere, someone still knows what happened that day. And until Aanya Khanna finds the truth... She will never stop looking.",
    ],
    quote: "The world gave up.\nI never did.",
  },
];

export const characterById = (id: string) => characters.find((c) => c.id === id);
