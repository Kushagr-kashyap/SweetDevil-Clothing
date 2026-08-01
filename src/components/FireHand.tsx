"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * "Devil's Aim" — a three-level shooting game.
 *
 * Rules live in React; physics and rendering live in a plain closure below.
 * A rAF loop driven from React state would re-render the tree 60x a second.
 *
 * The pixels are real, not faked: the backing store is rendered at 1/SCALE
 * resolution with smoothing off, then blown up by CSS with
 * `image-rendering: pixelated`. Every sprite is whole-pixel rects.
 */

/**
 * Sizing is load-bearing, so the reasoning is written down.
 *
 * On a 375px phone the panel is ~351px wide. At SCALE 3 that's ~117 game
 * pixels. The cannon takes 34 and the skull sits 18 from the right, leaving the
 * fireball ~65 pixels of flight — about half a second, which is what forces you
 * to lead a moving target instead of shooting at it.
 *
 * An earlier build used SCALE 4 with a 56px cannon and left SIX pixels of
 * travel; the ball detonated on spawn. If you resize the cannon, redo this sum.
 */
const SCALE = 3;
const VH = 76;
const HAND_W = 34;
const SKULL_H = 11;

/** Shots per level. 15 total — the cap is what makes a score mean anything. */
export const LEVEL_SHOTS = [5, 5, 5] as const;
export const TOTAL_SHOTS = LEVEL_SHOTS.reduce((a, b) => a + b, 0);

/**
 * Difficulty per level. The skull always *travels* to a new random spot rather
 * than teleporting — unpredictable but still aimable. Pure randomness reads as
 * unfair; random destinations at a readable speed reads as hard.
 */
const LEVELS = [
  { speed: 0.3, pause: 30, range: 0.5 }, // only 5 shots to learn on, so gentle
  // Level 2 is deliberately EASIER than level 1 feels, not harder — it sweeps
  // the full height so it looks more dramatic, but moves slower and rests
  // twice as long at each end. Big travel reads as "harder" while a long dwell
  // at the turnaround is what actually makes it hittable.
  //
  // Tuned so a player who half-tries clears 10 hits and lands the 10% tier:
  // the reward has to feel reachable or nobody plays a second round. Level 3
  // is where 20% is earned.
  { speed: 0.44, pause: 24, range: 1.0 },
  { speed: 0.95, pause: 4, range: 1.0 }, // full height, barely rests
];

/** Hits needed for each discount tier. */
export const TIERS = [
  { min: 15, pct: 20, label: "flat 20% off" }, // perfect round
  { min: 10, pct: 10, label: "10% off" },
  { min: 5, pct: 5, label: "5% off" },
] as const;

export const tierFor = (hits: number) => TIERS.find((t) => hits >= t.min) ?? null;

/** Deliberately tiny palette — a wide ramp reads as airbrush, not sprite. */
const PAL = {
  ink: "#14161c",
  metalDark: "#31343d",
  metal: "#565c69",
  metalLite: "#8b93a2",
  shine: "#ccd3e0",
  bone: "#ded6c6",
  boneDark: "#8b8371",
  core: "#fff4c9",
  hot: "#ffd23f",
  mid: "#ff8a1f",
  outer: "#e8331c",
  deep: "#8f1e0c",
  guide: "#3a2320",
  starFar: "#4a2c2a",
  starNear: "#9c6b5e",
};

type Ball = { x: number; y: number; vx: number; vy: number; age: number; life: number; hit: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; age: number; life: number };
type Star = { x: number; y: number; sp: number; near: boolean };

type Engine = {
  fire: () => void;
  setLevel: (n: number) => void;
  reset: () => void;
  destroy: () => void;
};

