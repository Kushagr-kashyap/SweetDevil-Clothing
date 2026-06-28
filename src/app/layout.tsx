import type { Metadata } from "next";
import { Anton, Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sweet Devil — Unleash Your Inner Devil",
  description:
    "Sweet Devil is an edgy graphic-tee label for the ones who run a little hotter. Devil's Club, Brainrot Club & limited drops.",
  openGraph: {
    title: "Sweet Devil — Unleash Your Inner Devil",
    description:
      "Edgy graphic tees for the ones who run a little hotter. Limited drops, loud designs.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${spaceGrotesk.variable} ${geistMono.variable} antialiased`}
    >
      <body className="grain min-h-screen bg-bg text-ink">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
