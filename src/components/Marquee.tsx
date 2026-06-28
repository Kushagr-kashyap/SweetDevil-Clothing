"use client";

export default function Marquee({
  text = "Unleash your inner devil",
  duration = 28,
  outline = false,
}: {
  text?: string;
  duration?: number;
  outline?: boolean;
}) {
  const items = Array.from({ length: 6 });
  return (
    <div className="marquee-paused relative flex w-full overflow-hidden border-y border-line py-5">
      <div
        className="animate-marquee flex shrink-0 items-center whitespace-nowrap"
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        {items.map((_, i) => (
          <span
            key={i}
            className={`display mx-6 text-5xl md:text-7xl ${
              i % 2 ? (outline ? "text-stroke-devil" : "text-devil") : outline ? "text-stroke" : "text-ink"
            }`}
          >
            {text}
            <span className="mx-6 align-middle text-devil">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