function createEngine(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  onResult: (hit: boolean) => void,
): Engine {
  const ctx = canvas.getContext("2d")!;
  let balls: Ball[] = [];
  let sparks: Spark[] = [];
  let stars: Star[] = [];
  let raf: number | null = null;
  let lit = 0;
  let shake = 0;
  let vw = 0;
  let targetHp = 1;
  let respawn = 0;
  let visible = false;
  let level = 0;

  let skullY = VH / 2;
  let skullTo = VH / 2;
  let dwell = 0;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };

  /** Disc from integer pixels — an arc would anti-alias and mush the edge. */
  const disc = (cx: number, cy: number, r: number, c: string, squash = 1) => {
    ctx.fillStyle = c;
    const rr = r * r;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r * squash; dx <= r * squash; dx++) {
        const nx = dx / squash;
        if (nx * nx + dy * dy <= rr) ctx.fillRect(Math.round(cx + dx), Math.round(cy + dy), 1, 1);
      }
    }
  };

  const targetX = () => vw - 18;

  const seedStars = () => {
    stars = [];
    const n = Math.round(vw * 0.34);
    for (let i = 0; i < n; i++) {
      const near = Math.random() < 0.35;
      stars.push({
        x: Math.random() * vw,
        y: Math.random() * VH,
        sp: near ? 0.09 + Math.random() * 0.05 : 0.03 + Math.random() * 0.03,
        near,
      });
    }
  };

  const pickSkullTarget = () => {
    const spread = (VH / 2 - 10) * LEVELS[level].range;
    skullTo = VH / 2 + (Math.random() * 2 - 1) * spread;
  };

  /* ── sprites ── */

  /** Silhouette first: ink block with the face inset by a pixel. Without this
      a 34px sprite reads as a scatter of grey bars rather than one object. */
  const plate = (x: number, y: number, w: number, h: number, face = PAL.metal) => {
    px(x, y, w, h, PAL.ink);
    if (w > 2 && h > 2) px(x + 1, y + 1, w - 2, h - 2, face);
  };

  const drawStars = () => {
    for (const s of stars) px(s.x, s.y, 1, 1, s.near ? PAL.starNear : PAL.starFar);
  };

  const drawCannon = () => {
    const y = VH / 2;
    plate(0, y - 10, 11, 20, PAL.metalDark);
    px(2, y - 8, 7, 1, PAL.metalLite);
    px(2, y + 6, 7, 1, PAL.metal);
    plate(10, y - 8, 5, 16, PAL.metalDark);
    plate(14, y - 12, 10, 24, PAL.metal);
    px(16, y - 10, 6, 1, PAL.metalLite);
    px(16, y - 3, 6, 1, PAL.metalDark);
    px(16, y + 4, 6, 1, PAL.metalDark);

    plate(23, y - 12, 9, 5, PAL.metalDark);
    px(25, y - 11, 1, 3, PAL.ink);
    px(27, y - 11, 1, 3, PAL.ink);
    px(29, y - 11, 1, 3, PAL.ink);
    plate(23, y + 7, 9, 5, PAL.metalDark);
    px(25, y + 8, 1, 3, PAL.ink);
    px(27, y + 8, 1, 3, PAL.ink);
    px(29, y + 8, 1, 3, PAL.ink);

    plate(23, y - 6, 6, 12, PAL.metal);
    plate(28, y - 5, 5, 10, PAL.metal);
    plate(32, y - 4, 4, 8, PAL.metalDark);
    px(34, y - 2, 2, 4, PAL.deep);
    px(35, y - 1, 1, 2, PAL.outer);

    ctx.fillStyle = PAL.shine;
    ([[3, -8], [3, 6], [8, -8], [17, -9], [21, -9]] as const).forEach(([rx, ry]) =>
      ctx.fillRect(rx, Math.round(y + ry), 1, 1),
    );

    if (lit > 0) {
      const a = Math.min(1, lit / 8);
      ctx.globalAlpha = a * 0.9;
      px(28, y - 7, 10, 14, PAL.mid);
      ctx.globalAlpha = a * 0.35;
      px(14, y - 12, 14, 24, PAL.outer);
      ctx.globalAlpha = 1;
    }
  };

  const drawGuide = () => {
    const y = Math.round(VH / 2);
    for (let x = 38; x < targetX() - 2; x += 6) px(x, y, 3, 1, PAL.guide);
  };

  const drawSkull = () => {
    if (targetHp <= 0) return;
    const x = targetX();
    const y = Math.round(skullY) - 6;
    px(x + 1, y, 9, 1, PAL.boneDark);
    px(x, y + 1, 11, 6, PAL.bone);
    px(x, y + 1, 11, 1, PAL.boneDark);
    px(x + 2, y + 3, 3, 3, PAL.ink);
    px(x + 6, y + 3, 3, 3, PAL.ink);
    px(x + 3, y + 4, 1, 1, PAL.outer);
    px(x + 7, y + 4, 1, 1, PAL.outer);
    px(x + 2, y + 7, 7, 3, PAL.bone);
    px(x + 3, y + 8, 1, 2, PAL.ink);
    px(x + 5, y + 8, 1, 2, PAL.ink);
    px(x + 7, y + 8, 1, 2, PAL.ink);
  };

  const paint = () => {
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (shake > 0) {
      ctx.setTransform(1, 0, 0, 1, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3);
    }

    drawStars();
    drawGuide();
    drawCannon();
    drawSkull();

    for (const s of sparks) {
      const t = s.age / s.life;
      px(s.x, s.y, 1, 1, t < 0.3 ? PAL.core : t < 0.6 ? PAL.hot : t < 0.85 ? PAL.mid : PAL.outer);
    }

    for (const ball of balls) {
      const t = ball.age / ball.life;
      const stretch = 1 + Math.min(Math.hypot(ball.vx, ball.vy) / 5, 2.4);
      const size = 5 * (1 - t * 0.4);
      for (let i = 5; i >= 1; i--) {
        const r = Math.max(1, size - i * 0.75);
        disc(
          ball.x - ball.vx * 0.34 * i,
          ball.y + (i % 2 ? 0.4 : -0.4),
          r,
          i > 3 ? PAL.deep : i > 2 ? PAL.outer : PAL.mid,
          stretch,
        );
      }
      disc(ball.x, ball.y, Math.max(1, size), PAL.outer, stretch);
      disc(ball.x, ball.y, Math.max(1, size - 1.4), PAL.mid, stretch);
      disc(ball.x, ball.y, Math.max(1, size - 2.8), PAL.hot, stretch);
      if (t < 0.72) disc(ball.x + 0.6, ball.y, Math.max(1, size - 4), PAL.core, 1.2);
    }
  };

  const burst = (x: number, y: number, n: number, power: number) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = Math.random() * power;
      sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: 20 + Math.random() * 30 });
    }
  };

  const step = () => {
    const cfg = LEVELS[level];

    for (const s of stars) {
      if (reduced) break; // drifting starfield is pure decoration
      s.x -= s.sp;
      if (s.x < 0) {
        s.x = vw;
        s.y = Math.random() * VH;
      }
    }

    {
      if (dwell > 0) dwell -= 1;
      else {
        const d = skullTo - skullY;
        if (Math.abs(d) < cfg.speed) {
          skullY = skullTo;
          dwell = cfg.pause;
          pickSkullTarget();
        } else skullY += Math.sign(d) * cfg.speed * (reduced ? 0.6 : 1);
      }
    }

    if (lit > 0) lit -= 1;
    if (shake > 0) shake -= 1;
    if (respawn > 0) {
      respawn -= 1;
      if (respawn === 0) targetHp = 1;
    }

    for (const ball of balls) {
      ball.age += 1;
      ball.vx += 0.07;
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (!reduced && ball.age < ball.life * 0.85 && sparks.length < 220) {
        for (let i = 0; i < 2; i++) {
          sparks.push({
            x: ball.x - ball.vx * 0.5,
            y: ball.y + (Math.random() - 0.5) * 5,
            vx: -0.3 - Math.random() * 1.1 + ball.vx * 0.12,
            vy: (Math.random() - 0.5) * 0.9,
            age: 0,
            life: 22 + Math.random() * 24,
          });
        }
      }

      const inX = ball.x >= targetX() - 3 && ball.x <= targetX() + 13;
      const inY = Math.abs(ball.y - skullY) < SKULL_H / 2 + 2;
      if (targetHp > 0 && !ball.hit && inX && inY) {
        ball.hit = true;
        targetHp = 0;
        respawn = 46;
        shake = reduced ? 0 : 7;
        burst(targetX() + 5, skullY, reduced ? 10 : 34, 2.6);
        ball.age = ball.life;
        onResult(true);
      }
    }

    for (const s of sparks) {
      s.age += 1;
      s.vy += 0.035;
      s.vx *= 0.985;
      s.x += s.vx;
      s.y += s.vy;
    }

    for (const b of balls) {
      if (!b.hit && b.x >= vw + 20) {
        b.hit = true; // report once
        onResult(false);
      }
    }

    balls = balls.filter((b) => b.age < b.life && b.x < vw + 24);
    sparks = sparks.filter((s) => s.age < s.life && s.y < VH + 6);
    paint();
  };

  const loop = () => {
    step();
    raf = visible ? requestAnimationFrame(loop) : null;
  };
  const start = () => {
    if (raf === null && visible) raf = requestAnimationFrame(loop);
  };

  const resize = () => {
    const w = Math.max(60, Math.ceil(host.getBoundingClientRect().width / SCALE));
    vw = w;
    canvas.width = w;
    canvas.height = VH;
    canvas.style.width = `${w * SCALE}px`;
    canvas.style.height = `${VH * SCALE}px`;
    seedStars();
    paint();
  };

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  pickSkullTarget();

  /* Only animate on screen — the skull and stars move continuously now, and
     running that off-screen would drain phone battery for nothing. */
  const io = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    },
    { rootMargin: "60px" },
  );
  io.observe(host);

  return {
    fire() {
      balls.push({
        x: HAND_W + 4,
        y: VH / 2,
        vx: 1.2 + Math.random() * 0.3,
        vy: 0,
        age: 0,
        life: 150,
        hit: false,
      });
      burst(HAND_W + 3, VH / 2, reduced ? 5 : 14, 1.9);
      lit = 9;
      start();
    },
    setLevel(n) {
      level = Math.max(0, Math.min(LEVELS.length - 1, n));
      pickSkullTarget();
    },
    reset() {
      balls = [];
      sparks = [];
      level = 0;
      targetHp = 1;
      respawn = 0;
      skullY = VH / 2;
      pickSkullTarget();
      paint();
    },
    destroy() {
      ro.disconnect();
      io.disconnect();
      visible = false;
      if (raf !== null) cancelAnimationFrame(raf);
    },
  };
}

