import type { Metadata } from "next";
import Link from "next/link";
import Catalogue from "@/components/Catalogue";
import Marquee from "@/components/Marquee";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/hud";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "All Products — Sweet Devil",
  description:
    "Every Sweet Devil tee in one place: Devil's Club comic covers and the Minimalist wordmark line. Oversized and boxy fits, heavyweight cotton, made in India.",
};

export default function ProductsPage() {
  const shopCount = products.filter((p) => p.collection !== "custom").length;

  return (
    <main>
      <PageHeader
        code="CAT"
        meta={`${String(shopCount).padStart(2, "0")} styles in stock`}
        lines={["All", "Products"]}
        blurb="Every tee we print. Oversized and boxy fits, heavyweight cotton, small runs. Nothing here gets restocked once it's gone."
      />

      <Marquee text="Limited drops" duration={26} outline />

      <Catalogue />

      {/* ── hand-off to the commission flow ── */}
      <section className="px-[max(1.25rem,5vw)] pb-16 pt-4">
        <Link
          href="/custom"
          className="chassis cut-4 group block p-6 md:p-10"
          style={{ ["--cut" as string]: "20px" }}
        >
          <span className="readout text-ember">CST — made to order</span>
          <span className="display text-bone mt-3 block text-[length:var(--step-2)]">
            Nothing here feels like you?
          </span>
          <span className="text-bone-dim prose-body mt-3 block text-[0.95rem]">
            Send us the idea instead. Our team draws 2–3 concepts, you pick one,
            and we print it once — front, back, or both.
          </span>
          <span className="label text-bone group-hover:text-ember mt-4 inline-flex min-h-11 items-center gap-2 transition-colors">
            Start a custom design
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </Link>
      </section>

      <Footer />
    </main>
  );
}
