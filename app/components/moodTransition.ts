/*
 * Mood transition: perfusion. Vessels shoot out of the mood key and branch across the page
 * like a vascular tree (or a distribution network growing out of its hub), with clinics
 * blinking on at the branch tips. The new mood floods in behind them until it covers the
 * page; the mood switches underneath, and a clearing wave spreads back out from the key to
 * reveal it while the vessels fade.
 *
 * Drawn on a one-off canvas over everything. The colours are the new mood's, copied from
 * the mood tokens in globals.css (they aren't readable before the mood is applied).
 */

import type { Time } from "./TimeKeys";

const MOOD: Record<Time, { bg: string; vessel: string; clinic: string }> = {
  morning: { bg: "#E2ECF1", vessel: "#1A6A76", clinic: "#B02A35" },
  afternoon: { bg: "#F6EEDC", vessel: "#9C5A12", clinic: "#A3262A" },
  evening: { bg: "#1B1322", vessel: "#F2916A", clinic: "#F06A5C" },
  night: { bg: "#04070D", vessel: "#E2CDA4", clinic: "#E8615B" },
};

const GROW = 1.9;          // px per ms a vessel grows
const FLOOD_START = 160;   // ms before the flood follows the vessels out
const COVERED = 900;       // ms: the page is fully flooded, so the mood switches here
const CLEAR_END = 1650;    // ms: the clearing wave has reached the far corner

type Seg = { x0: number; y0: number; x1: number; y1: number; t0: number; t1: number; w: number; tip: boolean };

// A branching tree from (ox, oy), aimed into the page. Each segment knows when it starts and
// finishes growing, so the whole tree can be drawn at any moment from the clock alone.
function grow(ox: number, oy: number, W: number, H: number) {
  const segs: Seg[] = [];
  const toward = Math.atan2(H * 0.6 - oy, W * 0.45 - ox);
  const walk = (x: number, y: number, a: number, t: number, w: number, depth: number) => {
    for (let i = 0; i < 40 && segs.length < 700; i++) {
      const len = 34 + Math.random() * 46;
      a += (Math.random() - 0.5) * 0.7;
      const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len, t1 = t + len / GROW;
      const off = x1 < -60 || x1 > W + 60 || y1 < -60 || y1 > H + 60;
      segs.push({ x0: x, y0: y, x1, y1, t0: t, t1, w, tip: off || i === 39 });
      if (off) return;
      if (depth < 6 && Math.random() < 0.3) walk(x1, y1, a + (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5), t1, Math.max(1, w * 0.7), depth + 1);
      x = x1; y = y1; t = t1; w = Math.max(1, w * 0.97);
    }
  };
  for (let r = 0; r < 7; r++) walk(ox, oy, toward + (r - 3) * 0.42, 0, 5.5, 0);
  return segs;
}

export function perfuse(to: Time, from: HTMLElement | null, apply: () => void) {
  const W = window.innerWidth, H = window.innerHeight;
  const box = from?.getBoundingClientRect();
  const ox = box ? box.left + box.width / 2 : W - 60, oy = box ? box.top + box.height / 2 : 30;
  const far = Math.max(Math.hypot(ox, oy), Math.hypot(W - ox, oy), Math.hypot(ox, H - oy), Math.hypot(W - ox, H - oy));
  const c = MOOD[to];
  const segs = grow(ox, oy, W, H);

  const cv = document.createElement("canvas");
  cv.className = "mood-perfusion";
  cv.setAttribute("aria-hidden", "true");
  cv.width = W; cv.height = H;
  document.body.append(cv);
  const ctx = cv.getContext("2d");
  if (!ctx) { cv.remove(); apply(); return; }

  let t0 = 0, switched = false;
  const frame = (now: number) => {
    if (!t0) t0 = now;
    const t = now - t0;
    ctx.clearRect(0, 0, W, H);

    // The flood: a wobbling front that follows the vessels out and covers the page by COVERED.
    const q = Math.max(0, Math.min(1, (t - FLOOD_START) / (COVERED - FLOOD_START)));
    const reach = (q * q * (3 - 2 * q)) * (far + 40);
    if (reach > 0) {
      ctx.fillStyle = c.bg;
      ctx.beginPath();
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        const r = reach * (1 + 0.06 * Math.sin(a * 7 + t * 0.01) * (1 - q));
        if (i) ctx.lineTo(ox + Math.cos(a) * r, oy + Math.sin(a) * r); else ctx.moveTo(ox + Math.cos(a) * r, oy + Math.sin(a) * r);
      }
      ctx.fill();
    }
    if (!switched && t >= COVERED) { switched = true; apply(); }

    // The clearing wave: once switched, a hole spreads back out from the key, revealing the page.
    const cq = Math.max(0, Math.min(1, (t - COVERED - 40) / (CLEAR_END - COVERED - 40)));
    if (cq > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(1, cq * (far + 120)));
      g.addColorStop(0, "#000"); g.addColorStop(0.86, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // The vessels, and a clinic lighting up at each tip as it's reached. They fade out as the page clears.
    const fade = 1 - cq;
    if (fade > 0) {
      ctx.lineCap = "round";
      ctx.strokeStyle = c.vessel;
      ctx.shadowColor = c.vessel;
      ctx.shadowBlur = 10;
      ctx.globalAlpha = fade;
      for (const s of segs) {
        if (t < s.t0) continue;
        const k = Math.min(1, (t - s.t0) / (s.t1 - s.t0));
        ctx.lineWidth = s.w;
        ctx.beginPath(); ctx.moveTo(s.x0, s.y0); ctx.lineTo(s.x0 + (s.x1 - s.x0) * k, s.y0 + (s.y1 - s.y0) * k); ctx.stroke();
      }
      ctx.shadowColor = c.clinic;
      ctx.fillStyle = c.clinic;
      for (const s of segs) {
        if (!s.tip || t < s.t1) continue;
        const p = Math.min(1, (t - s.t1) / 220);
        const z = 3 + 3 * (1 - p);
        ctx.fillRect(s.x1 - z / 3, s.y1 - z, (z * 2) / 3, z * 2);
        ctx.fillRect(s.x1 - z, s.y1 - z / 3, z * 2, (z * 2) / 3);
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    if (t < CLEAR_END) requestAnimationFrame(frame);
    else cv.remove();
  };
  requestAnimationFrame(frame);
}
