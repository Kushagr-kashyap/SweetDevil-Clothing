"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { pctForHits, REWARD_TTL_MS } from "./reward-tiers";

/**
 * The discount the visitor is currently holding, client side.
 *
 * Same shape as the cart store and for the same reason: localStorage doesn't
 * exist during SSR, so the server snapshot is empty and React swaps in the real
 * value after hydration. Reading it in an effect instead would mismatch on
 * hydration and trip the cascading-render lint rule.
 *
 * This is a CONVENIENCE COPY, not the truth. The code is the only field that
 * matters; `pct` and `expiresAt` exist so the UI can render without a round
 * trip. Checkout sends the code and the server re-reads the percentage from
 * game_rewards, so editing this in devtools changes what you see and nothing
 * you pay.
 */

const KEY = "sd_reward_v1";

export type Reward = {
  code: string;
  pct: number;
  /** ISO-8601 UTC. */
  expiresAt: string;
};

type Snapshot = { reward: Reward | null; ready: boolean };

/** Stable identity matters: useSyncExternalStore compares by reference. */
const SERVER_SNAPSHOT: Snapshot = { reward: null, ready: false };

let snapshot: Snapshot = SERVER_SNAPSHOT;
let loaded = false;
const listeners = new Set<() => void>();

function read(): Reward | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p: unknown = JSON.parse(raw);
    if (typeof p !== "object" || p === null) return null;
    const r = p as Record<string, unknown>;
    if (
      typeof r.code !== "string" ||
      typeof r.pct !== "number" ||
      typeof r.expiresAt !== "string"
    ) {
      return null;
    }
    return { code: r.code, pct: r.pct, expiresAt: r.expiresAt };
  } catch {
    return null;
  }
}

/**
 * Expiry is deliberately NOT filtered here.
 *
 * getSnapshot has to return the same reference until something actually
 * changes. Dropping an expired reward inside it would return a fresh value on
 * every call once the clock passed, and React would re-render forever. The
 * hook below compares against a ticking clock instead.
 */
function getSnapshot(): Snapshot {
  if (!loaded) {
    loaded = true;
    snapshot = { reward: read(), ready: true };
  }
  return snapshot;
}

const getServerSnapshot = (): Snapshot => SERVER_SNAPSHOT;

function commit(reward: Reward | null) {
  snapshot = { reward, ready: true };
  try {
    if (reward) localStorage.setItem(KEY, JSON.stringify(reward));
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode / quota — the reward just won't survive a reload */
  }
  for (const l of listeners) l();
}

function onStorage(e: StorageEvent) {
  if (e.key !== KEY) return;
  snapshot = { reward: read(), ready: true };
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

/**
 * Claims the reward for a finished round. THE LATEST ROUND IS THE ONE THAT
 * COUNTS — it replaces whatever was held, even when it is worth less.
 *
 * This used to keep the better of the two, so that "play again" could never
 * cost you a discount. It read as a bug from the customer's side: finish on 6
 * hits and the card announced 15% off, because an earlier 11-hit round was
 * still standing. The number on screen has to be the number you just earned.
 *
 * Two things follow from that, and both are the point rather than side effects:
 *
 *  - A round below the lowest tier CLEARS the discount. Nothing is posted for
 *    it: the tier table is public and clearing only ever takes a discount
 *    away, so deciding it here can't grant anything the server didn't.
 *  - Every qualifying round mints a NEW code, and the server stamps that with
 *    a fresh `now + REWARD_TTL_MS`. So the 30-minute clock restarts each round
 *    on its own — there is no separate code that extends an expiry.
 *
 * Returns the reward now held, or null when this round earned none.
 */
export async function claimReward(hits: number): Promise<Reward | null> {
  // Below the floor tier there is nothing to claim, and the previous round's
  // discount no longer applies.
  if (pctForHits(hits) <= 0) {
    if (getSnapshot().reward) commit(null);
    return null;
  }

  try {
    const res = await fetch("/api/game/reward", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hits }),
    });

    const data: unknown = res.ok ? await res.json() : null;
    const next = (data as { reward?: Reward | null } | null)?.reward ?? null;
    if (!next || typeof next.code !== "string" || typeof next.pct !== "number") {
      // The round qualified but no code came back. Drop the stale one rather
      // than presenting a discount from a round the customer has moved past —
      // the card says the save failed and invites another go.
      if (getSnapshot().reward) commit(null);
      return null;
    }

    commit(next);
    return next;
  } catch {
    // Offline, or the endpoint is down. Same reasoning as above: the previous
    // round is over, so its discount cannot stand in for this one.
    if (getSnapshot().reward) commit(null);
    return null;
  }
}

/** Called once an order is paid, so a spent code stops showing in the cart. */
export function clearReward() {
  commit(null);
}

export function useReward() {
  const { reward, ready } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Re-render once a second so the countdown moves and the reward disappears
  // the moment it lapses. Only runs while one is actually held.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!reward) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [reward]);

  // `now` only ticks while a reward is held, so when a new one lands it can be
  // stale by however long the page sat with none — and the card would briefly
  // read "expires in 40:00" on a code the server gave exactly 30 minutes. No
  // code can have more than REWARD_TTL_MS left, so the display is capped at it.
  const msLeft = reward
    ? Math.min(new Date(reward.expiresAt).getTime() - now, REWARD_TTL_MS)
    : 0;
  const live = reward && msLeft > 0 ? reward : null;

  return {
    reward: live,
    ready,
    msLeft: Math.max(0, msLeft),
    clear: useCallback(() => clearReward(), []),
  };
}

/** mm:ss, for the expiry countdown. */
export function countdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
