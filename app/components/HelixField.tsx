"use client";

import { useEffect, useRef } from "react";
import { toolkit } from "../content";

/*
 * The site-wide backdrop: one long DNA double helix that the whole page sits on. Its
 * axis isn't a straight line. It bends gently, the way a real strand coils, and the
 * two backbones are offset like real DNA (a wide major groove and a narrow minor one).
 * Base pairs join the strands, gold for A–T and red for G–C. Scrolling turns the helix
 * and travels down it. Depth is shown by line weight and fade only, so it stays quiet
 * behind text. Colours follow the time-of-day mood.
 *
 * It's Aditya's DNA: every base pair carries one skill from the Toolkit, always the same
 * one. Hovering near the strand reads the nearest pair. Dragging across open space turns
 * the helix by hand, like a lab model, and it spins on a little after letting go.
 *
 * It only draws when something changes (scroll, a new pair read, a turn). The page's glass
 * cards blur whatever is behind them, so a canvas that redrew every frame would make every
 * card re-blur every frame.
 */

const readRGB = (name: string, fallback: string) =>
  (getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback).split(",").map(Number);
const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

const STEP = 8;          // world px between backbone samples
const RUNG = 46;         // world px between base pairs (≈ 10.5 pairs per turn)
const TWIST = (Math.PI * 2) / (RUNG * 10.5);
const GROOVE = 2.35;     // phase gap between the two backbones (radians): major vs minor groove
const LEVELS = 4;        // depth is drawn in a few batched bands rather than per segment
const READ_RANGE = 46;   // how close (px) the cursor must be to a pair to read it

const GENES = toolkit.flatMap((g) => g.skills.map((s) => ({ skill: s.name, group: g.group })));

type Pair = { k: number; ax: number; ay: number; bx: number; by: number; z: number; gc: boolean };

