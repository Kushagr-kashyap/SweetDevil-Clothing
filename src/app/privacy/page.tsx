import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
import { privacy } from "@/lib/policies";

export const metadata: Metadata = {
  title: `${privacy.title} — Sweet Devil`,
  description: privacy.description,
};

export default function PrivacyPage() {
  return <PolicyPage doc={privacy} />;
}
