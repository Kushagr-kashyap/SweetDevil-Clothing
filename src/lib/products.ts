/**
 * Catalogue mirrored from the live Wix store (sweetdevil.in).
 * Names, prices, descriptions and SKUs are the real ones, transcribed from the
 * live product pages on 2026-07-25. Do not invent or reword them.
 *
 * Photography is self-hosted in `public/products/`, one 1000×1000 file per
 * slug, so the storefront carries no dependency on the Wix CDN.
 */

/**
 * Every product photo is `public/products/<slug>.png`, square, at this size.
 *
 * 2000, not 1000, since 2026-09-25: the gallery lightbox zooms into the file
 * itself, and 1000px went soft past about 1.5x. next/image still downsizes for
 * the grid, so the card costs no more than it did.
 */
export const PHOTO_SIZE = 2000;

/**
 * Offered on every tee. Order matters — it's the order shown on the page.
 *
 * XXXL was dropped on 2026-08-01: the size chart stops at 2XL, so anyone
 * picking XXXL was choosing a size with no published measurements. Do not add a
 * size back without adding its row to the chart image first.
 */
export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

/** "Type" on the Wix product page. */
export const FITS = ["Regular", "Oversized"] as const;
export type Fit = (typeof FITS)[number];

/**
 * The default spec sheet. Products may override it with their own `specs`.
 *
 * This used to be the ONLY spec sheet, applied to everything. That held while
 * the range was one blank at 220 GSM; it broke the moment a 240 GSM garment
 * arrived, and it would break harder for bottoms, which have no round neck.
 * Read specs via `specsFor(product)`, never by importing this directly.
 */
export const SPECS = [
  "Oversized and regular fit available",
  "Unisex",
  "Round neck",
  "220 GSM",
  "Bio washed",
  "100% pure cotton",
] as const;

/**
 * The lighter slub blank, used by two Devil's Cut colourways.
 *
 * Dusty White and Graphite are 180 GSM — the supplier does not stock them at
 * 240. They are the only two garments in the range below 220, so they get
 * their own sheet rather than quietly inheriting a GSM they do not have.
 */
export const SPECS_180 = [
  "Boxy fit",
  "Unisex",
  "Round neck",
  "180 GSM slub",
  "Bio washed",
  "100% pure cotton",
] as const;

/** The boxy blank the Devil's Cut colourways are printed on. */
/** The ringer blank: contrast rib at collar and cuffs. */
export const SPECS_220_RINGER = [
  "Ringer tee, contrast trim",
  "Unisex",
  "Round neck",
  "220 GSM",
  "Bio washed",
  "100% pure cotton",
] as const;

/** Waffle knit, oversized, full sleeve. */
export const SPECS_240_WAFFLE = [
  "Oversized, full sleeve",
  "Unisex",
  "Round neck",
  "240 GSM waffle knit",
  "Easy wash",
  "100% pure cotton",
  "Premium printing",
] as const;

/**
 * The half-sleeve waffle. Same knit as SPECS_240_WAFFLE on a boxy tee body —
 * the Unitee blanks are the ...WaffleBackHS pair, and HS is half sleeve. These
 * two were on SPECS_240_BOXY, which never said "waffle" at all while the copy
 * on the page did. The spec sheet is the thing a customer checks when the copy
 * sounds too good, so it has to say it too.
 */
export const SPECS_240_WAFFLE_BOXY = [
  "Boxy fit, half sleeve",
  "Unisex",
  "Round neck",
  "240 GSM waffle knit",
  "Easy wash",
  "100% pure cotton",
  "Premium printing",
] as const;

/** The heavy fleece the winter hoodies are cut from. */
export const SPECS_360_HOODIE = [
  "Boxy oversized hood",
  "Unisex",
  "Kangaroo pocket",
  "360 GSM heavy fleece",
  "Brushed inner",
  "Easy wash",
  "Premium printing",
] as const;

/** As above, with a double-ended zip. */
export const SPECS_360_ZIP = [
  "Boxy oversized hood",
  "Unisex",
  "Double-ended zip",
  "Kangaroo pocket",
  "360 GSM heavy fleece",
  "Brushed inner",
  "Premium printing",
] as const;

export const SPECS_240_BOXY = [
  "Boxy fit",
  "Unisex",
  "Round neck",
  "240 GSM (premium quality)",
  "Easy wash",
  "100% pure cotton",
  "Premium printing",
] as const;

/** The heavier blank. Premium line. */
export const SPECS_240 = [
  "Oversized and regular fit available",
  "Unisex",
  "Round neck",
  "240 GSM (premium quality)",
  "Easy wash",
  "100% pure cotton",
  "Premium printing",
] as const;

export type CollectionId =
  | "devils-club"
  | "minimalist"
  | "winter"
  /**
   * Retired from the storefront on 2026-10-19 at the owner's request — the
   * made-to-order flow was work for him and a decision for the customer. The
   * id survives because `needsBrief` and the design-brief field are still typed
   * against it through pricing, checkout and the Razorpay webhook; only the
   * products and the pages are gone.
   */
  | "custom";

/**
 * Garment types within a design line.
 *
 * A SECOND AXIS, deliberately separate from CollectionId. The collection says
 * what is printed; the cut says what it is printed on. Devil's Club groups by
 * design because the artwork is what differs there; Minimalist groups by cut
 * because the wordmark is constant and the garment is the actual choice.
 *
 * Order is the order the groups appear on the page. Adding a garment type is
 * one line here plus `cut:` on a product — the section renders whatever has
 * stock and hides the rest, so no component changes to add the next one.
 */
