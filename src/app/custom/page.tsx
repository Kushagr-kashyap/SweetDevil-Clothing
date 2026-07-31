import type { Metadata } from "next";
import CustomDesign from "@/components/CustomDesign";
import Marquee from "@/components/Marquee";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/hud";

export const metadata: Metadata = {
  title: "Custom Designs — Sweet Devil",
  description:
    "Tell us your idea and our team draws 2–3 concepts for you. Approve one and we print a one-of-a-kind tee — front, back, or both. From ₹999.",
};

export default function CustomPage() {
  return (
    <main>
      <PageHeader
        code="CST"
        meta="made to order · 3 tiers"
        lines={["Custom", "Designs"]}
        blurb="Your idea, drawn by our team, printed once. Pick how much of the shirt you want to take over, send us the brief, and we'll come back with concepts."
      />

      <Marquee text="Print it once" duration={24} />

      <CustomDesign heading={false} />

      <Footer />
    </main>
  );
}
