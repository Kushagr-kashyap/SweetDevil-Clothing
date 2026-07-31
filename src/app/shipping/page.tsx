import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
import { shipping } from "@/lib/policies";

export const metadata: Metadata = {
  title: `${shipping.title} — Sweet Devil`,
  description: shipping.description,
};

export default function ShippingPage() {
  return <PolicyPage doc={shipping} />;
}