export const CUTS = [
  {
    id: "boxy",
    name: "Boxy Fit",
    code: "BXY",
    /* DRAFT COPY — these three blurbs are not the owner's words. They state
       what each garment plainly is, so the pages are not blank, and should be
       rewritten in his voice. */
    blurb: "Square through the body, cropped short. Sits wide, stops high.",
  },
  {
    id: "waffle",
    name: "Waffle Knit",
    code: "WFL",
    blurb: "Textured knit, oversized, full sleeve.",
  },
  {
    id: "ringer",
    name: "Ringer Tee",
    code: "RNG",
    blurb: "Contrast trim at the collar and the cuffs.",
  },
] as const;

export type Cut = (typeof CUTS)[number]["id"];

/**
 * A THIRD axis, and the narrowest: it only means anything inside Winter.
 *
 * Collection says what season, cut says what garment — neither separates a
 * wordmark hoodie from one carrying a full illustrated back, and those are
 * different products at different prices on the same blank. "loud" is the
 * owner's word for the illustrated ones.
 */
export const WINTER_LINES = [
  { id: "loud", name: "Loud", code: "LUD",
    blurb: "Full backs, full colour. One story each." },
  { id: "minimalist", name: "Minimalist", code: "MIN",
    blurb: "The wordmark, on heavier cloth." },
] as const;

export type WinterLine = (typeof WINTER_LINES)[number]["id"];

export type Badge = "SALE" | "LIMITED" | "EXCLUSIVE";

export type Product = {
  /** Matches the Wix product-page slug so links keep working during migration. */
  slug: string;
  name: string;
  collection: CollectionId;
  /** Only meaningful when collection is "winter". See WINTER_LINES. */
  line?: WinterLine;
  /** Struck-through original price, in INR. */
  mrp: number;
  /** What the customer actually pays, in INR. */
  price: number;
  image: string;
  badge: Badge;
  /** Verbatim from the live store. Paragraphs split on blank lines. */
  description: string;
  /** The real Wix SKU where the live page showed one. */
  wixSku?: string;
  /**
   * Custom-design tiers are still ordinary sized tees — they just additionally
   * require the customer's design brief before they can be added to the cart.
   */
  needsBrief?: boolean;

  /** Overrides the default spec sheet. See specsFor(). */
  specs?: readonly string[];

  /**
   * Garment type, for collections that group by it rather than by design.
   * Optional: Devil's Club and Custom have no use for it.
   */
  cut?: Cut;

  /**
   * The image the catalogue card shows, when the hero graphic isn't the front.
   *
   * A grid answers one question — "which design do I want?" — so the card has
   * to show the side the design actually lives on. The Lovers proved the point:
   * its front is two small skeleton hands and its back is the whole graphic, so
   * on a shelf next to Killswitch and Slipknot it read as the weakest piece in
   * the range while actually being one of the strongest.
   *
   * Per-product, because which side is the hero varies per design.
   */
  card?: string;

  /**
   * Every image for this product, in the order shown. When absent, the single
   * `image` is used. Order is editorial and deliberate: on-body shots first,
   * because a garment on a person sells and a garment on a white square does
   * not.
   */
  gallery?: string[];

  /** Size chart image, shown last. Fits differ, so this is per-product. */
  sizeChart?: string;

  /**
   * Fit reference for the on-body shots — the most-requested detail in online
   * apparel, and the cheapest confidence a product page can offer. Without it
   * "oversized" is unanswerable: oversized on whom?
   *
   * Per-product because the model and the size they wore change between shoots.
   */
  model?: { height: string; wears: string };

  /**
   * Gallery images shot on black, which get a dark plate and a warm backlight.
   *
   * Everything NOT listed here gets the default lit plate — and that default
   * matters more than it looks. A cut-out photo of a black t-shirt on a dark
   * plate is a black shape on black: the garment's silhouette disappears and
   * only the print survives. The lit plate exists precisely to give a black
   * garment a surface to read against.
   *
   * So this is per-image, not per-product: one product can hold on-body shots
   * that want darkness and flat cut-outs that want light.
   */
  backlit?: string[];
};

/** The spec sheet actually shown on a product page. */
export const specsFor = (p: Product): readonly string[] => p.specs ?? SPECS;

/** Every image for a product, in order — falls back to the single hero shot. */
export const galleryFor = (p: Product): string[] =>
  p.gallery && p.gallery.length > 0 ? p.gallery : [p.image];

/** The thumbnail for rails, grids and search. See `Product.card`. */
export const cardImage = (p: Product): string => p.card ?? p.image;

