/**
 * Where next/image fetches from on this site.
 *
 * Cloudflare Workers, which is what OpenNext deploys us onto, has no image
 * optimiser. /_next/image does not fail — it answers 200 and hands back the
 * original file untouched, which is worse, because nothing looks broken.
 * Measured against the live deploy of 2026-10-19: fearless.png asked for at
 * w=640 returned 2,737,944 bytes of image/png, the entire 2.61 MB original.
 *
 * Cloudflare will resize properly for money. This site has to cost nothing,
 * so scripts/optimise-images.mjs writes a WebP ladder at build time and this
 * loader points at it instead.
 *
 * Anything without a prepared variant falls through unchanged, so a new image
 * dropped into public/ is merely unoptimised rather than broken.
 */

/** Must stay in step with WIDTHS in scripts/optimise-images.mjs. */
const WIDTHS = [384, 640, 828, 1080, 1920] as const;

/** The folders that build script walks. */
const OPTIMISED = ["/products/", "/brand/"] as const;

export default function cloudflareImageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Remote images, and anything that is already a variant, are not ours.
  if (!src.startsWith("/") || src.includes("/opt/")) return src;

  const dir = OPTIMISED.find((d) => src.startsWith(d));
  const ext = /\.(png|jpe?g)$/i.exec(src);
  if (!dir || !ext) return src;

  // Round UP to the next prepared width, so a card is never blown up from a
  // smaller file; past the top of the ladder, serve the largest one made.
  const w = WIDTHS.find((candidate) => candidate >= width) ?? WIDTHS[WIDTHS.length - 1];

  const base = src.slice(0, -ext[0].length);
  return `${base.replace(dir, `${dir}opt/`)}-${w}.webp`;
}
