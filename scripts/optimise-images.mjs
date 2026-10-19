/**
 * Pre-render every public image to WebP at a fixed ladder of widths.
 *
 * WHY THIS EXISTS. next/image normally resizes on demand, but this site runs
 * on Cloudflare Workers through OpenNext, and that runtime has no image
 * optimiser — /_next/image answers 200 and hands back the ORIGINAL bytes,
 * same length, same content-type. Measured on the live site: a 2.61 MB PNG in,
 * 2,737,944 bytes out, unchanged. One visit to /products pulled 68.5 MB, which
 * is about 55 seconds on good Indian 4G and four and a half minutes on weak.
 *
 * Cloudflare sells the fix (Images, or Polish on a Pro plan). This project has
 * to stay free, so the resizing happens here at build time instead and the
 * results ship as ordinary static assets that Workers Assets serves for nothing.
 *
 * src/lib/image-loader.ts points next/image at what this writes. The two must
 * agree on WIDTHS and on the output path, so they are the only two files to
 * touch if the ladder changes.
 */
import { readdir, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

/** Must stay in step with WIDTHS in src/lib/image-loader.ts. */
const WIDTHS = [384, 640, 828, 1080, 1920];
const QUALITY = 82;

const ROOTS = ["public/products", "public/brand"];
let made = 0, skipped = 0, before = 0, after = 0;

for (const root of ROOTS) {
  if (!existsSync(root)) continue;
  const outDir = path.join(root, "opt");
  await mkdir(outDir, { recursive: true });

  for (const file of await readdir(root)) {
    if (!/\.(png|jpe?g)$/i.test(file)) continue;
    const src = path.join(root, file);
    const base = file.replace(/\.(png|jpe?g)$/i, "");
    const srcStat = await stat(src);
    before += srcStat.size;

    for (const w of WIDTHS) {
      const out = path.join(outDir, `${base}-${w}.webp`);
      // Rebuild only when the source is newer: a full run is slow and most
      // deploys change one or two pictures.
      if (existsSync(out) && (await stat(out)).mtimeMs >= srcStat.mtimeMs) {
        after += (await stat(out)).size; skipped++; continue;
      }
      await sharp(src)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(out);
      after += (await stat(out)).size; made++;
    }
  }
}

const mb = (n) => (n / 1048576).toFixed(1);
console.log(`images: wrote ${made}, reused ${skipped}`);
console.log(`originals ${mb(before)} MB -> all variants ${mb(after)} MB`);
