"use client";

import { useEffect, useRef } from "react";

/*
 * The site-wide backdrop: circulation. Red cells and gold supply crates stream across the
 * whole screen along slow, branching currents — read it as blood vessels or as freight
 * lanes — and the flow surges on a lub-dub heartbeat. A DNA double helix runs down the
 * middle as the spine; it turns slowly on its own and as you scroll.
 *
 * It's there to be played with, quietly:
 *  - the cursor is a hub: traffic near it is pulled into a swirl and follows you around;
 *  - clicking open space drops a clinic (a small cross depot) that draws traffic in, each
 *    arrival "delivered" with a pulse, and sends a heartbeat shockwave out from the click;
 *  - dragging across open space turns the helix by hand.
 * Everything stays faint and only brightens near the cursor, so the content stays first.
 *
 * Drawn at ~30 fps and 1 device pixel per CSS pixel (the glass cards blur whatever is
 * behind them, so every frame here costs a re-blur); paused while the tab is hidden, and a
 * single still frame for reduced motion.
 */

const readRGB = (name: string, fallback: string) =>
  (getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback).split(",").map(Number);
const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

// Helix geometry.
const STEP = 8;          // px between backbone samples
const RUNG = 46;         // px between base pairs (≈ 10.5 pairs per turn)
const TWIST = (Math.PI * 2) / (RUNG * 10.5);
const GROOVE = 2.35;     // phase gap between the two backbones: major vs minor groove
const LEVELS = 4;        // depth bands, batched

// Circulation.
const DENSITY = 1 / 6500;   // particles per px²
const MAX_PARTS = 260;
const TRAIL = 9;            // positions kept per particle
const SPEED = 0.85;         // px per frame at rest
const HUB_R = 170;          // cursor hub radius
const DEPOT_R = 230;        // how far a clinic reaches
const DEPOT_LIFE = 14000;   // ms
const MAX_DEPOTS = 4;
const BEAT_MS = 1500;       // one heartbeat

type Part = { x: number; y: number; vx: number; vy: number; cell: boolean; trail: Float32Array; n: number; glow: number };
type Depot = { x: number; y: number; born: number; hits: number[] };
type Wave = { x: number; y: number; born: number };

// Lub-dub: a strong beat, then a softer one, then rest.
const beatAt = (t: number) => {
  const p = (t % BEAT_MS) / BEAT_MS;
  return Math.exp(-(((p - 0.04) / 0.035) ** 2)) + 0.55 * Math.exp(-(((p - 0.2) / 0.04) ** 2));
};

// The currents: a slowly shifting angle field that makes long, branching streams.
const flowAngle = (x: number, y: number, t: number) =>
  Math.sin(x * 0.0021 + t * 0.00006) * 1.25 + Math.cos(y * 0.0026 - t * 0.00004) * 1.1 + Math.sin((x + y) * 0.0012 + 1.7) * 0.9 + 0.35;

