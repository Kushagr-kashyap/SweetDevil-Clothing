import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/hud";
import { browsableGroups } from "@/lib/products";

/**
 * The page a customer gets when a URL does not resolve.
 *
 * Before this existed they got Next's own 404: a white page, a thin line, and
 * "This page could not be found." No header, no footer, no shop — a dead end
 * on a different-looking website. That matters more here than on most sites,
 * because the store moved off Wix and Google still indexes Wix URLs. Several
 * of those are redirected in next.config.ts now, but a redirect table only
 * covers the paths you thought of; this covers the rest.
 *
 * The groups are read live rather than listed, so a collection added later
 * shows up here without anyone remembering to come back and add it.
 *
 * `noindex` on purpose: a soft 404 that search engines index is worse than a
 * hard one, because it competes with the real pages.
 */
export const metadata: Metadata = {
  title: "Page not found — Sweet Devil",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const groups = browsableGroups();

  return (
    <main>
      <PageHeader
        code="404"
        meta="dead link"
        lines={["Nothing", "here"]}
        blurb="This page doesn't exist — it may have moved when the store did. Everything we make is still one tap away."
      />

      <section className="px-[max(1.25rem,5vw)] pb-16">
        <Link
          href="/products"
          className="chassis cut-4 group block p-6 md:p-10"
          style={{ ["--cut" as string]: "20px" }}
        >
          <span className="readout text-ember">CAT — everything we print</span>
          <span className="display text-bone mt-3 block text-[length:var(--step-2)]">
            Go to the shop
          </span>
          <span className="label text-bone group-hover:text-ember mt-4 inline-flex min-h-11 items-center gap-2 transition-colors">
            All products
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </Link>

        {groups.length > 0 && (
          <>
            <p className="readout text-bone-faint mt-10">or jump straight in</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {groups.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/collections/${g.id}`}
                    className="chassis cut text-bone-dim hover:text-ember inline-flex min-h-11 items-center gap-2 px-4 transition-colors"
                    style={{ ["--cut" as string]: "8px" }}
                  >
                    <span className="readout text-ember">{g.code}</span>
                    {g.name}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <Footer />
    </main>
  );
}
