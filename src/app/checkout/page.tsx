import type { Metadata } from "next";
import Link from "next/link";
import CheckoutForm from "@/components/CheckoutForm";
import Footer from "@/components/Footer";
import { PageHeader, Readout } from "@/components/hud";
import { isConfigured, isTestMode } from "@/lib/razorpay";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Checkout — Sweet Devil",
  robots: { index: false },
};

/**
 * Reads Razorpay's configuration from the environment, which only exists at
 * request time on Workers — so this page can't be prerendered.
 */
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const live = isConfigured();

  return (
    <main>
      <PageHeader
        code="PAY"
        meta={live ? "secure checkout" : "opening soon"}
        lines={live ? ["Checkout"] : ["Checkout", "is next"]}
        blurb={
          live
            ? "Delivery details, then payment. Card, UPI, netbanking and wallets — handled by Razorpay, so your card details never touch our servers."
            : "Payments aren't switched on yet. Everything else works — browse, pick your size, build a cart. Card and UPI go live shortly."
        }
      />

      {live ? (
        <>
          {isTestMode() && (
            <div className="px-[max(1.25rem,5vw)] pb-6">
              {/* Loud on purpose. Shipping with test keys means customers see
                  "payment successful" and no money ever arrives. */}
              <div
                className="chassis chassis-hot cut flex flex-wrap items-center gap-x-3 gap-y-1 p-4"
                style={{ ["--cut" as string]: "12px" }}
              >
                <span className="readout text-ember">test mode</span>
                <span className="text-bone-dim text-[0.9rem]">
                  No real money moves. Payments are simulated.
                </span>
              </div>
            </div>
          )}
          <CheckoutForm />
        </>
      ) : (
        <section className="px-[max(1.25rem,5vw)] pb-16">
          <div
            className="chassis cut-4 p-5 md:p-8"
            style={{
              ["--cut" as string]: "20px",
              ["--chassis-fill" as string]: "var(--color-void-deep)",
            }}
          >
            <div className="border-line/60 mb-4 flex items-center gap-3 border-b pb-3">
              <span className="bg-ember animate-led block h-1.5 w-1.5 rounded-full" />
              <span className="readout text-ember">status</span>
              <span className="bg-line/60 h-px flex-1" />
            </div>

            <Readout label="cart" value="working" />
            <Readout label="payments" value="coming soon" hot />
            <Readout label="shipping" value="free, all india" />
            <Readout label="returns" value="3 days" />

            <p className="text-bone-dim prose-body mt-6 text-[0.95rem]">
              Want something from the drop before payments open? Message us and
              we&apos;ll sort it out directly.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={CONTACT.instagram}
                target="_blank"
                rel="noreferrer"
                className="cut bg-bone text-void label inline-flex min-h-11 items-center gap-2 px-5"
                style={{ ["--cut" as string]: "12px" }}
              >
                DM on Instagram <span aria-hidden>↗</span>
              </a>
              <a
                href={`mailto:${CONTACT.email}`}
                className="chassis cut label text-bone-dim hover:text-bone inline-flex min-h-11 items-center px-5 transition-colors"
                style={{ ["--cut" as string]: "12px" }}
              >
                Email us
              </a>
            </div>

            <Link
              href="/cart"
              className="text-bone-dim hover:text-ember mt-6 inline-flex min-h-11 items-center text-[0.9rem] transition-colors"
            >
              ← Back to cart
            </Link>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
