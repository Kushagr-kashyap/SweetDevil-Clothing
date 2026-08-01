import { CONTACT, POLICIES, phoneDisplay } from "./site";

/**
 * The four policy documents Razorpay requires publicly visible before it will
 * activate a merchant account (Terms, Privacy, Refunds, Shipping).
 *
 * TWO RULES FOR EDITING THIS FILE:
 *
 * 1. The shipping and returns commitments are NOT written here. They are pulled
 *    verbatim from `POLICIES` in site.ts, which was transcribed off the live
 *    store. Two copies of a refund window is how a store ends up promising 3
 *    days on one page and 7 on another — which is a consumer-law problem, not a
 *    typo. Change site.ts, and both the product pages and these pages follow.
 *
 * 2. Nothing here asserts a fact about the business that wasn't already known.
 *    No registered entity type, no GSTIN, no CIN, no invented retention periods,
 *    no return exclusions nobody agreed to. Where a commitment would have to be
 *    invented, the clause is written conditionally ("if", "when") so it stays
 *    true either way. Add real details only from the source, never from memory.
 */

/** Shown on every document. Bump when the wording materially changes. */
export const POLICY_UPDATED = "30 July 2026";

export type PolicySection = {
  heading: string;
  /** One string per paragraph. */
  body?: string[];
  /** Rendered as a list after the paragraphs. */
  list?: string[];
};

export type PolicyDoc = {
  slug: string;
  /** HUD code in the masthead, matching the rest of the site. */
  code: string;
  title: string;
  /** Masthead lines — each one glitches separately. */
  lines: string[];
  blurb: string;
  description: string;
  sections: PolicySection[];
};

const ADDRESS = CONTACT.address;
const PHONES = CONTACT.phones.map(phoneDisplay).join(" · ");

/** The returns text is three paragraphs; shipping is one. Split, don't retype. */
const RETURNS_PARAS = POLICIES.returns.split("\n\n").map((p) => p.trim());
const SHIPPING_PARAS = POLICIES.shipping.split("\n\n").map((p) => p.trim());

const reachUs: PolicySection = {
  heading: "Reaching a human",
  body: [
    `Sweet Devil, ${ADDRESS}. Email ${CONTACT.email} or call ${PHONES}. We reply ${CONTACT.responseTime}.`,
  ],
};

/* ── Terms ─────────────────────────────────────────────────────────────── */

const terms: PolicyDoc = {
  slug: "terms",
  code: "TRM",
  title: "Terms & Conditions",
  lines: ["Terms &", "conditions"],
  blurb:
    "The rules for buying from Sweet Devil. Written to be read, not to be skipped.",
  description:
    "Terms and conditions for shopping with Sweet Devil — orders, pricing, custom designs, intellectual property and governing law.",
  sections: [
    {
      heading: "Who you're dealing with",
      body: [
        `This site is operated by Sweet Devil, based at ${ADDRESS}. Throughout this document "we", "us" and "our" mean Sweet Devil, and "you" means you, the person using the site or placing an order.`,
        "By browsing this site or placing an order you accept these terms. If you don't accept them, please don't order.",
      ],
    },
    {
      heading: "Using the site",
      body: [
        "You may use this site to browse our products and place orders for your own personal use. You may not use it to break the law, to interfere with how the site runs, or to scrape, copy or resell our content.",
        "You need to be able to enter a binding contract to order. If you're under 18, order through a parent or guardian.",
      ],
    },
    {
      heading: "Our products",
      body: [
        // Deliberately does NOT state a fabric, weight or size range. The range
        // is expanding past 220 GSM tees into bottoms, hoodies, shirts and
        // waffle knit, and a legal document that hard-codes "220 GSM, round
        // neck, XS to XXXL" becomes a false statement the day the first pair of
        // bottoms goes live. Per-product specs belong on the product page.
        "We make graphic apparel in small runs. Fabric, weight, fit and the sizes available differ by product — the specification for each piece is listed on its own product page, and that listing is what applies to your order.",
        "We photograph our products as accurately as we can, but screens differ. Slight variation in colour, print placement and finish between the photo and the garment is normal for printed apparel and isn't a fault.",
        "Limited runs are limited on purpose. When a design sells out we're under no obligation to reprint it.",
      ],
    },
    {
      heading: "Prices and payment",
      body: [
        "All prices are in Indian Rupees (₹) and shown on the product page. Shipping is free across India, so the price you see is the price you pay.",
        "We can change prices at any time, but never on an order we've already accepted. If a product is listed at an obviously wrong price because of a technical or human error, we may cancel the order and refund you in full rather than honour it.",
        "Payments are processed by our payment provider. We never see or store your full card details — see our Privacy Policy for what we do and don't hold.",
      ],
    },
    {
      heading: "Orders and acceptance",
      body: [
        "Placing an order is an offer to buy. The contract forms when we confirm your order. Until then we may decline or cancel it — for example if the item is out of stock, we can't verify your details, we can't deliver to your address, or we suspect fraud.",
        "If we cancel an order you've already paid for, you get a full refund. That's the whole of our liability in that situation.",
      ],
    },
    {
      heading: "Custom designs",
      body: [
        "For custom orders you send us the idea and our team draws it. By submitting artwork, text or a reference you confirm you have the right to use it and that it doesn't infringe anyone else's copyright, trademark or other rights.",
        "We can refuse any custom request without giving a reason — including anything hateful, defamatory, or infringing someone else's work. If we refuse before production, you're refunded in full.",
        "Custom pieces are made to your brief and printed once. Because they can't be resold, they are not eligible for return or refund once production has started — check your proof carefully before approving it. If a custom piece arrives faulty or doesn't match the proof you approved, that's on us and we'll put it right. See the Refund & Cancellation Policy.",
      ],
    },
    {
      heading: "Returns and delivery",
      body: [
        "Returns are covered by our Refund & Cancellation Policy, and delivery by our Shipping Policy. Both form part of these terms.",
      ],
    },
    {
      heading: "Our designs belong to us",
      body: [
        "The artwork, graphics, photography, wordmark and written content on this site are ours and are protected by copyright and trade mark law. Buying a t-shirt buys you the t-shirt — not the right to reproduce, resell or print the design.",
      ],
    },
    {
      heading: "What we're responsible for",
      body: [
        "We'll do our best to keep the site available and accurate, but we don't promise it will be uninterrupted or error-free.",
        "Nothing in these terms limits your rights under Indian consumer law, and nothing excludes our liability for fraud, or for death or personal injury caused by our negligence. Subject to that, our total liability for any order is limited to the amount you paid for it.",
        "We're not liable for delays caused by things outside our reasonable control — courier disruption, natural events, strikes, or government action.",
      ],
    },
    {
      heading: "Changes to these terms",
      body: [
        "We may update these terms as the business changes. The version published here when you place your order is the version that applies to that order.",
      ],
    },
    {
      heading: "Governing law",
      body: [
        "These terms are governed by the laws of India, and the courts of New Delhi have jurisdiction over any dispute.",
      ],
    },
    reachUs,
  ],
};

