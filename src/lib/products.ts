/**
 * Catalogue mirrored from the live Wix store (sweetdevil.in).
 * Names, prices, descriptions and SKUs are the real ones, transcribed from the
 * live product pages on 2026-07-25. Do not invent or reword them.
 *
 * Photography is self-hosted in `public/products/`, one 1000×1000 file per
 * slug, so the storefront carries no dependency on the Wix CDN.
 */

/** Every product photo is `public/products/<slug>.png`. */
export const PHOTO_SIZE = 1000;

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
  | "brainrot-club"
  | "limited-edition"
  | "custom";

export type Badge = "SALE" | "LIMITED" | "EXCLUSIVE";

export type Product = {
  /** Matches the Wix product-page slug so links keep working during migration. */
  slug: string;
  name: string;
  collection: CollectionId;
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
   * Character whose story is told on this product's page — an id from
   * characters.ts. One garment, one character.
   */
  character?: string;

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

const RAW: Omit<Product, "image">[] = [
  // ── Devil's Club ────────────────────────────────────────────────────────
  {
    // FIRST CHARACTER GARMENT. The gallery order is the owner's brief and is
    // not arbitrary: character on-body front, character on-body back, then the
    // flat front and back. People buy the garment on a body; the flats are for
    // checking the print once they already want it.
    //
    // ⚠️ PRICE IS A PLACEHOLDER — matched to the other tees pending the owner's
    // real figure. This is a 240 GSM premium blank and may well cost more.
    slug: "the-lovers",
    name: "The Lovers",
    collection: "devils-club",
    mrp: 1299,
    price: 999,
    badge: "EXCLUSIVE",
    character: "nyx",
    specs: SPECS_240,
    // Model shots are .png because they are cut out — transparency is the whole
    // point. A .jpg here would carry a white box and defeat the backlight.
    gallery: [
      "/products/the-lovers-model-front.png",
      "/products/the-lovers-model-back.png",
      "/products/the-lovers.png",
      "/products/the-lovers-back.png",
    ],
    model: { height: "5'7\"", wears: "M" },
    // On-body shots only. The flat tees are cut-outs of a BLACK garment and
    // need the lit plate, or they read as a black hole with a print floating
    // in it.
    backlit: [
      "/products/the-lovers-model-front.png",
      "/products/the-lovers-model-back.png",
    ],
    // sizeChart intentionally absent until the chart image is supplied — a
    // missing file here would 404 in the gallery on the live site.
    description: `Skeleton hands hooked together on the chest. Turn around and you get the whole story — two skeletons holding each other like the world already ended and they didn't care.`,
  },
  {
    slug: "killswitch-engage",
    name: "Killswitch Engage",
    collection: "devils-club",
    mrp: 899,
    price: 699,
    badge: "SALE",
    wixSku: "00686382694",
    description: `Dive into the dark beauty of sorrow with this striking Killswitch Engage inspired tee. On the front, Death looms in skeletal form, cradling a bleeding woman in his bony arms, her guts spilling out in visceral, tragic detail. It's a raw, emotional portrayal of love lost and pain embraced, a perfect visual echo of the album "The End of Heartache."

The haunting scene is grounded by the title text across the chest in weathered old white, mirroring the band's iconic aesthetic. Set against jet black cotton, this tee is crafted for fans who wear their grief like armor and find power in the brutal honesty of metalcore.

Not for the faint of heart — made for those who feel everything.`,
  },
  {
    slug: "satan-s-child",
    name: "Satan's Child",
    collection: "devils-club",
    mrp: 899,
    price: 699,
    badge: "SALE",
    wixSku: "393774879898721",
    description: `Introducing our "Satan's Child" t-shirt, a daring statement piece that exudes rebellious charm. Featuring bold lettering and captivating imagery, this tee is perfect for those who march to the beat of their own drum.

Crafted with comfort in mind, it's made from premium materials to ensure both style and softness. Embrace your darker side and stand out from the crowd.`,
  },
  {
    slug: "regular-fit",
    name: "The Lovers",
    collection: "devils-club",
    mrp: 899,
    price: 699,
    badge: "SALE",
    wixSku: "284215376135191",
    description: `Enter the realm of dark romance and macabre allure with our Lovers Skeleton Graphic T-Shirt, a haunting tribute to the beauty found in the shadows.

This t-shirt is more than apparel; it's an expression of eternal love and the timeless appeal of gothic aesthetics.`,
  },
  {
    slug: "chair",
    name: "Slipknot",
    collection: "devils-club",
    mrp: 899,
    price: 699,
    badge: "SALE",
    wixSku: "36523641234523",
    description: `Unleash your inner rebel with our Slipknot Graphic T-Shirt, a tribute to the intense energy and iconic imagery of one of metal's most legendary bands.

This t-shirt is not just clothing; it's a statement of attitude and passion for hardcore music.`,
  },
  {
    slug: "reggular",
    name: "Weed Demon",
    collection: "devils-club",
    mrp: 899,
    price: 699,
    badge: "SALE",
    wixSku: "632835642834572",
    description: `Embark on a journey into the realm of heavy riffs and stoner doom with our Weed Demon Graphic T-Shirt, paying homage to the riff-heavy band known for their crushing sound and ethereal lyrics.

This t-shirt is not just apparel; it's a statement of reverence for the power of music and the spirit of the underground scene.`,
  },
  {
    slug: "regular-1",
    name: "Taylor Swift (Kanye West)",
    collection: "devils-club",
    mrp: 899,
    price: 699,
    badge: "SALE",
    wixSku: "126351351935",
    description: `Celebrate a moment in music history with our Kanye and Taylor Graphic T-Shirt, commemorating the iconic incident that sparked discussions and divided opinions.

This t-shirt is more than apparel; it's a cultural statement reflecting the intersection of fame, artistry, and controversy.`,
  },
  {
    slug: "high-is-the-new-low",
    name: "high is the new low",
    collection: "devils-club",
    mrp: 899,
    price: 699,
    badge: "SALE",
    wixSku: "00657689703",
    description: `Clean. Minimal. Loud without shouting. This design speaks to the souls who find depth in the smoke, who float through chaos with calm in their eyes.

It's not just about being high. It's about owning the low, vibing in the silence, and letting the world move while you just exist. Made for heads who get it.`,
  },

  // ── Brainrot Club ───────────────────────────────────────────────────────
  {
    slug: "professional-tweeter",
    name: "professional tweeter",
    collection: "brainrot-club",
    mrp: 799,
    price: 699,
    badge: "SALE",
    description: `Designed to look like a real tweet from the timeline, the print captures that perfect mix of sarcasm, confidence, and meme culture that made Kanye's tweets legendary. It's the kind of design that makes people stop, read, and instantly get the joke.

Printed on a clean black tee with soft, comfortable fabric, it's built for everyday wear while keeping your style effortlessly online. For the ones who don't just tweet… they tweet like Kanye.`,
  },
  {
    slug: "capybara-speaking-facts",
    name: "real eyes, realize",
    collection: "brainrot-club",
    mrp: 899,
    price: 799,
    badge: "SALE",
    wixSku: "001984735620",
    description: `Introducing our "Real Eyes Realize" T-shirt – a dark twist with unexpected charm. This black tee features a laid-back capybara front and centre, paired with the thought-provoking phrase "Real Eyes Realize" in striking print. It's where chill meets rebellion.

Designed for those who see through the noise and walk their own path, this shirt blends irony, edge, and comfort effortlessly. Crafted from premium, ultra-soft fabric, it's built for everyday wear with a bold attitude.

See clearly. Chill hard. Wear the capybara.`,
  },

  // ── Limited Edition ─────────────────────────────────────────────────────
  {
    slug: "bound-2",
    name: "Bound 2",
    collection: "limited-edition",
    mrp: 1599,
    price: 1099,
    badge: "LIMITED",
    // NOTE: the live Wix page for Bound 2 has no description at all. This copy
    // is newly written — get it approved or replaced before launch.
    description: `A numbered run, printed once and never again. Heavy statement type across the chest, set on off-white heavyweight cotton so the ink sits sharp against it.

Each one is part of a counted drop. When the run is gone it doesn't come back — no restock, no second printing, no exceptions.`,
  },

  // ── Custom Designs ──────────────────────────────────────────────────────
  {
    slug: "front",
    name: "Front",
    collection: "custom",
    mrp: 1599,
    price: 999,
    badge: "EXCLUSIVE",
    needsBrief: true,
    description: `Your design across the front of the tee. Send us the idea and our team draws 2–3 concepts, you pick one, and we print it once.`,
  },
  {
    slug: "back",
    name: "Back",
    collection: "custom",
    mrp: 1599,
    price: 999,
    badge: "EXCLUSIVE",
    needsBrief: true,
    description: `Your design across the back of the tee. Send us the idea and our team draws 2–3 concepts, you pick one, and we print it once.`,
  },
  {
    slug: "front-back",
    name: "Front & Back",
    collection: "custom",
    mrp: 1999,
    price: 1099,
    badge: "EXCLUSIVE",
    needsBrief: true,
    description: `Your design across both sides of the tee. Send us the idea and our team draws 2–3 concepts, you pick one, and we print it once.`,
  },
];

export const products: Product[] = RAW.map((p) => ({
  ...p,
  image: `/products/${p.slug}.png`,
}));

export const bySlug = (slug: string) => products.find((p) => p.slug === slug);

/**
 * The store cross-lists two Devil's Club tees under Brainrot Club as well.
 * Kept deliberately — it mirrors how the shop is merchandised today.
 */
const CROSS_LISTED = ["high-is-the-new-low", "regular-1"];

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
    id: "brainrot-club",
    name: "Brainrot Club",
    code: "BRN",
    blurb: "Terminally online. Proudly unserious.",
  },
  {
    id: "limited-edition",
    name: "Limited Edition",
    code: "LTD",
    blurb: "Numbered drops. Once they're gone, they're gone.",
  },
  {
    id: "custom",
    name: "Custom Designs",
    code: "CST",
    blurb: "Your idea, drawn by our team, printed once.",
  },
];

export function productsIn(id: CollectionId): Product[] {
  const own = products.filter((p) => p.collection === id);
  if (id !== "brainrot-club") return own;
  return [...own, ...products.filter((p) => CROSS_LISTED.includes(p.slug))];
}

/** The real Wix SKU when we have one, else a stable generated code. */
export function sku(p: Product): string {
  if (p.wixSku) return p.wixSku;
  const c = collections.find((c) => c.id === p.collection)?.code ?? "SD";
  let h = 0;
  for (const ch of p.slug) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return `${c}-${String(h).padStart(4, "0")}`;
}

/** Short code for the card footers, where a 15-digit Wix SKU won't fit. */
export function shortCode(p: Product): string {
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
