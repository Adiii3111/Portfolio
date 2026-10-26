// Hero signature: a supply-chain flow line with a heartbeat running through it —
// one line that reads as both logistics and healthcare.

const W = 1200;
const MID = 30;
const words = ["Engineering", "Healthcare", "Supply Chains", "Research", "Analytics", "Leadership", "Creativity", "Running"];
const gap = W / words.length;
const nodes = words.map((_, i) => gap * (i + 0.5));

// Flat line between nodes, with a compact ECG complex (P, QRS, T) in each gap.
const beat = (x: number) => `L${x - 22} ${MID} q5 -5 10 0 L${x - 6} ${MID} l3 5 l4 -24 l4 30 l3 -11 L${x + 12} ${MID} q6 -7 12 0`;
const LINE = `M0 ${MID}` + nodes.slice(0, -1).map((x) => beat(x + gap / 2)).join("") + ` L${W} ${MID}`;

export default function PulseChain() {
  return (
    <div className="pulse-chain" aria-label="Disciplines: Engineering, Healthcare, Supply Chains, Research, Analytics, Leadership, Creativity, Running">
      <svg viewBox={`0 0 ${W} 60`} preserveAspectRatio="none" aria-hidden="true">
        <path className="pc-base" d={LINE} />
        <path className="pc-tail" d={LINE} pathLength={1} />
        <path className="pc-pulse" d={LINE} pathLength={1} />
        {nodes.map((x) => <circle key={x} className="pc-node" cx={x} cy={MID} r="3.5" />)}
      </svg>
      <ul>
        {words.map((w) => <li key={w} className={w === "Healthcare" || w === "Supply Chains" ? "is-key" : undefined}>{w}</li>)}
      </ul>
    </div>
  );
}
