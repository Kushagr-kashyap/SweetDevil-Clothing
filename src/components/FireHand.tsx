"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { claimReward, countdown, useReward } from "@/lib/reward";
import { nextTier, tierFor, TIERS, TOTAL_SHOTS } from "@/lib/reward-tiers";

/**
 * "Devil's Aim" — a five-level arcade shooter.
 *
 * Rules live in React; physics and rendering live in a plain closure below.
 * A rAF loop driven from React state would re-render the tree 60x a second.
 *
 * The pixels are real, not faked: the backing store is rendered at 1/scale
 * resolution with smoothing off, then blown up by CSS with
 * `image-rendering: pixelated`. Every sprite is whole-pixel rects.
 *
 * ── WHY THIS PLAYS THE WAY IT DOES ──────────────────────────────────────────
 * The first version fired every ball down the centre line with `vy: 0`, so a
 * skull was only hittable while crossing the middle. The optimal strategy was
 * therefore to WAIT, and playtesters correctly called it "a patience game".
 *
 * Now the shot goes wherever you tap. The skull is hittable everywhere, waiting
 * buys you nothing, and the skill is leading a moving target across a ~0.5s
 * flight. Do not reintroduce a fixed firing line.
 */

/* ── world ──────────────────────────────────────────────────────────────── */

/** Game-space height. Everything vertical is measured against this. */
const GAME_H = 92;

/**
 * The cannon is bolted to the LEFT edge and the skulls live at the right, so
 * the corridor is as wide as the panel.
 *
 * That corridor is ~65px on a phone and ~350px on a desktop, which would make
 * the same shot take half a second on one and three seconds on the other. So
 * ball speed is DERIVED from the corridor instead of being a constant: every
 * screen gets the same FLIGHT_FRAMES of travel time, and the reflex the game
 * asks for is identical everywhere.
 *
 * An earlier build fixed this by centring a narrow arena instead. It kept the
 * timing honest and left the cannon floating in dead space — don't go back.
 */
const CANNON_X = 12; // barrel pivot, from the left edge
const FLIGHT_FRAMES = 32; // ~0.53s at 60Hz, on every device
const BARREL_LEN = 15;
const SKULL_W = 11;
const SKULL_H = 11;

/** Simulation runs at a fixed 60Hz regardless of display refresh rate.
    Without this the game runs at double speed on a 120Hz ProMotion iPhone. */
const STEP_MS = 1000 / 60;

/* ── difficulty ─────────────────────────────────────────────────────────── */

/**
 * Each level introduces an IDEA, not just a bigger number. Five levels of
 * "same skull, faster" reads as padding; five levels of "now there are two",
 * "now it weaves", "now one is armoured" reads as a game.
 *
 * `range` is the fraction of the playable height a skull may roam.
 * `dwell` is how long it rests at a waypoint — the rest is what makes a fast
 * target hittable, so cutting dwell is the sharpest difficulty lever here.
 */
type Pattern = "waypoint" | "weave";

type LevelDef = {
  name: string;
  blurb: string;
  count: number;
  speed: number;
  dwell: number;
  range: number;
  pattern: Pattern;
  /** Horizontal wander, in game px, added on top of the vertical movement. */
  drift: number;
  /** Index of the target given armour (2 hits). -1 for none. */
  armoured: number;
};

const LEVELS: LevelDef[] = [
  {
    name: "Warm up",
    blurb: "one skull",
    count: 1,
    speed: 0.42,
    dwell: 32,
    range: 0.55,
    pattern: "waypoint",
    drift: 0,
    armoured: -1,
  },
  {
    name: "Twin",
    blurb: "two targets",
    count: 2,
    speed: 0.55,
    dwell: 20,
    range: 0.85,
    pattern: "waypoint",
    drift: 0,
    armoured: -1,
  },
  {
    name: "Runner",
    blurb: "it weaves",
    count: 1,
    speed: 1.15,
    dwell: 0,
    range: 1,
    pattern: "weave",
    drift: 4,
    armoured: -1,
  },
  {
    name: "Armoured",
    blurb: "bone plate — two hits",
    count: 2,
    speed: 0.72,
    dwell: 12,
    range: 0.95,
    pattern: "waypoint",
    drift: 0,
    armoured: 0,
  },
  {
    name: "Inferno",
    blurb: "three, and they don't rest",
    count: 3,
    speed: 1.0,
    dwell: 5,
    range: 1,
    pattern: "weave",
    drift: 3,
    armoured: 2,
  },
];

/**
 * Derived, never configured. TOTAL_SHOTS lives in reward-tiers.ts because it is
 * what the SERVER validates a submitted score against; deriving the per-level
 * count from it means adding a level here can't quietly let someone claim a
 * score the server would reject.
 */
const SHOTS_PER_LEVEL = Math.floor(TOTAL_SHOTS / LEVELS.length);

/**
 * The two tiers the copy on this panel quotes out loud: the best one you can
 * win, and the cheapest one you can clear.
 *
 * reward-tiers.ts asks to be the only place a percentage is written down, and
 * these were typed in by hand against it — so retuning TIERS would have left
 * the page promising "up to 20% off" while paying something else. TIERS is
 * ordered richest first, which is the same order the tier lookup relies on.
 */
const TOP_TIER = TIERS[0];
const FLOOR_TIER = TIERS[TIERS.length - 1];

/** Deliberately tiny palette — a wide ramp reads as airbrush, not sprite. */
const PAL = {
  ink: "#14161c",
  metalDark: "#31343d",
  metal: "#565c69",
  metalLite: "#8b93a2",
  shine: "#ccd3e0",
  bone: "#ded6c6",
  boneDark: "#8b8371",
  steel: "#6f7d92",
  steelLite: "#a9b6c9",
  core: "#fff4c9",
  hot: "#ffd23f",
  mid: "#ff8a1f",
  outer: "#e8331c",
  deep: "#8f1e0c",
  guide: "#3a2320",
  guideHot: "#7d4030",
  starFar: "#4a2c2a",
  starNear: "#9c6b5e",
};