const RAW: Omit<Product, "image">[] = [
  // ── Devil's Club ────────────────────────────────────────────────────────
  //
  // The comic drop, loaded 2026-09-25. Ten covers, one garment each: a back
  // print and a matching centre-chest logo, black 240 GSM oversized.
  //
  // `gallery` is BACK then FRONT at the owner's direction. The back carries the
  // cover, which is the design being bought; the front is a small chest logo
  // that means nothing to someone who has not seen the cover yet. With no
  // `card`, the card falls back to `image` — /products/<slug>.png — which is
  // the back, so the grid and the gallery lead with the same shot.
  //
  // DESCRIPTIONS ARE DELIBERATELY EMPTY. The owner is writing them. Until then
  // these pages carry no body copy and no meta description.
  {
    slug: "fearless",
    name: "Fearless",
    collection: "devils-club",
    mrp: 1899,
    price: 1499,
    badge: "EXCLUSIVE",
    description: `This isn't the first bridge. It isn't even the twentieth. Every time it happens he grabs the windscreen and screams the same word, and every time she reaches for her lipstick like she's done it a hundred times. The deal was struck decades ago: she doesn't die, she resets. He's the one who has to be in the car when it happens, every single time, front-row seat to his own worst night, on a loop he never agreed to ride twice. He remembers every bridge. She doesn't remember any of them. That's the part that actually breaks him.`,
    specs: SPECS_240,
    gallery: ["/products/fearless.png", "/products/fearless-front.png"],
  },
  {
    slug: "adopt-a-devil",
    name: "Adopt A Devil",
    collection: "devils-club",
    mrp: 1899,
    price: 1499,
    badge: "EXCLUSIVE",
    description: `Two kids prayed for a baby brother the way kids pray — loud, eyes shut, right before bed. The prayer never reached God. It landed on a different desk instead, one that doesn't usually get requests like this — from someone who doesn't usually get asked nicely for anything. He wasn't about to waste it. The next morning, a box marked FRAGILE sat on the step. The children carried it into the living hall together and opened it with care. Inside: red skin, small horns, a tail that wouldn't stop wagging. The kids cheered. Mother cried happy tears. Only the dog under the table knows what's actually living in this house now.`,
    specs: SPECS_240,
    gallery: ["/products/adopt-a-devil.png", "/products/adopt-a-devil-front.png"],
  },
  {
    slug: "the-spin",
    name: "The Spin",
    collection: "devils-club",
    mrp: 1899,
    price: 1499,
    badge: "EXCLUSIVE",
    description: `The house had been haunted for forty years before she ever touched the turntable. Three tracks in, whatever was stuck in that attic was already leaking out through the walls — her bassline didn't want it around. Death came down to stop her himself. Bad move. She dropped the needle on the one marked DEATH, and he went flying backward out of the room, scythe and all. Downstairs, nobody even paused. Best party that house had thrown in decades. Nobody there knows what just happened. She's too busy queuing the next track to notice either.`,
    specs: SPECS_240,
    gallery: ["/products/the-spin.png", "/products/the-spin-front.png"],
  },
  {
    slug: "no-honour",
    name: "No Honour",
    collection: "devils-club",
    mrp: 1899,
    price: 1499,
    badge: "EXCLUSIVE",
    description: `Two of them planned this job — one to rob, one to drive. Nobody planned on the devil getting bored in the passenger seat. By the time the alarm went off, the driver wasn't him anymore — car gone red, plate now DEVIL-1, horns through his hair, a grin that was never his. His partner sprinted out with two bags, sirens closing fast. Threw the first one in. Reached for the door with the second. That's when the engine roared and the car peeled off — and he froze, because the face waving goodbye wasn't his best friend's. It was the devil, grinning, laughing as it drove off with someone else's face. He always does this, when he's bored enough to ride shotgun.`,
    specs: SPECS_240,
    gallery: ["/products/no-honour.png", "/products/no-honour-front.png"],
  },
  {
    slug: "chandni-chowk",
    name: "Chandni Chowk",
    collection: "devils-club",
    mrp: 1899,
    price: 1499,
    badge: "EXCLUSIVE",
    description: `Six years ago she sold her shadow in this exact market for one wish, no questions asked. Nobody told her a sold shadow doesn't just sit quiet on the wall behind you — it hunts. Every man who's crossed her since has turned up missing by morning, filed away as unsolved. Tonight it's the man with the briefcase's turn. He's walking to the cab right now, briefcase in hand, already counting his cut, feeling pretty good about the job. He doesn't feel it stretching taller behind him with every step he takes. He has no idea the deal was never with her.`,
    specs: SPECS_240,
    gallery: ["/products/chandni-chowk.png", "/products/chandni-chowk-front.png"],
  },
  {
    slug: "three-musketeers",
    name: "Three Musketeers",
    collection: "devils-club",
    mrp: 1899,
    price: 1499,
    badge: "EXCLUSIVE",
    description: `Every constable on this beat knows his job and knows he's good at it — stand your post, follow the rules, wave down anything that's speeding. Tonight, from the other end of the road, a red Vespa comes tearing through — devil driving, angel riding pillion, Death in the back balancing a tray like he's done it a thousand times. They only ever ride out together on someone's last day. The constable spots them and blows his whistle, flagging them down without a second thought. He doesn't know it's for him. He'll radio it in as a routine stop. He won't remember writing the report. Nobody ever does when the three of them come for you smiling.`,
    specs: SPECS_240,
    gallery: ["/products/three-musketeers.png", "/products/three-musketeers-front.png"],
  },
  {
    slug: "zaveri-bazaar",
    name: "Zaveri Bazaar",
    collection: "devils-club",
    mrp: 1899,
    price: 1499,
    badge: "EXCLUSIVE",
    description: `The safe held forty pieces of gold. She wanted one — the one with her grandmother's initials scratched into the clasp, taken from her family two generations ago and locked away like nobody would ever come looking for it. Three men had come to rob the shop that same night, masks on, guns out, certain the only thing between them and the vault was a woman who didn't matter. Wrong shop. Wrong woman. Wrong night. All three are on the floor now, out cold, and she never laid a finger on them. She didn't have to. Somebody else doesn't like it when men raise their hands to her. She just steps over them, takes back what's hers, and lets him handle the rest.`,
    specs: SPECS_240,
    gallery: ["/products/zaveri-bazaar.png", "/products/zaveri-bazaar-front.png"],
  },
  {
    slug: "sweet-as-sin",
    name: "Sweet As Sin",
    collection: "devils-club",
    mrp: 1899,
    price: 1499,
    badge: "EXCLUSIVE",
    description: `Same five faces, every full moon, hair let down, lipstick reapplied twice before midnight. Different names, different centuries, different corners of the world — but the same thirst, and the same price for staying this beautiful forever: a man, once every full moon, invited in but never invited back out. Call it a girls' night if you like. It's closer to a hunt dressed in silk and perfume, giggling behind painted nails at the one face too charmed to notice the room getting smaller. The pact only holds at five. Two years ago there were six — nobody says her name anymore, though the skull on the table still wears her ring, and it still matches her nails. Tonight there are five again. Laughing. Gorgeous. Patient. By the time the last candle burns to nothing, the pact might not hold.`,
    specs: SPECS_240,
    gallery: ["/products/sweet-as-sin.png", "/products/sweet-as-sin-front.png"],
  },
  {
    slug: "vacancy",
    name: "Vacancy",
    collection: "devils-club",
    mrp: 1899,
    price: 1499,
    badge: "EXCLUSIVE",
    description: `The moths outside the Lonely Rest aren't moths. Regulars know that. They used to be guests — the ones who checked in, paid cash, no name needed, and never checked out. Same offer, thirteen years running. She read every word on the check-in slip before she signed it. Signed anyway. He's still trying to work out why she wasn't scared. She's still trying to work out why he looked scared of her. The moths already know how this ends. They always do.`,
    specs: SPECS_240,
    gallery: ["/products/vacancy.png", "/products/vacancy-front.png"],
  },
  {
    slug: "planchette",
    name: "Planchette",
    collection: "devils-club",
    mrp: 1899,
    price: 1499,
    badge: "EXCLUSIVE",
    description: `Four kids started this circle. Three are left, and none of them can say what happened to the fourth — just an empty chair by the window that's never been moved back. Nobody remembers exactly when the skeleton started showing up either. He's just always been there, patient, quiet, easy to get used to. Every afternoon: same candle, same board, same question written in his own soft hand. हाँ or नहीं. He's never once said नहीं. The three of them think that means he always agrees. It might just mean he's still waiting for someone to ask the right question.`,
    specs: SPECS_240,
    gallery: ["/products/planchette.png", "/products/planchette-front.png"],
  },

  // ── Devil's Cut ─────────────────────────────────────────────────────────
  //
  // Loaded 2026-10-07. One design — the Copperplate script wordmark, 8.5in
  // across the chest — on ten boxy-fit colourways. The opposite shape to
  // Devil's Club: there the design changes and the garment is constant, here
  // the garment changes and the design is constant.
  //
  // So `gallery` runs FRONT then BACK, the reverse of Devil's Club. The front
  // carries the wordmark; the back is plain, because the supplier print spec
  // is front-only (B: 0x0). With no `card`, the grid falls back to `image` —
  // /products/<slug>.png — which is the front, the side worth seeing.
  //
  // PRICES ARE FINAL as of 2026-10-19, costed per garment rather than flat.
  //
  // They were a flat guess before. Kushagr then gave his real landed costs
  // (waffle 610, hoodie 860, zip 910, all incl. shipping), which showed
  // Unitee's "cost" column omits about 75 of shipping a unit. Costed properly,
  // one flat price earned 53% on a ringer and 38% on a black waffle boxy, so
  // the cheap blanks were subsidising the dear ones. These four tiers hold
  // every garment at 52-58% after the 2% gateway. No GST and no COD here, so
  // neither is in the maths. Full workings: the Sweet Devil Price Sheet artifact.
  //
  // "Devil's Cut" is still only a suggested name.
  //
  // DESCRIPTIONS ARE DELIBERATELY EMPTY, as with Devil's Club.
  {
    slug: "cut-pink-sunfade",
    name: "Pink Sunfade",
    collection: "minimalist",
    cut: "boxy",
    mrp: 1699,
    price: 1199,
    badge: "EXCLUSIVE",
    description: `Most men won't wear pink. That's exactly the point.

A sunfade that starts soft at the shoulders and burns hot by the hem — one tee, two moods, and nothing printed on to fake it. Boxy through the body, square at the shoulder, stopping high. 240 GSM pure cotton that holds its shape through the heat and a hundred washes. The script sits small, in black, and says everything it needs to.

Wear it with black jeans. Count how many people look twice.`,
    specs: SPECS_240_BOXY,
    gallery: [
      "/products/cut-pink-sunfade.png",
      "/products/cut-pink-sunfade-back.png",
    ],
  },
  {
    slug: "cut-denim",
    name: "Denim Wash",
    collection: "minimalist",
    cut: "boxy",
    mrp: 1699,
    price: 1199,
    badge: "EXCLUSIVE",
    description: `Denim blue, without the denim.

A cloudy indigo wash that moves across the cloth like weather — no two hang exactly alike, and none of it is printed on. Boxy through the body, square at the shoulder, stopping high. 240 GSM pure cotton with the weight to stand up on its own. The script runs across the chest in white.

Goes with everything. Looks like nothing else on the rail.`,
    specs: SPECS_240_BOXY,
    gallery: ["/products/cut-denim.png", "/products/cut-denim-back.png"],
  },
  {
    slug: "cut-off-white",
    name: "Off White",
    collection: "minimalist",
    cut: "boxy",
    mrp: 1499,
    price: 999,
    badge: "EXCLUSIVE",
    description: `Cream, not white. There is a difference and you will see it.

Flat white goes grey after a month. This sits warmer from the start, so it keeps looking deliberate instead of tired. Boxy cut, square shoulder, high hem, 240 GSM pure cotton. The script is in red — the only colour on the whole garment, and it does all the work.

The easiest thing here to wear. The hardest to put down.`,
    specs: SPECS_240_BOXY,
    gallery: ["/products/cut-off-white.png", "/products/cut-off-white-back.png"],
  },
  {
    slug: "cut-off-white-waffle",
    name: "Off White Waffle",
    collection: "minimalist",
    cut: "boxy",
    mrp: 1699,
    price: 1199,
    badge: "EXCLUSIVE",
    description: `Texture does what a graphic cannot.

Waffle knit in ivory — a grid you can feel, holding light and shadow right across the tee so it never reads as plain. Boxy and square through the shoulder, 240 GSM. Red script on the chest, sharp against the cream.

Quiet from a distance. Expensive up close.`,
    specs: SPECS_240_WAFFLE_BOXY,
    gallery: [
      "/products/cut-off-white-waffle.png",
      "/products/cut-off-white-waffle-back.png",
    ],
  },
  {
    slug: "cut-brown",
    name: "Brown",
    collection: "minimalist",
    cut: "boxy",
    mrp: 1499,
    price: 999,
    badge: "EXCLUSIVE",
    description: `Everybody owns black. Almost nobody owns brown.

Deep chocolate with a worn-in finish, cut boxy and square, raw at the hem so it never looks factory fresh. 240 GSM pure cotton. Cream script across the chest, warm on warm, nothing fighting.

Wear it with denim and watch it beat black every time.`,
    specs: SPECS_240_BOXY,
    gallery: ["/products/cut-brown.png", "/products/cut-brown-back.png"],
  },
  {
    slug: "cut-black-ombre",
    name: "Black Ombré",
    collection: "minimalist",
    cut: "boxy",
    mrp: 1699,
    price: 1199,
    badge: "EXCLUSIVE",
    description: `Black at the shoulders. Smoke by the time it reaches your waist.

A fade that runs the full length of the tee — dense black up top, lifting into slate at the hem. Dyed in, not printed, so there is nothing to crack or lift. Boxy cut, square shoulder, 240 GSM pure cotton. White script sits high, where the black is deepest.

Black, for people who are bored of black.`,
    specs: SPECS_240_BOXY,
    gallery: [
      "/products/cut-black-ombre.png",
      "/products/cut-black-ombre-back.png",
    ],
  },
  {
    slug: "cut-black",
    name: "Black",
    collection: "minimalist",
    cut: "boxy",
    mrp: 1499,
    price: 999,
    badge: "EXCLUSIVE",
    description: `The one you will wear more than everything else put together.

No wash, no fade, no excuses — flat black, 240 GSM pure cotton, cut boxy and square with a raw hem so it reads as streetwear and not a uniform. White script on the chest, small enough that it never shouts.

Not the most exciting thing we make. Easily the most worn.`,
    specs: SPECS_240_BOXY,
    gallery: ["/products/cut-black.png", "/products/cut-black-back.png"],
  },
  {
    slug: "cut-black-waffle",
    name: "Black Waffle",
    collection: "minimalist",
    cut: "boxy",
    mrp: 1799,
    price: 1299,
    badge: "EXCLUSIVE",
    description: `Plain black is easy. Plain black with texture is a decision.

Waffle knit holds the light in a grid — close up it has depth, across a room it just reads as the cleanest thing you own. Boxy and square through the shoulder, 240 GSM, heavy enough to drape instead of cling. The wordmark sits small and says nothing it does not mean.

This is the one you reach for without thinking. Buy two.`,
    specs: SPECS_240_WAFFLE_BOXY,
    gallery: [
      "/products/cut-black-waffle.png",
      "/products/cut-black-waffle-back.png",
    ],
  },
  {
    slug: "cut-graphite",
    name: "Graphite",
    collection: "minimalist",
    cut: "boxy",
    mrp: 1299,
    price: 899,
    badge: "EXCLUSIVE",
    description: `Not quite black. That is the whole trick.

Graphite reads black across a room and charcoal up close, so it works in places flat black would look dead. 180 GSM slub cotton, light on the body, with a slub running through the weave that catches the light. Boxy fit. Red script on the chest, loud against the grey.

The one that gets asked about.`,
    specs: SPECS_180,
    gallery: ["/products/cut-graphite.png", "/products/cut-graphite-back.png"],
  },
  {
    slug: "cut-dusty-white",
    name: "Dusty White",
    collection: "minimalist",
    cut: "boxy",
    mrp: 1299,
    price: 899,
    badge: "EXCLUSIVE",
    description: `Summer weight, with a texture you can read from a metre away.

180 GSM slub cotton — deliberately uneven, so the surface has grain instead of going flat and cheap. Dusty, faintly grey white rather than bleached. Boxy fit, square shoulder. Black script on the chest, clean against the texture.

The one you will live in from April to September.`,
    specs: SPECS_180,
    gallery: [
      "/products/cut-dusty-white.png",
      "/products/cut-dusty-white-back.png",
    ],
  },


  // ── Minimalist · ringers ────────────────────────────────────────────────
  //
  // Same wordmark, 220 GSM ringer blank. The ink matches each tee's own trim
  // where Unitee already sets it that way — the sky blue needed a colourway
  // that did not exist, cut from the same alpha as the other four so the
  // letterforms are identical.
  {
    // The one ringer that is not the wordmark: block heading on the chest,
    // bronco devil across the back. Dearer because the back print is 13x12in
    // and costs 156 to print against 36 for the script.
    slug: "ring-rodeo",
    name: "Rodeo Ringer",
    collection: "minimalist",
    cut: "ringer",
    mrp: 1799,
    price: 1299,
    badge: "EXCLUSIVE",
    description: `The front keeps quiet. The back does not.

SWEETDEVIL across the chest in a red western block, and that is all it gives you. Then you turn around — a cowboy devil breaking a bronco, full colour, fourteen inches wide. The biggest print we make. Maroon ringer trim at the collar and both cuffs, 220 GSM, bio-washed soft from the first wear.

Front for walking in. Back for walking away.`,
    specs: SPECS_220_RINGER,
    /* the full bronco is what sells it — lead the card with the back. */
    card: "/products/ring-rodeo-back.png",
    gallery: ["/products/ring-rodeo.png", "/products/ring-rodeo-back.png"],
  },
  {
    slug: "ring-offwhite",
    name: "Off White & Maroon Ringer",
    collection: "minimalist",
    cut: "ringer",
    mrp: 1299,
    price: 899,
    badge: "EXCLUSIVE",
    description: `Cream and maroon. The oldest good idea in sportswear.

Ringer trim at the collar and both cuffs, deep maroon against a warm cream body — the contrast does all the styling for you, so nothing else has to. 220 GSM pure cotton, bio-washed soft from the first wear. Red script across the chest.

Under nine hundred rupees. Looks like it has no business being.`,
    specs: SPECS_220_RINGER,
    gallery: ["/products/ring-offwhite.png", "/products/ring-offwhite-back.png"],
  },
  {
    slug: "ring-mousse",
    name: "Mousse & Cream Ringer",
    collection: "minimalist",
    cut: "ringer",
    mrp: 1299,
    price: 899,
    badge: "EXCLUSIVE",
    description: `Brown on cream. Nobody else on the street is wearing this.

The ringer flipped — a mousse-brown body with cream at the collar and the cuffs, warm on warm instead of hard contrast. 220 GSM pure cotton, bio-washed, soft from day one. The script runs across the chest in cream.

Quietly the best-looking thing in the range.`,
    specs: SPECS_220_RINGER,
    gallery: ["/products/ring-mousse.png", "/products/ring-mousse-back.png"],
  },
  {
    slug: "ring-sky-blue",
    name: "Sky Blue Ringer",
    collection: "minimalist",
    cut: "ringer",
    mrp: 1299,
    price: 899,
    badge: "EXCLUSIVE",
    description: `White and sky blue. Easy, and it knows it.

Clean white body, soft blue at the collar and both cuffs, script to match — the lightest thing we make and the one that still works at forty degrees. 220 GSM pure cotton, bio-washed, soft before you have even put it through a wash.

Summer in one tee. No effort required.`,
    specs: SPECS_220_RINGER,
    gallery: ["/products/ring-sky-blue.png", "/products/ring-sky-blue-back.png"],
  },

  // ── Winter ──────────────────────────────────────────────────────────────
  //
  // Hoodies and zips first, then the waffle knits — the order the owner asked
  // for, and the order CUTS does not control because this is a collection.
  //
  // The script sits 2.1in below the neck seam on the hooded pieces and 6.0in
  // below the collar on the waffles. Different numbers because a hood sits
  // above the shoulders, so the two garments do not share a landmark.
  {
    slug: "win-waffle-pink",
    name: "Pink Ombré Waffle",
    collection: "winter",
    line: "minimalist",
    cut: "waffle",
    mrp: 1999,
    price: 1399,
    badge: "EXCLUSIVE",
    description: `Full sleeve, full pink, no apology.

A waffle knit that fades from soft pink at the shoulder down to hot pink at the hem — dyed through, not printed, so it goes nowhere in the wash. Oversized and boxy, with the sleeves to match. 240 GSM waffle, textured right the way through. Black script sits high on the chest.

Most people will not have the nerve. You will.`,
    specs: SPECS_240_WAFFLE,
    gallery: ["/products/win-waffle-pink.png", "/products/win-waffle-pink-back.png"],
  },
  {
    slug: "win-waffle-blue",
    name: "Blue Ombré Waffle",
    collection: "winter",
    line: "minimalist",
    cut: "waffle",
    mrp: 1999,
    price: 1399,
    badge: "EXCLUSIVE",
    description: `Navy that moves.

Deep indigo through the shoulders, lifting into a worn lighter blue below — the kind of fade a jacket takes five years to earn. Oversized waffle knit, full sleeve, boxy cut, 240 GSM of texture you can feel through the sleeve. White script across the chest.

Winter, without wearing black again.`,
    specs: SPECS_240_WAFFLE,
    gallery: ["/products/win-waffle-blue.png", "/products/win-waffle-blue-back.png"],
  },
  {
    slug: "win-hoodie-cream",
    name: "Cream Hoodie",
    collection: "winter",
    line: "minimalist",
    cut: "boxy",
    mrp: 2599,
    price: 1899,
    badge: "EXCLUSIVE",
    description: `A cream hoodie is a statement. A clean one is a flex.

360 GSM of heavy fleece, brushed soft on the inside, cut boxy and oversized so it sits square on the shoulder instead of swallowing you. Kangaroo pocket, ribbed cuffs that actually hold their shape. Red script across the chest, the only colour on it.

Anyone can wear black. This one takes nerve.`,
    specs: SPECS_360_HOODIE,
    gallery: ["/products/win-hoodie-cream.png", "/products/win-hoodie-cream-back.png"],
  },
  {
    slug: "win-hoodie-black",
    name: "Black Hoodie",
    collection: "winter",
    line: "minimalist",
    cut: "boxy",
    mrp: 2599,
    price: 1899,
    badge: "EXCLUSIVE",
    description: `The heaviest thing in your wardrobe, and the one you will never take off.

360 GSM fleece — real weight, the kind you feel the second you lift it off the shelf. Brushed soft inside, boxy oversized cut, kangaroo pocket, ribbed cuffs. White script across the chest and nothing else.

Buy it once. Wear it for years.`,
    specs: SPECS_360_HOODIE,
    gallery: ["/products/win-hoodie-black.png", "/products/win-hoodie-black-back.png"],
  },
  {
    slug: "win-zip-grey",
    name: "Grey Zip Hoodie",
    collection: "winter",
    line: "minimalist",
    cut: "boxy",
    mrp: 2899,
    price: 2099,
    badge: "EXCLUSIVE",
    description: `Two zips. Open it from the bottom and the whole shape changes.

360 GSM of heavy fleece — brushed soft on the inside, structured enough on the outside to sit square on your shoulders instead of hanging off them. Kangaroo pocket. Boxy oversized cut. You feel the weight the second you pick it up, and that is the entire argument.

The dearest thing we make. It earns it.`,
    specs: SPECS_360_ZIP,
    gallery: ["/products/win-zip-grey.png", "/products/win-zip-grey-back.png"],
  },
  {
    slug: "win-zip-black",
    name: "Black Zip Hoodie",
    collection: "winter",
    line: "minimalist",
    cut: "boxy",
    mrp: 2899,
    price: 2099,
    badge: "EXCLUSIVE",
    description: `Two zips, so you decide the shape.

Open it from the bottom and it wears like a bomber; close it up and it is a hood again. 360 GSM heavy fleece, brushed soft inside, boxy oversized cut, kangaroo pocket. Black on black — the script stays almost invisible until the light catches it.

The most versatile thing we make, and it looks like nothing else.`,
    specs: SPECS_360_ZIP,
    gallery: ["/products/win-zip-black.png", "/products/win-zip-black-back.png"],
  },
  {
    slug: "win-waffle-acid",
    name: "Acid Wash Waffle",
    collection: "winter",
    line: "minimalist",
    cut: "waffle",
    mrp: 1999,
    price: 1399,
    badge: "EXCLUSIVE",
    description: `Acid wash, on a waffle. Two textures arguing, both winning.

Charcoal grey broken up by a wash that runs light and dark across the whole garment, over a knit that already has a grid in it. Oversized, full sleeve, boxy, 240 GSM. White script on the chest.

Looks like you have had it ten years. You have had it since Tuesday.`,
    specs: SPECS_240_WAFFLE,
    gallery: ["/products/win-waffle-acid.png", "/products/win-waffle-acid-back.png"],
  },
  {
    /* The tie-dye is the product, so it goes last among the dark pieces but
       ahead of nothing — same 240 GSM waffle and the same 8.5in script as its
       three siblings, priced with them. */
    slug: "win-waffle-hammer",
    name: "Hammer Wash Waffle",
    collection: "winter",
    line: "minimalist",
    cut: "waffle",
    mrp: 1999,
    price: 1399,
    badge: "EXCLUSIVE",
    description: `No two of these are the same, and we cannot make them be.

A hammer wash that tears pale lightning straight down a black waffle knit — bleached by hand, so the pattern lands differently on every single piece. Oversized, full sleeve, boxy, 240 GSM of knit you can feel through the cloth. White script across the chest, bright against the dark.

The one nobody else will be wearing. Not even in your size.`,
    specs: SPECS_240_WAFFLE,
    gallery: ["/products/win-waffle-hammer.png", "/products/win-waffle-hammer-back.png"],
  },


  // ── Winter · Loud ───────────────────────────────────────────────────────
  //
  // Five illustrated hoodies on the same 360 GSM black blank as the wordmark
  // ones. Backs run 8.7-9.5in wide and sit 7.5in below the shoulder, which is
  // where the owner placed them on all four of his own references.
  //
  // PRICE IS THE OWNER'S, set 2026-10-19 after he sent the real Unitee figures.
  //
  // Base 700 + front 36 + back 120 (102 on SD Studio) = 898.80 incl 5% tax,
  // and that is BEFORE delivery; his own plain-hoodie number implies about 87
  // more, so these land near 986. At 1899 that is a 46% margin against 53-55%
  // everywhere else in the range — the full-colour back costs 120 to print
  // where a script costs 36, and the price did not move to cover it. He has
  // seen that and chosen 1899 anyway. Do not "fix" it silently.
  {
    slug: "loud-ruthless",
    name: "Ruthless",
    collection: "winter",
    line: "loud",
    cut: "boxy",
    mrp: 2599,
    price: 1899,
    badge: "EXCLUSIVE",
    description: `He is not making a phone call. He is making arrangements.

Red fedora, leopard suit, bone where a face should be — stood at a payphone on a sunset street, watching a woman he used to drive around put her arms round somebody else. The Corvette is still his. The number he is dialling does not belong to a friend. It runs the full back of the hood: when trust turns into lies, only revenge remains.

360 GSM heavy fleece, brushed soft inside, cut boxy and oversized. The loudest thing we have ever made.`,
    specs: SPECS_360_HOODIE,
    /* bought for the back — show it on the card, not the blank front. */
    card: "/products/loud-ruthless-back.png",
    gallery: ["/products/loud-ruthless-back.png", "/products/loud-ruthless.png"],
  },
  {
    slug: "loud-sweet-dreams",
    name: "Sweet Dreams",
    collection: "winter",
    line: "loud",
    cut: "boxy",
    mrp: 2599,
    price: 1899,
    badge: "EXCLUSIVE",
    description: `She thinks she is alone on that phone call.

Behind the green armchair, arms spread and claws out, something red and grinning has been listening the whole time. She still has not turned round. Across the bottom, in yellow and red: I'll meet you in my dreams.

Printed full width across the back of a 360 GSM hood. Heavy fleece, brushed soft inside, boxy and oversized. Sweet, right up until you read it twice.`,
    specs: SPECS_360_HOODIE,
    /* bought for the back — show it on the card, not the blank front. */
    card: "/products/loud-sweet-dreams-back.png",
    gallery: ["/products/loud-sweet-dreams-back.png", "/products/loud-sweet-dreams.png"],
  },
  {
    slug: "loud-devil-back",
    name: "Devil Has Your Back",
    collection: "winter",
    line: "loud",
    cut: "boxy",
    mrp: 2599,
    price: 1899,
    badge: "EXCLUSIVE",
    description: `Four words down your spine, in pink, in marker.

No illustration, no frame, no border — just DEVIL HAS YOUR BACK thrown across the full back in hot pink handstyle, big enough to read from the other side of the road. Pink on black is the loudest thing we print and the hardest to walk past.

360 GSM heavy fleece, brushed soft inside, boxy oversized cut. It reads like a promise, because it is one.`,
    specs: SPECS_360_HOODIE,
    /* bought for the back — show it on the card, not the blank front. */
    card: "/products/loud-devil-back-back.png",
    gallery: ["/products/loud-devil-back-back.png", "/products/loud-devil-back.png"],
  },
  {
    slug: "loud-sd-studio",
    name: "Sweet Devil Studio",
    collection: "winter",
    line: "loud",
    cut: "boxy",
    mrp: 2599,
    price: 1899,
    badge: "EXCLUSIVE",
    description: `Built like a record sleeve nobody ever got round to printing.

SWEET DEVIL STUDIO in a fat red bubble script with a blue outline, yellow starbursts going off behind it and lightning coming out of both sides. Loud, daft, joyful — the one piece in the range that is not trying to be dark.

Full back of a 360 GSM hood. Heavy fleece, brushed soft inside, boxy and oversized. Wear it when you want the room in a good mood.`,
    specs: SPECS_360_HOODIE,
    /* bought for the back — show it on the card, not the blank front. */
    card: "/products/loud-sd-studio-back.png",
    gallery: ["/products/loud-sd-studio-back.png", "/products/loud-sd-studio.png"],
  },
  {
    slug: "loud-sinners-club",
    name: "Sinners Club",
    collection: "winter",
    line: "loud",
    cut: "boxy",
    mrp: 2599,
    price: 1899,
    badge: "EXCLUSIVE",
    description: `Recruited by the devil. Membership costs one hoodie.

A small devil sat in the flames with a trident in his hand, ringed by SWEET AS DEVIL and signed off underneath — the whole thing struck in a single red, like a club badge somebody has been wearing since the eighties.

Full back of a 360 GSM hood. Heavy fleece, brushed soft inside, boxy and oversized. The calmest of the five, and the one people ask about.`,
    specs: SPECS_360_HOODIE,
    /* bought for the back — show it on the card, not the blank front. */
    card: "/products/loud-sinners-club-back.png",
    gallery: ["/products/loud-sinners-club-back.png", "/products/loud-sinners-club.png"],
  },
];

