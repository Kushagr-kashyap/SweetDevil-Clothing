import Link from "next/link";
import { collections } from "@/lib/products";
import { POLICY_LINKS } from "@/lib/policies";
import { CONTACT } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-line/60 mt-8 border-t">
      <div className="px-[max(1.25rem,5vw)] pt-14">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
          {/* ── sign-up ── */}
          <div>
            <div className="border-line/60 mb-4 flex items-center gap-3 border-b pb-3">
              <span className="bg-ember animate-led block h-1.5 w-1.5 rounded-full" />
              <span className="readout text-ember">join the cult</span>
            </div>
            <p className="text-bone-dim prose-body text-[0.95rem]">
              Drops sell out. Get first dibs, secret discounts, and zero spam.
            </p>
            <form
              className="mt-4 flex max-w-sm items-stretch gap-2"
              action={`mailto:${CONTACT.email}`}
              method="post"
            >
              {/* chassis lives on the wrapper — inputs can't paint ::before */}
              <span
                className="chassis cut focus-within:bg-ember block min-w-0 flex-1 transition-colors"
                style={{ ["--cut" as string]: "8px" }}
              >
                <input
                  type="email"
                  required
                  name="email"
                  placeholder="your@email.com"
                  aria-label="Email address"
                  className="text-bone placeholder:text-bone-faint w-full bg-transparent px-3 py-3 text-base outline-none"
                />
              </span>
              <button
                type="submit"
                className="cut bg-bone text-void label shrink-0 px-5"
                style={{ ["--cut" as string]: "8px" }}
              >
                Join
              </button>
            </form>
          </div>

          <nav aria-label="Shop">
            <p className="readout text-bone-faint border-line/60 mb-4 border-b pb-3">
              Shop
            </p>
            <ul>
              {collections
                .filter((c) => c.id !== "custom")
                .map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/products#${c.id}`}
                      className="text-bone-dim hover:text-ember flex min-h-11 items-center text-[0.95rem] transition-colors"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              <li>
                <Link
                  href="/products"
                  className="text-bone-dim hover:text-ember flex min-h-11 items-center text-[0.95rem] transition-colors"
                >
                  All products
                </Link>
              </li>
              <li>
                <Link
                  href="/custom"
                  className="text-bone-dim hover:text-ember flex min-h-11 items-center text-[0.95rem] transition-colors"
                >
                  Custom designs
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Brand">
            <p className="readout text-bone-faint border-line/60 mb-4 border-b pb-3">
              Brand
            </p>
            <ul>
              <li>
                <Link
                  href="/about"
                  className="text-bone-dim hover:text-ember flex min-h-11 items-center text-[0.95rem] transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-bone-dim hover:text-ember flex min-h-11 items-center text-[0.95rem] transition-colors"
                >
                  Contact us
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="text-bone-dim hover:text-ember flex min-h-11 items-center text-[0.95rem] transition-colors"
                >
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="text-bone-dim hover:text-ember flex min-h-11 items-center text-[0.95rem] transition-colors"
                >
                  Instagram ↗
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* ── the wordmark, used as architecture ── */}
        <h2
          aria-hidden
          className="display text-bone/90 mt-14 text-[19vw] leading-[0.78]"
        >
          Sweet<span className="text-ember">.</span>
        </h2>
      </div>

      {/* Policy links sit in the footer so they're reachable from every page —
          both because that's where customers look for them and because a
          payment provider's review checks they're publicly linked, not just
          published at a URL somebody has to guess. */}
      <nav
        aria-label="Policies"
        className="border-line/60 mt-6 border-t px-[max(1.25rem,5vw)] pt-3"
      >
        <ul className="flex flex-wrap items-center gap-x-5">
          {POLICY_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-bone-dim hover:text-ember flex min-h-11 items-center text-[0.9rem] transition-colors"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-line/60 flex flex-col gap-1.5 border-t px-[max(1.25rem,5vw)] py-5 md:flex-row md:items-center md:justify-between">
        <span className="readout text-bone-faint">
          © {new Date().getFullYear()} sweet devil — unleash your inner devil
        </span>
        <span className="readout text-bone-faint">made in india · sweetdevil.in</span>
      </div>
    </footer>
  );
}