type Phase = "idle" | "playing" | "done";

export default function FireHand({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  /**
   * Shot counters live in a ref, not in state.
   *
   * React batches renders, so several taps inside one frame all read the same
   * stale `fired`/`level` and most of them are swallowed — tapping fast on a
   * phone silently loses shots. The ref updates synchronously, so every tap is
   * counted; state exists only to drive the render.
   */
  const game = useRef({ phase: "idle" as Phase, level: 0, fired: 0 });
  const [view, setView] = useState({ phase: "idle" as Phase, level: 0, fired: 0 });
  const [hits, setHits] = useState(0);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);

  const sync = useCallback(() => setView({ ...game.current }), []);

  const result = useCallback((didHit: boolean) => {
    if (didHit) setHits((n) => n + 1);
    setFlash(didHit ? "hit" : "miss");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const engine = createEngine(canvas, host, result);
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [result]);

  const { phase, level } = view;
  const shotsUsed =
    LEVEL_SHOTS.slice(0, view.level).reduce((a, b) => a + b, 0) + view.fired;

  const onTap = () => {
    const g = game.current;
    if (g.phase === "done") return;

    if (g.phase === "idle") {
      g.phase = "playing";
      g.level = 0;
      g.fired = 0;
      setHits(0);
      setFlash(null);
      engineRef.current?.setLevel(0);
      engineRef.current?.reset();
      sync();
      return; // the first tap starts the round rather than burning a shot
    }

    if (g.fired >= LEVEL_SHOTS[g.level]) return;

    setFlash(null);
    engineRef.current?.fire();
    g.fired += 1;

    if (g.fired >= LEVEL_SHOTS[g.level]) {
      if (g.level < LEVEL_SHOTS.length - 1) {
        g.level += 1;
        g.fired = 0;
        engineRef.current?.setLevel(g.level);
      } else {
        g.phase = "done";
      }
    }
    sync();
  };

  const replay = () => {
    game.current = { phase: "idle", level: 0, fired: 0 };
    setHits(0);
    setFlash(null);
    engineRef.current?.setLevel(0);
    engineRef.current?.reset();
    sync();
  };

  const tier = tierFor(hits);

  return (
    <div className={`px-[max(1.25rem,5vw)] py-6 ${className}`}>
      <div
        className="chassis cut relative w-full select-none overflow-hidden"
        style={{ ["--cut" as string]: "12px" }}
      >
        {/* ── header: level + shots ── */}
        <div className="border-line/60 flex items-center justify-between gap-3 border-b px-3 py-1.5">
          <span className="readout text-ember">
            {phase === "done" ? "round over" : `level ${level + 1} / 3`}
          </span>
          <span className="readout text-bone-faint tabular-nums">
            {phase === "idle"
              ? `${TOTAL_SHOTS} shots`
              : `${Math.max(0, TOTAL_SHOTS - shotsUsed)} shots left`}
          </span>
        </div>

        <div ref={hostRef} className="relative w-full" style={{ height: VH * SCALE }}>
          <canvas
            ref={canvasRef}
            aria-hidden
            className="absolute left-0 top-0"
            style={{ imageRendering: "pixelated" }}
          />

          {/* `click`, not pointerdown — the browser withholds click during a
              scroll drag, so swiping past never fires it by accident. */}
          {phase !== "done" && (
            <button
              type="button"
              onClick={onTap}
              aria-label={phase === "idle" ? "Start Devil's Aim" : "Fire at the skull"}
              className="absolute inset-0 h-full w-full"
            />
          )}

          {phase === "idle" && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="bg-void/75 cut px-4 py-3 text-center" style={{ ["--cut" as string]: "10px" }}>
                <p className="display text-bone text-[1.15rem]">Devil&apos;s Aim</p>
                <p className="readout text-bone-faint mt-1">
                  {TOTAL_SHOTS} shots · 3 levels · tap to start
                </p>
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="absolute inset-0 grid place-items-center">
              <div
                className="bg-void/90 cut px-5 py-4 text-center"
                style={{ ["--cut" as string]: "12px" }}
              >
                <p className="readout text-bone-faint">
                  {hits} / {TOTAL_SHOTS} hits
                </p>
                <p
                  className={`display mt-1 text-[1.4rem] ${tier ? "text-ember" : "text-bone"}`}
                >
                  {tier ? tier.label : "no reward"}
                </p>
                <p className="readout text-bone-faint mt-1">
                  {tier ? "unlocks at checkout — coming soon" : "5 hits unlocks 5%"}
                </p>
                <button
                  type="button"
                  onClick={replay}
                  className="cut bg-bone text-void label mt-3 px-4 py-2"
                  style={{ ["--cut" as string]: "8px" }}
                >
                  Play again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── footer: feedback + score ── */}
        <div className="border-line/60 flex items-center justify-between gap-3 border-t px-3 py-1.5">
          <span
            className={`readout ${
              flash === "hit" ? "text-ember" : flash === "miss" ? "text-bone-dim" : "text-bone-faint"
            }`}
          >
            {flash === "hit"
              ? "◆ direct hit"
              : flash === "miss"
                ? "× missed — lead the shot"
                : phase === "idle"
                  ? "▶ hit 5 to win a discount"
                  : "▶ time it, then tap"}
          </span>
          <span className="readout text-bone-faint shrink-0 tabular-nums">
            <span className="text-ember">{String(hits).padStart(2, "0")}</span> hits
          </span>
        </div>
      </div>
    </div>
  );
}
