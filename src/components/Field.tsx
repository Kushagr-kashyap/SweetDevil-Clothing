import type { ReactNode } from "react";

/**
 * `text-base` (16px) is deliberate and must not be reduced: iOS Safari zooms
 * the whole page in when a focused input has a font-size below 16px, which
 * makes every form on the site lurch on a phone.
 */
export const CONTROL =
  "text-bone placeholder:text-bone-faint w-full bg-transparent px-3 py-3 text-base outline-none";

/**
 * Inputs and textareas can't render `::before`, which is how `.chassis` paints
 * its fill — applied directly they'd come out as solid blocks. The chassis goes
 * on this wrapper instead, and lights up on focus.
 */
export default function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="readout text-bone-faint mb-2 block">{label}</span>
      <span
        className="chassis cut focus-within:bg-ember block transition-colors"
        style={{ ["--cut" as string]: "8px" }}
      >
        {children}
      </span>
    </label>
  );
}
