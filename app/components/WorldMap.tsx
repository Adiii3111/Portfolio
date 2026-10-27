import { type Bounds, greatCircle, landDots, places, projector, routePath } from "../lib/geo";

/** A small airliner silhouette, nose pointing along +x, centred on the origin. */
export const PLANE_PATH = "M12 0 C12 -1.2 10.5 -1.6 9 -1.6 L3 -1.6 L-3 -9.5 L-5.6 -9.5 L-2 -1.6 L-7.5 -1.6 L-9.6 -4.6 L-11.4 -4.6 L-10 0 L-11.4 4.6 L-9.6 4.6 L-7.5 1.6 L-2 1.6 L-5.6 9.5 L-3 9.5 L3 1.6 L9 1.6 C10.5 1.6 12 1.2 12 0Z";

type PlaceKey = keyof typeof places;

export type MapRoute = { from: PlaceKey; to: PlaceKey; className?: string };
export type MapMarker = { at: PlaceKey; className?: string };

export const WORLD: Bounds = { lonMin: -130, lonMax: 150, latMin: -40, latMax: 80 };
export const NORTH_ATLANTIC: Bounds = { lonMin: -125, lonMax: 105, latMin: 2, latMax: 74 };

export default function WorldMap({
  bounds = WORLD,
  width = 1400,
  step = 2,
  dot = 2.2,
  routes = [],
  markers = [],
  className,
  preserve = "xMidYMid meet",
  children,
}: {
  bounds?: Bounds;
  width?: number;
  step?: number;
  dot?: number;
  routes?: MapRoute[];
  markers?: MapMarker[];
  className?: string;
  preserve?: string;
  /** Extra SVG layers drawn on top, in the map's own coordinate space. */
  children?: React.ReactNode;
}) {
  const { height, project } = projector(bounds, width);
  return (
    <svg className={className} viewBox={`0 0 ${width} ${height.toFixed(0)}`} preserveAspectRatio={preserve} aria-hidden="true">
      <path className="map-land" d={landDots(bounds, width, step, dot)} />
      {routes.map((r) => (
        <path key={r.from + r.to} className={`map-route ${r.className ?? ""}`} pathLength={1} d={routePath(greatCircle(places[r.from], places[r.to]), bounds, width)} />
      ))}
      {markers.map((m) => {
        const [x, y] = project(...places[m.at]);
        return (
          <g key={m.at} className={`map-marker ${m.className ?? ""}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
            <circle className="map-marker-ring" r="14" />
            <circle className="map-marker-dot" r="8" />
          </g>
        );
      })}
      {children}
    </svg>
  );
}

/** Percent position of a place inside a map, for overlaying HTML labels. */
export function placePercent(at: PlaceKey, bounds: Bounds = WORLD) {
  const { width, height, project } = projector(bounds, 1000);
  const [x, y] = project(...places[at]);
  return { left: `${((x / width) * 100).toFixed(2)}%`, top: `${((y / height) * 100).toFixed(2)}%` };
}
