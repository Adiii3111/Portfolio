"use client";

import { useEffect, useRef } from "react";

/*
 * The site-wide backdrop: an engineering blueprint of a supply network. A precise
 * drafting grid with registration marks, and shipping lanes routed like circuit-board
 * traces (straight runs joined by 45° chamfers) between square terminals. Streaks of
 * light — shipments (gold) and blood units (red) — run along the lanes. The cursor is a
 * drafting crosshair with live coordinates that lights the lanes it passes; a click
 * dispatches a shipment from the nearest lane. Colours follow the time-of-day mood.
 */

const MINOR = 24, MAJOR = 120;

type Pt = { x: number; y: number };
type Lane = { pts: Pt[]; len: number; seg: number[]; lit: number; top: number; bottom: number };
type Streak = { lane: number; s: number; speed: number; red: boolean; dir: 1 | -1; life: number };

const readRGB = (name: string, fallback: string) =>
  (getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback).split(",").map(Number);
const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Route a lane across the grid: long straight runs, 45° chamfers at every turn. */
function route(rand: () => number, W: number, H: number): Lane {
  const snap = (v: number) => Math.round(v / MAJOR) * MAJOR;
  const horizontal = rand() < 0.6;
  let x = horizontal ? -MAJOR : snap(rand() * W), y = horizontal ? snap(rand() * H) : -MAJOR;
  const pts: Pt[] = [{ x, y }];
  let dir = horizontal ? 0 : 1; // 0 → east, 1 → south
  const step = () => MAJOR * (1 + Math.floor(rand() * 3));
  for (let k = 0; k < 14 && x < W + MAJOR && y < H + MAJOR; k++) {
    const run = step();
    if (dir === 0) x += run; else y += run;
    pts.push({ x, y });
    // chamfered turn: a 45° jog of one minor-grid diagonal, then continue the other way
    const c = MAJOR / 2;
    if (rand() < 0.65) {
      x += c; y += c; pts.push({ x, y });
      dir = dir === 0 ? 1 : 0;
    }
  }
  const seg: number[] = [];
  let len = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); seg.push(d); len += d; }
  const ys = pts.map((p) => p.y);
  return { pts, len, seg, lit: 0, top: Math.min(...ys), bottom: Math.max(...ys) };
}

