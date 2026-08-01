import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Manifesto from "@/components/Manifesto";
import Marquee from "@/components/Marquee";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { PageHeader, Readout, Ticks } from "@/components/hud";
import { collections } from "@/lib/products";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "About — Sweet Devil",
  description:
    "Sweet Devil started with two best friends who couldn't find a t-shirt that met their standards. So they printed their own. Made in New Delhi.",
};

/** Verbatim from the live store's own description of each club. */
const CLUB_NOTES: Record<string, string> = {
  "devils-club":
    "The loud one. Band-grade artwork, heavy ink, the kind of print people stop you about at a gig.",
  "brainrot-club":
    "The joke one. Screenshots, memes and group-chat energy printed at full size, entirely without shame.",
  "limited-edition":
    "The rare one. Numbered runs that go once and never come back — no restocks, no second chances.",
  custom:
    "The personal one. You send the idea, our team draws it, and it gets printed exactly once.",
};

export default function AboutPage() {
  return (
    <main>
      <PageHeader
        code="ABT"
        meta="est. 2024 · new delhi"
        lines={["Two friends,", "one bad idea."]}
        blurb="Sweet Devil exists because we couldn't buy the t-shirt we wanted. So we printed it, and then we printed a lot more."
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
                It started as a complaint
              </h2>
              <div className="text-bone-dim prose-body mt-4 space-y-4 text-[0.98rem]">
                <p>
                  Sweet Devil was started by two best friends who kept running
                  into the same problem: they couldn&apos;t find a t-shirt that
                  actually met their standards. Graphics they liked came on
                  cheap blanks. Blanks they liked came with nothing worth
                  wearing on them.
                </p>
                <p>
                  So they stopped looking and started printing. The first run was
                  for themselves. The second was because people kept asking where
                  the first one came from.
                </p>
                <p>
                  Everything still gets made the same way — heavyweight cotton,
                  oversized cuts, artwork printed big and loud, in runs small
                  enough that you won&apos;t see yourself walking down the street.
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
            <Readout label="fits" value="oversized" />
            <Readout label="range" value="₹699 — ₹1,599" />
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

      <Marquee text="Unleash your inner devil" duration={30} />

      <Manifesto />

      {/* ── the clubs ── */}
      <section className="px-[max(1.25rem,5vw)] pb-16">
        <div className="border-line/60 mb-8 flex items-center gap-3 border-b pb-3">
          <span className="readout text-ember">CLB</span>
          <span className="bg-line/60 h-px flex-1" />
          <span className="readout text-bone-faint">
            {String(collections.length).padStart(2, "0")} clubs
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
                href={c.id === "custom" ? "/custom" : `/products#${c.id}`}
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
