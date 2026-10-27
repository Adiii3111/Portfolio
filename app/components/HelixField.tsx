"use client";

import { useEffect, useRef } from "react";

/*
 * The site-wide backdrop: circulation. Blood drifts across the whole screen on slow,
 * branching currents, as if seen under a microscope: red cells tumbling as they go, the odd
 * white cell with its lobed nucleus, and tiny platelets, all a little out of focus. The
 * flow surges on a lub-dub heartbeat. A straight DNA double
 * helix in light, bright colours runs down the middle; it fades in when the page opens and
 * turns as you scroll.
 *
 * It's there to be played with, quietly:
 *  - the cursor is a hub: cells near it are pulled into a swirl and follow you around;
 *  - clicking open space places a hospital (a cross in a diamond): cells from across the
 *    screen rush to it, each one admitted with a pulse, and a heartbeat shockwave goes out
 *    from the click.
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
const FADE_IN = 1800;    // ms for the DNA to fade in on load

// Circulation.
const DENSITY = 1 / 16000;  // cells per px²
const MAX_PARTS = 110;
const SPEED = 0.42;         // px per frame at rest, for a cell in the middle distance
const HUB_R = 170;          // cursor hub radius
const DEPOT_R = 620;        // how far a hospital's pull reaches
const DEPOT_LIFE = 14000;   // ms
const MAX_DEPOTS = 4;
const BEAT_MS = 1500;       // one heartbeat

// A blood cell: red cell, white cell or platelet. z is its depth (0 far, 1 near), which sets
// its size, speed and focus; spin and tumble turn it as it drifts.
type Kind = "red" | "white" | "platelet";
type Part = { x: number; y: number; vx: number; vy: number; kind: Kind; z: number; spin: number; tumble: number; glow: number };
const pickKind = (): Kind => { const r = Math.random(); return r < 0.7 ? "red" : r < 0.82 ? "white" : "platelet"; };
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
    let born = 0;
    let press: { x: number; y: number; moved: number } | null = null;   // a pointer down on open space, to tell a click from a drag
    let parts: Part[] = [];
    const depots: Depot[] = [];
    const waves: Wave[] = [];
    const mouse = { x: -1, y: -1, on: false };   // on: over open space
    let col = { line: [197, 165, 114], gold: [226, 205, 164], red: [232, 97, 91], dnaA: [158, 231, 255], dnaB: [255, 179, 199], white: [236, 236, 246], nucleus: [150, 110, 196], platelet: [232, 206, 160] };
    const readColours = () => { col = { line: readRGB("--field-a", "197,165,114"), gold: readRGB("--field-b", "226,205,164"), red: readRGB("--field-hot", "232,97,91"), dnaA: readRGB("--dna-a", "158,231,255"), dnaB: readRGB("--dna-b", "255,179,199"), white: readRGB("--cell-white", "236,236,246"), nucleus: readRGB("--cell-nucleus", "150,110,196"), platelet: readRGB("--cell-platelet", "232,206,160") }; };

    const spawn = (edge: boolean): Part => {
      let x = Math.random() * W, y = Math.random() * H;
      if (edge) { if (Math.random() < 0.5) x = Math.random() < 0.5 ? -4 : W + 4; else y = Math.random() < 0.5 ? -4 : H + 4; }
      return { x, y, vx: 0, vy: 0, kind: pickKind(), z: Math.random(), spin: Math.random() * Math.PI, tumble: Math.random() * Math.PI * 2, glow: 0 };
    };

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W; cv.height = H;
      const want = Math.min(MAX_PARTS, Math.round(W * H * DENSITY));
      parts = parts.slice(0, want);
      while (parts.length < want) parts.push(spawn(false));
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
        const a = flowAngle(p.x, p.y + pos * 0.35, now);
        const sp = SPEED * surge * (0.5 + p.z);
        let tx = Math.cos(a) * sp, ty = Math.sin(a) * sp;
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
          // Rush: a firm pull from anywhere in reach, firmer still close in.
          if (d < DEPOT_R) { const f = (0.45 + 0.55 * (1 - d / DEPOT_R)) * fade(dp, now); tx += (mx / d) * 4.2 * f; ty += (my / d) * 4.2 * f; near = Math.max(near, f * 0.8); }
        }
        if (parts[i] !== p) continue;
        for (const w of waves) {
          const age = Math.max(0, now - w.born), r = age * 0.55;
          const mx = p.x - w.x, my = p.y - w.y, d = Math.hypot(mx, my) || 1;
          if (Math.abs(d - r) < 28) { const f = 2.6 * (1 - age / 1600); p.vx += (mx / d) * f; p.vy += (my / d) * f; p.glow = 1; }
        }
        p.vx += (tx - p.vx) * 0.09;
        p.vy += (ty - p.vy) * 0.09;
        p.x += p.vx; p.y += p.vy;
        p.glow = Math.max(p.glow * 0.94, near);
        p.spin += 0.004; p.tumble += 0.012 + p.z * 0.01;
        if (p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) parts[i] = spawn(true);
      }
      for (let i = depots.length - 1; i >= 0; i--) depots[i].hits = depots[i].hits.filter((h) => now - h < 700);
      return beat;
    };

    const fade = (dp: Depot, now: number) => {
      const age = now - dp.born;
      return Math.min(1, age / 300) * Math.min(1, (DEPOT_LIFE - age) / 1000);
    };

    // The DNA: straight down the middle, its colour blending from one light tone to the other
    // and back along its length.
    const drawHelix = (now: number, beat: number) => {
      const R = Math.min(W * 0.2, 250);
      const travel = pos * 0.55;                  // we move down the strand slower than the page
      const spin = pos * 0.0032;                  // scrolling turns it
      const cx = W / 2;
      const y0 = -RUNG * 2, y1 = H + RUNG * 2;
      const pt = (sy: number, phase: number) => {
        const th = (sy + travel) * TWIST + spin + phase;
        return { x: cx + Math.cos(th) * R, y: sy, z: Math.sin(th) };
      };
      const level = (z: number) => Math.min(LEVELS - 1, Math.floor((0.5 + z * 0.5) * LEVELS));
      const lift = beat * 0.05;
      const shown = born ? Math.min(1, (now - born) / FADE_IN) : 0;
      if (shown <= 0) return;
      const tint = (a: number) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, rgba(col.dnaA, a)); g.addColorStop(0.5, rgba(col.dnaB, a)); g.addColorStop(1, rgba(col.dnaA, a));
        return g;
      };
      ctx.globalAlpha = shown * shown * (3 - 2 * shown);
      for (const front of [false, true]) {
        const bb = Array.from({ length: LEVELS }, () => new Path2D());
        const rungA = Array.from({ length: LEVELS }, () => new Path2D());
        const rungB = Array.from({ length: LEVELS }, () => new Path2D());
        const first = Math.ceil((y0 + travel) / RUNG) * RUNG - travel;
        for (let sy = first; sy < y1; sy += RUNG) {
          const a = pt(sy, 0), b = pt(sy, GROOVE);
          const z = (a.z + b.z) / 2;
          if ((z >= 0) !== front) continue;
          const k = Math.round((sy + travel) / RUNG);
          const gc = ((k * 7919) % 5) < 2;
          const lv = level(z);
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          rungA[lv].moveTo(a.x, a.y); rungA[lv].lineTo(mx, my);
          (gc ? rungB : rungA)[lv].moveTo(mx, my); (gc ? rungB : rungA)[lv].lineTo(b.x, b.y);
        }
        for (const phase of [0, GROOVE]) {
          let prev = pt(y0, phase);
          for (let sy = y0 + STEP; sy <= y1; sy += STEP) {
            const q = pt(sy, phase);
            const z = (q.z + prev.z) / 2;
            if ((z >= 0) === front) { bb[level(z)].moveTo(prev.x, prev.y); bb[level(z)].lineTo(q.x, q.y); }
            prev = q;
          }
        }
        for (let lv = 0; lv < LEVELS; lv++) {
          const d = (lv + 0.5) / LEVELS;
          ctx.lineWidth = 0.9 + d * 1.4;
          ctx.strokeStyle = tint(0.08 + d * 0.2 + lift); ctx.stroke(rungA[lv]);
          ctx.strokeStyle = rgba(col.dnaB, 0.08 + d * 0.22 + lift); ctx.stroke(rungB[lv]);
          ctx.lineWidth = 1 + d * 2.8;
          ctx.strokeStyle = tint(0.12 + d * 0.4 + lift); ctx.stroke(bb[lv]);
        }
      }
      ctx.globalAlpha = 1;
    };

    const draw = (now: number, beat: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      drawHelix(now, beat);

      // Blood cells, smaller and fainter the further away they are.
      //  red: a biconcave disc, brighter at the rim than in the dimple, face-on or edge-on as it tumbles;
      //  white: a larger pale cell with a lobed nucleus;
      //  platelet: a tiny irregular fragment.
      for (const p of parts) {
        const a = (0.1 + p.z * 0.16) + Math.min(1, p.glow) * 0.4;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        if (p.kind === "red") {
          const r = 3 + p.z * 4.5;
          ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(p.tumble)));
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
          g.addColorStop(0, rgba(col.red, a * 0.35)); g.addColorStop(0.5, rgba(col.red, a * 0.55));
          g.addColorStop(0.78, rgba(col.red, a)); g.addColorStop(1, rgba(col.red, 0));
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        } else if (p.kind === "white") {
          const r = 4.5 + p.z * 4.5;
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
          g.addColorStop(0, rgba(col.white, a * 0.7)); g.addColorStop(0.8, rgba(col.white, a * 0.9)); g.addColorStop(1, rgba(col.white, 0));
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = rgba(col.nucleus, a * 1.4);
          ctx.beginPath();
          for (let k = 0; k < 3; k++) { const q = k * 2.1 + p.tumble * 0.2; ctx.moveTo(Math.cos(q) * r * 0.32 + r * 0.24, Math.sin(q) * r * 0.32); ctx.arc(Math.cos(q) * r * 0.32, Math.sin(q) * r * 0.32, r * 0.24, 0, Math.PI * 2); }
          ctx.fill();
        } else {
          const r = 1.2 + p.z * 1.4;
          ctx.fillStyle = rgba(col.platelet, a * 1.6);
          ctx.beginPath(); ctx.ellipse(0, 0, r * 1.4, r, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }

      // The hub: a faint ring that beats with the heart.
      if (mouse.on) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(col.gold, 0.1 + beat * 0.12);
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 22 + beat * 6, 0, Math.PI * 2); ctx.stroke();
      }

      // Heartbeat shockwaves from clicks.
      for (const w of waves) {
        const age = Math.max(0, now - w.born), r = age * 0.55, a = 1 - age / 1600;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = rgba(col.red, 0.35 * a);
        ctx.beginPath(); ctx.arc(w.x, w.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = rgba(col.red, 0.18 * a);
        ctx.beginPath(); ctx.arc(w.x, w.y, Math.max(0, r - 34), 0, Math.PI * 2); ctx.stroke();
      }

      // Hospitals: a cross in a diamond, a reach ring, and a pulse for every cell admitted.
      for (const dp of depots) {
        const f = fade(dp, now);
        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(col.gold, 0.12 * f);
        ctx.setLineDash([2, 6]);
        ctx.beginPath(); ctx.arc(dp.x, dp.y, 46 * (0.92 + beat * 0.12), 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        for (const h of dp.hits) {
          const q = (now - h) / 700;
          ctx.strokeStyle = rgba(col.red, 0.6 * (1 - q) * f);
          ctx.beginPath(); ctx.arc(dp.x, dp.y, 10 + q * 26, 0, Math.PI * 2); ctx.stroke();
        }
        const s = 13 + beat * 2;
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = rgba(col.gold, 0.8 * f);
        ctx.beginPath(); ctx.moveTo(dp.x, dp.y - s); ctx.lineTo(dp.x + s, dp.y); ctx.lineTo(dp.x, dp.y + s); ctx.lineTo(dp.x - s, dp.y); ctx.closePath(); ctx.stroke();
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
      const beat = step(t);
      draw(t, beat);
    };
    const start = () => { if (!raf && !reduced && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const still = () => { pos = target; born = -FADE_IN; draw(0, 0); };

    // Open space only: never react on text, controls, cards or media.
    const openSpace = (t: Element) => !t.closest("a, button, input, textarea, select, label, p, h1, h2, h3, h4, li, dt, dd, figure, blockquote, img, svg, canvas, video, [role=dialog], .glass, .sl, .mc, .lab, .ae-backdrop, .site-header");

    const onScroll = () => { target = window.scrollY; if (reduced) still(); };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.on = openSpace(e.target as Element);
      if (press) { press.moved += Math.abs(e.clientX - press.x) + Math.abs(e.clientY - press.y); press.x = e.clientX; press.y = e.clientY; }
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || !openSpace(e.target as Element)) return;
      press = { x: e.clientX, y: e.clientY, moved: 0 };
    };
    const onUp = (e: PointerEvent) => {
      if (!press) return;
      const click = press.moved < 6;
      press = null;
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
    born = performance.now();
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
    };
  }, []);

  return (
    <div className="lanefield helixfield" aria-hidden="true">
      <canvas ref={ref} className="lanefield-canvas" />
    </div>
  );
}
