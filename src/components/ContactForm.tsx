"use client";

import { useState } from "react";
import Field, { CONTROL } from "./Field";
import { CONTACT } from "@/lib/site";

/**
 * There's no backend yet, so submitting composes a real email in the visitor's
 * mail app rather than pretending to send and dropping the message on the
 * floor. The <form action> is the same mailto, so it still does something
 * useful if scripting is unavailable.
 */
export default function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = `${data.get("firstName") ?? ""} ${data.get("lastName") ?? ""}`.trim();
    const body = [
      `Name: ${name}`,
      `Email: ${data.get("email") ?? ""}`,
      "",
      String(data.get("message") ?? ""),
    ].join("\n");

    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
      `Website enquiry from ${name || "a customer"}`,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <div
      className="chassis cut-4 p-5 md:p-8"
      style={{
        ["--cut" as string]: "20px",
        ["--chassis-fill" as string]: "var(--color-void-deep)",
      }}
    >
      <div className="border-line/60 mb-6 flex items-center gap-3 border-b pb-3">
        <span className="bg-ember animate-led block h-1.5 w-1.5 rounded-full" />
        <span className="readout text-ember">send a message</span>
        <span className="bg-line/60 h-px flex-1" />
        <span className="readout text-bone-faint">
          {sent ? "composing…" : "awaiting input"}
        </span>
      </div>

      <form
        onSubmit={onSubmit}
        action={`mailto:${CONTACT.email}`}
        method="post"
        encType="text/plain"
        className="grid gap-4 sm:grid-cols-2"
      >
        <Field label="First name">
          <input
            required
            type="text"
            name="firstName"
            autoComplete="given-name"
            className={CONTROL}
          />
        </Field>
        <Field label="Last name">
          <input
            required
            type="text"
            name="lastName"
            autoComplete="family-name"
            className={CONTROL}
          />
        </Field>
        <Field label="Email" className="sm:col-span-2">
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            className={CONTROL}
          />
        </Field>
        <Field label="Message" className="sm:col-span-2">
          <textarea
            required
            name="message"
            rows={5}
            placeholder="Order number, question, complaint, compliment — all welcome."
            className={`${CONTROL} block resize-y`}
          />
        </Field>

        <button
          type="submit"
          className="cut bg-bone text-void label group flex items-center justify-center gap-2 py-4 sm:col-span-2"
          style={{ ["--cut" as string]: "14px" }}
        >
          Send
          <span
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </button>
      </form>

      {sent && (
        <p
          role="status"
          className="text-bone-dim rise mt-4 text-[0.9rem]"
        >
          Your mail app should have opened with the message ready. If nothing
          happened, email us directly at{" "}
          <a
            href={`mailto:${CONTACT.email}`}
            className="text-ember underline underline-offset-2"
          >
            {CONTACT.email}
          </a>
          .
        </p>
      )}
    </div>
  );
}
