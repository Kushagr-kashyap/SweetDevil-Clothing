import type { Metadata } from "next";
import Link from "next/link";
import Field, { CONTROL } from "@/components/Field";
import { PageHeader } from "@/components/hud";
import { isAdminConfigured, isLoggedIn } from "@/lib/admin-auth";
import {
  getStats,
  listCustomers,
  listOrders,
  listOrdersByStatus,
  parseItems,
  searchOrders,
  topProducts,
  type CustomerSummary,
  type OrderRow,
} from "@/lib/orders";
import { formatPaise } from "@/lib/pricing";
import { phoneDisplay } from "@/lib/site";

export const metadata: Metadata = {
  title: "Dashboard — Sweet Devil",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Order dashboard. Reads the session cookie, so it can never be prerendered —
 * a cached copy would be a customer-data leak.
 *
 * Views are driven by the query string and navigated with plain links, so every
 * tab is a shareable URL and the whole page works with scripting dead. There is
 * no client JS on this page at all.
 */

type View = "orders" | "abandoned" | "customers" | "stats";
const VIEWS: { id: View; label: string }[] = [
  { id: "orders", label: "Orders" },
  { id: "abandoned", label: "Abandoned" },
  { id: "customers", label: "Customers" },
  { id: "stats", label: "Stats" },
];

const STATUS_STYLE: Record<string, string> = {
  paid: "text-ember",
  pending: "text-bone-faint",
  failed: "text-flare",
};

function Stat({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div
      className="chassis cut px-4 py-3"
      style={{ ["--cut" as string]: "10px" }}
    >
      <p className="readout text-bone-faint">{label}</p>
      <p className={`display mt-1 text-[1.35rem] ${hot ? "text-ember" : "text-bone"}`}>
        {value}
      </p>
    </div>
  );
}

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

        {/* Selectable so it can be pasted straight into a courier form. */}
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

function CustomerRow({ c }: { c: CustomerSummary }) {
  const last = new Date(c.lastOrderAt);
  return (
    <li
      className="chassis cut p-4"
      style={{ ["--cut" as string]: "12px" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-bone text-[0.98rem]">{c.name}</span>
        <span className="text-bone font-semibold">{formatPaise(c.spentPaise)}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5">
        <a
          href={`mailto:${c.email}`}
          className="text-bone-dim hover:text-ember break-all text-[0.88rem] transition-colors"
        >
          {c.email}
        </a>
        <a
          href={`tel:+91${c.phone}`}
          className="text-bone-dim hover:text-ember text-[0.88rem] transition-colors"
        >
          {phoneDisplay(c.phone)}
        </a>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4">
        <span className="readout text-bone-faint">
          {c.city}, {c.state}
        </span>
        <span className="readout text-ember">
          {c.orders} order{c.orders === 1 ? "" : "s"}
        </span>
        <span className="readout text-bone-faint">
          last {last.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
        </span>
      </div>
    </li>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; view?: string; q?: string }>;
}) {
  const params = await searchParams;
  const configured = isAdminConfigured();
  const authed = await isLoggedIn();

  if (!authed) {
    return (
      <main>
        <PageHeader
          code="ADM"
          meta="staff only"
          lines={["Dashboard"]}
          blurb="Sign in to see orders, customers and takings."
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

            {params.error === "bad" && (
              <p role="alert" className="readout text-flare mt-3">
                Wrong password.
              </p>
            )}
            {(!configured || params.error === "unconfigured") && (
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

  const view = (VIEWS.find((v) => v.id === params.view)?.id ?? "orders") as View;
  const query = (params.q ?? "").trim().slice(0, 80);
  const stats = await getStats();

  const orders = query
    ? await searchOrders(query)
    : view === "abandoned"
      ? await listOrdersByStatus("pending")
      : view === "orders"
        ? await listOrders(200)
        : [];

  const customers = view === "customers" && !query ? await listCustomers() : [];
  const top = view === "stats" && !query ? await topProducts() : [];

  return (
    <main>
      <PageHeader
        code="ADM"
        meta={`${stats.paidCount} paid · ${stats.pendingCount} pending`}
        lines={["Dashboard"]}
        blurb="Everything you need to pack, ship and chase — and nothing you don't."
      />

      <section className="px-[max(1.25rem,5vw)] pb-20">
        {/* ── takings ── */}
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="revenue (live)" value={formatPaise(stats.revenuePaise)} hot />
          <Stat label="paid orders" value={String(stats.paidCount)} />
          <Stat label="avg order" value={formatPaise(stats.avgOrderPaise)} />
          <Stat label="units sold" value={String(stats.unitsSold)} />
          <Stat label="abandoned" value={String(stats.pendingCount)} />
        </div>

        {/* ── tabs + sign out ── */}
        <div className="border-line/60 mb-4 flex flex-wrap items-center gap-2 border-b pb-3">
          {VIEWS.map((v) => (
            <Link
              key={v.id}
              href={`/admin?view=${v.id}`}
              className={`label inline-flex min-h-11 items-center px-3 transition-colors ${
                view === v.id && !query
                  ? "text-ember"
                  : "text-bone-dim hover:text-bone"
              }`}
            >
              {v.label}
            </Link>
          ))}
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

        {/* ── search ── */}
        <form action="/admin" method="get" className="mb-6 flex max-w-md items-stretch gap-2">
          <input type="hidden" name="view" value={view} />
          <span
            className="chassis cut focus-within:bg-ember block min-w-0 flex-1 transition-colors"
            style={{ ["--cut" as string]: "8px" }}
          >
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Order no, name, email, phone…"
              aria-label="Search orders"
              className={CONTROL}
            />
          </span>
          <button
            type="submit"
            className="cut bg-bone text-void label shrink-0 px-5"
            style={{ ["--cut" as string]: "8px" }}
          >
            Find
          </button>
        </form>

        {query && (
          <p className="readout text-bone-faint mb-4">
            {orders.length} result{orders.length === 1 ? "" : "s"} for “{query}” ·{" "}
            <Link href={`/admin?view=${view}`} className="text-ember">
              clear
            </Link>
          </p>
        )}

        {/* ── abandoned explainer ── */}
        {view === "abandoned" && !query && (
          <p className="text-bone-dim prose-body mb-4 max-w-[62ch] text-[0.93rem]">
            Started checkout, never paid. Each one has a real phone number and
            email — a short message asking if something went wrong recovers more
            of these than any discount does.
          </p>
        )}

        {/* ── content ── */}
        {(view === "orders" || view === "abandoned" || query) && (
          orders.length === 0 ? (
            <p className="text-bone-dim prose-body">
              {query ? "Nothing matched." : "Nothing here yet."}
            </p>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </ul>
          )
        )}

        {view === "customers" && !query && (
          customers.length === 0 ? (
            <p className="text-bone-dim prose-body">No customers yet.</p>
          ) : (
            <>
              <p className="text-bone-dim prose-body mb-4 max-w-[62ch] text-[0.93rem]">
                Everyone who has ever checked out, biggest spender first. There
                are no accounts — a customer is a distinct email address.
              </p>
              <ul className="space-y-2">
                {customers.map((c) => (
                  <CustomerRow key={c.email} c={c} />
                ))}
              </ul>
            </>
          )
        )}

        {view === "stats" && !query && (
          <div className="max-w-xl">
            <p className="readout text-bone-faint border-line/60 mb-3 border-b pb-3">
              Best sellers
            </p>
            {top.length === 0 ? (
              <p className="text-bone-dim prose-body">Nothing sold yet.</p>
            ) : (
              <ul className="space-y-1">
                {top.map((t) => (
                  <li
                    key={t.name}
                    className="border-line/60 flex items-baseline justify-between gap-4 border-b py-2.5"
                  >
                    <span className="text-bone-dim text-[0.95rem]">{t.name}</span>
                    <span className="flex items-baseline gap-4">
                      <span className="readout text-ember">{t.qty} sold</span>
                      <span className="text-bone-dim text-[0.9rem]">
                        {formatPaise(t.revenuePaise)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-bone-faint prose-body mt-8 text-[0.88rem]">
              Revenue figures count live orders only — test-mode payments are
              excluded everywhere on this page, because simulated money is not
              money.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
