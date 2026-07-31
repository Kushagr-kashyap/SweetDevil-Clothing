import type { Metadata } from "next";
import Field, { CONTROL } from "@/components/Field";
import { PageHeader } from "@/components/hud";
import { isAdminConfigured, isLoggedIn } from "@/lib/admin-auth";
import { listOrders, parseItems, type OrderRow } from "@/lib/orders";
import { formatPaise } from "@/lib/pricing";
import { phoneDisplay } from "@/lib/site";

export const metadata: Metadata = {
  title: "Orders — Sweet Devil",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Order dashboard. Reads the session cookie, so it can never be prerendered —
 * a cached copy of this page would be a customer-data leak.
 */

const STATUS_STYLE: Record<string, string> = {
  paid: "text-ember",
  pending: "text-bone-faint",
  failed: "text-flare",
};

function OrderCard({ order }: { order: OrderRow }) {
  const items = parseItems(order);
  const placed = new Date(order.created_at);

  return (
    <li
      className="chassis cut-4 p-5"
      style={{
        ["--cut" as string]: "16px",
        ["--chassis-fill" as string]: "var(--color-void-deep)",
      }}
    >
      <div className="border-line/60 flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-3">
        <span className="readout text-ember">{order.id}</span>
        <span className={`readout ${STATUS_STYLE[order.status] ?? "text-bone-dim"}`}>
          {order.status}
        </span>
        {order.test_mode === 1 && <span className="readout text-flare">test</span>}
        <span className="bg-line/60 h-px flex-1" />
        <span className="readout text-bone-faint">
          {placed.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}{" "}
          {placed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className="text-bone font-semibold">{formatPaise(order.amount_paise)}</span>
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-[1.1fr_1fr]">
        {/* ── what to pack ── */}
        <div>
          <p className="readout text-bone-faint mb-2">pack</p>
          <ul className="space-y-1.5">
            {items.map((l, i) => (
              <li key={`${l.slug}-${i}`} className="text-bone-dim text-[0.92rem]">
                <span className="text-bone">{l.qty}×</span> {l.name}
                <span className="text-bone-faint">
                  {" "}
                  — {[l.fit, l.size].filter(Boolean).join(", ")}
                </span>
                {l.note && (
                  <span className="text-bone-faint mt-0.5 block text-[0.85rem] italic">
                    brief: “{l.note}”
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* ── where it goes. Selectable so it can be pasted into a courier form. ── */}
        <div>
          <p className="readout text-bone-faint mb-2">ship to</p>
          <address className="text-bone-dim select-text text-[0.92rem] not-italic leading-relaxed">
            <span className="text-bone block">{order.customer_name}</span>
            {order.address_line}
            <br />
            {order.city}, {order.state} {order.pincode}
          </address>
          <p className="mt-2 flex flex-wrap gap-x-4 text-[0.9rem]">
            <a
              href={`tel:+91${order.customer_phone}`}
              className="text-bone-dim hover:text-ember inline-flex min-h-11 items-center transition-colors"
            >
              {phoneDisplay(order.customer_phone)}
            </a>
            <a
              href={`mailto:${order.customer_email}`}
              className="text-bone-dim hover:text-ember inline-flex min-h-11 items-center break-all transition-colors"
            >
              {order.customer_email}
            </a>
          </p>
          {order.razorpay_payment_id && (
            <p className="readout text-bone-faint mt-1 break-all">
              {order.razorpay_payment_id}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = isAdminConfigured();
  const authed = await isLoggedIn();

  if (!authed) {
    return (
      <main>
        <PageHeader
          code="ADM"
          meta="staff only"
          lines={["Orders"]}
          blurb="Sign in to see orders, addresses and what needs packing."
        />
        <section className="px-[max(1.25rem,5vw)] pb-20">
          <form
            method="POST"
            action="/api/admin/login"
            className="chassis cut-4 max-w-sm p-5 md:p-7"
            style={{
              ["--cut" as string]: "18px",
              ["--chassis-fill" as string]: "var(--color-void-deep)",
            }}
          >
            <Field label="Password">
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                className={CONTROL}
              />
            </Field>

            {error === "bad" && (
              <p role="alert" className="readout text-flare mt-3">
                Wrong password.
              </p>
            )}
            {(!configured || error === "unconfigured") && (
              <p role="alert" className="readout text-flare mt-3 leading-relaxed">
                No admin password set. Run: npx wrangler secret put ADMIN_PASSWORD
              </p>
            )}

            <button
              type="submit"
              className="cut bg-bone text-void label mt-5 flex w-full items-center justify-center py-3.5"
              style={{ ["--cut" as string]: "12px" }}
            >
              Sign in
            </button>
          </form>
        </section>
      </main>
    );
  }

  const orders = await listOrders(200);
  const paid = orders.filter((o) => o.status === "paid");
  const revenuePaise = paid
    .filter((o) => o.test_mode === 0)
    .reduce((sum, o) => sum + o.amount_paise, 0);

  return (
    <main>
      <PageHeader
        code="ADM"
        meta={`${orders.length} orders`}
        lines={["Orders"]}
        blurb="Newest first. Everything you need to pack and ship, and nothing you don't."
      />

      <section className="px-[max(1.25rem,5vw)] pb-20">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <span className="readout text-bone-faint">
            paid <span className="text-ember">{paid.length}</span>
          </span>
          <span className="readout text-bone-faint">
            pending{" "}
            <span className="text-bone-dim">
              {orders.filter((o) => o.status === "pending").length}
            </span>
          </span>
          <span className="readout text-bone-faint">
            revenue <span className="text-ember">{formatPaise(revenuePaise)}</span>
            <span className="text-bone-faint"> (live only)</span>
          </span>
          <span className="bg-line/60 h-px flex-1" />
          <form method="POST" action="/api/admin/login">
            <input type="hidden" name="action" value="logout" />
            <button
              type="submit"
              className="text-bone-dim hover:text-ember inline-flex min-h-11 items-center text-[0.9rem] transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>

        {orders.length === 0 ? (
          <p className="text-bone-dim prose-body">No orders yet.</p>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
