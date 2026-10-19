/**
 * Transactional email via Resend — REST over fetch.
 *
 * Deliberately NOT the `resend` npm SDK, for the same reason razorpay.ts skips
 * its SDK: these run on Cloudflare Workers, and one POST does not justify
 * pulling a Node-targeted package into the bundle.
 *
 * SERVER ONLY. RESEND_API_KEY can send mail as your domain — anyone holding it
 * can send invoices that look like they came from you.
 *
 * NOTHING HERE MAY THROW. A send is called from the payment-confirmation path,
 * and an exception there would either show a paying customer an error over a
 * successful payment, or make the webhook return non-200 and have Razorpay
 * retry an event already processed. A missing email is a bad day; a failed
 * confirmation is a lost order.
 */

import "server-only";
import type { OrderRow } from "./orders";
import { parseItems } from "./orders";
import { formatPaise } from "./pricing";
import { CONTACT } from "./site";

const API = "https://api.resend.com/emails";

/**
 * Must be on the domain verified in Resend. Replies go to the address the
 * owner actually reads — nobody monitors an inbox at orders@.
 */
const FROM = "Sweet Devil <orders@sweetdevil.in>";
const SITE = "https://sweetdevil.in";

/**
 * The site palette, converted from the oklch() tokens in globals.css to hex.
 *
 * Not a second source of truth by choice — email clients don't support oklch,
 * CSS variables, or external stylesheets, so these have to be literal hex
 * inlined on every element. If globals.css changes, re-convert; the values here
 * are void / void-deep / panel / line / line-hot / bone / bone-dim /
 * bone-faint / blood / ember in that order.
 */
const C = {
  void: "#0C0605",
  voidDeep: "#040202",
  panel: "#1A0E0C",
  line: "#472E2A",
  lineHot: "#8D3A32",
  bone: "#F3EDE8",
  boneDim: "#AEA29C",
  boneFaint: "#938681",
  blood: "#920B0D",
  ember: "#FA493F",
} as const;

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY);

/** Anything interpolated into HTML is customer-controlled — a custom-design
 *  brief is free text they typed. Escape at the boundary, every time. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function send(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("email: RESEND_API_KEY is not set — not sending", {
      subject: input.subject,
    });
    return false;
  }

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [input.to],
        reply_to: CONTACT.email,
        subject: input.subject,
        html: input.html,
        // Sent alongside the HTML, not as a fallback nobody reads: a message
        // with no text part is a well-known spam signal.
        text: input.text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("email: send failed", res.status, detail);
      return false;
    }

    return true;
  } catch (err) {
    console.error("email: send threw", err);
    return false;
  }
}

/* ── order confirmation ────────────────────────────────────────────────── */

/**
 * Sent once, when an order first transitions to paid. The caller is responsible
 * for that "once": markOrderPaid() only reports true for whichever of the three
 * confirmation paths wins the race, so gate on its return value. See confirm.ts.
 */
