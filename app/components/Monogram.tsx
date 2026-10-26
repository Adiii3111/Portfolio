/*
 * The AKS monogram, drawn as one supply route: the A is a peak, the K branches off it
 * like a supply split, the S flows out to a delivery point (the red terminal). It
 * draws itself in when the page opens.
 */
export default function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg className={`monogram ${className}`} viewBox="0 0 70 40" role="img" aria-label="AKS — Aditya Kadlabal Sripad">
      <g className="mg-letters">
        <path pathLength={1} d="M3 33 L13.5 5 L24 33" />
        <path pathLength={1} d="M7.6 22.5 H19.4" />
        <path pathLength={1} d="M30 5 V33" />
        <path pathLength={1} d="M30 21 L43 5" />
        <path pathLength={1} d="M34.2 16 L44 33" />
        <path pathLength={1} d="M64 8.5 C60.5 4.5 50 4.2 50 11.6 C50 19.2 64.6 16.6 64.6 25.4 C64.6 33.6 53 35 49.4 29.6" />
      </g>
      <path className="mg-route" pathLength={1} d="M1 38 H58" />
      <rect className="mg-node" x="58.5" y="35.5" width="5" height="5" />
    </svg>
  );
}
