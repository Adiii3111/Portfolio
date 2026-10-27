"use client";

import { useEffect, useRef } from "react";

/*
 * The AETERNUS mark: an infinity drawn as a real 3D curve, not a flat picture. It's a
 * lemniscate with a gentle twist out of its plane, tumbling slowly about all three axes, so
 * it turns edge-on, flips over and comes back round. The near side is drawn thicker and
 * brighter than the far side, and a point of light runs round it forever. Colour follows the
 * mood's accent. Reduced motion gets one still, three-quarter view.
 */

const N = 120;    // samples round the curve

export default function InfinityMark({ size = 36, speed = 1 }: { size?: number; speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = cv.height = Math.round(size * dpr);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let accent = "#E2CDA4", raf = 0, last = 0, clock = 0;
    const readAccent = () => { accent = getComputedStyle(cv).color || accent; };

    const draw = (t: number) => {
      const s = size * dpr, a = s * 0.42, c = s / 2;
      ctx.clearRect(0, 0, s, s);
      // Tumble: three rotations at unrelated rates, so it never repeats the same way twice.
      const rx = t * 0.00071, ry = t * 0.00113, rz = t * 0.00043;
      const [sx, cxr, sy, cyr, sz, czr] = [Math.sin(rx), Math.cos(rx), Math.sin(ry), Math.cos(ry), Math.sin(rz), Math.cos(rz)];
      const pts: { x: number; y: number; z: number }[] = [];
      for (let i = 0; i <= N; i++) {
        const u = (i / N) * Math.PI * 2, d = 1 + Math.sin(u) ** 2;
        let x = (Math.cos(u) / d) * a, y = ((Math.sin(u) * Math.cos(u)) / d) * a, z = Math.sin(u) * a * 0.32;
        [y, z] = [y * cxr - z * sx, y * sx + z * cxr];
        [x, z] = [x * cyr + z * sy, -x * sy + z * cyr];
        [x, y] = [x * czr - y * sz, x * sz + y * czr];
        const k = 1 / (1 - z / (s * 2.2));          // a little perspective
        pts.push({ x: c + x * k, y: c + y * k, z });
      }
      // Back to front, so the near loop passes over the far one.
      const segs = Array.from({ length: N }, (_, i) => i).sort((i, j) => pts[i].z + pts[i + 1].z - (pts[j].z + pts[j + 1].z));
      ctx.lineCap = "round";
      ctx.strokeStyle = accent;
      for (const i of segs) {
        const depth = 0.5 + ((pts[i].z + pts[i + 1].z) / 2) / (a * 1.2);   // ~0 far … ~1 near
        ctx.globalAlpha = 0.35 + 0.65 * Math.max(0, Math.min(1, depth));
        ctx.lineWidth = (1 + 1.6 * Math.max(0, Math.min(1, depth))) * dpr;
        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[i + 1].x, pts[i + 1].y); ctx.stroke();
      }
      // The point of light running round it.
      const p = pts[Math.floor(((t * 0.0004) % 1) * N)];
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.shadowColor = accent; ctx.shadowBlur = 6 * dpr;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.6 * dpr, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    };

    let drawn = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (last) clock += (t - last) * speedRef.current;
      last = t;
      if (t - drawn < 33) return;   // ~30 fps is smooth enough for a slow tumble
      drawn = t;
      draw(clock);
    };
    readAccent();
    const mood = new MutationObserver(() => { readAccent(); if (reduced) draw(2400); });
    mood.observe(document.documentElement, { attributes: true, attributeFilter: ["data-time"] });
    if (reduced) draw(2400); else raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); mood.disconnect(); };
  }, [size]);

  return <canvas ref={ref} className="ae-inf" style={{ width: size, height: size }} aria-hidden="true" />;
}
