/*
 * The AKS monogram, one symbol per discipline: the A is an engineering truss, the K is a
 * supply line splitting in two (with a node at each end), and the S is a heartbeat. It
 * draws itself in when the page opens.
 */
export default function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg className={`monogram ${className}`} viewBox="0 0 150 66" role="img" aria-label="AKS — Aditya Kadlabal Sripad">
      <g className="mg-letters">
        <path className="mg-a" pathLength={1} d="M6 60 L24 10 L42 60 Z" />
        <path className="mg-k" pathLength={1} d="M58 10 V60" />
        <path className="mg-k" pathLength={1} d="M58 37 L84 12 M66 30 L84 60" />
        <path className="mg-s" pathLength={1} d="M100 35 H108 L112 26 L118 46 L123 14 L129 56 L134 35 H146" />
      </g>
      <rect className="mg-node" x="80" y="8" width="8" height="8" />
      <rect className="mg-node" x="80" y="56" width="8" height="8" />
    </svg>
  );
}
