import type { Metadata } from "next";
import CartView from "@/components/CartView";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/hud";

export const metadata: Metadata = {
  title: "Cart — Sweet Devil",
  description: "Your Sweet Devil cart. Free shipping on every order.",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <main>
      <PageHeader
        code="BAG"
        meta="free shipping"
        lines={["Cart"]}
        blurb="Check the sizes before you go through — every order ships free, and returns are open for 3 days after delivery."
      />
      <CartView />
      <Footer />
    </main>
  );
}
