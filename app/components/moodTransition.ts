/*
 * Mood transition: the heartbeat. The lights go down, drops of blood stream in from every
 * edge towards the middle of the screen, and a heartbeat trace pops up there and runs out
 * both ways, its spikes jumping on each beat, lub-dub. On the third, harder beat it shoots
 * out to the edges and pumps the new mood out behind it: a flood spreads from the middle
 * across the page, the mood switches underneath, and a clearing wave spreads back out to
 * reveal it.
 *
 * Drawn on a one-off canvas over everything. The page colours are the new mood's, copied
 * from the mood tokens in globals.css (they aren't readable before the mood is applied).
 */

import type { Time } from "./TimeKeys";

const MOOD: Record<Time, { bg: string; blood: string }> = {
  morning: { bg: "#E2ECF1", blood: "#B02A35" },
  afternoon: { bg: "#F6EEDC", blood: "#A3262A" },
  evening: { bg: "#1B1322", blood: "#F06A5C" },
  night: { bg: "#04070D", blood: "#E8615B" },
};

// Timeline (ms).
const DARK = 280;          // the lights are down
const INFLOW = 900;        // the last drop has reached the middle
const TRACE = 360;         // the heartbeat trace pops up
const BEATS = [640, 820];  // lub, dub
const PUMP = 1040;         // the beat that pumps the new mood out
const COVERED = 1480;      // the flood has covered the page: switch the mood here
const END = 2150;          // the page has cleared

// One heartbeat of the trace, PERIOD px long: flat, a P wave, the QRS spike and a T wave.
// Returns the height (px, up is negative) at x along the beat.
const PERIOD = 170;
const bump = (x: number, at: number, w: number, h: number) => h * Math.exp(-(((x - at) / w) ** 2));
const ecg = (x: number) => {
  const u = ((x % PERIOD) + PERIOD) % PERIOD;
  return bump(u, 40, 6, -7) + bump(u, 78, 2.4, 10) + bump(u, 85, 3, -54) + bump(u, 92, 2.6, 18) + bump(u, 126, 9, -12);
};

type Drop = { a: number; r: number; t0: number; t1: number; size: number; curl: number };

// Drops start scattered around (and beyond) the edges of the screen at staggered times, and
// all arrive in the middle by INFLOW.
function drops(far: number) {
  return Array.from({ length: 150 }, (): Drop => {
    const t0 = Math.random() * 360;
    return { a: Math.random() * Math.PI * 2, r: far * (0.55 + Math.random() * 0.6), t0, t1: Math.min(INFLOW, t0 + 380 + Math.random() * 260), size: 4 + Math.random() * 4.5, curl: (Math.random() - 0.5) * 0.9 };
  });
}

// How hard the heart is beating at time t: two soft beats, then a hard one that pumps.
const pulse = (t: number, at: number, w: number) => Math.exp(-(((t - at) / w) ** 2));
const beatScale = (t: number) => pulse(t, BEATS[0], 55) * 0.6 + pulse(t, BEATS[1], 50) * 0.4 + pulse(t, PUMP, 70);

