import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Black, Azeret_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Chassis from "@/components/Chassis";

// Heavy industrial grotesque — equipment labelling, not fashion-editorial.
const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

// Reserved for text a machine would actually print: SKUs, counts, telemetry.
const azeret = Azeret_Mono({
  variable: "--font-azeret",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

/**
 * Arcade bitmap face, for the game heading and nothing else.
 *
 * The game strip sits between two product sections and was reading as more
 * merchandising; a font nobody uses for selling t-shirts is the fastest way to
 * signal "this is a game". Self-hosted at build time like the others, so it
 * costs no third-party request. Keep it off the rest of the site — its value
 * is entirely in being the exception.
 */
const pressStart = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sweetdevil.in"),
  title: "Sweet Devil — Unleash your inner devil",
  description:
    "Oversized graphic tees for the ones who run a little hotter. Devil's Club, Brainrot Club, limited drops and one-off custom designs. Made in India.",
  openGraph: {
    title: "Sweet Devil — Unleash your inner devil",
    description:
      "Oversized graphic tees for the ones who run a little hotter. Limited drops, loud designs.",
    type: "website",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a0d0b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${archivo.variable} ${azeret.variable} ${pressStart.variable}`}
    >
      {/* no bg-* utility here — it would paint over the .page-heat layer */}
      <body className="grain scanlines text-bone min-h-screen">
        {/* site-wide red heat wash, behind everything */}
        <div className="page-heat" aria-hidden />
        {/* Chassis must sit *inside* SmoothScroll — it calls useLenis(), which
            reads context from ReactLenis. Outside it, menu scroll-lock is a
            silent no-op. */}
        <SmoothScroll>
          <Chassis />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
