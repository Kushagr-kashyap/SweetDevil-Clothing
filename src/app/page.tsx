import Hero from "@/components/Hero";
import FireHand from "@/components/FireHand";
import Marquee from "@/components/Marquee";
import Catalogue from "@/components/Catalogue";
import Manifesto from "@/components/Manifesto";
import CustomDesign from "@/components/CustomDesign";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <FireHand />
      <Marquee />
      <Catalogue />
      <Manifesto />
      <Marquee text="Limited drops" duration={24} outline />
      <CustomDesign />
      <Footer />
    </main>
  );
}
