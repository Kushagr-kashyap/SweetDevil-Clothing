"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { bySlug, type Fit, type Size } from "./products";

/**
 * The cart is a module-level external store read through useSyncExternalStore,
 * not React state in a provider.
 *
 * localStorage doesn't exist during SSR, so the server snapshot is always an
 * empty cart and React swaps in the real one after hydration — which is exactly
 * what useSyncExternalStore's two-snapshot contract is designed for. Reading it
 * into state inside an effect instead would both mismatch on hydration and
 * trigger the cascading-render lint rule.
 */

const KEY = "sd_cart_v1";

export type CartLine = {
  slug: string;
  size?: Size;
  fit?: Fit;
  qty: number;
  /** The customer's brief on a custom-design line. Travels with the order. */
  note?: string;
};

/**
 * One cart row per slug+size+fit. A custom-design brief is part of the identity
 * too — two different briefs are two different orders, not a quantity of two.
 */
export const lineId = (l: Pick<CartLine, "slug" | "size" | "fit" | "note">) => {
  const base = `${l.slug}__${l.size ?? "-"}__${l.fit ?? "-"}`;
  if (!l.note) return base;
  let h = 0;
  for (const ch of l.note) h = (h * 31 + ch.charCodeAt(0)) % 99991;
  return `${base}__${h}`;
};

/** Guard against a hand-edited localStorage payload ordering 10,000 tees. */
const clampQty = (n: number) => Math.max(1, Math.min(20, Math.round(n)));

type Snapshot = { lines: CartLine[]; ready: boolean };

/** Stable identity matters: useSyncExternalStore compares snapshots by reference. */
const SERVER_SNAPSHOT: Snapshot = { lines: [], ready: false };

let snapshot: Snapshot = SERVER_SNAPSHOT;
let loaded = false;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Drop anything that no longer exists in the catalogue.
    return (parsed as CartLine[]).filter(
      (l) =>
        l &&
        typeof l.slug === "string" &&
        Number.isFinite(l.qty) &&
        Boolean(bySlug(l.slug)),
    );
  } catch {
    return [];
  }
}

function load() {
  if (loaded) return;
  loaded = true;
  snapshot = { lines: read(), ready: true };
}

function commit(lines: CartLine[]) {
  snapshot = { lines, ready: true };
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* private mode / quota — the cart just won't persist */
  }
  for (const l of listeners) l();
}

function onStorage(e: StorageEvent) {
  if (e.key !== KEY) return;
  snapshot = { lines: read(), ready: true };
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Snapshot {
  load();
  return snapshot;
}

const getServerSnapshot = (): Snapshot => SERVER_SNAPSHOT;

/* ── mutations ─────────────────────────────────────────────────────────────── */

function addLine(line: CartLine) {
  const id = lineId(line);
  const prev = snapshot.lines;
  const hit = prev.find((l) => lineId(l) === id);
  commit(
    hit
      ? prev.map((l) =>
          lineId(l) === id ? { ...l, qty: clampQty(l.qty + line.qty) } : l,
        )
      : [...prev, { ...line, qty: clampQty(line.qty) }],
  );
}

function setLineQty(id: string, qty: number) {
  const prev = snapshot.lines;
  commit(
    qty <= 0
      ? prev.filter((l) => lineId(l) !== id)
      : prev.map((l) => (lineId(l) === id ? { ...l, qty: clampQty(qty) } : l)),
  );
}

/* ── hook ──────────────────────────────────────────────────────────────────── */

export function useCart() {
  const { lines, ready } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const { count, subtotal } = useMemo(() => {
    let count = 0;
    let subtotal = 0;
    for (const l of lines) {
      const p = bySlug(l.slug);
      if (!p) continue;
      count += l.qty;
      subtotal += p.price * l.qty;
    }
    return { count, subtotal };
  }, [lines]);

  const add = useCallback((line: CartLine) => addLine(line), []);
  const setQty = useCallback((id: string, qty: number) => setLineQty(id, qty), []);
  const remove = useCallback((id: string) => setLineQty(id, 0), []);
  const clear = useCallback(() => commit([]), []);

  return { lines, ready, count, subtotal, add, setQty, remove, clear };
}
