"use client";

import { useEffect, useRef } from "react";

/*
 * The site-wide backdrop: one long DNA double helix that the whole page sits on. Its
 * axis isn't a straight line. It bends gently, the way a real strand coils, and the
 * two backbones are offset like real DNA (a wide major groove and a narrow minor one).
 * Base pairs join the strands, gold for A–T and red for G–C. Scrolling turns the helix
 * and travels down it. Depth is shown by line weight and fade only, so it stays quiet
 * behind text. Colours follow the time-of-day mood.
 */

const readRGB = (name: string, fallback: string) =>
  (getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback).split(",").map(Number);
const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

const STEP = 5;          // world px between backbone samples
const RUNG = 46;         // world px between base pairs (≈ 10.5 pairs per turn)
const TWIST = (Math.PI * 2) / (RUNG * 10.5);
const GROOVE = 2.35;     // phase gap between the two backbones (radians): major vs minor groove

export default function HelixField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1, raf = 0, running = true;
    let target = window.scrollY, pos = target, idle = 0;
    let col = { line: [197, 165, 114], gold: [226, 205, 164], red: [232, 97, 91] };
    const readColours = () => { col = { line: readRGB("--field-a", "197,165,114"), gold: readRGB("--field-b", "226,205,164"), red: readRGB("--field-hot", "232,97,91") }; };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    };

    // Where the axis sits for a given world y: two slow, unrelated bends so it never repeats neatly.
    const axis = (wy: number) => {
      const amp = Math.min(W * 0.11, 150);
      return W * 0.5 + amp * Math.sin(wy * 0.0011 + 0.6) + amp * 0.45 * Math.sin(wy * 0.0027 + 2.1);
    };

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const R = Math.min(W * 0.2, 250);
      const travel = pos * 0.55;                  // we move down the strand slower than the page
      const spin = pos * 0.0032 + t * 0.00004;     // scrolling turns it; a very slow drift otherwise
      const y0 = -RUNG * 2, y1 = H + RUNG * 2;
      const pt = (sy: number, phase: number) => {
        const wy = sy + travel;
        const th = wy * TWIST + spin + phase;
        return { x: axis(wy) + Math.cos(th) * R, y: sy, z: Math.sin(th) };
      };

      // Two passes, back half first, so the strand in front always covers the one behind.
      for (const front of [false, true]) {
        // Base pairs
        const first = Math.ceil((y0 + travel) / RUNG) * RUNG - travel;
        for (let sy = first; sy < y1; sy += RUNG) {
          const a = pt(sy, 0), b = pt(sy, GROOVE);
          const z = (a.z + b.z) / 2;
          if ((z >= 0) !== front) continue;
          const k = Math.round((sy + travel) / RUNG);
          const gc = ((k * 7919) % 5) < 2;          // fixed pseudo-random sequence of pairs
          const depth = 0.5 + z * 0.5;
          const mx = a.x + (b.x - a.x) * (0.42 + ((k * 31) % 7) * 0.02), my = a.y + (b.y - a.y) * 0.5;
          ctx.lineWidth = 0.8 + depth * 1.4;
          ctx.strokeStyle = rgba(col.line, 0.04 + depth * 0.12);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.stroke();
          ctx.strokeStyle = rgba(gc ? col.red : col.gold, 0.04 + depth * 0.14);
          ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        // Backbones: drawn as short runs so weight and fade can follow depth.
        for (const phase of [0, GROOVE]) {
          let prev = pt(y0, phase);
          for (let sy = y0 + STEP; sy <= y1; sy += STEP) {
            const p = pt(sy, phase);
            const z = (p.z + prev.z) / 2;
            if ((z >= 0) === front) {
              const depth = 0.5 + z * 0.5;
              ctx.lineWidth = 0.8 + depth * 2.6;
              ctx.strokeStyle = rgba(col.gold, 0.05 + depth * 0.22);
              ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
            }
            prev = p;
          }
          // Phosphate nodes where each pair meets the backbone.
          const firstN = Math.ceil((y0 + travel) / RUNG) * RUNG - travel;
          for (let sy = firstN; sy < y1; sy += RUNG) {
            const p = pt(sy, phase);
            if ((p.z >= 0) !== front) continue;
            const depth = 0.5 + p.z * 0.5;
            ctx.fillStyle = rgba(col.gold, 0.06 + depth * 0.3);
            ctx.beginPath(); ctx.arc(p.x, p.y, 1.2 + depth * 2.2, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    };

    const loop = (t: number) => {
      if (!running) return;
      // Ease towards the real scroll position so the turn feels mechanical, not jumpy.
      const d = target - pos;
      pos += Math.abs(d) < 0.3 ? d : d * 0.12;
      // Once settled, only the slow drift remains: redraw every 4th frame to save battery.
      idle = Math.abs(d) < 0.3 ? idle + 1 : 0;
      if (idle < 60 || idle % 4 === 0) draw(t);
      raf = requestAnimationFrame(loop);
    };

    readColours(); resize();
    if (reduced) draw(0); else raf = requestAnimationFrame(loop);

    const onScroll = () => { target = window.scrollY; idle = 0; if (reduced) { pos = target; draw(0); } };
    const onResize = () => { resize(); draw(0); };
    const mood = new MutationObserver(() => { readColours(); draw(0); });
    mood.observe(document.documentElement, { attributes: true, attributeFilter: ["data-time"] });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      running = false; cancelAnimationFrame(raf); mood.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="lanefield helixfield" aria-hidden="true">
      <canvas ref={ref} className="lanefield-canvas" />
    </div>
  );
}