export default function HelixField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, raf = 0, last = 0;
    let target = window.scrollY, pos = target, lastScroll = target;
    let turn = 0, spinV = 0;
    let drag: { x: number; y: number; moved: number } | null = null;
    let parts: Part[] = [];
    const depots: Depot[] = [];
    const waves: Wave[] = [];
    const mouse = { x: -1, y: -1, on: false };
    let col = { line: [197, 165, 114], gold: [226, 205, 164], red: [232, 97, 91] };
    const readColours = () => { col = { line: readRGB("--field-a", "197,165,114"), gold: readRGB("--field-b", "226,205,164"), red: readRGB("--field-hot", "232,97,91") }; };

    const spawn = (edge: boolean): Part => {
      let x = Math.random() * W, y = Math.random() * H;
      if (edge) { if (Math.random() < 0.5) x = Math.random() < 0.5 ? -4 : W + 4; else y = Math.random() < 0.5 ? -4 : H + 4; }
      const trail = new Float32Array(TRAIL * 2);
      for (let i = 0; i < TRAIL; i++) { trail[i * 2] = x; trail[i * 2 + 1] = y; }
      return { x, y, vx: 0, vy: 0, cell: Math.random() < 0.68, trail, n: 0, glow: 0 };
    };

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W; cv.height = H;
      const want = Math.min(MAX_PARTS, Math.round(W * H * DENSITY));
      parts = parts.slice(0, want);
      while (parts.length < want) parts.push(spawn(false));
    };

    // Where the helix axis sits for a given world y: two slow, unrelated bends.
    const axis = (wy: number) => {
      const amp = Math.min(W * 0.11, 150);
      return W * 0.5 + amp * Math.sin(wy * 0.0011 + 0.6) + amp * 0.45 * Math.sin(wy * 0.0027 + 2.1);
    };

    const step = (now: number) => {
      const beat = beatAt(now);
      const surge = 1 + beat * 1.3;
      // Scrolling carries the traffic with the page a little, so the field feels like depth.
      const dy = (pos - lastScroll) * 0.35; lastScroll = pos;
      for (let i = depots.length - 1; i >= 0; i--) if (now - depots[i].born > DEPOT_LIFE) depots.splice(i, 1);
      for (let i = waves.length - 1; i >= 0; i--) if (now - waves[i].born > 1600) waves.splice(i, 1);

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.y -= dy;
        for (let k = 0; k < TRAIL; k++) p.trail[k * 2 + 1] -= dy;
        const a = flowAngle(p.x, p.y + pos * 0.35, now);
        let tx = Math.cos(a) * SPEED * surge, ty = Math.sin(a) * SPEED * surge;
        let near = 0;

        if (mouse.on) {
          const mx = mouse.x - p.x, my = mouse.y - p.y, d = Math.hypot(mx, my);
          if (d < HUB_R && d > 1) {
            const f = 1 - d / HUB_R;
            // Swirl around the hub and drift in towards it.
            tx += (-my / d * 2.4 + mx / d * 0.9) * f;
            ty += (mx / d * 2.4 + my / d * 0.9) * f;
            near = f;
          }
        }
        for (const dp of depots) {
          const mx = dp.x - p.x, my = dp.y - p.y, d = Math.hypot(mx, my);
          if (d < 9) { dp.hits.push(now); parts[i] = spawn(true); break; }
          if (d < DEPOT_R) { const f = (1 - d / DEPOT_R) * fade(dp, now); tx += (mx / d) * 3.2 * f; ty += (my / d) * 3.2 * f; near = Math.max(near, f * 0.8); }
        }
        if (parts[i] !== p) continue;
        for (const w of waves) {
          const age = now - w.born, r = age * 0.55;
          const mx = p.x - w.x, my = p.y - w.y, d = Math.hypot(mx, my) || 1;
          if (Math.abs(d - r) < 28) { const f = 2.6 * (1 - age / 1600); p.vx += (mx / d) * f; p.vy += (my / d) * f; p.glow = 1; }
        }
        p.vx += (tx - p.vx) * 0.09;
        p.vy += (ty - p.vy) * 0.09;
        p.x += p.vx; p.y += p.vy;
        p.glow = Math.max(p.glow * 0.94, near);
        p.n = (p.n + 1) % TRAIL;
        p.trail[p.n * 2] = p.x; p.trail[p.n * 2 + 1] = p.y;
        if (p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) parts[i] = spawn(true);
      }
      for (let i = depots.length - 1; i >= 0; i--) depots[i].hits = depots[i].hits.filter((h) => now - h < 700);
      return beat;
    };

    const fade = (dp: Depot, now: number) => {
      const age = now - dp.born;
      return Math.min(1, age / 300) * Math.min(1, (DEPOT_LIFE - age) / 1000);
    };

    const drawHelix = (beat: number) => {
      const R = Math.min(W * 0.2, 250);
      const travel = pos * 0.55;
      const spin = pos * 0.0032 + turn;
      const y0 = -RUNG * 2, y1 = H + RUNG * 2;
      const pt = (sy: number, phase: number) => {
        const wy = sy + travel;
        const th = wy * TWIST + spin + phase;
        return { x: axis(wy) + Math.cos(th) * R, y: sy, z: Math.sin(th) };
      };
      const level = (z: number) => Math.min(LEVELS - 1, Math.floor((0.5 + z * 0.5) * LEVELS));
      const lift = beat * 0.05;
      for (const front of [false, true]) {
        const bb = Array.from({ length: LEVELS }, () => new Path2D());
        const rungG = Array.from({ length: LEVELS }, () => new Path2D());
        const rungR = Array.from({ length: LEVELS }, () => new Path2D());
        const first = Math.ceil((y0 + travel) / RUNG) * RUNG - travel;
        for (let sy = first; sy < y1; sy += RUNG) {
          const a = pt(sy, 0), b = pt(sy, GROOVE);
          const z = (a.z + b.z) / 2;
          if ((z >= 0) !== front) continue;
          const k = Math.round((sy + travel) / RUNG);
          const gc = ((k * 7919) % 5) < 2;
          const lv = level(z);
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          rungG[lv].moveTo(a.x, a.y); rungG[lv].lineTo(mx, my);
          (gc ? rungR : rungG)[lv].moveTo(mx, my); (gc ? rungR : rungG)[lv].lineTo(b.x, b.y);
        }
        for (const phase of [0, GROOVE]) {
          let prev = pt(y0, phase);
          for (let sy = y0 + STEP; sy <= y1; sy += STEP) {
            const p = pt(sy, phase);
            const z = (p.z + prev.z) / 2;
            if ((z >= 0) === front) { bb[level(z)].moveTo(prev.x, prev.y); bb[level(z)].lineTo(p.x, p.y); }
            prev = p;
          }
        }
        for (let lv = 0; lv < LEVELS; lv++) {
          const d = (lv + 0.5) / LEVELS;
          ctx.lineWidth = 0.8 + d * 1.2;
          ctx.strokeStyle = rgba(col.gold, 0.03 + d * 0.1 + lift); ctx.stroke(rungG[lv]);
          ctx.strokeStyle = rgba(col.red, 0.03 + d * 0.11 + lift); ctx.stroke(rungR[lv]);
          ctx.lineWidth = 0.8 + d * 2.4;
          ctx.strokeStyle = rgba(col.gold, 0.04 + d * 0.18 + lift); ctx.stroke(bb[lv]);
        }
      }
    };

    const draw = (now: number, beat: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      drawHelix(beat);

      // Traffic: faint trails for everything, brighter for whatever the cursor or a clinic has hold of.
      const trails = [new Path2D(), new Path2D(), new Path2D(), new Path2D()]; // cell, crate, hot cell, hot crate
      const heads = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
      for (const p of parts) {
        const hot = p.glow > 0.25 ? 2 : 0, kind = (p.cell ? 0 : 1) + hot;
        const t = trails[kind];
        let k = (p.n + 1) % TRAIL;
        t.moveTo(p.trail[k * 2], p.trail[k * 2 + 1]);
        for (let j = 1; j < TRAIL; j++) { k = (k + 1) % TRAIL; t.lineTo(p.trail[k * 2], p.trail[k * 2 + 1]); }
        if (p.cell) { heads[kind].moveTo(p.x + 1.7, p.y); heads[kind].arc(p.x, p.y, 1.7, 0, Math.PI * 2); }
        else heads[kind].rect(p.x - 1.5, p.y - 1.5, 3, 3);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(col.red, 0.1 + beat * 0.04); ctx.stroke(trails[0]);
      ctx.strokeStyle = rgba(col.gold, 0.1 + beat * 0.04); ctx.stroke(trails[1]);
      ctx.fillStyle = rgba(col.red, 0.32); ctx.fill(heads[0]);
      ctx.fillStyle = rgba(col.gold, 0.32); ctx.fill(heads[1]);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = rgba(col.red, 0.42); ctx.stroke(trails[2]);
      ctx.strokeStyle = rgba(col.gold, 0.42); ctx.stroke(trails[3]);
      ctx.fillStyle = rgba(col.red, 0.85); ctx.fill(heads[2]);
      ctx.fillStyle = rgba(col.gold, 0.85); ctx.fill(heads[3]);

      // The hub: a faint ring that beats with the heart.
      if (mouse.on) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(col.gold, 0.1 + beat * 0.12);
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 22 + beat * 6, 0, Math.PI * 2); ctx.stroke();
      }

      // Heartbeat shockwaves from clicks.
      for (const w of waves) {
        const age = now - w.born, r = age * 0.55, a = 1 - age / 1600;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = rgba(col.red, 0.35 * a);
        ctx.beginPath(); ctx.arc(w.x, w.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = rgba(col.red, 0.18 * a);
        ctx.beginPath(); ctx.arc(w.x, w.y, Math.max(0, r - 34), 0, Math.PI * 2); ctx.stroke();
      }

      // Clinics: a cross in a square, a reach ring, and a pulse for every delivery.
      for (const dp of depots) {
        const f = fade(dp, now);
        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(col.gold, 0.12 * f);
        ctx.setLineDash([2, 6]);
        ctx.beginPath(); ctx.arc(dp.x, dp.y, DEPOT_R * (0.94 + beat * 0.04), 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        for (const h of dp.hits) {
          const q = (now - h) / 700;
          ctx.strokeStyle = rgba(col.red, 0.6 * (1 - q) * f);
          ctx.beginPath(); ctx.arc(dp.x, dp.y, 10 + q * 26, 0, Math.PI * 2); ctx.stroke();
        }
        const s = 9 + beat * 1.5;
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = rgba(col.gold, 0.8 * f);
        ctx.strokeRect(dp.x - s, dp.y - s, s * 2, s * 2);
        ctx.fillStyle = rgba(col.red, 0.9 * f);
        ctx.fillRect(dp.x - 1.6, dp.y - 5.5, 3.2, 11);
        ctx.fillRect(dp.x - 5.5, dp.y - 1.6, 11, 3.2);
      }
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (last && t - last < 30) return;   // ~30 fps is plenty for a background
      last = t;
      const d = target - pos;
      pos += Math.abs(d) < 0.3 ? d : d * 0.22;
      // Idle spin, plus whatever a drag or its momentum adds.
      turn += 0.004;
      if (!drag) { turn += spinV; spinV *= 0.9; if (Math.abs(spinV) < 0.0004) spinV = 0; }
      const beat = step(t);
      draw(t, beat);
    };
    const start = () => { if (!raf && !reduced && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const still = () => { pos = target; draw(0, 0); };

    // Open space only: never react on text, controls, cards or media.
    const openSpace = (t: Element) => !t.closest("a, button, input, textarea, select, label, p, h1, h2, h3, h4, li, dt, dd, figure, blockquote, img, svg, canvas, video, [role=dialog], .glass, .sl, .mc, .lab, .ae-backdrop, .site-header");

    const onScroll = () => { target = window.scrollY; if (reduced) still(); };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.on = openSpace(e.target as Element);
      if (drag) {
        const dx = e.clientX - drag.x;
        drag.moved += Math.abs(dx) + Math.abs(e.clientY - drag.y);
        drag.x = e.clientX; drag.y = e.clientY;
        turn += dx * 0.009; spinV = dx * 0.009;
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || !openSpace(e.target as Element)) return;
      drag = { x: e.clientX, y: e.clientY, moved: 0 };
      if (e.pointerType !== "touch") document.documentElement.classList.add("helix-turning");
    };
    const onUp = (e: PointerEvent) => {
      if (!drag) return;
      const click = drag.moved < 6;
      drag = null;
      document.documentElement.classList.remove("helix-turning");
      if (!click || reduced || e.type === "pointercancel") return;
      const now = performance.now();
      waves.push({ x: e.clientX, y: e.clientY, born: now });
      depots.push({ x: e.clientX, y: e.clientY, born: now, hits: [] });
      if (depots.length > MAX_DEPOTS) depots.shift();
    };
    const onLeave = () => { mouse.on = false; };
    const onResize = () => { resize(); if (reduced) still(); };
    const onVis = () => (document.hidden ? stop() : start());
    const mood = new MutationObserver(() => { readColours(); if (reduced) still(); });

    readColours(); resize();
    if (reduced) still(); else start();
    mood.observe(document.documentElement, { attributes: true, attributeFilter: ["data-time"] });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop(); mood.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      document.documentElement.classList.remove("helix-turning");
    };
  }, []);

  return (
    <div className="lanefield helixfield" aria-hidden="true">
      <canvas ref={ref} className="lanefield-canvas" />
    </div>
  );
}
