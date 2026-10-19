/**
 * The graphic tees that were on the site before the Devil's Club drop of
 * 2026-09-21, kept whole rather than deleted.
 *
 * ARCHIVED, NOT DEAD. The owner's words were "get rid of all the tees FOR NOW",
 * so these are parked, not removed: putting one back on sale is a matter of
 * moving its object into RAW in products.ts, not re-typing it. Their copy,
 * prices and SKUs are still the ones transcribed from the live Wix store on
 * 2026-07-25 — do not "tidy" them here either.
 *
 * Their photography is still in public/products/. Left alone on purpose: it
 * costs nothing to keep and it is what a returning product would need.
 *
 * NOTHING IMPORTS THE ENTRIES. This file exists so the work survives; only
 * ARCHIVED_SLUGS is read anywhere, and only to prove the redirect list in
 * next.config.ts is complete.
 */
import { SPECS_240, type CollectionId, type Product } from "./products";

/**
 * NOTE (2026-09-25): the `character` field was stripped from these entries when
 * the character system was removed with the drop. Three tees carried one. If a
 * tee is ever brought back it returns without a character, which is the only
 * shape the Product type still allows.
 */

/**
 * Archived entries keep the collection they were actually sold under, which
 * includes two that no longer exist on the site: Brainrot Club and Limited
 * Edition were removed on 2026-10-16. Widening the type here rather than
 * retagging the products keeps the record true — these tees really were sold
 * in those clubs, and a parking lot that rewrites history is worth nothing.
 */
type ArchivedProduct = Omit<Product, "image" | "collection"> & {
  collection: CollectionId | "brainrot-club" | "limited-edition";
};

const ARCHIVED: ArchivedProduct[] = [

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
    specs: SPECS_240,
    // Model shots are .png because they are cut out — transparency is the whole
    // point. A .jpg here would carry a white box and defeat the backlight.
    // Back first, all the way through: the hero graphic leads the card, then the
    // same graphic on a body, then the front, then the flats.
    gallery: [
      "/products/the-lovers-model-back.png",
      "/products/the-lovers-model-front.png",
      "/products/the-lovers-back.png",
      "/products/the-lovers.png",
    ],
    model: { height: "5'7\"", wears: "M" },
    // The artwork that sells this one is on the back, so that's what the rail
    // shows — matching the other Devil's Club cards, which are all back prints.
    card: "/products/the-lovers-back.png",
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
    specs: SPECS_240,
    // Artwork is on the back, so the back leads the card and the gallery —
    // same reasoning as The Lovers.
    card: "/products/killswitch-engage-back.png",
    model: { height: "6'2\"", wears: "XL" },
    gallery: [
      "/products/killswitch-engage-model-back.png",
      "/products/killswitch-engage-model-front.png",
      "/products/killswitch-engage-back.png",
      "/products/killswitch-engage-front.png",
    ],
    // These on-body shots are genuine cut-outs, so the warm pool behind them
    // shows THROUGH the transparency and rims the subject — the effect the
    // opaque Lovers shots could only fake. The flat stays on the lit plate: a
    // black garment on a dark plate loses its silhouette.
    backlit: [
      "/products/killswitch-engage-model-back.png",
      "/products/killswitch-engage-model-front.png",
    ],
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
    specs: SPECS_240,
    model: { height: "5'11\"", wears: "L" },
    // Artwork is on the back, so the back leads.
    card: "/products/satan-s-child.png",
    gallery: [
      // Both on-body shots arrived with the transparency CHECKERBOARD baked in
      // as real pixels — the background remover had exported its preview rather
      // than the transparent PNG. Re-cut here by flood-filling the light region
      // inward from the border, which removes only backdrop CONNECTED to the
      // edge; the white print sits inside black fabric and is unreachable, so
      // the artwork survived. A plain colour-key would have punched holes
      // straight through "SATAN'S CHILD".
      "/products/satan-s-child-model-back.png",
      "/products/satan-s-child-model-front.png",
      // The ORIGINAL flat, not the regenerated one. A newer version of this
      // image had the body copy AI-mangled into gibberish — "ALDO KNOWN AS,
      // THE ,DCVIL AND SLMETIMES SIBO DALLED FURIPERT IN CHRISTIONITY" — which
      // would have shipped a product page advertising nonsense printed on the
      // garment. Check the small print on any regenerated artwork before it
      // goes near a product page.
      "/products/satan-s-child.png",
      "/products/satan-s-child-front.png",
    ],
    // Now genuine cut-outs, so the warm pool shows THROUGH and rims the subject
    // — the same treatment as Atlas.
    backlit: [
      "/products/satan-s-child-model-back.png",
      "/products/satan-s-child-model-front.png",
    ],
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
];

/**
 * Every slug that used to resolve at /products/<slug>.
 *
 * These were deliberately the live Wix slugs (see the note on Product.slug), so
 * they are the URLs in every Instagram post, saved link and search result that
 * predates the drop. next.config.ts redirects all of them; this array is the
 * list that redirect table has to match.
 */
export const ARCHIVED_SLUGS: string[] = ARCHIVED.map((p) => p.slug);