export const products: Product[] = RAW.map((p) => ({
  ...p,
  image: `/products/${p.slug}.png`,
}));

export const bySlug = (slug: string) => products.find((p) => p.slug === slug);

export type Collection = {
  id: CollectionId;
  name: string;
  /** Machine-readable label used in the HUD rails. */
  code: string;
  blurb: string;
};

export const collections: Collection[] = [
  {
    id: "devils-club",
    name: "Devil's Club",
    code: "DVL",
    blurb: "Band-grade graphics for the gloriously unholy.",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    code: "MIN",
    blurb: "The wordmark, clean. Pick your cut and your colour.",
  },
  {
    id: "winter",
    name: "Winter Collection",
    code: "WTR",
    blurb: "Hoodies and heavy knits for when it finally turns.",
  },
];

export function productsIn(id: CollectionId): Product[] {
  return products.filter((p) => p.collection === id);
}

/**
 * A browsable group — anything with its own page at /collections/<id>.
 *
 * Two different things wear this shape: a COLLECTION (what is printed) and a
 * CUT (what it is printed on). They are separate axes, but from a customer's
 * side they are the same gesture — tap a heading, see everything under it — so
 * one route serves both and the page does not care which it was handed.
 */
export type Group = {
  id: string;
  kind: "collection" | "cut";
  name: string;
  code: string;
  blurb: string;
  items: Product[];
};