/* ── sound ──────────────────────────────────────────────────────────────── */

/**
 * Synthesised, not sampled — three audio files would cost more to download than
 * the whole game does, and this is a shop page. Built lazily on the first tap
 * because browsers refuse an AudioContext created before a user gesture.
 */
function createAudio() {
  let ctx: AudioContext | null = null;
  let muted = false;

  const ac = () => {
    if (!ctx) {
      type WithWebkit = typeof window & { webkitAudioContext?: typeof AudioContext };
      const Ctor = window.AudioContext ?? (window as WithWebkit).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  };

  const tone = (
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    bend = 1,
    delay = 0,
  ) => {
    const c = ac();
    if (!c || muted) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (bend !== 1) osc.frequency.exponentialRampToValueAtTime(freq * bend, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  };

  /** White noise through a fast decay — the "crunch" half of every impact. */
  const noise = (dur: number, gain: number, hp: number, delay = 0) => {
    const c = ac();
    if (!c || muted) return;
    const t0 = c.currentTime + delay;
    const frames = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, frames, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = hp;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(c.destination);
    src.start(t0);
  };

  return {
    setMuted(v: boolean) {
      muted = v;
    },
    fire() {
      tone(320, 0.16, "sawtooth", 0.05, 0.4);
      noise(0.1, 0.05, 900);
    },
    /** Pitch climbs with the streak, so a run of hits audibly escalates. */
    hit(streak: number) {
      tone(520 * 1.06 ** Math.min(streak, 8), 0.1, "square", 0.05, 1.5);
      noise(0.09, 0.07, 1600);
    },
    kill(streak: number) {
      tone(180, 0.26, "triangle", 0.09, 0.35);
      tone(760 * 1.05 ** Math.min(streak, 8), 0.14, "square", 0.04, 1.7);
      noise(0.22, 0.09, 500);
    },
    armour() {
      tone(240, 0.1, "square", 0.05, 0.7);
      noise(0.07, 0.06, 2600);
    },
    graze() {
      tone(1500, 0.05, "sine", 0.035, 0.6);
    },
    miss() {
      tone(150, 0.12, "sine", 0.025, 0.7);
    },
    level() {
      tone(440, 0.1, "square", 0.045);
      tone(660, 0.16, "square", 0.045, 1, 0.1);
    },
    win(pct: number) {
      const notes = pct >= 20 ? [523, 659, 784, 1047] : pct >= 15 ? [523, 659, 784] : [523, 659];
      notes.forEach((n, i) => tone(n, 0.24, "square", 0.05, 1, i * 0.09));
    },
  };
}

type Audio = ReturnType<typeof createAudio>;

/* ── engine ─────────────────────────────────────────────────────────────── */

type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  /** Set once the shot has been scored, so it can only ever report once. */
  done: boolean;
  /** Closest approach to a skull, used to decide a graze on a miss. */
  near: number;
};
type Spark = { x: number; y: number; vx: number; vy: number; age: number; life: number };
type Star = { x: number; y: number; sp: number; near: boolean };
type Target = {
  x: number;
  y: number;
  toY: number;
  dwell: number;
  hp: number;
  maxHp: number;
  /** Phase offset so two weaving skulls never move in lockstep. */
  phase: number;
  baseX: number;
  dead: number;
};

export type ShotEvent = {
  kind: "kill" | "armour" | "graze" | "miss";
};

type Engine = {
  fire: (tx: number, ty: number) => void;
  aimAt: (p: { x: number; y: number } | null) => void;
  clearGuide: () => void;
  startLevel: (n: number) => void;
  pause: (frames: number) => void;
  reset: () => void;
  destroy: () => void;
  toGame: (clientX: number, clientY: number) => { x: number; y: number } | null;
  /** True while a fired ball is still in the air — used to hold the end card. */
  inFlight: () => boolean;
};

function createEngine(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  audio: Audio,
  onShot: (e: ShotEvent) => void,
): Engine {
  const ctx = canvas.getContext("2d")!;
  let balls: Ball[] = [];
  let sparks: Spark[] = [];
  let stars: Star[] = [];
  let targets: Target[] = [];

  let raf: number | null = null;
  let acc = 0;
  let last = 0;
  let visible = false;

  let vw = 0;
  let scale = 3;
  let ax0 = 0; // corridor left edge, in game px
  let ax1 = 0; // corridor right edge
  let ballSpeed = 1.35; // recomputed on resize — see FLIGHT_FRAMES

  let level = 0;
  let lit = 0;
  let shake = 0;
  let recoil = 0;
  /** Frames of frozen simulation after a kill. The cheapest way to make an
      impact feel heavy is to briefly stop time. */
  let freeze = 0;
  let held = 0; // externally requested pause (level banners)

  let aim: { x: number; y: number } | null = null;

  /**
   * Whether to DRAW the aim guide — separate from `aim` itself, which the
   * barrel keeps using for its angle either way.
   *
   * The dotted line and crosshair are a preview of where the next shot will go,
   * and a preview only means anything while a pointer is hovering. On a phone
   * there is no hover: the tap IS the shot, so the guide could only ever be
   * left over from the last one, drawn across empty space and pointing at
   * wherever the previous skull happened to be. Players read that as "the game
   * says my next shot lands here" and aimed at the line instead of the skull.
   *
   * So on touch it is never drawn at all, and the cannon simply stays pointing
   * where it was last fired.
   */
  let guide = false;
  const canHover = window.matchMedia("(hover: hover)").matches;

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

  const pivot = () => ({ x: ax0 + CANNON_X, y: GAME_H / 2 });

  /** Where skulls are allowed to live: the right third of the arena. */
  const spawnX = () => ax1 - 26 + Math.random() * 12;
  const yBounds = (range: number) => {
    const half = (GAME_H / 2 - 10) * range;
    return { lo: GAME_H / 2 - half, hi: GAME_H / 2 + half };
  };

  const seedStars = () => {
    stars = [];
    const n = Math.round(vw * 0.34);
    for (let i = 0; i < n; i++) {
      const near = Math.random() < 0.35;
      stars.push({
        x: Math.random() * vw,
        y: Math.random() * GAME_H,
        sp: near ? 0.09 + Math.random() * 0.05 : 0.03 + Math.random() * 0.03,
        near,
      });
    }
  };

  const pickWaypoint = (t: Target) => {
    const { lo, hi } = yBounds(LEVELS[level].range);
    t.toY = lo + Math.random() * (hi - lo);
  };

  const spawnTargets = () => {
    const cfg = LEVELS[level];
    targets = [];
    for (let i = 0; i < cfg.count; i++) {
      const { lo, hi } = yBounds(cfg.range);
      const hp = i === cfg.armoured ? 2 : 1;
      const t: Target = {
        x: spawnX(),
        baseX: 0,
        y: lo + ((i + 0.5) / cfg.count) * (hi - lo),
        toY: 0,
        dwell: i * 8,
        hp,
        maxHp: hp,
        phase: Math.random() * Math.PI * 2,
        dead: 0,
      };
      t.baseX = t.x;
      pickWaypoint(t);
      targets.push(t);
    }
  };

  /* ── sprites ── */

  /** Silhouette first: ink block with the face inset by a pixel. Without this
      a small sprite reads as a scatter of grey bars rather than one object. */
  const plate = (x: number, y: number, w: number, h: number, face = PAL.metal) => {
    px(x, y, w, h, PAL.ink);
    if (w > 2 && h > 2) px(x + 1, y + 1, w - 2, h - 2, face);
  };

  const drawStars = () => {
    for (const s of stars) px(s.x, s.y, 1, 1, s.near ? PAL.starNear : PAL.starFar);
  };

  /**
   * Aim line. Dots rather than a stroke, thinning with distance, so it reads as
   * a sight rather than a laser — and so it never visually blocks the skull it
   * is pointing at.
   */
  const drawAim = () => {
    if (!aim || !guide) return;
    const p = pivot();
    const dx = aim.x - p.x;
    const dy = aim.y - p.y;
    const len = Math.hypot(dx, dy);
    if (len < 4) return;
    const ux = dx / len;
    const uy = dy / len;
    for (let d = BARREL_LEN + 4; d < len - 3; d += 5) {
      px(p.x + ux * d, p.y + uy * d, 1, 1, d < len * 0.6 ? PAL.guideHot : PAL.guide);
    }
    // crosshair
    const cx = Math.round(aim.x);
    const cy = Math.round(aim.y);
    px(cx - 3, cy, 2, 1, PAL.guideHot);
    px(cx + 2, cy, 2, 1, PAL.guideHot);
    px(cx, cy - 3, 1, 2, PAL.guideHot);
    px(cx, cy + 2, 1, 2, PAL.guideHot);
  };

  /**
   * Turret base plus a barrel drawn ALONG the aim vector. A rotated bitmap
   * would need smoothing and lose the pixel grid, so the barrel is stamped as
   * overlapping plates stepped down the angle instead — it rotates freely and
   * still lands on whole pixels.
   */
  const drawCannon = () => {
    const p = pivot();
    const y = p.y;

    // base
    plate(ax0, y - 10, 11, 20, PAL.metalDark);
    px(ax0 + 2, y - 8, 7, 1, PAL.metalLite);
    px(ax0 + 2, y + 6, 7, 1, PAL.metal);
    plate(ax0 + 10, y - 8, 5, 16, PAL.metalDark);

    // vents
    plate(ax0 + 6, y - 13, 9, 5, PAL.metalDark);
    plate(ax0 + 6, y + 8, 9, 5, PAL.metalDark);
    for (const vx of [8, 10, 12]) {
      px(ax0 + vx, y - 12, 1, 3, PAL.ink);
      px(ax0 + vx, y + 9, 1, 3, PAL.ink);
    }

    // barrel along the aim
    let ux = 1;
    let uy = 0;
    if (aim) {
      const dx = aim.x - p.x;
      const dy = aim.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      ux = dx / len;
      uy = dy / len;
    }
    const back = recoil * 0.5;
    for (let d = 0; d <= BARREL_LEN; d += 1) {
      const bx = p.x + ux * (d - back);
      const by = p.y + uy * (d - back);
      const w = d > BARREL_LEN - 4 ? 4 : 5;
      px(bx - w / 2, by - w / 2, w, w, PAL.ink);
      px(bx - w / 2 + 1, by - w / 2 + 1, w - 2, w - 2, d > BARREL_LEN - 4 ? PAL.metalDark : PAL.metal);
    }

    // hub, drawn last so the barrel appears to pass behind it
    disc(p.x, p.y, 5, PAL.ink);
    disc(p.x, p.y, 4, PAL.metal);
    disc(p.x, p.y, 2, PAL.metalLite);

    if (lit > 0) {
      const a = Math.min(1, lit / 8);
      const mx = p.x + ux * (BARREL_LEN + 1 - back);
      const my = p.y + uy * (BARREL_LEN + 1 - back);
      ctx.globalAlpha = a * 0.9;
      disc(mx, my, 4, PAL.hot);
      ctx.globalAlpha = a * 0.4;
      disc(mx, my, 7, PAL.mid);
      ctx.globalAlpha = 1;
    }
  };

  const drawSkull = (t: Target) => {
    if (t.hp <= 0) return;
    const x = Math.round(t.x);
    const y = Math.round(t.y) - 5;

    // armour plate rides in front and is what the first hit removes
    if (t.hp > 1) {
      px(x - 4, y, 3, 11, PAL.ink);
      px(x - 3, y + 1, 2, 9, PAL.steel);
      px(x - 3, y + 2, 1, 3, PAL.steelLite);
    }

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
    drawAim();
    drawCannon();
    for (const t of targets) drawSkull(t);

    for (const s of sparks) {
      const t = s.age / s.life;
      px(s.x, s.y, 1, 1, t < 0.3 ? PAL.core : t < 0.6 ? PAL.hot : t < 0.85 ? PAL.mid : PAL.outer);
    }

    for (const ball of balls) {
      const t = ball.age / ball.life;
      const speed = Math.hypot(ball.vx, ball.vy);
      const stretch = 1 + Math.min(speed / 5, 2.4);
      const size = 5 * (1 - t * 0.4);
      for (let i = 5; i >= 1; i--) {
        const r = Math.max(1, size - i * 0.75);
        disc(
          ball.x - ball.vx * 0.34 * i,
          ball.y - ball.vy * 0.34 * i,
          r,
          i > 3 ? PAL.deep : i > 2 ? PAL.outer : PAL.mid,
          stretch,
        );
      }
      disc(ball.x, ball.y, Math.max(1, size), PAL.outer, stretch);
      disc(ball.x, ball.y, Math.max(1, size - 1.4), PAL.mid, stretch);
      disc(ball.x, ball.y, Math.max(1, size - 2.8), PAL.hot, stretch);
      if (t < 0.72) disc(ball.x, ball.y, Math.max(1, size - 4), PAL.core, 1.2);
    }
  };

  const burst = (x: number, y: number, n: number, power: number) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = Math.random() * power;
      sparks.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        age: 0,
        life: 20 + Math.random() * 30,
      });
    }
  };

  /** Bone chips: a kill throws pale debris, distinct from the fire sparks. */
  const chips = (x: number, y: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const sp = 0.6 + Math.random() * 1.8;
      sparks.push({
        x,
        y,
        vx: Math.cos(a) * sp + 0.6,
        vy: Math.sin(a) * sp,
        age: 0,
        life: 34 + Math.random() * 26,
      });
    }
  };

  const settle = (ball: Ball, kind: ShotEvent["kind"]) => {
    if (ball.done) return;
    ball.done = true;
    onShot({ kind });
  };

  /**
   * Tests one ball against every live skull and scores at most one of them.
   * Also records the closest approach, which is what decides a graze when the
   * shot goes on to miss. Returns true once the shot is spent.
   */
  const impact = (ball: Ball) => {
    for (const t of targets) {
      if (t.hp <= 0) continue;
      const dy = ball.y - t.y;
      const dist = Math.hypot(ball.x - (t.x + SKULL_W / 2), dy);
      if (dist < ball.near) ball.near = dist;

      const inX = ball.x >= t.x - (t.hp > 1 ? 5 : 2) && ball.x <= t.x + SKULL_W + 2;
      const inY = Math.abs(dy) < SKULL_H / 2 + 2;
      if (!inX || !inY) continue;

      t.hp -= 1;
      recoil = Math.max(recoil, 2);
      if (t.hp > 0) {
        // armour shrugged it off
        burst(t.x - 3, t.y, reduced ? 6 : 18, 2.2);
        shake = reduced ? 0 : 3;
        settle(ball, "armour");
      } else {
        t.dead = 44;
        shake = reduced ? 0 : 8;
        freeze = reduced ? 0 : 4;
        burst(t.x + 5, t.y, reduced ? 10 : 34, 2.8);
        chips(t.x + 5, t.y, reduced ? 4 : 14);
        settle(ball, "kill");
      }
      ball.age = ball.life;
      return true;
    }
    return false;
  };

  const step = () => {
    const cfg = LEVELS[level];

    for (const s of stars) {
      if (reduced) break; // drifting starfield is pure decoration
      s.x -= s.sp;
      if (s.x < 0) {
        s.x = vw;
        s.y = Math.random() * GAME_H;
      }
    }

    if (lit > 0) lit -= 1;
    if (shake > 0) shake -= 1;
    if (recoil > 0) recoil = Math.max(0, recoil - 0.7);

    // Freeze halts the world but not the decay counters above, so the muzzle
    // flash and shake still read during the hitstop.
    if (freeze > 0) {
      freeze -= 1;
      return;
    }
    if (held > 0) {
      held -= 1;
      return;
    }

    /* ── targets ── */
    for (const t of targets) {
      if (t.hp <= 0) {
        if (t.dead > 0 && --t.dead === 0) {
          t.hp = t.maxHp;
          t.x = spawnX();
          t.baseX = t.x;
          const { lo, hi } = yBounds(cfg.range);
          t.y = lo + Math.random() * (hi - lo);
          pickWaypoint(t);
        }
        continue;
      }

      const sp = cfg.speed * (reduced ? 0.6 : 1);
      if (cfg.pattern === "weave") {
        // Continuous motion: no rest at all, so the only way to land a shot is
        // to lead it. This is what makes level 3 feel like a step up.
        const { lo, hi } = yBounds(cfg.range);
        const mid = (lo + hi) / 2;
        const amp = (hi - lo) / 2;
        t.phase += sp * 0.022;
        t.y = mid + Math.sin(t.phase) * amp;
      } else {
        if (t.dwell > 0) t.dwell -= 1;
        else {
          const d = t.toY - t.y;
          if (Math.abs(d) < sp) {
            t.y = t.toY;
            t.dwell = cfg.dwell;
            pickWaypoint(t);
          } else {
            // Eased approach rather than a constant crawl: a skull that slows
            // into its waypoint is readable, which is what separates "hard"
            // from "unfair".
            const ease = 0.45 + 0.55 * Math.min(1, Math.abs(d) / 18);
            t.y += Math.sign(d) * sp * ease;
          }
        }
      }

      if (cfg.drift) t.x = t.baseX + Math.sin(t.phase * 0.6 + 1.7) * cfg.drift;
    }

    /* ── balls ── */
    for (const ball of balls) {
      ball.age += 1;

      /**
       * Movement is sub-stepped, and collision is tested on every slice.
       *
       * Ball speed scales with the panel (see FLIGHT_FRAMES), so on a wide
       * monitor a frame moves the ball ~11px — wider than the 11px skull it is
       * aimed at, which means a whole-frame step could jump clean over a
       * target and report a miss on a perfect shot. Slices are kept to ~2px.
       */
      const slices = Math.max(1, Math.ceil(Math.hypot(ball.vx, ball.vy) / 2));
      for (let s = 0; s < slices; s++) {
        ball.x += ball.vx / slices;
        ball.y += ball.vy / slices;
        if (!ball.done && impact(ball)) break;
      }

      if (!reduced && ball.age < ball.life * 0.85 && sparks.length < 240) {
        for (let i = 0; i < 2; i++) {
          sparks.push({
            x: ball.x - ball.vx * 0.5,
            y: ball.y - ball.vy * 0.5 + (Math.random() - 0.5) * 4,
            vx: -ball.vx * 0.16 + (Math.random() - 0.5) * 0.6,
            vy: -ball.vy * 0.16 + (Math.random() - 0.5) * 0.6,
            age: 0,
            life: 22 + Math.random() * 24,
          });
        }
      }

      // Resolved the moment it clears the target zone, not when it leaves the
      // canvas — the old version sat on a known miss for a fifth of a second.
      //
      // The LEFT edge counts too. You can tap behind the cannon — its own base
      // is drawn there — and a shot that goes backwards used to match none of
      // these bounds, so it flew off-screen and stayed `done: false` until its
      // 190-frame life ran out: no miss scored, no streak broken, no sound, and
      // inFlight() pinning the level card shut for three silent seconds.
      const out =
        ball.x > ax1 + 2 || ball.x < ax0 - 6 || ball.y < -6 || ball.y > GAME_H + 6;
      if (!ball.done && out) {
        settle(ball, ball.near < SKULL_H ? "graze" : "miss");
      }
    }

    for (const s of sparks) {
      s.age += 1;
      s.vy += 0.035;
      s.vx *= 0.985;
      s.x += s.vx;
      s.y += s.vy;
    }

    balls = balls.filter(
      (b) => b.age < b.life && b.x > -24 && b.x < vw + 24 && b.y > -20 && b.y < GAME_H + 20,
    );
    sparks = sparks.filter((s) => s.age < s.life && s.y < GAME_H + 6);
  };

  const loop = (now: number) => {
    // Fixed timestep. A 120Hz phone gets two frames per simulation step
    // instead of running the whole game at double speed.
    const dt = Math.min(now - last, 120);
    last = now;
    acc += dt;
    let guard = 0;
    while (acc >= STEP_MS && guard++ < 6) {
      step();
      acc -= STEP_MS;
    }
    paint();
    raf = visible ? requestAnimationFrame(loop) : null;
  };

  const start = () => {
    if (raf === null && visible) {
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(loop);
    }
  };

  const resize = () => {
    const cssW = Math.max(120, host.getBoundingClientRect().width);
    // Chunkier pixels on a big screen keep the sprites the same apparent size
    // instead of shrinking them to specks.
    scale = cssW >= 760 ? 4 : 3;
    const w = Math.ceil(cssW / scale);
    vw = w;
    ax0 = 0;
    ax1 = w;
    // Same travel time on a 320px phone and a 1600px monitor.
    ballSpeed = Math.max(1.2, (ax1 - CANNON_X - BARREL_LEN - 12) / FLIGHT_FRAMES);
    canvas.width = w;
    canvas.height = GAME_H;
    canvas.style.width = `${w * scale}px`;
    canvas.style.height = `${GAME_H * scale}px`;
    seedStars();
    for (const t of targets) {
      t.x = Math.min(t.x, ax1 - 14);
      t.baseX = t.x;
    }
    paint();
  };

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  spawnTargets();

  /* Only animate on screen — the skulls and stars move continuously, and
     running that off-screen would drain phone battery for nothing. */
  const io = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    },
    { rootMargin: "60px" },
  );
  io.observe(host);

  return {
    fire(tx, ty) {
      const p = pivot();
      let dx = tx - p.x;
      let dy = ty - p.y;
      const len = Math.hypot(dx, dy);
      if (len < 6) {
        // A tap on the muzzle itself has no meaningful direction; fire flat
        // rather than dividing by ~zero and launching at a random angle.
        dx = 1;
        dy = 0;
      } else {
        dx /= len;
        dy /= len;
      }
      const speed = ballSpeed;
      balls.push({
        x: p.x + dx * (BARREL_LEN + 1),
        y: p.y + dy * (BARREL_LEN + 1),
        vx: dx * speed,
        vy: dy * speed,
        age: 0,
        life: 190,
        done: false,
        near: Infinity,
      });
      burst(p.x + dx * BARREL_LEN, p.y + dy * BARREL_LEN, reduced ? 5 : 14, 1.9);
      lit = 9;
      recoil = 4;
      audio.fire();
      start();
    },
    aimAt(p) {
      aim = p;
      guide = p !== null && canHover;
    },
    /** Drop the guide but keep the barrel angle — for a tap on a device that
        also has a mouse, where canHover alone can't tell the two apart. */
    clearGuide() {
      guide = false;
    },
    startLevel(n) {
      level = Math.max(0, Math.min(LEVELS.length - 1, n));
      balls = [];
      spawnTargets();
    },
    pause(frames) {
      held = frames;
    },
    reset() {
      balls = [];
      sparks = [];
      level = 0;
      freeze = 0;
      held = 0;
      aim = null;
      guide = false;
      spawnTargets();
      paint();
    },
    destroy() {
      ro.disconnect();
      io.disconnect();
      visible = false;
      if (raf !== null) cancelAnimationFrame(raf);
    },
    toGame(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      return {
        x: ((clientX - r.left) / r.width) * vw,
        y: ((clientY - r.top) / r.height) * GAME_H,
      };
    },
    inFlight() {
      return balls.some((b) => !b.done);
    },
  };
}

