"use client";

import { useEffect, useRef } from "react";

// Hero signature: a supply-chain flow line with a heartbeat running through it —
// one line that reads as both logistics and healthcare. Each discipline lights up
// the moment the pulse reaches its node.

const W = 1200;
const MID = 30;
const words = ["Engineering", "Healthcare", "Supply Chains", "Research", "Analytics", "Leadership", "Creativity", "Running"];
const gap = W / words.length;
const nodes = words.map((_, i) => gap * (i + 0.5));

// Flat line between nodes, with a compact ECG complex (P, QRS, T) in each gap.
const beat = (x: number) => `L${x - 22} ${MID} q5 -5 10 0 L${x - 6} ${MID} l3 5 l4 -24 l4 30 l3 -11 L${x + 12} ${MID} q6 -7 12 0`;
const LINE = `M0 ${MID}` + nodes.slice(0, -1).map((x) => beat(x + gap / 2)).join("") + ` L${W} ${MID}`;

// Must match the pulseRun animation in globals.css: the pulse's head travels 0 → 1.06 of the line in 5.5s.
const RUN = 5.5, HEAD_SPAN = 1.06;

export default function PulseChain() {
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null);

  // The ECG complexes make path length uneven along x, so find each node's share of the
  // length on the real path and delay its glow by the time the pulse takes to get there.
  useEffect(() => {
    const p = line.current, el = root.current;
    if (!p || !el) return;
    const total = p.getTotalLength();
    nodes.forEach((x, i) => {
      let lo = 0, hi = total;
      for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (p.getPointAtLength(m).x < x) lo = m; else hi = m; }
      const at = `${((lo / total / HEAD_SPAN) * RUN).toFixed(3)}s`;
      el.querySelectorAll<HTMLElement | SVGElement>(`[data-i="${i}"]`).forEach((n) => n.style.setProperty("--at", at));
    });
    el.classList.add("is-timed");
  }, []);

  return (
    <div ref={root} className="pulse-chain" aria-label="Disciplines: Engineering, Healthcare, Supply Chains, Research, Analytics, Leadership, Creativity, Running">
      <svg viewBox={`0 0 ${W} 60`} preserveAspectRatio="none" aria-hidden="true">
        <path ref={line} className="pc-base" d={LINE} />
        <path className="pc-tail" d={LINE} pathLength={1} />
        <path className="pc-pulse" d={LINE} pathLength={1} />
        {nodes.map((x, i) => <circle key={x} data-i={i} className="pc-node" cx={x} cy={MID} r="3.5" />)}
      </svg>
      <ul>
        {words.map((w, i) => <li key={w} data-i={i}>{w}</li>)}
      </ul>
    </div>
  );
}
