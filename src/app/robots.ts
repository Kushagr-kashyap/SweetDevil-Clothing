import type { MetadataRoute } from "next";

/**
 * Crawl rules, and the pointer to the sitemap.
 *
 * /admin is disallowed because it lists customer names, phone numbers and home
 * addresses. The page already sets `robots: { index: false }` and sits behind a
 * password, so this is the third lock on the same door — cheap, and the cost of
 * the other two failing is a customer's address in a search result.
 *
 * /cart, /checkout and /order/* are disallowed because they are per-visitor and
 * there is nothing in them to rank. An order page is reachable by its id alone,
 * which makes the id the capability to view that order; crawling one would put
 * a stranger's order into an index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/cart", "/checkout", "/order/"],
    },
    sitemap: "https://sweetdevil.in/sitemap.xml",
  };
}
