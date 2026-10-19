import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { PageHeader } from "@/components/hud";
import { browsableGroups, groupById } from "@/lib/products";

/**
 * One page per browsable group.
 *
 * The same route serves a COLLECTION (Devil's Club, Minimalist, Winter) and a
 * CUT (Boxy Fit, Waffle Knit, Ringer Tee). They are different axes in the data
 * — what is printed versus what it is printed on — but identical to a customer:
 * tap a heading, see everything under it. Splitting them into two routes would
 * double the code to serve one gesture.
 *
 * A grid here, never a rail. The rails on the catalogue are for browsing past
 * something; this page is where someone has already chosen what they want to
 * look at, so everything is laid out at once and nothing hides behind a drag.
 *
 * Only groups holding stock exist — browsableGroups() filters the empty ones —
 * so Ringer Tee 404s until there is a ringer tee, rather than offering a link
 * to an empty shelf.
 */
export function generateStaticParams() {
  return browsableGroups().map((g) => ({ id: g.id }));
}

/** `params` is a Promise in Next 16 and must be awaited. */
type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const g = groupById(id);
  if (!g) return { title: "Not found — Sweet Devil" };

  return {
    title: `${g.name} — Sweet Devil`,
    description: g.blurb,
    openGraph: {
      title: `${g.name} — Sweet Devil`,
      description: g.blurb,
      images: g.items[0] ? [g.items[0].image] : undefined,
    },
  };
}

export default async function CollectionPage({ params }: Params) {
  const { id } = await params;
  const g = groupById(id);
  if (!g) notFound();

  return (
    <main>
      <PageHeader
        code={g.code}
        meta={`${String(g.items.length).padStart(2, "0")} ${
          g.items.length === 1 ? "style" : "styles"
        } in stock`}
        lines={g.name.split(" ")}
        blurb={g.blurb}
      />

      <section className="px-[max(1.25rem,5vw)] pb-16">
        {/* Four across on desktop rather than the catalogue's five: this page
            has no competing sections, so each card can afford the extra width. */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {g.items.map((p, i) => (
            <Reveal key={p.slug} delay={i * 50}>
              <ProductCard
                product={p}
                sizes="(max-width: 768px) 45vw, (max-width: 1024px) 31vw, 23vw"
              />
            </Reveal>
          ))}
        </div>

        <Link
          href="/products"
          className="label text-bone-dim hover:text-ember mt-10 inline-flex min-h-11 items-center gap-2 transition-colors"
        >
          <span aria-hidden>←</span>
          Everything else
        </Link>
      </section>

      <Footer />
    </main>
  );
}
