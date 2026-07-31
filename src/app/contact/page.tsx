import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { PageHeader } from "@/components/hud";
import { CONTACT, phoneDisplay, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us — Sweet Devil",
  description: `Questions about an order or a product? Email ${CONTACT.email} or call us. We reply ${CONTACT.responseTime}.`,
};

const CHANNELS = [
  {
    code: "EML",
    label: "Email",
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
    // An address is machine text, and uppercase display type is too wide to fit
    // 26 characters on a 375px phone without breaking mid-word.
    valueClass: "font-mono text-[0.92rem] tracking-tight",
    note: "Best for order issues — attach your order number.",
  },
  {
    code: "TEL",
    label: "Phone",
    value: phoneDisplay(CONTACT.phones[0]),
    href: telHref(CONTACT.phones[0]),
    valueClass: "display text-[1.15rem]",
    // Reads off however many numbers are listed rather than assuming a second
    // one exists — `phones[1]` printed "Also on undefined." the moment the
    // store dropped to a single line.
    note:
      CONTACT.phones.length > 1
        ? `Also on ${CONTACT.phones.slice(1).map(phoneDisplay).join(" and ")}.`
        : "Call or WhatsApp — fastest for anything urgent.",
  },
  {
    code: "IGM",
    label: "Instagram",
    value: "@sweetdevil.in",
    href: CONTACT.instagram,
    valueClass: "display text-[1.15rem]",
    note: "Drops land here first. DMs are open.",
  },
];

export default function ContactPage() {
  return (
    <main>
      <PageHeader
        code="CTC"
        meta={CONTACT.responseTimeShort}
        lines={["Contact", "Us"]}
        blurb="Question about a product? Need help with an order? Reach us however you like — we answer all of them, usually the same day."
      />

      {/* ── channels ── */}
      <section className="px-[max(1.25rem,5vw)] pb-12">
        <ul className="grid gap-3 md:grid-cols-3">
          {CHANNELS.map((c, i) => (
            <Reveal as="li" key={c.code} delay={i * 70}>
              <a
                href={c.href}
                {...(c.code === "IGM"
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
                className="chassis cut group flex h-full flex-col p-5 transition-colors"
                style={{ ["--cut" as string]: "14px" }}
              >
                <span className="border-line/60 flex items-center gap-3 border-b pb-2">
                  <span className="readout text-ember">{c.code}</span>
                  <span className="bg-line/60 h-px flex-1" />
                  <span className="readout text-bone-faint">{c.label}</span>
                </span>
                <span
                  className={`text-bone group-hover:text-ember mt-3 block break-words leading-tight transition-colors ${c.valueClass}`}
                >
                  {c.value}
                </span>
                <span className="text-bone-dim mt-2 block text-[0.9rem]">
                  {c.note}
                </span>
              </a>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ── form + address ── */}
      <section className="px-[max(1.25rem,5vw)] pb-16">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
          <Reveal>
            <ContactForm />
          </Reveal>

          <Reveal delay={120} className="self-start">
            <div
              className="chassis cut-4 p-5 md:p-6"
              style={{ ["--cut" as string]: "18px" }}
            >
              <div className="border-line/60 mb-4 flex items-center gap-3 border-b pb-3">
                <span className="readout text-ember">LOC</span>
                <span className="bg-line/60 h-px flex-1" />
                <span className="readout text-bone-faint">studio</span>
              </div>
              <address className="text-bone-dim not-italic text-[0.95rem] leading-relaxed">
                {CONTACT.address}
              </address>

              <div className="border-line/60 mt-5 border-t pt-4">
                <p className="readout text-bone-faint mb-2">Response time</p>
                <p className="text-bone text-[0.95rem]">
                  We reply {CONTACT.responseTime}.
                </p>
              </div>

              <div className="border-line/60 mt-5 border-t pt-4">
                <p className="readout text-bone-faint mb-2">Call us</p>
                <ul className="space-y-1.5">
                  {CONTACT.phones.map((p) => (
                    <li key={p}>
                      <a
                        href={telHref(p)}
                        className="text-bone-dim hover:text-ember flex min-h-11 items-center text-[0.95rem] transition-colors"
                      >
                        {phoneDisplay(p)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
