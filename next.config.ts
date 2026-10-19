import type { NextConfig } from "next";
import { networkInterfaces, type NetworkInterfaceInfo } from "node:os";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/**
 * Every LAN address this machine currently answers on.
 *
 * Next blocks cross-origin requests to dev-only assets, so opening `next dev`
 * from a phone on the same Wi-Fi serves the HTML and then silently refuses
 * every `/_next/*` chunk. The page looks perfect — it is all server-rendered —
 * while nothing interactive works and any canvas stays blank. The dev server
 * logs "Blocked cross-origin request" when this happens; check there first.
 *
 * Read live rather than hardcoded, so testing on a phone survives the router
 * handing out a different IP. Dev-only — `next build` ignores this field.
 *
 * CAVEAT, found 2026-09-26: "read live" means read once, when this file is
 * loaded. Move the laptop to another network and the running dev server keeps
 * yesterday's allowlist, so the phone gets the HTML and a 403 on every
 * /_next/* chunk — the page looks perfect and nothing interactive works.
 * Editing this file makes Next reload the config, which re-runs the lookup.
 */
const lanOrigins = Object.values(networkInterfaces())
  .flat()
  .filter((n): n is NetworkInterfaceInfo => !!n && n.family === "IPv4" && !n.internal)
  .map((n) => n.address);

/**
 * The eleven graphic tees retired on 2026-09-21, when the Devil's Club drop
 * replaced the range.
 *
 * These are not arbitrary strings: they were deliberately the live Wix product
 * slugs (see the note on Product.slug), which makes them the URLs sitting in
 * every Instagram post, saved link and indexed search result from before the
 * drop. Deleting the products without this table would turn all of that into
 * 404s on the same day the new range went up.
 *
 * Source of truth is ARCHIVED_SLUGS in src/lib/products-archive.ts. It is not
 * imported here on purpose — next.config.ts is evaluated by the build before
 * any app code, and pulling a module out of src/ into it couples the config to
 * the app's import graph for no gain. If a tee comes back, delete its line here
 * and move its object back into RAW.
 */
const RETIRED_TEE_SLUGS = [
  "the-lovers",
  "killswitch-engage",
  "satan-s-child",
  "regular-fit",
  "chair",
  "reggular",
  "regular-1",
  "high-is-the-new-low",
  "professional-tweeter",
  "capybara-speaking-facts",
  "bound-2",
];

/**
 * Tunnel hostnames, for showing the dev site on a phone that is NOT on the
 * same network — a different Wi-Fi, mobile data, or a router that blocks
 * device-to-device traffic (campus and office networks usually do).
 *
 * `cloudflared tunnel --url http://localhost:3001` prints a one-off
 * https://<random>.trycloudflare.com address. Without it listed here the phone
 * gets the HTML and a 403 on every /_next/* chunk: the page looks right and
 * nothing works. Wildcards are supported, and the host is random per run, so a
 * pattern is the only thing that can be written ahead of time.
 *
 * Dev-only. `next build` ignores this field, so it cannot widen anything in
 * production.
 */
const tunnelOrigins = ["*.trycloudflare.com"];

const nextConfig: NextConfig = {
  /* Product photography is self-hosted in public/products/ — no remote hosts. */
  allowedDevOrigins: [...lanOrigins, ...tunnelOrigins],

  images: {
    /**
     * Resized at BUILD time, not on request.
     *
     * OpenNext puts this site on Cloudflare Workers, and that runtime has no
     * image optimiser. /_next/image does not fail — it answers 200 and returns
     * the original bytes, which is worse, because nothing looks broken.
     * Measured against the live deploy of 2026-10-19: asking for fearless.png
     * at w=640 returned 2,737,944 bytes of image/png, the whole 2.61 MB file.
     * One visit to /products came to 68.5 MB, about 55 seconds on decent
     * Indian 4G and four and a half minutes on weak.
     *
     * Cloudflare will do it properly for money (Images, or Polish on Pro).
     * This site has to cost nothing, so scripts/optimise-images.mjs writes a
     * WebP ladder at build time and this loader points at it. Same 37 cards:
     * 68.5 MB to 0.75 MB, 92x smaller.
     *
     * qualities is still declared because the loader ignores it but Next
     * validates the prop before the loader ever runs, and the lightbox asks
     * for 90.
     */
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    qualities: [75, 90],
  },

  /**
   * 308s, not 307s: these tees are not coming back at these URLs, and a
   * permanent redirect is what lets a search engine move the ranking across
   * rather than keep the dead URL indexed.
   *
   * Everything lands on /products rather than the home page. Someone following
   * a two-year-old link to one specific tee is shopping, not browsing — the
   * catalogue is the closest honest answer to what they asked for, and the home
   * page would make them start over.
   */
  redirects() {
    return RETIRED_TEE_SLUGS.map((slug) => ({
      source: `/products/${slug}`,
      destination: "/products",
      permanent: true,
    }));
  },
};

/**
 * Makes Cloudflare bindings (KV, D1, secrets) available inside `next dev`.
 * Without it, anything reading `getCloudflareContext()` works in production but
 * throws locally — which is exactly the kind of gap that only shows up once
 * Razorpay keys are being read at request time.
 */
initOpenNextCloudflareForDev();

export default nextConfig;
