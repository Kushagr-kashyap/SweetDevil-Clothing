"use client";

import { useEffect, useRef, useState } from "react";

/**
 * fire.mp4 is 4.5MB, so it is never fetched up front. We hold the poster frame
 * until the element is on screen and the visitor is on a connection and motion
 * setting that can justify it; otherwise the poster is the final state.
 */
export default function FireBackdrop({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (reduced || conn?.saveData) return;

    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAllowed(true);
          el.play().catch(() => {
            /* autoplay refused — poster stands in */
          });
        } else {
          el.pause();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      poster="/brand/fire-poster.jpg"
      preload="none"
      src={allowed ? "/brand/fire.mp4" : undefined}
      muted
      loop
      playsInline
      aria-hidden
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
