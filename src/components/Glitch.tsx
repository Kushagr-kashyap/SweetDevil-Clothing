"use client";

import { useEffect, useRef, type ElementType } from "react";

/**
 * Display heading that glitches once as it scrolls into view, then settles.
 *
 * The real text is always rendered normally — the ghosts are `::before` /
 * `::after` fed by `data-text`, and the animation only runs once a JS-added
 * class lands. No script, no glitch, but the heading is still there and clean.
 *
 * Multi-line headings are passed as separate `lines` rather than a string with
 * a `<br>`, because `content: attr(data-text)` can't render a line break — each
 * line needs to be its own glitching element.
 */
export default function Glitch({
  as: Tag = "span",
  lines,
  className = "",
  lineClassName = "",
  style,
}: {
  as?: ElementType;
  lines: string[];
  className?: string;
  lineClassName?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    // Honour the OS setting explicitly: the global reduced-motion rule collapses
    // the duration, but not arming it at all is cleaner than a 0.001s flicker.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = el.querySelectorAll<HTMLElement>("[data-text]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          // The loop and its per-line stagger are both CSS; JS only decides
          // *when* to arm it, so nothing animates off-screen.
          entry.target.classList.add("is-glitching");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={className} style={style}>
      {lines.map((line, i) => (
        <span
          key={i}
          data-text={line}
          style={{ ["--gi" as string]: i }}
          className={`glitch ${lineClassName}`}
        >
          {line}
        </span>
      ))}
    </Tag>
  );
}
