import Glitch from "./Glitch";

/**
 * Shared HUD primitives. Small, dumb, server-renderable.
 */

/** Registration marks at a panel's corners — the machine "framing" its subject. */
export function Ticks({ className = "" }: { className?: string }) {
  const corners = [
    "left-2 top-2 border-l border-t",
    "right-2 top-2 border-r border-t",
    "bottom-2 left-2 border-b border-l",
    "bottom-2 right-2 border-b border-r",
  ];
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      {corners.map((c) => (
        <span key={c} className={`border-bone/35 absolute h-3 w-3 ${c}`} />
      ))}
    </span>
  );
}

/** A labelled telemetry row, as printed on equipment. */
export function Readout({
  label,
  value,
  hot = false,
}: {
  label: string;
  value: string;
  hot?: boolean;
}) {
  return (
    <div className="border-line/60 flex items-baseline justify-between gap-3 border-b py-2">
      <span className="readout text-bone-faint">{label}</span>
      <span className={`readout ${hot ? "text-ember" : "text-bone-dim"}`}>{value}</span>
    </div>
  );
}

/**
 * Top-of-page masthead. Every route opens with this so the pages read as one
 * machine rather than five unrelated screens.
 */
export function PageHeader({
  code,
  lines,
  blurb,
  meta,
}: {
  code: string;
  /** One entry per rendered line — each glitches separately. */
  lines: string[];
  blurb: string;
  meta?: string;
}) {
  return (
    <header className="px-[max(1.25rem,5vw)] pb-8 pt-24 md:pb-12 md:pt-28">
      <div
        className="rise flex flex-wrap items-center gap-x-3 gap-y-1"
        style={{ ["--d" as string]: "50ms" }}
      >
        <span className="readout text-ember">{code}</span>
        <span className="bg-line/60 h-px w-8" />
        {meta && <span className="readout text-bone-faint">{meta}</span>}
      </div>

      <Glitch
        as="h1"
        lines={lines}
        className="rise display text-bone mt-4 flex flex-col items-start text-[length:var(--step-3)]"
        style={{ ["--d" as string]: "120ms" }}
      />

      <p
        className="rise text-bone-dim prose-body mt-4 max-w-[52ch] text-[length:var(--step-0)]"
        style={{ ["--d" as string]: "200ms" }}
      >
        {blurb}
      </p>
    </header>
  );
}

/** Section heading with a machine code and rule, used above every rail. */
export function SectionHead({
  code,
  title,
  blurb,
  count,
}: {
  code: string;
  title: string;
  blurb: string;
  count: number;
}) {
  return (
    <header className="mb-7 md:mb-10">
      <div className="border-line/60 mb-4 flex items-center gap-3 border-b pb-3">
        <span className="readout text-ember">{code}</span>
        <span className="bg-line/60 h-px flex-1" />
        <span className="readout text-bone-faint">
          {String(count).padStart(2, "0")} items
        </span>
      </div>
      <Glitch
        as="h2"
        lines={[title]}
        className="display text-bone block text-[length:var(--step-3)]"
      />
      <p className="text-bone-dim prose-body mt-2 text-[length:var(--step-0)]">{blurb}</p>
    </header>
  );
}
