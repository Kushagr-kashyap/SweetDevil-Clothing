import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClearPaidLines from "@/components/ClearPaidLines";
import Footer from "@/components/Footer";
import { PageHeader, Readout } from "@/components/hud";
import { getOrderById, parseItems } from "@/lib/orders";
import { formatPaise } from "@/lib/pricing";
import { CONTACT, POLICIES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Order confirmed — Sweet Devil",
  // Order pages are reachable by id; keep them out of search results entirely.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Order confirmation.
 *
 * Shows the order number, what was bought and what was paid — deliberately NOT
 * the delivery address, phone or email. The id in the URL is the only thing
 * guarding this page, so it shows enough to reassure the buyer and nothing that
 * would matter if the link were forwarded or ended up in someone's history.
 */
export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const items = parseItems(order);
  const paid = order.status === "paid";

  return (
    <main>
      {/* A redirect payment brings the customer back here without checkout's
          success handler ever running, so this is the only place the cart gets
          emptied on the UPI path. */}
      {paid && (
        <ClearPaidLines
          lines={items.map(({ slug, size, fit, note }) => ({
            slug,
            size,
            fit,
            note,
          }))}
          rewardCode={order.reward_code}
        />
      )}

      <PageHeader
        code="ORD"
        meta={order.id}
        lines={paid ? ["Order", "confirmed"] : ["Order", "pending"]}
        blurb={
          paid
            ? "Payment received. We've got it from here — you'll get a shipping confirmation with tracking once it leaves us."
            : "We haven't received payment for this order yet. If you were charged, contact us and we'll sort it out straight away."
        }
      />

      {/* The note. Shown only on a paid order — putting a thank-you above an
          unpaid one reads as a store that doesn't know whether it got the
          money. This is the moment a customer is most likely to screenshot, so
          it's written to be worth screenshotting. */}
      {paid && (
        <section className="px-[max(1.25rem,5vw)] pb-8">
          <div
            className="chassis chassis-hot cut-4 relative overflow-hidden p-6 md:p-9"
            style={{ ["--cut" as string]: "22px" }}
          >
            <span
              aria-hidden
              className="bloom pointer-events-none absolute -right-10 -top-16 h-56 w-56 opacity-40"
            />
            <div className="relative">
              <p className="readout text-ember">transmission received</p>
              <p className="display text-bone mt-2 text-[length:var(--step-2)] leading-[0.95]">
                Welcome to
                <br />
                the club
              </p>
              <div className="text-bone-dim prose-body mt-4 max-w-[54ch] space-y-3 text-[0.98rem]">
                <p>
                  You just bought something most people wouldn&apos;t wear. That
                  was always the point.
                </p>
                <p>
                  It gets printed, packed by hand, and sent your way. When it
                  lands it&apos;s properly yours — small run, no restock, and
                  you won&apos;t be passing someone in the same one.
                </p>
                <p className="text-bone">
                  Thank you, genuinely. Brands like this run on the people who
                  go first. Wear it loud.
                </p>
              </div>
              <p className="readout text-bone-faint mt-5">
                — the two idiots who started sweet devil
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="px-[max(1.25rem,5vw)] pb-16">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
          <div
            className="chassis cut-4 p-5 md:p-7"
            style={{
              ["--cut" as string]: "20px",
              ["--chassis-fill" as string]: "var(--color-void-deep)",
            }}
          >
            <div className="border-line/60 mb-4 flex items-center gap-3 border-b pb-3">
              <span
                className={`block h-1.5 w-1.5 rounded-full ${paid ? "bg-ember animate-led" : "bg-bone-faint"}`}
              />
              <span className="readout text-ember">{paid ? "paid" : "pending"}</span>
              <span className="bg-line/60 h-px flex-1" />
              <span className="readout text-bone-faint">
                {String(items.length).padStart(2, "0")} items
              </span>
            </div>

            <ul className="space-y-3">
              {items.map((l, i) => (
                <li
                  key={`${l.slug}-${i}`}
                  className="border-line/60 flex items-baseline justify-between gap-3 border-b pb-3"
                >
                  <span className="min-w-0">
                    <span className="text-bone block text-[0.95rem]">{l.name}</span>
                    <span className="readout text-bone-faint">
                      {[l.fit, l.size].filter(Boolean).join(" · ")} × {l.qty}
                    </span>
                    {l.note && (
                      <span className="text-bone-faint mt-1 block text-[0.85rem] italic">
                        “{l.note}”
                      </span>
                    )}
                  </span>
                  <span className="text-bone-dim shrink-0 text-[0.9rem]">
                    {formatPaise(l.linePaise)}
                  </span>
                </li>
              ))}
            </ul>

            {order.discount_paise > 0 && (
              <div className="border-line/60 flex items-baseline justify-between gap-3 border-t py-2.5">
                <span className="min-w-0">
                  <span className="readout text-ember block">devil&apos;s aim discount</span>
                  {order.reward_code && (
                    <span className="readout text-bone-faint mt-0.5 block">
                      {order.reward_code}
                    </span>
                  )}
                </span>
                <span className="text-ember shrink-0 font-semibold">
                  −{formatPaise(order.discount_paise)}
                </span>
              </div>
            )}

            <div className="flex items-baseline justify-between py-4">
              <span className="label text-bone">
                {paid ? "Paid" : "Total"}
              </span>
              <span className="display text-bone text-2xl">
                {formatPaise(order.amount_paise)}
              </span>
            </div>

            {order.test_mode === 1 && (
              <p className="readout text-flare leading-relaxed">
                test order — no real money was taken
              </p>
            )}
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div
              className="chassis cut-4 p-5 md:p-6"
              style={{ ["--cut" as string]: "18px" }}
            >
              <p className="readout text-bone-faint border-line/60 mb-2 border-b pb-3">
                What happens now
              </p>
              <Readout label="order" value={order.id} />
              <Readout label="status" value={order.status} hot={paid} />
              <Readout label="shipping" value="free, all india" />
              <Readout label="delivery" value="3–7 business days" />

              <p className="text-bone-dim prose-body mt-5 text-[0.92rem]">
                {POLICIES.shipping.split(". ")[0]}. We&apos;ll email tracking as
                soon as it ships.
              </p>

              <p className="text-bone-faint prose-body mt-4 text-[0.88rem]">
                Keep your order number. Any questions, quote it to us at{" "}
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="text-bone-dim hover:text-ember underline transition-colors"
                >
                  {CONTACT.email}
                </a>
                .
              </p>

              <Link
                href="/products"
                className="cut bg-bone text-void label mt-6 flex items-center justify-center gap-2 py-3.5"
                style={{ ["--cut" as string]: "12px" }}
              >
                Keep shopping <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
