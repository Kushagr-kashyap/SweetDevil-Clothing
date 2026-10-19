import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BuyBox from "@/components/BuyBox";
import Lightbox from "@/components/Lightbox";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import SizeChart from "@/components/SizeChart";
import { Ticks } from "@/components/hud";
import { bySlug, collections, discount, galleryFor, inr, PHOTO_SIZE, products, sizeChartFor, specsFor } from "@/lib/products";
import { POLICIES } from "@/lib/site";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

/** `params` is a Promise in Next 16 and must be awaited. */
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = bySlug(slug);
  if (!p) return { title: "Not found — Sweet Devil" };

  return {
    title: `${p.name} — Sweet Devil`,
    description: p.description.split("\n\n")[0].slice(0, 155),
    openGraph: {
      title: `${p.name} — Sweet Devil`,
      description: p.description.split("\n\n")[0].slice(0, 155),
      images: [{ url: p.image, width: 1000, height: 1000, alt: p.name }],
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const p = bySlug(slug);
  if (!p) notFound();

  const collection = collections.find((c) => c.id === p.collection);
  const sizeChart = sizeChartFor(p);
  const related = products
    .filter((r) => r.collection === p.collection && r.slug !== p.slug)
    .slice(0, 4);

  // Size chart is appended rather than listed in `gallery` so it can never be
  // mistaken for the hero shot or used as the OG image.
  const gallery = p.sizeChart ? [...galleryFor(p), p.sizeChart] : galleryFor(p);

  /**
   * Structured data, so a search result can carry the price and the words
   * "In stock" instead of just a blue link.
   *
   * Built from the same catalogue the page renders, never typed twice — a
   * price in here that disagrees with the price on the page is the kind of
   * thing Google penalises and a customer screenshots.
   *
   * No `aggregateRating`: the shop has no reviews yet, and inventing one is
   * both a lie to the customer and a manual action waiting to happen.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description.split("\n\n")[0],
    image: galleryFor(p).map((src) => `https://sweetdevil.in${src}`),
    brand: { "@type": "Brand", name: "Sweet Devil" },
    category: collections.find((c) => c.id === p.collection)?.name,
    offers: {
      "@type": "Offer",
      url: `https://sweetdevil.in/products/${p.slug}`,
      priceCurrency: "INR",
      price: String(p.price),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Sweet Devil" },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "INR" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
      },
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="px-[max(1.25rem,5vw)] pt-24 md:pt-28">
        {/* breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="rise flex flex-wrap items-center gap-2"
          style={{ ["--d" as string]: "40ms" }}
        >
          <Link href="/products" className="readout text-bone-faint hover:text-ember inline-flex min-h-11 items-center transition-colors">
            All products
          </Link>
          <span aria-hidden className="readout text-bone-faint">
            /
          </span>
          <span className="readout text-ember">{collection?.code}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* ── the garment ──
               A native scroll-snap strip, not a JS carousel: swiping works on
               a phone, arrow keys work on a desktop, and it still functions
               with scripting dead — same rule as the rest of the site.
               Object-contain, not cover: a model shot cropped to a square
               beheads the model. */}
          <div
            className="rise lg:sticky lg:top-24 lg:self-start"
            style={{ ["--d" as string]: "100ms" }}
          >
            <Lightbox>
            <div
              className="chassis cut-4 relative overflow-hidden"
              style={{ ["--cut" as string]: "20px" }}
            >
              <ul className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
                {gallery.map((src, i) => {
                  const backlit = p.backlit?.includes(src) ?? false;
                  const alt =
                    i === gallery.length - 1 && p.sizeChart
                      ? `${p.name} size chart, measurements in inches`
                      : `${p.name} — view ${i + 1} of ${gallery.length}`;
                  return (
                  <li
                    key={src}
                    className={`relative aspect-square w-full shrink-0 snap-center ${
                      backlit ? "bg-void-deep" : "bg-panel"
                    }`}
                  >
                    {/* The lit plate. Not decoration — a cut-out of a BLACK
                        garment needs a lighter surface or its silhouette
                        vanishes and only the print survives. */}
                    {!backlit && (
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,var(--color-panel-hi),var(--color-panel)_72%)]"
                      />
                    )}

                    {/* Backlight, for on-body shots taken on black. Beneath the
                        image so it fills the letterbox margins either side of a
                        portrait crop — the subject stands in a pool of warm
                        light rather than on a flat black square. Offset to 34%
                        to sit at head height. */}
                    {backlit && (
                      <span
                        aria-hidden
                        className="absolute left-1/2 top-[34%] h-[92%] w-[104%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] opacity-80 blur-2xl"
                        style={{
                          background:
                            "radial-gradient(circle at center, color-mix(in oklch, var(--color-flare) 30%, transparent) 0%, color-mix(in oklch, var(--color-ember) 20%, transparent) 45%, transparent 74%)",
                        }}
                      />
                    )}
                    {/* A real link to the file, upgraded by <Lightbox> into an
                        in-page viewer. With scripting dead this still opens the
                        photo and the phone zooms it natively. */}
                    <a
                      href={src}
                      data-zoom
                      data-alt={alt}
                      className="relative block h-full w-full cursor-zoom-in"
                    >
                      <Image
                        src={src}
                        alt={alt}
                        width={PHOTO_SIZE}
                        height={PHOTO_SIZE}
                        priority={i === 0}
                        sizes="(max-width: 1024px) 92vw, 46vw"
                        className="relative h-full w-full object-contain"
                      />
                    </a>

                    {/* REMOVED: a `mix-blend-screen` bleed used to sit here, on
                        top of the image, to lift the backdrop around the
                        subject. It intermittently rendered as an opaque wash
                        that hid the photograph completely — a product page
                        showing no product. Proven by hiding the layer and
                        watching the model reappear.
                        The pool BENEATH the image gives most of the same effect
                        and cannot obscure anything. Do not reintroduce a blend
                        mode over product photography: the downside is the
                        product vanishing, the upside is a slightly nicer glow. */}
                  </li>
                  );
                })}
              </ul>
              <Ticks />
              <span
                className="cut bg-void/85 text-ember readout absolute left-3 top-3 px-2 py-1"
                style={{ ["--cut" as string]: "5px" }}
              >
                {p.badge}
              </span>
              {gallery.length > 1 && (
                <span className="readout text-bone-faint bg-void/70 absolute bottom-3 right-3 px-2 py-1">
                  swipe · {String(gallery.length).padStart(2, "0")}
                </span>
              )}
            </div>
            </Lightbox>

            {/* Fit reference, directly under the photos it describes — this is
                where someone is judging "will it look like that on me?", and
                "oversized" is unanswerable without a body to measure it
                against. */}
            {p.model && (
              <p className="readout text-bone-faint mt-3">
                model is {p.model.height} · wearing size{" "}
                <span className="text-ember">{p.model.wears}</span>
              </p>
            )}
          </div>

          {/* ── the pitch ── */}
          <div className="rise" style={{ ["--d" as string]: "180ms" }}>
            <h1 className="display text-bone text-[length:var(--step-3)]">{p.name}</h1>

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-bone text-3xl font-semibold">{inr(p.price)}</span>
              <span className="text-bone-faint text-lg line-through">{inr(p.mrp)}</span>
              <span className="readout text-flare">−{discount(p)}% off</span>
            </div>

            {/* SKU removed at the owner's request — it's an internal reference
                and meant nothing to a customer. Order numbers are what support
                actually needs. */}
            <div className="border-line/60 mt-4 flex items-center gap-3 border-y py-2.5">
              <span className="readout text-ember">free shipping</span>
              <span className="bg-line/60 h-px flex-1" />
              <span className="readout text-bone-faint">within 7 days</span>
            </div>

            <div className="text-bone-dim prose-body mt-6 space-y-4 text-[0.98rem]">
              {p.description.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <BuyBox product={p} />

            {/* ── specs & policies: plain <details>, works with no JS ── */}
            <div className="mt-10 space-y-2">
              <Panel title="Product info" open>
                <ul className="text-bone-dim space-y-1.5 text-[0.95rem]">
                  {specsFor(p).map((s) => (
                    <li key={s} className="flex gap-2">
                      <span aria-hidden className="text-ember">
                        ·
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </Panel>

              {/* Only when the supplier has actually sent figures for this
                  garment — an invented size chart is worse than none. */}
              {sizeChart && (
                <Panel title="Size chart">
                  <SizeChart chart={sizeChart} />
                </Panel>
              )}

              <Panel title="Shipping">
                <p className="text-bone-dim prose-body text-[0.95rem]">
                  {POLICIES.shipping}
                </p>
              </Panel>
              <Panel title="Returns & refunds">
                <div className="text-bone-dim prose-body space-y-3 text-[0.95rem]">
                  {POLICIES.returns.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </div>

      {/* ── more from the club ── */}
      {related.length > 0 && (
        <section className="px-[max(1.25rem,5vw)] py-16 md:py-20">
          <div className="border-line/60 mb-6 flex items-center gap-3 border-b pb-3">
            <span className="readout text-ember">{collection?.code}</span>
            <span className="bg-line/60 h-px flex-1" />
            <span className="readout text-bone-faint">more from this club</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {related.map((r) => (
              <ProductCard
                key={r.slug}
                product={r}
                sizes="(max-width: 1024px) 45vw, 23vw"
              />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}

/** Native disclosure — no JS, keyboard accessible, and findable by ⌘F. */
function Panel({
  title,
  open = false,
  children,
}: {
  title: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={open}
      className="chassis cut group"
      style={{ ["--cut" as string]: "10px" }}
    >
      <summary className="label text-bone flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        {title}
        <span
          aria-hidden
          className="text-ember transition-transform duration-300 group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}
