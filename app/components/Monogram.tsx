import "./monogram.css";

/*
 * The AKS ligature, set on a forward slant. The letters share strokes: the A's right leg is
 * the K's stem, the A's crossbar runs straight on into the K's upper arm, and the K's lower
 * leg runs down into an angular S, so K→S is one route ending at the red delivery node.
 * Every terminal is cut flat to the cap and base lines. A pulse runs that route once on
 * open and again on hover.
 */
const ROUTE = "M27.6 14.4 L39.6 35.5 H53 L57.5 31 V25.5 L42.8 15.5 V9.5 L47.3 4.5 H61";

export default function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg className={`monogram ${className}`} viewBox="-2 0 74 40" role="img" aria-label="AKS — Aditya Kadlabal Sripad">
      <defs>
        <clipPath id="mg-lines">
          <rect x="-10" y="2.2" width="100" height="35.6" />
        </clipPath>
      </defs>
      <g transform="skewX(-12) translate(4 0)">
        <g className="mg-letters" clipPath="url(#mg-lines)">
          <path pathLength={1} d="M2 42 L20.5 -2 V42" />
          <path pathLength={1} d="M9.3 26.5 H20.5 L37.5 -2" />
          <path pathLength={1} d={ROUTE} />
        </g>
        <circle className="mg-pulse" r="1.6" style={{ offsetPath: `path("${ROUTE}")` }} />
        <path className="mg-node" d="M65.2 1.5 L68.2 4.5 L65.2 7.5 L62.2 4.5 Z" />
      </g>
    </svg>
  );
}