/* ── component ──────────────────────────────────────────────────────────── */

type Phase = "idle" | "playing" | "done";

const MUTE_KEY = "sd_aim_muted";

/** How long the level card holds. Taps are ignored while it is up, so this is
    dead time — long enough to read two words, and not a frame longer. */
const BANNER_MS = 700;

/**
 * localStorage read through useSyncExternalStore rather than an effect.
 *
 * The obvious `useEffect(() => setMuted(read()))` is a setState cascade on
 * every mount and React's lint rule rejects it. This is the sanctioned shape:
 * the server snapshot is always null, so the markup React renders on the
 * server and the markup it hydrates with agree, and the stored value lands on
 * the first client pass instead of a second render.
 */
const storeListeners = new Set<() => void>();

const subscribeStore = (fn: () => void) => {
  storeListeners.add(fn);
  // `storage` only fires in OTHER tabs, so same-tab writes notify by hand.
  window.addEventListener("storage", fn);
  return () => {
    storeListeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
};

const readStore = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // private mode / storage disabled
  }
};

const writeStore = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore — the game is still playable without a saved preference */
  }
  storeListeners.forEach((fn) => fn());
};

const useStored = (key: string) =>
  useSyncExternalStore(
    subscribeStore,
    () => readStore(key),
    () => null,
  );

