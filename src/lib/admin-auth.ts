import "server-only";
import { cookies } from "next/headers";

/**
 * Authentication for the admin page.
 *
 * The admin page lists customer names, phone numbers and home addresses, so
 * "nobody will guess the URL" is not a control. This is a password gate with a
 * signed, httpOnly session cookie.
 *
 * Scope, honestly: it protects one operator's dashboard against the open
 * internet. It is not multi-user auth and has no lockout — a very long random
 * password is doing the real work. If this ever needs to be stronger, put
 * Cloudflare Access in front of /admin rather than growing this file.
 */

const COOKIE = "sd_admin";
const SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours

export const isAdminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

function secret(): string {
  const v = process.env.ADMIN_PASSWORD;
  if (!v) throw new Error("ADMIN_PASSWORD is not set.");
  return v;
}

async function hmacHex(key: string, message: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time compare — see the note in razorpay.ts for why `===` leaks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkPassword(candidate: string): Promise<boolean> {
  // Compare hashes, not the raw strings: equal-length hex means the timing-safe
  // compare can't leak the password's length either.
  const [a, b] = await Promise.all([
    hmacHex(secret(), "pw"),
    hmacHex(candidate, "pw"),
  ]);
  return timingSafeEqual(a, b);
}

/** `<expiry>.<signature>` — the signature is what makes it unforgeable. */
export async function mintSession(): Promise<string> {
  const expiry = String(Date.now() + SESSION_MS);
  return `${expiry}.${await hmacHex(secret(), expiry)}`;
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expiry, sig] = token.split(".");
  if (!expiry || !sig) return false;

  const expiresAt = Number(expiry);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  try {
    return timingSafeEqual(await hmacHex(secret(), expiry), sig);
  } catch {
    return false;
  }
}

export async function isLoggedIn(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const jar = await cookies();
  return isValidSession(jar.get(COOKIE)?.value);
}

/**
 * httpOnly so page scripts can't read it, Secure so it never crosses plain
 * HTTP, SameSite=Strict so another site can't ride the session.
 */
export function sessionCookie(token: string): string {
  return [
    `${COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    `Max-Age=${Math.floor(SESSION_MS / 1000)}`,
  ].join("; ");
}

export const clearCookie = () =>
  `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
