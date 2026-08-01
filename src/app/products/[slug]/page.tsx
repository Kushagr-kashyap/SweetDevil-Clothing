import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BuyBox from "@/components/BuyBox";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Ticks } from "@/components/hud";
import CharacterPanel from "@/components/CharacterPanel";
import { characterById } from "@/lib/characters";
import {
  bySlug,
  collections,
  discount,
  galleryFor,
  inr,
  products,
  sku,
  specsFor,
} from "@/lib/products";
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
  const related = products
    .filter((r) => r.collection === p.collection && r.slug !== p.slug)
    .slice(0, 4);

  const character = p.character ? characterById(p.character) : undefined;
  // Size chart is appended rather than listed in `gallery` so it can never be
  // mistaken for the hero shot or used as the OG image.
  const gallery = p.sizeChart ? [...galleryFor(p), p.sizeChart] : galleryFor(p);

  return (
    <main>
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
            <div
              className="chassis cut-4 relative overflow-hidden"
              style={{ ["--cut" as string]: "20px" }}
            >
              <ul className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
                {gallery.map((src, i) => (
                  <li
                    key={src}
                    className={`relative aspect-square w-full shrink-0 snap-center ${
                      p.onDark ? "bg-void-deep" : "bg-panel"
                    }`}
                  >
                    {/* Photography shot on black brings its own lighting, so it
                        gets a dark plate and nothing else. The lit radial plate
                        exists for garments shot on white — it would frame these
                        in a lighter box instead of blending with them. */}
                    {!p.onDark && (
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,var(--color-panel-hi),var(--color-panel)_72%)]"
                      />
                    )}
                    <Image
                      src={src}
                      alt={
                        i === gallery.length - 1 && p.sizeChart
                          ? `${p.name} size chart, measurements in inches`
                          : `${p.name} — view ${i + 1} of ${gallery.length}`
                      }
                      width={1000}
                      height={1000}
                      priority={i === 0}
                      sizes="(max-width: 1024px) 92vw, 46vw"
                      className="relative h-full w-full object-contain"
                    />
                  </li>
                ))}
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
          </div>

          {/* ── the pitch ── */}
          <div className="rise" style={{ ["--d" as string]: "180ms" }}>
            <h1 className="display text-bone text-[length:var(--step-3)]">{p.name}</h1>

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-bone text-3xl font-semibold">{inr(p.price)}</span>
              <span className="text-bone-faint text-lg line-through">{inr(p.mrp)}</span>
              <span className="readout text-flare">−{discount(p)}% off</span>
            </div>

            <div className="border-line/60 mt-4 flex items-center gap-3 border-y py-2.5">
              <span className="readout text-bone-faint">sku {sku(p)}</span>
              <span className="bg-line/60 h-px flex-1" />
              <span className="readout text-ember">free shipping</span>
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

              {/* The character sits between the spec sheet and Shipping, at the
                  owner's direction — and it's the right place. Someone reading
                  this far either wants a reason to buy or is checking delivery.
                  The story answers the first; Shipping answers the second. */}
              {character && (
                <div className="!mt-6">
                  <CharacterPanel character={character} />
                </div>
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
