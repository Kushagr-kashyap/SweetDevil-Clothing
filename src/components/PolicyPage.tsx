import Link from "next/link";
import Footer from "./Footer";
import { PageHeader } from "./hud";
import { POLICY_DOCS, POLICY_UPDATED, type PolicyDoc } from "@/lib/policies";

/**
 * Renders one legal document. Deliberately plain compared with the rest of the
 * site: no Reveal wrappers, no scroll-gated animation, no client JS at all.
 *
 * A refund policy that only appears once a script runs is a policy the customer
 * can credibly say they never saw — and Razorpay's reviewer reads these pages
 * with the same tooling a scraper would. Everything here is in the HTML.
 */

/** Stable heading ids for the contents links. */
const anchor = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function PolicyPage({ doc }: { doc: PolicyDoc }) {
  const others = POLICY_DOCS.filter((d) => d.slug !== doc.slug);

  return (
    <main>
      <PageHeader
        code={doc.code}
        meta={`updated ${POLICY_UPDATED}`}
        lines={doc.lines}
        blurb={doc.blurb}
      />

      <div className="px-[max(1.25rem,5vw)] pb-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12">
          {/* ── the document ── */}
          <article
            className="chassis cut-4 p-5 md:p-8"
            style={{
              ["--cut" as string]: "20px",
              ["--chassis-fill" as string]: "var(--color-void-deep)",
            }}
          >
            {doc.sections.map((s, i) => (
              <section
                key={s.heading}
                id={anchor(s.heading)}
                className={i === 0 ? "scroll-mt-24" : "mt-9 scroll-mt-24"}
              >
                <div className="border-line/60 mb-3 flex items-baseline gap-3 border-b pb-2">
                  <span className="readout text-ember shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="display text-bone text-[1.15rem] leading-tight">
                    {s.heading}
                  </h2>
                </div>

                {s.body?.map((p) => (
                  <p
                    key={p}
                    className="text-bone-dim prose-body mt-3 text-[0.98rem]"
                  >
                    {p}
                  </p>
                ))}

                {s.list && (
                  <ul className="mt-3 space-y-2">
                    {s.list.map((item) => (
                      <li
                        key={item}
                        className="text-bone-dim prose-body relative pl-5 text-[0.98rem]"
                      >
                        <span
                          aria-hidden
                          className="bg-ember absolute left-0 top-[0.62em] block h-1.5 w-1.5"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>

          {/* ── contents + the other documents ── */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav aria-label="On this page">
              <p className="readout text-bone-faint border-line/60 mb-2 border-b pb-3">
                On this page
              </p>
              <ol>
                {doc.sections.map((s, i) => (
                  <li key={s.heading}>
                    <a
                      href={`#${anchor(s.heading)}`}
                      className="text-bone-dim hover:text-ember flex min-h-11 items-center gap-2.5 text-[0.9rem] transition-colors"
                    >
                      <span className="readout text-bone-faint shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <nav aria-label="Other policies" className="mt-8">
              <p className="readout text-bone-faint border-line/60 mb-2 border-b pb-3">
                Also worth reading
              </p>
              <ul>
                {others.map((d) => (
                  <li key={d.slug}>
                    <Link
                      href={`/${d.slug}`}
                      className="text-bone-dim hover:text-ember flex min-h-11 items-center gap-2.5 text-[0.9rem] transition-colors"
                    >
                      <span className="readout text-ember shrink-0">{d.code}</span>
                      {d.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <p className="text-bone-faint prose-body mt-8 text-[0.85rem]">
              Something here unclear? Ask us before you order, not after — we&apos;d
              rather explain it than argue about it.
            </p>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  );
}