export default function FireHand({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const audioRef = useRef<Audio | null>(null);

  /**
   * Shot counters live in a ref, not in state.
   *
   * React batches renders, so several taps inside one frame all read the same
   * stale `fired`/`level` and most of them are swallowed — tapping fast on a
   * phone silently loses shots. The ref updates synchronously, so every tap is
   * counted; state exists only to drive the render.
   */
  const game = useRef({ phase: "idle" as Phase, level: 0, fired: 0, hits: 0, streak: 0 });
  const [view, setView] = useState({ phase: "idle" as Phase, level: 0, fired: 0 });
  const [hits, setHits] = useState(0);
  const [streak, setStreak] = useState(0);
  const [flash, setFlash] = useState<ShotEvent["kind"] | null>(null);
  const [banner, setBanner] = useState<{ n: number; name: string; blurb: string } | null>(null);
  const [pop, setPop] = useState(0);
  /** Set when a round that DID earn a discount failed to save one. */
  const [claimFailed, setClaimFailed] = useState(false);

  const { reward: held, msLeft } = useReward();
  const muted = useStored(MUTE_KEY) === "1";

  const sync = useCallback(() => setView({ ...game.current }), []);

  /** Timers are tracked so a mid-round unmount can't fire into a dead tree. */
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      // Self-prune, IN PLACE. afterSettled polls every 100ms, so without this
      // a long session grows the array forever; and reassigning it instead of
      // splicing would strand the reference the unmount cleanup captured.
      const i = timers.current.indexOf(id);
      if (i !== -1) timers.current.splice(i, 1);
      fn();
    }, ms);
    timers.current.push(id);
    return id;
  }, []);

  /**
   * Run `fn` once no fired ball is still in the air.
   *
   * Both things that end a level need this. `startLevel` discards live balls,
   * so advancing on a fixed delay can bin a shot that was still flying and the
   * player loses a hit they earned. And the result card is only honest once the
   * last shot has actually landed.
   *
   * A poll rather than a longer fixed delay because the rAF loop STOPS when the
   * panel scrolls off screen: a timer would keep running while the ball sits
   * frozen mid-air, ending the round with the final shot never scored. The cap
   * is the escape hatch for exactly that case — scroll away and never come
   * back, and the round still closes instead of hanging on "0 LEFT".
   */
  const afterSettled = useCallback(
    (fn: () => void, capMs = 4000) => {
      const startedAt = performance.now();
      const poll = () => {
        const flying = engineRef.current?.inFlight() ?? false;
        if (!flying || performance.now() - startedAt > capMs) fn();
        else later(poll, 60);
      };
      // Polls tightly: this delay sits in the dead window between levels where
      // taps do nothing, and that window is the whole complaint we're fixing.
      later(poll, 60);
    },
    [later],
  );

  useEffect(() => {
    audioRef.current?.setMuted(muted);
  }, [muted]);

  const finish = useCallback(
    (total: number) => {
      const g = game.current;
      g.phase = "done";
      sync();
      const tier = tierFor(total);
      audioRef.current?.win(tier?.pct ?? 0);

      // Turn the score into a real, redeemable code. Called for EVERY round,
      // including one that earned nothing — the latest round is the one that
      // counts, so a bad round has to clear the previous discount rather than
      // leave it standing. claimReward posts nothing when there is no tier.
      //
      // Not awaited: the result card appears the instant the round ends and
      // fills in the code when it lands.
      setClaimFailed(false);
      void claimReward(total).then((won) => {
        // Qualified but came back empty means the code never saved. Say so,
        // instead of leaving "saving your reward…" on screen for good.
        if ((tier?.pct ?? 0) > 0 && !won) setClaimFailed(true);
      });
    },
    [sync],
  );

  /** One fired shot has resolved. This is the only place score changes. */
  const onShot = useCallback((e: ShotEvent) => {
    const g = game.current;
    // A shot can still land after afterSettled's cap has closed the round.
    // Scoring it then would tick the counter up behind the result card.
    if (g.phase !== "playing") return;
    const scored = e.kind === "kill" || e.kind === "armour";

    if (scored) {
      g.hits += 1;
      g.streak += 1;
      setHits(g.hits);
      setStreak(g.streak);
      setPop((n) => n + 1);
      if (e.kind === "kill") audioRef.current?.kill(g.streak);
      else audioRef.current?.armour();
    } else {
      g.streak = 0;
      setStreak(0);
      if (e.kind === "graze") audioRef.current?.graze();
      else audioRef.current?.miss();
    }
    setFlash(e.kind);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    if (!audioRef.current) {
      audioRef.current = createAudio();
      audioRef.current.setMuted(muted);
    }
    const engine = createEngine(canvas, host, audioRef.current, onShot);
    engineRef.current = engine;
    const ids = timers.current;
    return () => {
      engine.destroy();
      engineRef.current = null;
      ids.forEach(clearTimeout);
      ids.length = 0;
    };
    // `muted` is intentionally not a dep — remounting the engine on a mute
    // toggle would wipe the round. The audio object is updated in its own
    // effect instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onShot]);


  const { phase, level } = view;
  const shotsUsed = view.level * SHOTS_PER_LEVEL + view.fired;
  const shotsLeft = Math.max(0, TOTAL_SHOTS - shotsUsed);
  const pct = tierFor(hits)?.pct ?? 0;
  const up = nextTier(hits);

  /**
   * The percentage the card headlines: the held code's, falling back to what
   * this round scored while the code is still in flight.
   *
   * Since claimReward now lets the latest round replace whatever was held,
   * these two agree — but the held value is still the one to trust, because it
   * is the number the server wrote and checkout will re-read.
   */
  const rewardPct = held ? held.pct : pct;

  const showBanner = useCallback(
    (n: number) => {
      const def = LEVELS[n];
      setBanner({ n, name: def.name, blurb: def.blurb });
      // Frames, and it must match the timeout below — the engine stays frozen
      // for exactly as long as the card is up, so play resumes the instant the
      // card clears rather than a beat later.
      engineRef.current?.pause(42);
      audioRef.current?.level();
      later(() => setBanner(null), BANNER_MS);
    },
    [later],
  );

  const beginRound = useCallback(() => {
    const g = game.current;
    g.phase = "playing";
    g.level = 0;
    g.fired = 0;
    g.hits = 0;
    g.streak = 0;
    setHits(0);
    setStreak(0);
    setFlash(null);
    setClaimFailed(false);
    engineRef.current?.reset();
    engineRef.current?.startLevel(0);
    sync();
    showBanner(0);
  }, [showBanner, sync]);

  /**
   * Did this click come from an actual mouse?
   *
   * A tap arrives as a PointerEvent whose pointerType is "touch"; a real click
   * says "mouse". Browsers too old for PointerEvent send a plain MouseEvent
   * with no pointerType, so those fall back to what the display can do.
   */
  const isMouse = (native: MouseEvent) => {
    const kind = (native as PointerEvent).pointerType;
    return kind ? kind === "mouse" : window.matchMedia("(hover: hover)").matches;
  };

  const onFire = (ev: React.MouseEvent<HTMLButtonElement>) => {
    const g = game.current;
    if (g.phase === "done") return;

    if (g.phase === "idle") {
      beginRound();
      return; // the first tap starts the round rather than burning a shot
    }
    if (banner) return; // don't let a shot vanish into the level card
    if (g.fired >= SHOTS_PER_LEVEL) return;

    const p = engineRef.current?.toGame(ev.clientX, ev.clientY);
    if (!p) return;

    setFlash(null);
    engineRef.current?.aimAt(p);
    engineRef.current?.fire(p.x, p.y);
    // A finger on a device that ALSO has a mouse — an iPad with a trackpad —
    // passes the hover check, so the guide has to be taken down by hand or it
    // stays behind pointing at the shot that just left.
    if (!isMouse(ev.nativeEvent)) engineRef.current?.clearGuide();
    g.fired += 1;

    if (g.fired >= SHOTS_PER_LEVEL) {
      const from = g.level;
      if (from < LEVELS.length - 1) {
        afterSettled(() => {
          if (game.current.level !== from || game.current.phase !== "playing") return;
          game.current.level = from + 1;
          game.current.fired = 0;
          engineRef.current?.startLevel(from + 1);
          sync();
          showBanner(from + 1);
        });
      } else {
        afterSettled(() => {
          if (game.current.phase !== "playing") return;
          finish(game.current.hits);
        });
      }
    }
    sync();
  };

  /** Pointer aim preview — mouse only. On touch the tap IS the aim. */
  const onMove = (ev: React.MouseEvent<HTMLButtonElement>) => {
    if (view.phase !== "playing") return;
    const p = engineRef.current?.toGame(ev.clientX, ev.clientY);
    if (p) engineRef.current?.aimAt(p);
  };

  const replay = () => {
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
    game.current = { phase: "idle", level: 0, fired: 0, hits: 0, streak: 0 };
    setHits(0);
    setStreak(0);
    setFlash(null);
    setBanner(null);
    engineRef.current?.reset();
    sync();
    beginRound();
  };

  /* Kept under ~20 characters. The footer shares one line with the hit count
     and the mute toggle, and anything longer truncates on a 375px phone. */
  const flashText =
    flash === "kill"
      ? "◆ direct hit"
      : flash === "armour"
        ? "◆ armour cracked"
        : flash === "graze"
          ? "≈ grazed — so close"
          : flash === "miss"
            ? "× missed — lead it"
            : phase === "idle"
              ? "▶ tap to shoot"
              : "▶ aim, then tap";

  return (
    <div className={`px-[max(1.25rem,5vw)] py-6 ${className}`}>
      {/* Says "game" before the panel has to. Sitting between two product
          rails with no heading, the strip read as more merchandising and
          people scrolled past it. */}
      <header className="mb-4">
        <div className="border-line/60 mb-3 flex items-center gap-3 border-b pb-2">
          <span className="readout text-ember">◆ mini game</span>
          <span className="bg-line/60 h-px flex-1" />
          <span className="readout text-bone-faint shrink-0">free to play</span>
        </div>
        <h2 className="pixel text-flare text-[clamp(0.82rem,3.1vw,1.35rem)]">
          Play Devil&apos;s Aim
        </h2>
        <p className="text-bone-dim prose-body mt-2 text-[length:var(--step-0)]">
          Shoot the skulls before your {TOTAL_SHOTS} shots run out. The better you aim, the
          bigger your discount — up to {TOP_TIER.pct}% off.
        </p>
      </header>

      <div
        className="chassis cut relative w-full select-none overflow-hidden"
        style={{ ["--cut" as string]: "12px" }}
      >
        {/* ── header: level + reward + shots ── */}
        <div className="border-line/60 flex items-center justify-between gap-2 border-b px-3 py-1.5">
          <span className="readout text-ember shrink-0">
            {phase === "done"
              ? "round over"
              : phase === "idle"
                ? "devil's aim"
                : `lvl ${level + 1}/${LEVELS.length} · ${LEVELS[level].name}`}
          </span>
          <span className="readout text-bone-faint shrink-0 tabular-nums">
            {phase === "idle" ? `${TOTAL_SHOTS} shots` : `${shotsLeft} left`}
          </span>
        </div>

        {/* minHeight reserves the panel BEFORE the engine sizes the canvas.
            Without it the host collapses to 0 on the server-rendered pass, the
            "tap to start" card has no box to sit in, and the page jumps when
            JS lands. */}
        <div
          ref={hostRef}
          className="relative w-full"
          style={{ minHeight: GAME_H * 3 }}
        >
          <canvas
            ref={canvasRef}
            aria-hidden
            className="block"
            style={{ imageRendering: "pixelated" }}
          />

          {/* `click`, not pointerdown — the browser withholds click during a
              scroll drag, so swiping past never fires it by accident. */}
          {phase !== "done" && (
            <button
              type="button"
              onClick={onFire}
              onMouseMove={onMove}
              onMouseLeave={() => engineRef.current?.aimAt(null)}
              aria-label={phase === "idle" ? "Start Devil's Aim" : "Fire at the skull"}
              className="absolute inset-0 h-full w-full cursor-crosshair"
            />
          )}

          {/* live reward — the number climbing is the whole hook */}
          {phase === "playing" && (
            <div className="pointer-events-none absolute right-2 top-2 text-right">
              <p
                key={pop}
                className={`display leading-none ${pct ? "text-ember pop" : "text-bone-faint"}`}
                style={{ fontSize: "1.5rem" }}
              >
                {pct ? `${pct}%` : "—"}
              </p>
              <p className="readout text-bone-faint mt-0.5">
                {up ? `${up.min - hits} more → ${up.pct}%` : "max reward"}
              </p>
            </div>
          )}

          {/* streak */}
          {phase === "playing" && streak >= 2 && (
            <p
              key={`s${streak}`}
              className="display text-flare pop pointer-events-none absolute left-2 top-2 leading-none"
              style={{ fontSize: "1.1rem" }}
            >
              ×{streak}
            </p>
          )}

          {/* level card */}
          {banner && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div
                className="bg-void/85 cut pop px-5 py-3 text-center"
                style={{ ["--cut" as string]: "10px" }}
              >
                <p className="readout text-ember">
                  level {banner.n + 1} / {LEVELS.length}
                </p>
                <p className="display text-bone mt-1 text-[1.3rem]">{banner.name}</p>
                <p className="readout text-bone-faint mt-1">{banner.blurb}</p>
              </div>
            </div>
          )}

          {phase === "idle" && !banner && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div
                className="bg-void/80 cut px-5 py-3 text-center"
                style={{ ["--cut" as string]: "10px" }}
              >
                <p className="display text-bone text-[1.3rem]">Devil&apos;s Aim</p>
                <p className="readout text-bone-faint mt-1">
                  {TOTAL_SHOTS} shots · {LEVELS.length} levels
                </p>
                <p className="readout text-ember mt-2">tap to start</p>
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
                <p className={`display mt-1 text-[2rem] ${rewardPct ? "text-ember" : "text-bone"}`}>
                  {rewardPct ? `${rewardPct}% OFF` : "no reward"}
                </p>

                {held ? (
                  <>
                    <p className="readout text-bone mt-2">{held.code}</p>
                    <p className="readout text-bone-faint mt-1">
                      applied at checkout · expires in {countdown(msLeft)}
                    </p>
                  </>
                ) : (
                  <p className="readout text-bone-faint mt-1">
                    {pct
                      ? claimFailed
                        ? "couldn't save your reward — play again"
                        : "saving your reward…"
                      : `${FLOOR_TIER.min} hits unlocks ${FLOOR_TIER.pct}%`}
                  </p>
                )}
                {/* Shop now only appears when there is a discount to spend —
                    on a no-reward card it would be noise. It is the outlined
                    secondary, so the card gains a way out without gaining a
                    second loud button next to the one it always had. */}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={replay}
                    className="cut bg-bone text-void label px-4 py-2"
                    style={{ ["--cut" as string]: "8px" }}
                  >
                    Play again
                  </button>
                  {held && (
                    <Link
                      href="/products"
                      className="chassis cut label text-bone-dim hover:text-bone inline-flex items-center gap-1.5 px-4 py-2 transition-colors"
                      style={{ ["--cut" as string]: "8px" }}
                    >
                      Shop now <span aria-hidden>→</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── footer: feedback + score + mute ── */}
        <div className="border-line/60 flex items-center justify-between gap-2 border-t px-3 py-1.5">
          <span
            className={`readout truncate ${
              flash === "kill" || flash === "armour"
                ? "text-ember"
                : flash === "graze"
                  ? "text-flare"
                  : flash === "miss"
                    ? "text-bone-dim"
                    : "text-bone-faint"
            }`}
          >
            {flashText}
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <span className="readout text-bone-faint tabular-nums">
              <span className="text-ember">{String(hits).padStart(2, "0")}</span> hits
            </span>
            <button
              type="button"
              onClick={() => writeStore(MUTE_KEY, muted ? "0" : "1")}
              aria-label={muted ? "Unmute game sound" : "Mute game sound"}
              className="readout text-bone-faint hover:text-bone"
            >
              {muted ? "♪ off" : "♪ on"}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
