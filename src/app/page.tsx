import Hero from "@/components/Hero";
import FireHand from "@/components/FireHand";
import Marquee from "@/components/Marquee";
import Catalogue from "@/components/Catalogue";
import Manifesto from "@/components/Manifesto";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <FireHand />
      <Marquee />
      <Catalogue />
      <Manifesto />
      <Marquee text="Never restocked" duration={24} outline />
      <Footer />
    </main>
  );
}
