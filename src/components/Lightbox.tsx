"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Full-screen photo viewer for the product gallery.
 *
 * PROGRESSIVE ENHANCEMENT, on purpose. The gallery this wraps is server
 * rendered, and every photo in it is a plain `<a href>` pointing at the image
 * file. With scripting dead a tap still opens the photo and the phone's own
 * viewer handles zoom — the same rule the rest of this page follows. All this
 * component does is intercept those links and open them in place instead.
 *
 * It finds the links by delegation rather than by taking an image list as a
 * prop, so the gallery markup on the page stays exactly as it was and there is
 * one source of truth for what is in it.
 *
 * The zoom is transform-based, not the browser's native pinch. Native pinch
 * inside a `position: fixed` overlay zooms the whole page on iOS instead of the
 * photo, which leaves the customer stranded at 3x with the header off-screen.
 */

const MAX = 4;
const DOUBLE_TAP_MS = 300;

/**
 * The viewer shows the optimised photo, not the file the link points at.
 *
 * The masters are 2000px PNGs at 2-3 MB each. Served raw to a phone on 4G that
 * is seconds of waiting and someone's data, for a picture that is about to be
 * scaled to fit the screen anyway. The same image through next/image comes back
 * as WebP at roughly a tenth of that, and 2048 is one of Next's default device
 * widths so no config is needed.
 *
 * `raw` stays as the fallback: if the optimiser is not wired up on Cloudflare
 * the <img> errors and swaps to the plain file rather than showing nothing.
 */
const optimised = (raw: string, w = 2048, q = 90) =>
  `/_next/image?url=${encodeURIComponent(new URL(raw, location.origin).pathname)}&w=${w}&q=${q}`;

type Shot = { src: string; alt: string };

export default function Lightbox({ children }: { children: React.ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [at, setAt] = useState(0);
  const open = shots.length > 0;

  /* view transform */
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  /* gesture bookkeeping — refs, not state: these change per touchmove and
     re-rendering on every frame of a pinch drops frames on a mid-range phone */
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const lastTap = useRef(0);

  /* Whether a finger is currently driving the transform. State, not a ref,
     because the render reads it: a transition left switched on during a pinch
     makes the photo lag the fingers by the transition duration. */
  const [gesturing, setGesturing] = useState(false);

  const reset = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const close = useCallback(() => {
    setShots([]);
    reset();
  }, [reset]);

  const go = useCallback(
    (d: number) => {
      setAt((i) => (i + d + shots.length) % shots.length);
      reset();
    },
    [shots.length, reset],
  );

  /* Intercept clicks on the gallery's photo links. */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-zoom]");
      if (!link || !host.contains(link)) return;
      // Let the browser do its normal thing for opening in a new tab.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

      e.preventDefault();
      const links = Array.from(host.querySelectorAll<HTMLAnchorElement>("a[data-zoom]"));
      setShots(links.map((a) => ({ src: a.href, alt: a.dataset.alt ?? "" })));
      setAt(links.indexOf(link));
      reset();
    };

    host.addEventListener("click", onClick);
    return () => host.removeEventListener("click", onClick);
  }, [reset]);

  /* Keyboard, and the body scroll lock. */
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };

    // Restore the exact previous value rather than assuming it was "": this
    // page runs under Lenis smooth scroll, which sets its own overflow.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, go]);

  const clampPan = useCallback((p: { x: number; y: number }, s: number) => {
    // At 1x there is nothing to pan. Past that, allow half the overflow in each
    // direction so the photo can never be dragged fully off screen.
    if (s <= 1) return { x: 0, y: 0 };
    const limit = ((s - 1) / 2) * Math.min(window.innerWidth, window.innerHeight);
    return {
      x: Math.max(-limit, Math.min(limit, p.x)),
      y: Math.max(-limit, Math.min(limit, p.y)),
    };
  }, []);

  const zoomTo = useCallback(
    (next: number) => {
      const s = Math.max(1, Math.min(MAX, next));
      setScale(s);
      setPan((p) => clampPan(p, s));
    },
    [clampPan],
  );

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinch.current = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), scale };
      drag.current = null;
      setGesturing(true);
      return;
    }
    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < DOUBLE_TAP_MS) {
        zoomTo(scale > 1 ? 1 : 2.5);
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;
      if (scale > 1) {
        drag.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, px: pan.x, py: pan.y };
        setGesturing(true);
      }
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (pinch.current && e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      zoomTo(pinch.current.scale * (d / pinch.current.dist));
      return;
    }
    if (drag.current && e.touches.length === 1) {
      const t = e.touches[0];
      setPan(
        clampPan(
          {
            x: drag.current.px + (t.clientX - drag.current.x),
            y: drag.current.py + (t.clientY - drag.current.y),
          },
          scale,
        ),
      );
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinch.current = null;
    if (e.touches.length === 0) {
      drag.current = null;
      setGesturing(false);
    }
  };

  const shot = shots[at];

  return (
    <>
      <div ref={hostRef}>{children}</div>

      {open && shot && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${shot.alt} — full screen`}
          className="bg-void/97 fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) => {
            // Backdrop closes, but only when the photo is not zoomed — at 2x a
            // stray tap while panning would otherwise throw the viewer away.
            if (e.target === e.currentTarget && scale === 1) close();
          }}
        >
          <div
            className="flex h-full w-full touch-none select-none items-center justify-center overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onDoubleClick={() => zoomTo(scale > 1 ? 1 : 2.5)}
          >
            {/* Plain <img>: next/image adds a layout wrapper and srcset logic
                that fights a transform, and the file is already the size the
                page decided to ship. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={shot.src}
              src={optimised(shot.src)}
              onError={(e) => {
                // One retry only — without the guard a failing raw file would
                // loop the error handler forever.
                const el = e.currentTarget;
                if (el.dataset.fellBack) return;
                el.dataset.fellBack = "1";
                el.src = shot.src;
              }}
              alt={shot.alt}
              draggable={false}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transition: gesturing ? "none" : "transform 180ms ease-out",
              }}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="readout text-bone-dim hover:text-ember bg-void/80 border-line absolute right-4 top-4 border px-3 py-2 transition-colors"
          >
            CLOSE ✕
          </button>

          {shots.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous photo"
                className="readout text-bone-dim hover:text-ember bg-void/80 border-line absolute left-3 top-1/2 -translate-y-1/2 border px-3 py-4 transition-colors"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next photo"
                className="readout text-bone-dim hover:text-ember bg-void/80 border-line absolute right-3 top-1/2 -translate-y-1/2 border px-3 py-4 transition-colors"
              >
                →
              </button>
              <span className="readout text-bone-faint absolute bottom-5 left-1/2 -translate-x-1/2">
                {at + 1} / {shots.length}
                {scale > 1 && ` · ${scale.toFixed(1)}x`}
              </span>
            </>
          )}

          {shots.length === 1 && scale > 1 && (
            <span className="readout text-bone-faint absolute bottom-5 left-1/2 -translate-x-1/2">
              {scale.toFixed(1)}x
            </span>
          )}
        </div>
      )}
    </>
  );
}