export async function sendOrderConfirmation(order: OrderRow): Promise<boolean> {
  const items = parseItems(order);
  const orderUrl = `${SITE}/order/${order.id}`;

  const first = order.customer_name.split(" ")[0] ?? "";

  const rows = items
    .map((l) => {
      const spec = [l.fit, l.size].filter(Boolean).join(" · ");
      const note = l.note
        ? `<div style="color:${C.boneFaint};font-style:italic;font-size:13px;margin-top:6px">“${esc(l.note)}”</div>`
        : "";
      return `<tr>
  <td style="padding:14px 0;border-bottom:1px solid ${C.line};font-family:Helvetica,Arial,sans-serif">
    <div style="color:${C.bone};font-size:15px;font-weight:700">${esc(l.name)}</div>
    <div style="color:${C.boneFaint};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;margin-top:4px">${esc(spec)} × ${l.qty}</div>${note}
  </td>
  <td style="padding:14px 0;border-bottom:1px solid ${C.line};text-align:right;white-space:nowrap;color:${C.boneDim};font-size:14px;font-family:Helvetica,Arial,sans-serif">
    ${formatPaise(l.linePaise)}
  </td>
</tr>`;
    })
    .join("\n");

  const testBanner =
    order.test_mode === 1
      ? `<tr><td style="padding:0 0 20px">
           <div style="background:${C.panel};border:1px solid ${C.lineHot};padding:12px 14px;color:${C.ember};font-size:13px;letter-spacing:0.1em;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif">
             Test order — no real money was taken
           </div>
         </td></tr>`
      : "";

  // Tables with explicit bgcolor, not divs: Outlook ignores background colours
  // on block elements, and a dark design that loses its background renders as
  // near-white text on white.
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:${C.void};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.void}" style="background:${C.void};padding:24px 12px">
<tr><td align="center">

  <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.voidDeep}" style="max-width:560px;width:100%;background:${C.voidDeep};border:1px solid ${C.line}">

    <tr><td bgcolor="${C.blood}" style="background:${C.blood};padding:18px 28px;font-family:Helvetica,Arial,sans-serif">
      <div style="color:${C.bone};font-size:19px;font-weight:900;letter-spacing:0.16em">SWEET DEVIL</div>
    </td></tr>

    <tr><td style="padding:32px 28px 0;font-family:Helvetica,Arial,sans-serif">
      <div style="color:${C.ember};font-size:11px;letter-spacing:0.22em;text-transform:uppercase">ORD — ${esc(order.id)}</div>
      <div style="color:${C.bone};font-size:34px;line-height:1.02;font-weight:900;letter-spacing:-0.01em;margin-top:10px">ORDER<br>CONFIRMED</div>
      <p style="color:${C.boneDim};font-size:15px;line-height:1.65;margin:16px 0 26px">
        Payment received${first ? `, ${esc(first)}` : ""}. We've got it from here — you'll get a
        shipping confirmation with tracking once it leaves us.
      </p>
    </td></tr>

    ${testBanner ? `<tr><td style="padding:0 28px">${testBanner}</td></tr>` : ""}

    <tr><td style="padding:0 28px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rows}
        <tr>
          <td style="padding:18px 0 0;font-family:Helvetica,Arial,sans-serif;color:${C.bone};font-size:12px;letter-spacing:0.18em;text-transform:uppercase">Paid</td>
          <td style="padding:18px 0 0;text-align:right;font-family:Helvetica,Arial,sans-serif;color:${C.bone};font-size:26px;font-weight:900">${formatPaise(order.amount_paise)}</td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="padding:30px 28px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.panel}" style="background:${C.panel};border:1px solid ${C.lineHot}">
        <tr><td style="padding:24px;font-family:Helvetica,Arial,sans-serif">
          <div style="color:${C.ember};font-size:11px;letter-spacing:0.22em;text-transform:uppercase">Transmission received</div>
          <div style="color:${C.bone};font-size:24px;line-height:1.05;font-weight:900;margin-top:8px">WELCOME TO<br>THE CLUB</div>
          <p style="color:${C.boneDim};font-size:14px;line-height:1.7;margin:16px 0 0">
            You just bought something most people wouldn't wear. That was always the point.
          </p>
          <p style="color:${C.boneDim};font-size:14px;line-height:1.7;margin:12px 0 0">
            It gets printed, packed by hand, and sent your way. When it lands it's properly
            yours — small run, no restock, and you won't be passing someone in the same one.
          </p>
          <p style="color:${C.bone};font-size:14px;line-height:1.7;margin:12px 0 0">
            Thank you, genuinely. Brands like this run on the people who go first. Wear it loud.
          </p>
          <div style="color:${C.boneFaint};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;margin-top:18px">
            — the two idiots who started sweet devil
          </div>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:30px 28px 0;font-family:Helvetica,Arial,sans-serif">
      <div style="color:${C.boneFaint};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;border-bottom:1px solid ${C.line};padding-bottom:10px">Delivering to</div>
      <p style="color:${C.boneDim};font-size:14px;line-height:1.7;margin:14px 0 0">
        ${esc(order.customer_name)}<br>
        ${esc(order.address_line)}<br>
        ${esc(order.city)}, ${esc(order.state)} ${esc(order.pincode)}
      </p>
      <p style="color:${C.boneDim};font-size:14px;line-height:1.7;margin:18px 0 0">
        Processed in 1–3 business days, delivered in 3–7. Shipping is free across India.
      </p>
    </td></tr>

    <tr><td style="padding:26px 28px 0">
      <a href="${orderUrl}" style="display:block;background:${C.bone};color:${C.void};text-decoration:none;padding:15px 24px;text-align:center;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:900;letter-spacing:0.16em;text-transform:uppercase">
        View your order →
      </a>
    </td></tr>

    <tr><td style="padding:26px 28px 30px;font-family:Helvetica,Arial,sans-serif">
      <p style="color:${C.boneFaint};font-size:12px;line-height:1.7;margin:0;border-top:1px solid ${C.line};padding-top:18px">
        Keep your order number — it's how we find you. Questions? Reply to this email or
        write to <a href="mailto:${CONTACT.email}" style="color:${C.ember};text-decoration:underline">${CONTACT.email}</a>.
      </p>
    </td></tr>

  </table>

</td></tr>
</table>
</body></html>`;

  const text = [
    `SWEET DEVIL`,
    `ORD — ${order.id}`,
    ``,
    `ORDER CONFIRMED`,
    ``,
    `Payment received${first ? `, ${first}` : ""}. We've got it from here — you'll get a`,
    `shipping confirmation with tracking once it leaves us.`,
    ...(order.test_mode === 1
      ? ["", "TEST ORDER — no real money was taken."]
      : []),
    ``,
    ...items.map(
      (l) =>
        `  ${l.name} — ${[l.fit, l.size].filter(Boolean).join(" · ")} x${l.qty} — ${formatPaise(l.linePaise)}` +
        (l.note ? `\n    "${l.note}"` : ""),
    ),
    ``,
    `  PAID: ${formatPaise(order.amount_paise)}`,
    ``,
    `--- WELCOME TO THE CLUB ---`,
    ``,
    `You just bought something most people wouldn't wear. That was always`,
    `the point.`,
    ``,
    `It gets printed, packed by hand, and sent your way. When it lands it's`,
    `properly yours — small run, no restock, and you won't be passing`,
    `someone in the same one.`,
    ``,
    `Thank you, genuinely. Brands like this run on the people who go first.`,
    `Wear it loud.`,
    ``,
    `  — the two idiots who started sweet devil`,
    ``,
    `DELIVERING TO`,
    `  ${order.customer_name}`,
    `  ${order.address_line}`,
    `  ${order.city}, ${order.state} ${order.pincode}`,
    ``,
    `Processed in 1-3 business days, delivered in 3-7. Shipping is free`,
    `across India.`,
    ``,
    `View your order: ${orderUrl}`,
    ``,
    `Keep your order number — it's how we find you. Questions? Reply to this`,
    `email or write to ${CONTACT.email}.`,
  ].join("\n");

  const ok = await send({
    to: order.customer_email,
    subject: `Order ${order.id} confirmed — Sweet Devil`,
    html,
    text,
  });

  console.log("email: order confirmation", { orderId: order.id, sent: ok });
  return ok;
}
