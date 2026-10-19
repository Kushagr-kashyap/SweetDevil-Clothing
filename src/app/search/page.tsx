import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { PageHeader } from "@/components/hud";
import { collections, products, type Product } from "@/lib/products";

export const metadata: Metadata = {
  title: "Search — Sweet Devil",
  description: "Search the Sweet Devil catalogue.",
  robots: { index: false },
};

/**
 * Search, done in-process.
 *
 * The catalogue is a dozen items held in memory, so a scored substring match is
 * both instant and exact — a search index would be more machinery than the data
 * it indexes. Revisit if the range grows past a few hundred products.
 *
 * The form is a plain GET, so results are linkable, shareable, and work with
 * scripting dead.
 */

/** Higher = better match. A name hit beats a description hit. */
function score(p: Product, terms: string[], collectionName: string): number {
  const name = p.name.toLowerCase();
  const desc = p.description.toLowerCase();
  const coll = collectionName.toLowerCase();

  let total = 0;
  for (const t of terms) {
    if (name === t) total += 100;
    else if (name.startsWith(t)) total += 50;
    else if (name.includes(t)) total += 30;

    if (coll.includes(t)) total += 12;
    if (desc.includes(t)) total += 6;
    if (p.slug.includes(t)) total += 8;
  }
  return total;
}

function searchProducts(query: string): Product[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1) // single letters match everything
    .slice(0, 8);

  if (terms.length === 0) return [];

  const collName = new Map(collections.map((c) => [c.id, c.name]));

  return products
    .map((p) => ({ p, s: score(p, terms, collName.get(p.collection) ?? "") }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((r) => r.p);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 100);
  const results = query ? searchProducts(query) : [];
  const searched = query.length > 0;

  return (
    <main>
      <PageHeader
        code="SRC"
        meta={searched ? `${results.length} found` : "find something"}
        lines={["Search"]}
        blurb={
          searched
            ? `Results for “${query}”.`
            : "Type what you're after — a design name, a vibe, a collection."
        }
      />

      <section className="px-[max(1.25rem,5vw)] pb-8">
        <form
          action="/search"
          method="get"
          role="search"
          className="flex max-w-xl items-stretch gap-2"
        >
          <span
            className="chassis cut focus-within:bg-ember block min-w-0 flex-1 transition-colors"
            style={{ ["--cut" as string]: "10px" }}
          >
            <input
              type="search"
              name="q"
              defaultValue={query}
              autoFocus={!searched}
              placeholder="Search tees, designs…"
              aria-label="Search products"
              className="text-bone placeholder:text-bone-faint w-full bg-transparent px-4 py-3.5 text-base outline-none"
            />
          </span>
          <button
            type="submit"
            className="cut bg-bone text-void label shrink-0 px-6"
            style={{ ["--cut" as string]: "10px" }}
          >
            Search
          </button>
        </form>
      </section>

      <section className="px-[max(1.25rem,5vw)] pb-20">
        {searched && results.length === 0 && (
          <div
            className="chassis cut-4 p-8 text-center md:p-12"
            style={{ ["--cut" as string]: "20px" }}
          >
            <p className="readout text-bone-faint">no matches</p>
            <p className="display text-bone mt-3 text-[length:var(--step-2)]">
              Nothing for “{query}”
            </p>
            <p className="text-bone-dim prose-body mx-auto mt-3 max-w-[40ch] text-[0.95rem]">
              Try a shorter word, or just browse the lot — there aren&apos;t that
              many and they&apos;re all worth a look.
            </p>
            <Link
              href="/products"
              className="cut bg-bone text-void label mt-7 inline-flex items-center gap-2 px-6 py-3.5"
              style={{ ["--cut" as string]: "12px" }}
            >
              Browse everything <span aria-hidden>→</span>
            </Link>
          </div>
        )}

        {results.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {results.map((p) => (
              <li key={p.slug}>
                <ProductCard
                  product={p}
                  sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 23vw"
                />
              </li>
            ))}
          </ul>
        )}

        {!searched && (
          <div>
            <p className="readout text-bone-faint border-line/60 mb-4 border-b pb-3">
              Or jump to a collection
            </p>
            <div className="flex flex-wrap gap-2">
              {collections.map((c) => (
                <Link
                  key={c.id}
                  /* Every collection now has a real page of its own, so this
                     points at it rather than an anchor on the catalogue. */
                  href={`/collections/${c.id}`}
                  className="chassis cut label text-bone-dim hover:text-bone inline-flex min-h-11 items-center px-4 transition-colors"
                  style={{ ["--cut" as string]: "12px" }}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
