import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Manifesto from "@/components/Manifesto";
import Marquee from "@/components/Marquee";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { PageHeader, Readout, Ticks } from "@/components/hud";
import { collections, inr, products } from "@/lib/products";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "About — Sweet Devil",
  description:
    "Every Sweet Devil design is drawn by us, printed in a small run, and never made again. Original artwork, heavyweight cotton, sold only here. Made in New Delhi.",
};

/**
 * One line per collection.
 *
 * DRAFT COPY — not the owner's words. Written 2026-10-19 so the cards are not
 * blank; worth rewriting in his voice when he has a minute.
 */
const CLUB_NOTES: Record<string, string> = {
  "devils-club":
    "Full comic covers across the back. Painted scenes, hand-drawn lettering, a story you can read in two seconds.",
  minimalist:
    "The wordmark and nothing else. Boxy, waffle, ringer — pick the garment, pick the colour.",
  winter:
    "Hoodies and heavy knits, cut for the weeks Delhi finally admits it is cold.",
};

export default function AboutPage() {
  /* Read off the catalogue rather than typed in: the page used to claim
     "₹699 — ₹1,599" long after both ends had moved. */
  const prices = products.map((p) => p.price);
  const range = `${inr(Math.min(...prices))} — ${inr(Math.max(...prices))}`;

  return (
    <main>
      <PageHeader
        code="ABT"
        meta="est. 2024 · new delhi"
        lines={["Nobody else", "makes this."]}
        blurb="Every design on this site was drawn by us, printed in a small run, and never made again. You won't find it anywhere else — because it doesn't exist anywhere else."
      />

      {/* ── the mascot, given room ── */}
      <section className="px-[max(1.25rem,5vw)]">
        <Reveal
          className="chassis cut-4 relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9]"
          style={{ ["--cut" as string]: "22px" }}
        >
          <span className="absolute inset-px overflow-hidden">
            <span
              aria-hidden
              className="bloom pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 opacity-60"
            />
            <Image
              src="/brand/devil.png"
              alt="The Sweet Devil mascot, wings spread, holding two fireballs"
              width={1563}
              height={1563}
              sizes="(max-width: 640px) 100vw, 70vw"
              className="absolute left-1/2 top-1/2 h-[92%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
            />
          </span>
          <Ticks />
          <span className="readout text-bone-faint absolute bottom-3 left-4">
            unleash your inner devil
          </span>
        </Reveal>
      </section>

      {/* ── the story ── */}
      <section className="px-[max(1.25rem,5vw)] py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:gap-16">
          <div>
            <div className="border-line/60 mb-6 flex items-center gap-3 border-b pb-3">
              <span className="readout text-ember">ORG</span>
              <span className="bg-line/60 h-px flex-1" />
              <span className="readout text-bone-faint">the story</span>
            </div>

            <Reveal>
              <h2 className="display text-bone text-[length:var(--step-2)]">
                We draw it. We print it. Then we stop.
              </h2>
              <div className="text-bone-dim prose-body mt-4 space-y-4 text-[0.98rem]">
                <p>
                  Sweet Devil didn&apos;t start as a business. It started because
                  we wanted a t-shirt that didn&apos;t exist, and it was obvious
                  nobody was going to make it for us.
                </p>
                <p>
                  So we learned to draw. Every cover, every wordmark, every line
                  of lettering on every garment here was made by us, for this,
                  and for nowhere else. We don&apos;t buy artwork off a
                  marketplace. We don&apos;t print what somebody else already
                  sold. There is no catalogue to order from — if it&apos;s on
                  this site, it exists because somebody sat down and drew it.
                </p>
                <p>
                  Then we got just as stubborn about what it gets printed on.
                  Heavyweight cotton, oversized and boxy cuts, ink laid down
                  thick enough to outlive the shirt. You can feel the weight the
                  second you pick one up — that part is not an accident, and it
                  is not cheap.
                </p>
                <p>
                  Runs are small on purpose and nothing comes back. When a design
                  sells out it is finished: no second edition, no restock, no
                  quiet version of it on some other website six months later. You
                  will not walk past someone wearing yours.
                </p>
                <p className="text-bone">
                  This is not a side project. Every hour we have goes into it.
                  We would rather two hundred people own something nobody else
                  can get than sell the same shirt to a hundred thousand.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120} className="self-start">
            <p className="readout text-bone-faint border-line/60 mb-2 border-b pb-3">
              On the record
            </p>
            <Readout label="founded" value="2024" />
            <Readout label="based in" value="new delhi" />
            <Readout label="artwork" value="drawn in-house" hot />
            <Readout label="fits" value="oversized · boxy" />
            <Readout label="range" value={range} />
            <Readout label="restocks" value="never" hot />
            <a
              href={`mailto:${CONTACT.email}`}
              className="label text-bone hover:text-ember mt-5 inline-flex min-h-11 items-center gap-2 transition-colors"
            >
              Say hello
              <span aria-hidden>→</span>
            </a>
          </Reveal>
        </div>
      </section>

      <Marquee text="Drawn here. Printed once. Never again." duration={30} />

      <Manifesto />

      {/* ── the collections ── */}
      <section className="px-[max(1.25rem,5vw)] pb-16">
        <div className="border-line/60 mb-8 flex items-center gap-3 border-b pb-3">
          <span className="readout text-ember">CLB</span>
          <span className="bg-line/60 h-px flex-1" />
          <span className="readout text-bone-faint">
            {String(collections.length).padStart(2, "0")} collections
          </span>
        </div>

        <ul className="grid gap-4 md:grid-cols-2">
          {collections.map((c, i) => (
            <Reveal
              as="li"
              key={c.id}
              delay={i * 70}
              className="chassis cut p-5"
              style={{ ["--cut" as string]: "14px" }}
            >
              <span className="readout text-ember">{c.code}</span>
              <h3 className="display text-bone mt-2 text-[1.35rem]">{c.name}</h3>
              <p className="text-bone-dim prose-body mt-2 text-[0.95rem]">
                {CLUB_NOTES[c.id]}
              </p>
              <Link
                href={`/collections/${c.id}`}
                className="label text-bone-dim hover:text-ember mt-3 inline-flex min-h-11 items-center gap-2 transition-colors"
              >
                Browse
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      <Footer />
    </main>
  );
}
