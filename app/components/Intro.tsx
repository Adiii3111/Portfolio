"use client";

import { useEffect, useRef } from "react";

export function finishIntro() {
  document.documentElement.dataset.intro = "done";
  try { sessionStorage.setItem("aks-intro", "1"); } catch {}
}

// Timeline (ms).
const GROW = [100, 1000];     // the helix grows out from the middle of the screen
const UNZIP = [1300, 2150];   // it unzips and the two strands sweep off to the edges
const END = 2650;

const smooth = (t: number, a: number, b: number) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

/**
 * A ~2.6s opening sequence: a DNA double helix grows out from the middle of a dark screen,
 * base pairs popping in as it turns. Then it unzips, and as it splits Aditya's name pops up
 * in the gap; the name holds for a moment while one strand sweeps off to the top-right edge
 * and the other to the bottom-left, where the page's two DNA spines live, and then the
 * screen opens onto the page.
 *
 * It never blocks the page: it fades out on its own (via CSS even without JavaScript), and
 * any click, key, scroll, or the Skip button dismisses it immediately. Returning visitors
 * and reduced-motion users never see it (see the inline script in layout.tsx).
 */
export default function Intro() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (document.documentElement.dataset.intro === "done") return;
    // The whole sequence (canvas and CSS alike) starts from here, when the DNA can first be
    // drawn, so a slow page start never skips the helix growing and splitting.
    const t = setTimeout(finishIntro, END + 100);
    const skip = () => finishIntro();
    window.addEventListener("wheel", skip, { passive: true, once: true });
    window.addEventListener("touchmove", skip, { passive: true, once: true });
    window.addEventListener("keydown", skip, { once: true });

    const cv = ref.current, ctx = cv?.getContext("2d");
    let raf = 0;
    if (cv && ctx) {
      const W = (cv.width = window.innerWidth), H = (cv.height = window.innerHeight);
      const R = Math.min(W, H) * 0.11, RUNG = 22, TWIST = (Math.PI * 2) / (RUNG * 10), GROOVE = 2.35;
      let t0 = 0;
      const frame = (now: number) => {
        if (!t0) { t0 = now; cv.parentElement?.classList.add("is-live"); }
        const t = now - t0;
        ctx.clearRect(0, 0, W, H);
        const reach = smooth(t, GROW[0], GROW[1]) * (H / 2 + 60);
        const u = smooth(t, UNZIP[0], UNZIP[1]);
        const spin = t * 0.0018;
        // Each strand drifts away from the middle as it unzips: one to the top-right, one to the bottom-left.
        const strand = (sy: number, phase: number, side: number) => {
          const th = sy * TWIST + spin + phase;
          const r = R * (1 - 0.55 * u);
          return {
            x: W / 2 + Math.cos(th) * r + side * u * (W / 2 - 30),
            y: sy - side * u * H * 0.3,
            z: Math.sin(th),
          };
        };
        const y0 = H / 2 - reach, y1 = H / 2 + reach;
        ctx.lineCap = "round";

        // Base pairs: popping in as the helix reaches them, then splitting into halves that
        // go with their strands and fade as it unzips.
        for (let sy = Math.ceil(y0 / RUNG) * RUNG; sy < y1; sy += RUNG) {
          const pop = Math.min(1, (reach - Math.abs(sy - H / 2)) / 50);
          if (pop <= 0) continue;
          const a = strand(sy, 0, 1), b = strand(sy, GROOVE, -1);
          const near = (a.z + b.z) / 2 >= 0;
          const k = Math.round(sy / RUNG);
          const gc = ((k * 7919) % 5) < 2;
          const half = 0.5 * pop * (1 - u);
          ctx.lineWidth = near ? 2 : 1.2;
          ctx.strokeStyle = `rgba(${gc ? "232,97,91" : "226,205,164"},${((near ? 0.7 : 0.3) * (1 - u)).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + (b.x - a.x) * half, a.y + (b.y - a.y) * half);
          ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + (a.x - b.x) * half, b.y + (a.y - b.y) * half);
          ctx.stroke();
        }
        // The two backbones, near segments heavier than far ones.
        for (const [phase, side, rgb] of [[0, 1, "226,205,164"], [GROOVE, -1, "158,222,255"]] as const) {
          let prev = strand(y0, phase, side);
          for (let sy = y0 + 5; sy <= y1; sy += 5) {
            const q = strand(sy, phase, side);
            const near = (q.z + prev.z) / 2;
            ctx.lineWidth = 1.4 + (near + 1) * 1.4;
            ctx.strokeStyle = `rgba(${rgb},${(0.35 + (near + 1) * 0.3).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y); ctx.stroke();
            prev = q;
          }
        }
        if (t < END) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
      window.removeEventListener("keydown", skip);
    };
  }, []);

  return (
    <div className="intro" onClick={finishIntro} aria-label="Opening sequence: Aditya Kadlabal Sripad">
      <canvas ref={ref} className="intro-dna" aria-hidden="true" />
      <div className="intro-id">
        <h2>Aditya Kadlabal Sripad</h2>
      </div>
      {/* The name waits for the split (see .intro.is-live); without JavaScript there's no split, so just show it. */}
      <noscript><style>{".intro-id{opacity:1}"}</style></noscript>
      <button className="intro-skip" onClick={(e) => { e.stopPropagation(); finishIntro(); }}>Skip intro →</button>
    </div>
  );
}
