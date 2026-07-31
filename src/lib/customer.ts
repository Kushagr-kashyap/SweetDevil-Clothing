import type { Customer } from "./orders";

/**
 * Validation for the delivery details.
 *
 * Shared by the checkout form and the API route on purpose. The form's copy is
 * the friendly version; the route re-runs the identical rules because HTML
 * validation is a convenience for honest customers, not a control — anything
 * can POST straight to the endpoint.
 *
 * The rules are Indian-specific because delivery is India-only (see the
 * shipping policy). Loosen them the day that stops being true.
 */

export type CustomerErrors = Partial<Record<keyof Customer, string>>;

/** Indian mobile numbers are 10 digits starting 6–9. */
const PHONE = /^[6-9]\d{9}$/;

/** Indian PIN codes are 6 digits and never start with 0. */
const PINCODE = /^[1-9]\d{5}$/;

/**
 * Deliberately permissive. Full RFC 5322 rejects addresses that work, and the
 * only real proof an address is valid is mail arriving at it.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Strips spaces, dashes and a +91 / 0 prefix before checking the 10 digits. */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/[\s\-()]/g, "").replace(/^\+?91/, "").replace(/^0/, "");
  return digits;
}

export function validateCustomer(
  input: unknown,
): { ok: true; customer: Customer } | { ok: false; errors: CustomerErrors } {
  const v =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {};

  const name = str(v.name);
  const email = str(v.email);
  const phone = normalisePhone(str(v.phone));
  const addressLine = str(v.addressLine);
  const city = str(v.city);
  const state = str(v.state);
  const pincode = str(v.pincode);

  const errors: CustomerErrors = {};

  if (name.length < 2) errors.name = "Please enter your full name.";
  else if (name.length > 100) errors.name = "That name is too long.";

  if (!EMAIL.test(email)) errors.email = "Please enter a valid email address.";
  else if (email.length > 200) errors.email = "That email address is too long.";

  if (!PHONE.test(phone)) {
    errors.phone = "Enter a 10-digit Indian mobile number.";
  }

  if (addressLine.length < 8) {
    errors.addressLine = "Please enter the full address, including the house number.";
  } else if (addressLine.length > 300) {
    errors.addressLine = "That address is too long.";
  }

  if (city.length < 2) errors.city = "Please enter your city.";
  else if (city.length > 80) errors.city = "That city name is too long.";

  if (state.length < 2) errors.state = "Please enter your state.";
  else if (state.length > 80) errors.state = "That state name is too long.";

  if (!PINCODE.test(pincode)) errors.pincode = "Enter a valid 6-digit PIN code.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    customer: { name, email, phone, addressLine, city, state, pincode },
  };
}
