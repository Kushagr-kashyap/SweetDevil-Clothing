import type { Metadata } from "next";
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
  const shopCount = products.length;

  return (
    <main>
      <PageHeader
        code="CAT"
        meta={`${String(shopCount).padStart(2, "0")} styles in stock`}
        lines={["All", "Products"]}
        blurb="Every tee we print. Oversized and boxy fits, heavyweight cotton, small runs. Nothing here gets restocked once it's gone."
      />

      <Marquee text="Never restocked" duration={26} outline />

      <Catalogue />

      <Footer />
    </main>
  );
}