export function perfuse(to: Time, apply: () => void) {
  const W = window.innerWidth, H = window.innerHeight;
  const ox = W / 2, oy = H / 2;
  const far = Math.hypot(W, H) / 2 + 40;
  const c = MOOD[to];
  const flow = drops(far);
  const cv = document.createElement("canvas");
  cv.className = "mood-perfusion";
  cv.setAttribute("aria-hidden", "true");
  cv.width = W; cv.height = H;
  document.body.append(cv);
  const ctx = cv.getContext("2d");
  if (!ctx) { cv.remove(); apply(); return; }

  // The trace: centred on the middle of the screen, drawn out to `half` px either side.
  const drawTrace = (t: number) => {
    const grow = Math.max(0, Math.min(1, (t - TRACE) / 420));
    const shoot = Math.max(0, Math.min(1, (t - PUMP) / 320));
    const half = (1 - (1 - grow) ** 3) * W * 0.32 + shoot * shoot * W * 0.8;
    const alpha = 1 - Math.max(0, Math.min(1, (t - PUMP - 120) / 360));
    if (half < 2 || alpha <= 0) return;
    const amp = 0.55 + beatScale(t) * 0.9;
    const line = new Path2D();
    for (let x = -half; x <= half; x += 3) {
      // Centre a QRS spike on the middle, and let the trace settle towards its ends.
      const y = oy + ecg(x + 85) * amp * (1 - 0.5 * Math.abs(x) / Math.max(half, 1));
      if (x === -half) line.moveTo(ox + x, y); else line.lineTo(ox + x, y);
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.shadowColor = c.blood;
    ctx.shadowBlur = 14 + 24 * beatScale(t);
    ctx.strokeStyle = c.blood; ctx.lineWidth = 3; ctx.stroke(line);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffe3dc"; ctx.lineWidth = 1.2; ctx.stroke(line);
    // A bright head at each end of the trace.
    ctx.fillStyle = "#fff";
    ctx.shadowColor = c.blood; ctx.shadowBlur = 16;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(ox + sx * half, oy + ecg(sx * half + 85) * amp * 0.5, 3.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  };

  let t0 = 0, switched = false;
  const frame = (now: number) => {
    if (!t0) t0 = now;
    const t = now - t0;
    ctx.clearRect(0, 0, W, H);

    // Lights off: the page goes dark before anything else happens.
    ctx.fillStyle = `rgba(2, 3, 6, ${(0.9 * Math.min(1, t / DARK)).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);

    // The pumped flood: a wobbling front from the middle that covers the page by COVERED.
    const q = Math.max(0, Math.min(1, (t - PUMP) / (COVERED - PUMP)));
    if (q > 0) {
      const reach = q * q * (3 - 2 * q) * far;
      ctx.fillStyle = c.bg;
      ctx.beginPath();
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        const r = reach * (1 + 0.07 * Math.sin(a * 6 + t * 0.012) * (1 - q));
        if (i) ctx.lineTo(ox + Math.cos(a) * r, oy + Math.sin(a) * r); else ctx.moveTo(ox + Math.cos(a) * r, oy + Math.sin(a) * r);
      }
      ctx.fill();
    }
    if (!switched && t >= COVERED) { switched = true; apply(); }

    // The clearing wave from the middle once the mood has switched.
    const cq = Math.max(0, Math.min(1, (t - COVERED - 40) / (END - COVERED - 40)));
    if (cq > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(1, cq * (far + 160)));
      g.addColorStop(0, "#000"); g.addColorStop(0.82, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // Blood drops pulled in towards the middle, speeding up as they near it and shrinking
    // away as they arrive. Each is a teardrop, its tail trailing behind it.
    if (t < INFLOW + 40) {
      ctx.fillStyle = c.blood;
      ctx.shadowColor = c.blood;
      ctx.shadowBlur = 6;
      for (const d of flow) {
        if (t < d.t0 || t > d.t1) continue;
        const k = (t - d.t0) / (d.t1 - d.t0), e = k * k;
        const ang = d.a + d.curl * e, r = d.r * (1 - e);
        const x = ox + Math.cos(ang) * r, y = oy + Math.sin(ang) * r;
        const sz = d.size * (k > 0.8 ? (1 - k) / 0.2 : 1) * Math.min(1, k * 6);
        if (sz <= 0.2) continue;
        // Heading: towards the middle, bent by the curl.
        const hx = ox - x, hy = oy - y, hl = Math.hypot(hx, hy) || 1, ux = hx / hl, uy = hy / hl;
        ctx.beginPath();
        ctx.arc(x, y, sz, 0, Math.PI * 2);
        ctx.moveTo(x - uy * sz, y + ux * sz);
        ctx.quadraticCurveTo(x - ux * sz * 1.6, y - uy * sz * 1.6, x - ux * sz * 2.8, y - uy * sz * 2.8);
        ctx.quadraticCurveTo(x - ux * sz * 1.6, y - uy * sz * 1.6, x + uy * sz, y - ux * sz);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    // The heartbeat trace sits on top of everything.
    drawTrace(t);

    if (t < END) requestAnimationFrame(frame);
    else cv.remove();
  };
  requestAnimationFrame(frame);
}
