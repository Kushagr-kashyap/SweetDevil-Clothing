/**
 * Real business details, transcribed from the live store's Contact and About
 * pages on 2026-07-25. Do not invent or "tidy" any of these — if something here
 * needs to change, change it at the source first and copy it across.
 */
export const CONTACT = {
  email: "sweetdevil1315@gmail.com",
  /**
   * The single contact number, confirmed by the owner on 2026-07-30. A second
   * number that appears on the old Wix contact page was retired that day — do
   * not copy it back across. (It isn't repeated here on purpose: server bundles
   * and source maps ship comments verbatim, so a retired number written into a
   * comment is still a retired number sitting in production JavaScript.)
   *
   * Kept as an array so adding one back is a data change, but nothing may index
   * positionally past [0]; see the contact page.
   */
  phones: ["7042688951"],
  address: "P Tower, DLF Capital Greens, Motinagar, New Delhi, 110015",
  instagram: "https://www.instagram.com/sweetdevil.in/",
  /** Stated on the live contact page. */
  responseTime: "within 24 hours during regular business hours",
  /** Same promise, short enough for a HUD label. */
  responseTimeShort: "replies within 24h",
} as const;

/**
 * Store policies, transcribed verbatim from the live product pages. Razorpay
 * requires these to be publicly visible before it will activate an account, and
 * they're shown on every product page.
 */
export const POLICIES = {
  shipping: `Orders placed with us are typically processed within 1–3 business days. Once processed, delivery will be done in approximately 3–7 business days. We offer free shipping. You will receive a shipping confirmation email with tracking information once your order ships.`,
  returns: `You have 3 days to return an item from the date you received it. To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.

To initiate a return, please contact our customer service team at the email address mentioned. Once we receive your item, we will inspect it and notify you that we have received your returned item. We will immediately notify you on the status of your refund after inspecting the item.

If your return is approved, we will initiate a refund to your original method of payment. You will receive the credit within a certain number of days, depending on your card issuer's policies.`,
} as const;

/** `tel:` links need the country code; the site displays the local form. */
export const telHref = (phone: string) => `tel:+91${phone}`;

export const phoneDisplay = (phone: string) =>
  `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
