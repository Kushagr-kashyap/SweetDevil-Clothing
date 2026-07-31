"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Scroll-triggered reveal that fails open.
 *
 * The element ships visible. Only once this mounts — proving scripting works —
 * does it add the hidden starting state, and only for content still below the
 * fold, so nothing above the fold ever flashes. If the script never runs, or
 * IntersectionObserver is missing, the content simply stays visible.
 *
 * This is deliberately not a Motion component: a storefront's products must not
 * depend on an animation library booting successfully.
 */
export default function Reveal({
  as: Tag = "div",
  delay = 0,
  className = "",
  style,
  children,
  ...rest
}: {
  as?: ElementType;
  /** Stagger, in ms. */
  delay?: number;
  className?: string;
  /** Merged with the delay variable rather than replacing it. */
  style?: React.CSSProperties;
  children: ReactNode;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    // Already on screen when JS boots — leave it alone rather than hide it.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    el.classList.add("will-reveal");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("is-in");
        io.disconnect();
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      {...rest}
      className={`reveal ${className}`}
      style={
        delay
          ? ({ ...style, ["--d"]: `${delay}ms` } as React.CSSProperties)
          : style
      }
    >
      {children}
    </Tag>
  );
}