/* ── Privacy ───────────────────────────────────────────────────────────── */

const privacy: PolicyDoc = {
  slug: "privacy",
  code: "PRV",
  title: "Privacy Policy",
  lines: ["Privacy", "policy"],
  blurb:
    "What we collect, what we don't, and who else ever sees it. Short, because we collect very little.",
  description:
    "Sweet Devil's privacy policy — no cookies, no tracking, no analytics. What we collect when you order, and who we share it with.",
  sections: [
    {
      heading: "The short version",
      body: [
        "We don't run analytics. We don't set tracking cookies. We don't use advertising pixels, and we've never sold anyone's data. The only personal information we hold is what you give us to get an order to your door or to answer a question.",
      ],
    },
    {
      heading: "What we collect",
      body: ["We collect information in three situations, and only these:"],
      list: [
        "When you place an order — your name, delivery address, phone number and email, so we can make and deliver it.",
        "When you contact us — whatever you put in your message. Our contact and sign-up forms open your own email app, so the message reaches us as an ordinary email rather than through this website.",
        "When you visit — our host records standard server logs, including your IP address, the pages requested and your browser type. These are used to keep the site running and secure, not to profile you.",
      ],
    },
    {
      heading: "Your cart never leaves your device",
      body: [
        "The cart is stored in your own browser's local storage. It isn't sent to us and we can't see it. Clearing your browser data clears the cart, and nothing about it reaches our servers until you actually place an order.",
      ],
    },
    {
      heading: "Payments",
      body: [
        "Card and UPI payments are handled by our payment provider on their own secure systems. Your full card number, CVV and UPI PIN are never sent to us and never stored by us — we only receive confirmation that a payment succeeded or failed, along with the reference we need to match it to your order.",
        "Your payment details are handled under the payment provider's own privacy policy, which we'd encourage you to read.",
      ],
    },
    {
      heading: "Who else sees your information",
      body: ["Only the people needed to complete your order:"],
      list: [
        "Our courier — your name, address and phone number, so they can deliver and call you if they can't find the place.",
        "Our payment provider — the details needed to take the payment.",
        "Our hosting provider — which processes server logs as part of serving the site.",
        "Anyone we're legally required to disclose to, such as a court or tax authority.",
      ],
    },
    {
      heading: "Nobody else",
      body: [
        "We don't sell, rent, or trade your personal information. We don't share it with advertisers or data brokers. We don't send marketing email to people who haven't asked for it, and if you've joined our list you can leave it by replying to any email or writing to us.",
      ],
    },
    {
      heading: "How long we keep it",
      body: [
        "Order records are kept as long as we need them for accounting, tax and warranty purposes, and for as long as the law requires us to. Emails you send us are kept until they're no longer needed to help you. Server logs are kept only briefly, by our host, for security and diagnostics.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        `You can ask us what personal information we hold about you, ask us to correct it if it's wrong, or ask us to delete it where we're not required to keep it. Email ${CONTACT.email} and we'll respond ${CONTACT.responseTime}.`,
      ],
    },
    {
      heading: "Children",
      body: [
        "This site isn't aimed at children under 13 and we don't knowingly collect their information. If you believe a child has given us personal information, contact us and we'll delete it.",
      ],
    },
    {
      heading: "Security",
      body: [
        "The site is served over an encrypted connection (HTTPS), and payment details go directly to our payment provider rather than through us. No system is perfectly secure, but we keep what we hold to the minimum precisely so there's little to lose.",
      ],
    },
    {
      heading: "Changes to this policy",
      body: [
        "If we start collecting anything new — analytics, for instance — we'll update this page and change the date at the top before we switch it on.",
      ],
    },
    reachUs,
  ],
};

