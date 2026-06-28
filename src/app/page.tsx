import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import ProductCarousel from "@/components/ProductCarousel";
import Collections from "@/components/Collections";
import Manifesto from "@/components/Manifesto";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <ProductCarousel />
        <Collections />
        <Manifesto />
        <Marquee text="Limited drops" duration={22} outline />
        <Footer />
      </main>
    </>
  );
}