/** Every group with at least one product, collections first. */
export function browsableGroups(): Group[] {
  const fromCollections: Group[] = collections.map((c) => ({
    id: c.id,
    kind: "collection" as const,
    name: c.name,
    code: c.code,
    blurb: c.blurb,
    items: productsIn(c.id),
  }));
  const fromCuts: Group[] = CUTS.map((c) => ({
    id: c.id,
    kind: "cut" as const,
    name: c.name,
    code: c.code,
    blurb: c.blurb,
    items: products.filter((p) => p.cut === c.id),
  }));
  return [...fromCollections, ...fromCuts].filter((g) => g.items.length > 0);
}

export const groupById = (id: string): Group | undefined =>
  browsableGroups().find((g) => g.id === id);

/** The products in a collection that are a given garment type, in CUTS order. */
/** Winter, split into its two lines, in WINTER_LINES order. */
export function winterByLine(): { line: (typeof WINTER_LINES)[number]; items: Product[] }[] {
  const own = productsIn("winter");
  return WINTER_LINES.map((line) => ({
    line,
    items: own.filter((p) => p.line === line.id),
  })).filter((g) => g.items.length > 0);
}

export function productsByCut(id: CollectionId): { cut: (typeof CUTS)[number]; items: Product[] }[] {
  const own = productsIn(id);
  return CUTS.map((cut) => ({ cut, items: own.filter((p) => p.cut === cut.id) })).filter(
    (g) => g.items.length > 0,
  );
}

/** The real Wix SKU when we have one, else a stable generated code. */
export function sku(p: Product): string {
  if (p.wixSku) return p.wixSku;
  const c = collections.find((c) => c.id === p.collection)?.code ?? "SD";
  let h = 0;
  for (const ch of p.slug) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return `${c}-${String(h).padStart(4, "0")}`;
}

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export const discount = (p: Product) =>
  Math.round(((p.mrp - p.price) / p.mrp) * 100);
