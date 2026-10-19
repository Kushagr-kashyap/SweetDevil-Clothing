import type { MetadataRoute } from "next";
import { browsableGroups, products } from "@/lib/products";

/**
 * Every page worth indexing, built from the catalogue rather than listed.
 *
 * WHY THIS EXISTS. On 2026-10-19 a search for the shop returned a Google
 * result describing "Devil's Club, Brainrot Club, limited drops and one-off
 * custom designs" and a cached page selling Killswitch Engage, Satan's Child
 * and Weed Demon at ₹699 — a catalogue retired in September. Google was
 * advertising stock that no longer exists. Without a sitemap it recrawls on
 * its own schedule, which for a site this young is months.
 *
 * Generated, not hand-written, so the next range change is picked up by
 * deploying rather than by somebody remembering this file.
 *
 * `lastmod` is the deploy time. It is honest at the level that matters — these
 * pages are rebuilt on every deploy — and it is what tells a crawler the old
 * copy it holds is stale.
 *
 * NOTE: a sitemap only helps once a crawler reads it. robots.ts points at it,
 * which is passive; submitting it in Google Search Console is what actually
 * triggers a recrawl, and only the owner can do that. Google retired its
 * sitemap ping endpoint in 2023, so there is no way to trigger it from code.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://sweetdevil.in";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/products`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    /* Razorpay requires these to be publicly reachable, and a buyer deciding
       whether to risk a prepaid order reads them. Low priority, still indexed. */
    { url: `${base}/shipping`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/refunds`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  /* Only groups holding stock exist as pages, so this never lists a 404. */
  const groups: MetadataRoute.Sitemap = browsableGroups().map((g) => ({
    url: `${base}/collections/${g.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  /* The ones that actually earn a search: nobody else sells "Chandni Chowk"
     or "Planchette" as a tee, so these are the pages that can rank. */
  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...groups, ...productPages];
}
