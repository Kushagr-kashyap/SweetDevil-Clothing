import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
import { refunds } from "@/lib/policies";

export const metadata: Metadata = {
  title: `${refunds.title} — Sweet Devil`,
  description: refunds.description,
};

export default function RefundsPage() {
  return <PolicyPage doc={refunds} />;
}