function pointAt(l: Lane, s: number): Pt {
  let d = Math.max(0, Math.min(l.len, s));
  for (let i = 0; i < l.seg.length; i++) {
    if (d <= l.seg[i]) { const t = d / (l.seg[i] || 1), a = l.pts[i], b = l.pts[i + 1]; return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
    d -= l.seg[i];
  }
  return l.pts[l.pts.length - 1];
}

export default function LaneField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const readout = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = ref.current, ro = readout.current;
    if (!cv || !ro) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let W = 0, H = 0, raf = 0, last = 0, running = true, scroll = 0;
    let lanes: Lane[] = [];
    const streaks: Streak[] = [];
    const mouse = { x: -1e4, y: -1e4, on: false, a: 0 };
    const pings: { x: number; y: number; age: number }[] = [];
    let col = { line: [197, 165, 114], gold: [226, 205, 164], red: [232, 97, 91] };
    const readColours = () => { col = { line: readRGB("--field-a", "197,165,114"), gold: readRGB("--field-b", "226,205,164"), red: readRGB("--field-hot", "232,97,91") }; };
    const rand = seeded(19);

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = seeded(7);
      // Lanes cover the whole page at quarter speed (parallax), so scrolling never wraps.
      const band = H + Math.max(0, document.documentElement.scrollHeight - H) * 0.25 + MAJOR * 2;
      lanes = [];
      for (let y0 = -MAJOR; y0 < band; y0 += H) {
        for (let i = 0; i < Math.round(Math.max(8, (W * H) / 90000)); i++) {
          const l = route(r, W, H);
          l.pts.forEach((p) => (p.y += y0)); l.top += y0; l.bottom += y0;
          lanes.push(l);
        }
      }
      streaks.length = 0;
      for (let i = 0; i < 14; i++) spawn(visibleLane(), rand() * 0.6);
    };

    function spawn(lane: number, at = 0, dir: 1 | -1 = 1, fast = false) {
      const l = lanes[lane];
      if (!l) return;
      streaks.push({ lane, s: dir === 1 ? at * l.len : l.len - at * l.len, speed: (fast ? 520 : 90 + rand() * 110), red: rand() < 0.35, dir, life: fast ? 1 : Infinity });
    }

    const offsetY = () => -scroll * 0.25;
    // New shipments start on lanes that are on screen, so the view stays busy.
    const visibleLane = () => {
      const oy = offsetY();
      const on = lanes.map((l, i) => (l.bottom + oy > 0 && l.top + oy < H ? i : -1)).filter((i) => i >= 0);
      return on.length ? on[Math.floor(rand() * on.length)] : Math.floor(rand() * lanes.length);
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, W, H);
      const { line, gold, red } = col;
      const oy = offsetY();

      // drafting grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(line, 0.045);
      ctx.beginPath();
      for (let x = 0.5; x < W; x += MINOR) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = (oy % MINOR) + 0.5; y < H; y += MINOR) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
      ctx.strokeStyle = rgba(line, 0.09);
      ctx.beginPath();
      for (let x = 0.5; x < W; x += MAJOR) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = (oy % MAJOR) + 0.5; y < H; y += MAJOR) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
      // registration marks at major crossings
      ctx.strokeStyle = rgba(line, 0.28);
      ctx.beginPath();
      for (let x = MAJOR; x < W; x += MAJOR * 2) for (let y = (oy % (MAJOR * 2)) + MAJOR; y < H; y += MAJOR * 2) {
        ctx.moveTo(x - 4, y + 0.5); ctx.lineTo(x + 4, y + 0.5); ctx.moveTo(x + 0.5, y - 4); ctx.lineTo(x + 0.5, y + 4);
      }
      ctx.stroke();

      ctx.save();
      ctx.translate(0, oy);
      // lanes + square terminals
      for (const l of lanes) {
        l.lit = Math.max(0, l.lit - dt * 1.2);
        if (l.bottom + oy < -10 || l.top + oy > H + 10) continue;
        ctx.strokeStyle = rgba(line, 0.13 + 0.4 * l.lit);
        ctx.lineWidth = 1.4 + l.lit;
        ctx.lineJoin = "miter";
        ctx.beginPath();
        l.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.stroke();
        ctx.fillStyle = rgba(line, 0.3 + 0.4 * l.lit);
        for (let i = 1; i < l.pts.length - 1; i += 3) { const p = l.pts[i]; ctx.fillRect(p.x - 3, p.y - 3, 6, 6); }
      }
      // streaks
      for (let i = streaks.length - 1; i >= 0; i--) {
        const st = streaks[i], l = lanes[st.lane];
        if (!l) { streaks.splice(i, 1); continue; }
        st.s += st.speed * dt * st.dir;
        if (st.life !== Infinity) st.life -= dt * 0.5;
        if (st.s > l.len || st.s < 0 || st.life <= 0) {
          streaks.splice(i, 1);
          if (st.life === Infinity) spawn(visibleLane());
          continue;
        }
        if (l.bottom + oy < -10 || l.top + oy > H + 10) continue;
        const c = st.red ? red : gold, tail = st.life === Infinity ? 70 : 140;
        const head = pointAt(l, st.s);
        for (let k = 0; k < 10; k++) {
          const p = pointAt(l, st.s - st.dir * (tail * k) / 10);
          ctx.fillStyle = rgba(c, (1 - k / 10) * 0.7);
          ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        }
        ctx.fillStyle = rgba(c, 1);
        ctx.shadowColor = rgba(c, 0.9); ctx.shadowBlur = 10;
        ctx.fillRect(head.x - 2.5, head.y - 2.5, 5, 5);
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // square dispatch pings
      for (let i = pings.length - 1; i >= 0; i--) {
        const p = pings[i];
        p.age += dt;
        if (p.age > 1) { pings.splice(i, 1); continue; }
        const r = 8 + p.age * 70;
        ctx.strokeStyle = rgba(gold, 0.7 * (1 - p.age));
        ctx.lineWidth = 1.2;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.PI / 4); ctx.strokeRect(-r / 2, -r / 2, r, r); ctx.restore();
      }

      // drafting crosshair
      mouse.a += ((mouse.on ? 1 : 0) - mouse.a) * Math.min(1, dt * 8 || 1);
      if (mouse.a > 0.02) {
        const { x, y } = mouse, a = mouse.a;
        const gx = ctx.createLinearGradient(x - 260, 0, x + 260, 0);
        gx.addColorStop(0, rgba(gold, 0)); gx.addColorStop(0.5, rgba(gold, 0.35 * a)); gx.addColorStop(1, rgba(gold, 0));
        ctx.fillStyle = gx; ctx.fillRect(x - 260, Math.round(y), 520, 1);
        const gy = ctx.createLinearGradient(0, y - 260, 0, y + 260);
        gy.addColorStop(0, rgba(gold, 0)); gy.addColorStop(0.5, rgba(gold, 0.35 * a)); gy.addColorStop(1, rgba(gold, 0));
        ctx.fillStyle = gy; ctx.fillRect(Math.round(x), y - 260, 1, 520);
        // corner-bracket reticle
        ctx.strokeStyle = rgba(gold, 0.8 * a); ctx.lineWidth = 1.2;
        const s = 11, k = 5;
        ctx.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          ctx.moveTo(x + sx * s, y + sy * (s - k)); ctx.lineTo(x + sx * s, y + sy * s); ctx.lineTo(x + sx * (s - k), y + sy * s);
        }
        ctx.stroke();
        // light up lanes near the cursor
        for (const l of lanes) {
          if (l.bottom + oy < y - 80 || l.top + oy > y + 80) continue;
          for (const p of l.pts) if (Math.abs(p.x - x) < 70 && Math.abs(p.y + oy - y) < 70) { l.lit = Math.min(1, l.lit + dt * 4); break; }
        }
      }
    };

    const loop = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      draw(dt);
      raf = running ? requestAnimationFrame(loop) : 0;
    };
    const start = () => { if (!raf && !reduced) { last = 0; raf = requestAnimationFrame(loop); } };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true;
      ro.style.opacity = "1";
      ro.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 16}px)`;
      ro.textContent = `X ${String(Math.round(e.clientX)).padStart(4, "0")} · Y ${String(Math.round(e.clientY + window.scrollY)).padStart(5, "0")}`;
      if (reduced) draw(0);
    };
    const onLeave = () => { mouse.on = false; ro.style.opacity = "0"; };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element;
      if (t.closest("a, button, input, textarea, select, label, [role=dialog], svg, img, canvas, .sl, .mc, .lab, .ae-backdrop")) return;
      if (window.getSelection()?.toString()) return;
      // dispatch along the nearest lane, both ways
      const oy = offsetY();
      let best = -1, bs = 0, bd = Infinity;
      lanes.forEach((l, i) => { if (l.bottom + oy < e.clientY - 260 || l.top + oy > e.clientY + 260) return; for (let s = 0; s < l.len; s += 20) { const p = pointAt(l, s); const d = Math.hypot(p.x - e.clientX, p.y + oy - e.clientY); if (d < bd) { bd = d; best = i; bs = s; } } });
      pings.push({ x: e.clientX, y: e.clientY, age: 0 });
      if (best >= 0 && bd < 240) {
        const l = lanes[best]; l.lit = 1;
        spawn(best, bs / l.len, 1, true); spawn(best, 1 - bs / l.len, -1, true);
      }
      if (reduced) draw(0);
    };
    const onScroll = () => { scroll = window.scrollY; if (reduced) draw(0); };
    const onResize = () => { build(); draw(0); };
    const onVisibility = () => { running = !document.hidden; if (running) start(); };
    const mood = new MutationObserver(() => { readColours(); draw(0); });

    readColours();
    scroll = window.scrollY;
    build();
    draw(0);
    start();
    window.addEventListener("resize", onResize);
    // The page grows as images load; rebuild the lane band when it does.
    let lastH = document.documentElement.scrollHeight;
    const grow = new ResizeObserver(() => { const h = document.documentElement.scrollHeight; if (Math.abs(h - lastH) > 200) { lastH = h; build(); } });
    grow.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (!coarse) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      window.addEventListener("click", onClick);
    }
    document.addEventListener("visibilitychange", onVisibility);
    mood.observe(document.documentElement, { attributes: true, attributeFilter: ["data-time"] });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVisibility);
      mood.disconnect();
      grow.disconnect();
    };
  }, []);

  return (
    <div className="lanefield" aria-hidden="true">
      <canvas ref={ref} className="lanefield-canvas" />
      <div ref={readout} className="lanefield-readout" />
    </div>
  );
}
