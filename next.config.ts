import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* Product photography is self-hosted in public/products/ — no remote hosts. */
};

/**
 * Makes Cloudflare bindings (KV, D1, secrets) available inside `next dev`.
 * Without it, anything reading `getCloudflareContext()` works in production but
 * throws locally — which is exactly the kind of gap that only shows up once
 * Razorpay keys are being read at request time.
 */
initOpenNextCloudflareForDev();

export default nextConfig;