// Distance from a point to a segment.
const segDist = (px: number, py: number, p: Pair) => {
  const dx = p.bx - p.ax, dy = p.by - p.ay;
  const t = Math.max(0, Math.min(1, ((px - p.ax) * dx + (py - p.ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (p.ax + dx * t), py - (p.ay + dy * t));
};

export default function HelixField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const label = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = ref.current, tag = label.current;
    if (!cv || !tag) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1, raf = 0, last = 0;
    let target = window.scrollY, pos = target;
    let turn = 0, spinV = 0;                     // hand-turned rotation and its momentum
    let drag: { x: number } | null = null;
    let pairs: Pair[] = [];
    let hover = -1;                              // world index of the pair being read
    const mouse = { x: -1, y: -1 };
    let col = { line: [197, 165, 114], gold: [226, 205, 164], red: [232, 97, 91] };
    const readColours = () => { col = { line: readRGB("--field-a", "197,165,114"), gold: readRGB("--field-b", "226,205,164"), red: readRGB("--field-hot", "232,97,91") }; };

    const resize = () => {
      // Drawn at 1 device pixel per CSS pixel at most: these are faint background lines, and a
      // 2x canvas is four times the pixels to paint under the glass cards on every frame.
      dpr = Math.min(window.devicePixelRatio || 1, 1);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    };

    // Where the axis sits for a given world y: two slow, unrelated bends so it never repeats neatly.
    const axis = (wy: number) => {
      const amp = Math.min(W * 0.11, 150);
      return W * 0.5 + amp * Math.sin(wy * 0.0011 + 0.6) + amp * 0.45 * Math.sin(wy * 0.0027 + 2.1);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const R = Math.min(W * 0.2, 250);
      const travel = pos * 0.55;                  // we move down the strand slower than the page
      const spin = pos * 0.0032 + turn;           // scrolling turns it, and so does a drag
      const y0 = -RUNG * 2, y1 = H + RUNG * 2;
      const pt = (sy: number, phase: number) => {
        const wy = sy + travel;
        const th = wy * TWIST + spin + phase;
        return { x: axis(wy) + Math.cos(th) * R, y: sy, z: Math.sin(th) };
      };
      const level = (z: number) => Math.min(LEVELS - 1, Math.floor((0.5 + z * 0.5) * LEVELS));
      const depthOf = (lv: number) => (lv + 0.5) / LEVELS;
      pairs = [];
      let read: Pair | null = null;

      for (const front of [false, true]) {
        const bb = Array.from({ length: LEVELS }, () => new Path2D());
        const rungL = Array.from({ length: LEVELS }, () => new Path2D());
        const rungG = Array.from({ length: LEVELS }, () => new Path2D());
        const rungR = Array.from({ length: LEVELS }, () => new Path2D());
        const nodes = Array.from({ length: LEVELS }, () => new Path2D());

        const first = Math.ceil((y0 + travel) / RUNG) * RUNG - travel;
        for (let sy = first; sy < y1; sy += RUNG) {
          const a = pt(sy, 0), b = pt(sy, GROOVE);
          const z = (a.z + b.z) / 2;
          if ((z >= 0) !== front) continue;
          const k = Math.round((sy + travel) / RUNG);
          const gc = ((k * 7919) % 5) < 2;          // fixed pseudo-random sequence of pairs
          const pair = { k, ax: a.x, ay: a.y, bx: b.x, by: b.y, z, gc };
          pairs.push(pair);
          if (k === hover) { read = pair; continue; }
          const lv = level(z);
          const mx = a.x + (b.x - a.x) * (0.42 + ((k * 31) % 7) * 0.02), my = a.y + (b.y - a.y) * 0.5;
          rungL[lv].moveTo(a.x, a.y); rungL[lv].lineTo(mx, my);
          (gc ? rungR : rungG)[lv].moveTo(mx, my); (gc ? rungR : rungG)[lv].lineTo(b.x, b.y);
          for (const p of [a, b]) { nodes[lv].moveTo(p.x + 2, p.y); nodes[lv].arc(p.x, p.y, 1.2 + depthOf(lv) * 2.2, 0, Math.PI * 2); }
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
          const d = depthOf(lv);
          ctx.lineWidth = 0.8 + d * 1.4;
          ctx.strokeStyle = rgba(col.line, 0.04 + d * 0.12); ctx.stroke(rungL[lv]);
          ctx.strokeStyle = rgba(col.gold, 0.04 + d * 0.14); ctx.stroke(rungG[lv]);
          ctx.strokeStyle = rgba(col.red, 0.04 + d * 0.14); ctx.stroke(rungR[lv]);
          ctx.lineWidth = 0.8 + d * 2.6;
          ctx.strokeStyle = rgba(col.gold, 0.05 + d * 0.22); ctx.stroke(bb[lv]);
          ctx.fillStyle = rgba(col.gold, 0.06 + d * 0.3); ctx.fill(nodes[lv]);
        }
      }

      // The pair being read: drawn solid, with a leader line out to its label.
      if (read) {
        const r = read as Pair;
        const right = Math.max(r.ax, r.bx), left = Math.min(r.ax, r.bx);
        const flip = right + 220 > W;
        const ex = flip ? left : right, ey = flip ? (r.ax < r.bx ? r.ay : r.by) : (r.ax > r.bx ? r.ay : r.by);
        const lx = flip ? ex - 34 : ex + 34;
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = rgba(r.gc ? col.red : col.gold, 0.95);
        ctx.beginPath(); ctx.moveTo(r.ax, r.ay); ctx.lineTo(r.bx, r.by); ctx.stroke();
        ctx.fillStyle = rgba(col.gold, 1);
        ctx.beginPath(); ctx.arc(r.ax, r.ay, 4, 0, Math.PI * 2); ctx.arc(r.bx, r.by, 4, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(col.gold, 0.6);
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(lx, ey); ctx.stroke();
        const gene = GENES[((r.k % GENES.length) + GENES.length) % GENES.length];
        tag.innerHTML = `<span>PAIR ${String(Math.abs(r.k)).padStart(4, "0")} · ${r.gc ? "G–C" : "A–T"}</span><b></b><i></i>`;
        (tag.children[1] as HTMLElement).textContent = gene.skill;
        (tag.children[2] as HTMLElement).textContent = gene.group;
        tag.style.transform = `translate(${flip ? lx - tag.offsetWidth : lx}px, ${ey - 20}px)`;
        tag.classList.add("is-on");
      } else {
        tag.classList.remove("is-on");
      }
    };

    // Runs only while something is moving, then stops.
    const loop = (t: number) => {
      // ~30 redraws a second is plenty for a slow background and halves the painting.
      if (last && t - last < 30) { raf = requestAnimationFrame(loop); return; }
      last = t;
      const d = target - pos;
      pos += Math.abs(d) < 0.3 ? d : d * 0.22;
      if (!drag) { turn += spinV; spinV *= 0.9; if (Math.abs(spinV) < 0.0004) spinV = 0; }
      pick();
      draw();
      const busy = Math.abs(target - pos) > 0.3 || spinV !== 0 || drag !== null;
      raf = busy ? requestAnimationFrame(loop) : 0;
      if (!busy) last = 0;
    };
    const kick = () => { if (reduced) { pos = target; spinV = 0; pick(); draw(); return; } if (!raf) raf = requestAnimationFrame(loop); };

    // Which pair (if any) the cursor is reading. Front pairs win over ones behind.
    const pick = () => {
      let best = -1, bd = READ_RANGE;
      if (mouse.x >= 0 && !drag) for (const p of pairs) { const dd = segDist(mouse.x, mouse.y, p) - (p.z > 0 ? 8 : 0); if (dd < bd) { bd = dd; best = p.k; } }
      const changed = best !== hover;
      hover = best;
      return changed;
    };

    // Open space only: never start a turn on text, controls, cards or media.
    const openSpace = (t: Element) => !t.closest("a, button, input, textarea, select, label, p, h1, h2, h3, h4, li, dt, dd, figure, blockquote, img, svg, canvas, video, [role=dialog], .glass, .sl, .mc, .lab, .ae-backdrop, .site-header");

    const onScroll = () => { target = window.scrollY; kick(); };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mouse.x = e.clientX; mouse.y = e.clientY;
      if (drag) {
        const dx = e.clientX - drag.x;
        drag.x = e.clientX;
        turn += dx * 0.009; spinV = dx * 0.009;
        kick();
        return;
      }
      // Hovering only redraws when it starts reading a different pair.
      if (pick()) { if (raf) return; draw(); }
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.button !== 0 || !openSpace(e.target as Element)) return;
      drag = { x: e.clientX };
      document.documentElement.classList.add("helix-turning");
      kick();
    };
    const onUp = () => {
      if (!drag) return;
      drag = null;
      document.documentElement.classList.remove("helix-turning");
      kick();
    };
    const onLeave = () => { mouse.x = -1; if (pick()) draw(); };
    const onResize = () => { resize(); draw(); };
    const mood = new MutationObserver(() => { readColours(); draw(); });

    readColours(); resize(); draw();
    mood.observe(document.documentElement, { attributes: true, attributeFilter: ["data-time"] });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf); mood.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("helix-turning");
    };
  }, []);

  return (
    <div className="lanefield helixfield" aria-hidden="true">
      <canvas ref={ref} className="lanefield-canvas" />
      <div ref={label} className="helix-tag" />
    </div>
  );
}
