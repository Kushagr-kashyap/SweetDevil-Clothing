import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Cloudflare Workers build config for OpenNext.
 *
 * Deliberately bare. Every route is static or SSG today, so there is nothing
 * to cache at the edge beyond what Workers Assets already serves. When the
 * Razorpay routes land they'll be dynamic-by-request (order creation, signature
 * verification) and must NOT be cached — so an incremental cache only becomes
 * worth configuring if we later add ISR.
 */
export default defineCloudflareConfig();