/* ── Refunds ───────────────────────────────────────────────────────────── */

const refunds: PolicyDoc = {
  slug: "refunds",
  code: "RFD",
  title: "Refund & Cancellation Policy",
  lines: ["Refunds &", "cancellations"],
  blurb:
    "Three days to change your mind, and a straight answer on how the money comes back.",
  description:
    "Sweet Devil's refund and cancellation policy — a 3-day return window, how to start a return, and how refunds are paid back.",
  sections: [
    {
      heading: "Returns",
      // Verbatim from the live store. See the note at the top of this file.
      body: RETURNS_PARAS,
    },
    {
      // Added on the owner's instruction, 2026-07-31. Deliberately a SEPARATE
      // section rather than an edit to the verbatim block above: the 3-day
      // promise is transcribed from the live store, and quietly rewriting it
      // would leave two different versions of the same commitment in the wild.
      //
      // The faulty/wrong-item carve-out is not optional politeness — Indian
      // consumer law applies to a custom piece exactly as it does to a stock
      // one, so an unqualified "no returns on custom" would be unenforceable
      // and would misrepresent the customer's rights.
      heading: "What can't be returned",
      body: [
        "Custom designs are the one exception. A custom piece is drawn to your brief and printed once, for you — it can't be resold or restocked, so it isn't eligible for return or refund once production has started.",
        "Please check your proof carefully before approving it. That's the point at which a custom order becomes final.",
        "This doesn't affect your rights if something goes wrong at our end: if a custom piece arrives faulty, damaged, or not matching the proof you approved, we'll put it right at our own cost, exactly as with anything else we sell.",
      ],
    },
    {
      heading: "Cancelling an order",
      body: [
        "If your order hasn't been dispatched yet, contact us and we'll cancel it and refund you in full.",
        "Once it's with the courier we can't recall it, but you can still return it under the policy above once it reaches you.",
      ],
    },
    {
      heading: "If something arrives damaged or wrong",
      body: [
        "Contact us with a photo as soon as you notice. If we sent the wrong item, or it arrived damaged or faulty, we'll put it right at our own cost — that's on us, not you, and it doesn't come out of your return window.",
      ],
    },
    {
      heading: "How refunds are paid",
      body: [
        "Approved refunds go back to the original payment method. We don't refund to a different card, account or wallet — that's a payment-industry rule, not ours.",
        "Once we've initiated the refund, how quickly it lands depends on your bank or card issuer rather than on us.",
      ],
    },
    {
      heading: "Starting a return",
      body: [
        `Email ${CONTACT.email} or call ${PHONES} with your order number and what's wrong. Please contact us before sending anything back, so we can tell you where to send it.`,
      ],
    },
    reachUs,
  ],
};

/* ── Shipping ──────────────────────────────────────────────────────────── */

const shipping: PolicyDoc = {
  slug: "shipping",
  code: "SHP",
  title: "Shipping Policy",
  lines: ["Shipping", "policy"],
  blurb: "Free across India. Here's how long it takes and how to track it.",
  description:
    "Sweet Devil's shipping policy — free delivery across India, 1–3 business days to process and 3–7 to deliver, with tracking.",
  sections: [
    {
      heading: "Processing and delivery",
      // Verbatim from the live store. See the note at the top of this file.
      body: SHIPPING_PARAS,
    },
    {
      heading: "What shipping costs",
      body: [
        "Nothing. Shipping is free across India, and the price on the product page is the full price you pay at checkout.",
      ],
    },
    {
      heading: "Tracking your order",
      body: [
        "You'll get a shipping confirmation with tracking once your order leaves us. Tracking can take a day to start updating after you receive it — that's the courier's system catching up, not a lost parcel.",
      ],
    },
    {
      heading: "Getting the address right",
      body: [
        "Please double-check your address and phone number before paying. We ship to the address you give us, and we can't redirect a parcel once it's with the courier.",
        "If a delivery fails because the address was wrong or nobody was reachable, the parcel comes back to us. We'll contact you to arrange resending it.",
      ],
    },
    {
      heading: "Delays outside our control",
      body: [
        "The delivery estimate above is what we've consistently seen, not a guarantee. Weather, festivals, strikes and courier backlogs can add time. If your order is running clearly late, contact us and we'll chase it with the courier.",
      ],
    },
    reachUs,
  ],
};

export const POLICY_DOCS = [terms, privacy, refunds, shipping] as const;

/** Footer and cross-links iterate this so a new document can't be orphaned. */
export const POLICY_LINKS = POLICY_DOCS.map((d) => ({
  href: `/${d.slug}`,
  label: d.title,
}));

export { terms, privacy, refunds, shipping };
