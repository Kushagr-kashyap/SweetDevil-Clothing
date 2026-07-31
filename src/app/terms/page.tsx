import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
import { terms } from "@/lib/policies";

export const metadata: Metadata = {
  title: `${terms.title} — Sweet Devil`,
  description: terms.description,
};

export default function TermsPage() {
  return <PolicyPage doc={terms} />;
}
