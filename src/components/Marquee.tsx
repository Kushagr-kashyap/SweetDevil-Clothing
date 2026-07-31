"use client";

export default function Marquee({
  text = "Unleash your inner devil",
  duration = 30,
  outline = false,
}: {
  text?: string;
  duration?: number;
  /** Outlined type — used on the second pass so the two bands don't twin. */
  outline?: boolean;
}) {
  // Two identical halves; the keyframe translates exactly -50% for a seamless loop.
  const half = Array.from({ length: 4 });

  return (
    <div
      className="border-line/60 relative flex w-full overflow-hidden border-y py-4"
      role="presentation"
    >
      <div
        className="animate-marquee flex shrink-0 items-center whitespace-nowrap"
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        {[...half, ...half].map((_, i) => (
          <span
            key={i}
            className="display mx-5 text-[clamp(1.8rem,7vw,3.4rem)]"
            style={
              outline
                ? {
                    WebkitTextStroke: "1px var(--color-bone-dim)",
                    color: "transparent",
                  }
                : { color: i % 2 ? "var(--color-ember)" : "var(--color-bone)" }
            }
          >
            {text}
            <span className="text-ember mx-5 align-middle">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
