import { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  Plane,
  Truck,
  Package,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Globe2,
  CheckCircle2,
  Clock,
  Navigation,
  Compass,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveCoordinates, projectCoordinates } from '@/lib/geocoding';
import type { z } from 'zod';
import { trackingMapState, type trackingSchema } from '@/lib/shipment';

type TrackingRecord = z.infer<typeof trackingSchema>;

interface Waypoint {
  id: string;
  type: 'origin' | 'checkpoint' | 'current' | 'destination';
  label: string;
  title: string;
  location: string;
  occurredAt?: string | undefined;
  description?: string;
  lat: number;
  lon: number;
  x: number;
  y: number;
  isCompleted: boolean;
  isCurrent: boolean;
}

// Generate quadratic bezier SVG path between two projected points with arched curve
function generateArcPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature = 0.22
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);

  if (dist < 1) return `M ${x1} ${y1} L ${x2} ${y2}`;

  // Normal vector perpendicular to the line segment
  const nx = -dy / dist;
  const ny = dx / dist;

  // Arc upwards toward the top of the map
  const sign = ny < 0 ? -1 : 1;
  const h = Math.min(75, dist * curvature) * (ny !== 0 ? (ny > 0 ? -1 : 1) : -1);

  const mx = (x1 + x2) / 2 + nx * h * sign;
  const my = (y1 + y2) / 2 + ny * h * sign;

  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

export function TrackingMap({ record }: { record: TrackingRecord }) {
  const [landPath, setLandPath] = useState<string>('');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const {cancelled: isCancelled, delivered: isDelivered, progressPercent} = trackingMapState(record.status);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'fit' | 'world'>('fit');
  const svgRef = useRef<SVGSVGElement>(null);

  const canvasWidth = 960;
  const canvasHeight = 480;

  // Load world landmass vector polygons from world-atlas
  useEffect(() => {
    let active = true;
    Promise.all([
      import('topojson-client'),
      import('world-atlas/land-110m.json'),
    ])
      .then(([topo, world]) => {
        if (!active) return;
        const land = topo.feature(
          world.default as unknown as Parameters<typeof topo.feature>[0],
          world.default.objects.land as unknown as Parameters<typeof topo.feature>[1]
        ) as unknown as {
          features: {
            geometry: {
              type: string;
              coordinates: number[][][] | number[][][][];
            };
          }[];
        };

        let path = '';
        for (const feature of land.features) {
          const coords = feature.geometry.coordinates;
          const polygons =
            feature.geometry.type === 'MultiPolygon'
              ? (coords as number[][][][])
              : [coords as number[][][]];
          for (const polygon of polygons) {
            for (const ring of polygon) {
              ring.forEach(([lon, lat], i) => {
                if (lon === undefined || lat === undefined) return;
                const [x, y] = projectCoordinates(
                  lat,
                  lon,
                  canvasWidth,
                  canvasHeight
                );
                path += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
              });
              path += 'Z';
            }
          }
        }
        if (active) setLandPath(path);
      })
      .catch(() => {
        // Fallback: simple world background if topojson fails
      });

    return () => {
      active = false;
    };
  }, []);

  // Compute Waypoints
  const waypoints = useMemo<Waypoint[]>(() => {
    const list: Waypoint[] = [];

    // 1. Origin
    const [origLat, origLon] = resolveCoordinates(record.origin, 0);
    const [origX, origY] = projectCoordinates(origLat, origLon, canvasWidth, canvasHeight);
    list.push({
      id: 'origin',
      type: 'origin',
      label: 'Origin',
      title: 'Dispatched from origin',
      location: record.origin,
      occurredAt: record.created_at,
      description: 'Shipment registered and dispatched from initial origin facility',
      lat: origLat,
      lon: origLon,
      x: origX,
      y: origY,
      isCompleted: true,
      isCurrent: record.status === 'Shipment Registered',
    });

    // 2. Events (sorted oldest first)
    const sortedEvents = [...record.events].sort(
      (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
    );

    sortedEvents.forEach((ev, idx) => {
      const [lat, lon] = resolveCoordinates(ev.location, idx + 1);
      const [x, y] = projectCoordinates(lat, lon, canvasWidth, canvasHeight);
      const isLatestEvent = idx === sortedEvents.length - 1;
      list.push({
        id: `ev-${idx}`,
        type: isLatestEvent && !isDelivered && !isCancelled ? 'current' : 'checkpoint',
        label: `Checkpoint ${idx + 1}`,
        title: ev.status,
        location: ev.location,
        occurredAt: ev.occurred_at,
        description: ev.description,
        lat,
        lon,
        x,
        y,
        isCompleted: true,
        isCurrent: isLatestEvent && !isDelivered && !isCancelled,
      });
    });

    // 3. Current latest location if not already added
    if (record.latest_location && !isDelivered && !isCancelled) {
      const lastWp = list[list.length - 1];
      if (!lastWp || lastWp.location.toLowerCase() !== record.latest_location.toLowerCase()) {
        const [lat, lon] = resolveCoordinates(record.latest_location, list.length + 1);
        const [x, y] = projectCoordinates(lat, lon, canvasWidth, canvasHeight);
        list.push({
          id: 'latest-location',
          type: 'current',
          label: 'Active Location',
          title: record.status,
          location: record.latest_location,
          description: `Current confirmed location: ${record.status}`,
          lat,
          lon,
          x,
          y,
          isCompleted: true,
          isCurrent: true,
        });
      }
    }

    // 4. Destination
    const [destLat, destLon] = resolveCoordinates(record.destination, list.length + 2);
    const [destX, destY] = projectCoordinates(destLat, destLon, canvasWidth, canvasHeight);
    list.push({
      id: 'destination',
      type: 'destination',
      label: 'Destination',
      title: isDelivered ? 'Successfully Delivered' : 'Final Delivery Destination',
      location: record.destination,
      occurredAt: isDelivered ? sortedEvents[sortedEvents.length - 1]?.occurred_at : isCancelled ? undefined : record.estimated_delivery ?? undefined,
      description: isCancelled
        ? 'Shipment cancelled; delivery is no longer scheduled.'
        : isDelivered
        ? 'Delivered to recipient address'
        : `Scheduled delivery by ${record.estimated_delivery ? new Date(record.estimated_delivery).toLocaleDateString() : 'estimated arrival date'}`,
      lat: destLat,
      lon: destLon,
      x: destX,
      y: destY,
      isCompleted: isDelivered,
      isCurrent: isDelivered,
    });

    return list;
  }, [record]);

  // Resolve selections against refreshed waypoints so corrections stay visible.
  const selectedPoint = waypoints.find(w => w.id === selectedPointId) ?? null;
  const setSelectedPoint = (point: Waypoint) => setSelectedPointId(point.id);
  const lastRecorded = waypoints.filter(w => w.type !== 'destination').at(-1);
  const activeWaypoint = selectedPoint ?? waypoints.find((w) => w.isCurrent) ?? (isCancelled ? lastRecorded : waypoints[waypoints.length - 1]);

  // Calculate dynamic bounding box for "fit to route"
  const viewBox = useMemo(() => {
    if (viewMode === 'world' || waypoints.length === 0) {
      const w = canvasWidth / zoomLevel;
      const h = canvasHeight / zoomLevel;
      const x = (canvasWidth - w) / 2;
      const y = (canvasHeight - h) / 2;
      return `${x} ${y} ${w} ${h}`;
    }

    const xs = waypoints.map((w) => w.x);
    const ys = waypoints.map((w) => w.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padX = Math.max(90, (maxX - minX) * 0.35);
    const padY = Math.max(70, (maxY - minY) * 0.35);

    let boxX = Math.max(0, minX - padX);
    let boxY = Math.max(0, minY - padY);
    let boxW = Math.min(canvasWidth - boxX, maxX - minX + padX * 2);
    let boxH = Math.min(canvasHeight - boxY, maxY - minY + padY * 2);

    // Apply zoom factor
    boxW /= zoomLevel;
    boxH /= zoomLevel;

    return `${boxX} ${boxY} ${boxW} ${boxH}`;
  }, [waypoints, viewMode, zoomLevel]);

  // Is route mostly intercontinental or regional?
  const isIntercontinental = useMemo(() => {
    if (waypoints.length < 2) return false;
    const first = waypoints[0];
    const last = waypoints[waypoints.length - 1];
    if (!first || !last) return false;
    const dist = Math.hypot(last.x - first.x, last.y - first.y);
    return dist > 260;
  }, [waypoints]);

  return (
    <div className="tracking-map-container" data-no-translate>
      {/* Map Header & Live Summary */}
      <div className="tracking-map-header">
        <div className="tracking-map-title">
          <div className="flex items-center gap-2">
            {!isCancelled && <span className="live-radar-dot" />}
            <span className="text-xs font-bold tracking-wider text-primary uppercase">
              {isCancelled ? 'Shipment History Map' : 'Live Shipment Map'}
            </span>
          </div>
          <h3>
            {record.origin} <ArrowRight className="inline-block mx-1 w-4 h-4 text-primary" /> {record.destination}
          </h3>
          <p className="text-xs text-muted-foreground">
            Current Status: <strong className="text-foreground">{record.status}</strong> · Latest Recorded Point: <strong className="text-foreground">{record.latest_location ?? record.origin}</strong>
          </p>
        </div>

        <div className="tracking-map-controls">
          <div className="flex items-center gap-1 bg-card/80 backdrop-blur-md p-1 border rounded-md">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              title="Zoom in"
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.3))}
            >
              <ZoomIn size={15} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              title="Zoom out"
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.3))}
            >
              <ZoomOut size={15} />
            </Button>
            <Button
              type="button"
              variant={viewMode === 'fit' ? 'secondary' : 'ghost'}
              size="icon"
              className="w-8 h-8"
              title="Fit to shipment route"
              onClick={() => {
                setViewMode('fit');
                setZoomLevel(1);
              }}
            >
              <Maximize2 size={15} />
            </Button>
            <Button
              type="button"
              variant={viewMode === 'world' ? 'secondary' : 'ghost'}
              size="icon"
              className="w-8 h-8"
              title="Full world view"
              onClick={() => {
                setViewMode('world');
                setZoomLevel(1);
              }}
            >
              <Globe2 size={15} />
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive SVG Route Map Canvas */}
      <div className="tracking-map-canvas-wrap">
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="tracking-map-svg"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Interactive shipment route from ${record.origin} to ${record.destination}`}
        >
          <defs>
            {/* Map Gradients */}
            <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0b1329" />
              <stop offset="50%" stopColor="#0f1b3b" />
              <stop offset="100%" stopColor="#080e22" />
            </linearGradient>

            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>

            <linearGradient id="remainingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ocean Background */}
          <rect width={canvasWidth} height={canvasHeight} fill="url(#oceanGrad)" />

          {/* Coordinate Grid (Meridians and Parallels) */}
          <g stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" strokeDasharray="3 3">
            {[60, 120, 180, 240, 300, 360, 420].map((y) => (
              <line key={`lat-${y}`} x1="0" y1={y} x2={canvasWidth} y2={y} />
            ))}
            {[120, 240, 360, 480, 600, 720, 840].map((x) => (
              <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2={canvasHeight} />
            ))}
            {/* Equator */}
            <line x1="0" y1="240" x2={canvasWidth} y2="240" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" />
            {/* Prime Meridian */}
            <line x1="480" y1="0" x2="480" y2={canvasHeight} stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" />
          </g>

          {/* World Continents / Landmass Outlines */}
          {landPath ? (
            <path
              d={landPath}
              fill="#182449"
              stroke="#29396d"
              strokeWidth="0.75"
              fillRule="evenodd"
            />
          ) : (
            /* Fallback stylized world continents */
            <g fill="#182449" stroke="#29396d" strokeWidth="0.8">
              {/* North America */}
              <path d="M 160 80 Q 240 70 320 90 Q 280 180 200 210 Q 150 170 160 80 Z" />
              {/* South America */}
              <path d="M 280 240 Q 340 270 320 380 Q 270 410 260 300 Z" />
              {/* Europe */}
              <path d="M 460 80 Q 530 70 540 140 Q 480 160 450 120 Z" />
              {/* Africa */}
              <path d="M 460 170 Q 550 170 540 330 Q 480 360 460 220 Z" />
              {/* Asia */}
              <path d="M 550 70 Q 750 60 760 190 Q 640 220 540 160 Z" />
              {/* Australia */}
              <path d="M 730 290 Q 820 290 810 370 Q 730 380 730 290 Z" />
            </g>
          )}

          {/* Route Arcs */}
          {waypoints.length > 1 && (
            <g className="route-arcs">
              {waypoints.slice(0, -1).map((w, idx) => {
                const next = waypoints[idx + 1];
                if (!next) return null;
                const arcPath = generateArcPath(w.x, w.y, next.x, next.y);
                const isPassed = w.isCompleted;

                return (
                  <g key={`arc-${w.id}-${next.id}`}>
                    {/* Shadow / Glow Line */}
                    {isPassed && (
                      <path
                        d={arcPath}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="5"
                        opacity="0.3"
                        filter="url(#glow)"
                      />
                    )}
                    {/* Main Curved Path */}
                    <path
                      d={arcPath}
                      fill="none"
                      stroke={isPassed ? 'url(#routeGradient)' : 'url(#remainingGradient)'}
                      strokeWidth={isPassed ? '2.8' : '1.8'}
                      strokeDasharray={isPassed ? undefined : '5 4'}
                      className={isPassed ? 'route-active-line' : 'route-future-line'}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Waypoint Markers */}
          {waypoints.map((w, i) => {
            const isSelected = selectedPoint?.id === w.id;
            return (
              <g
                key={w.id}
                className={`waypoint-node cursor-pointer ${w.type}`}
                transform={`translate(${w.x}, ${w.y})`}
                onClick={() => setSelectedPoint(w)}
              >
                {/* Radar pulse for active/current location */}
                {w.isCurrent && (
                  <g className="radar-pulse-group">
                    <circle r="18" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.4" className="animate-ping" />
                    <circle r="28" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.2" className="animate-pulse" />
                    <circle r="9" fill="#0284c7" opacity="0.5" />
                  </g>
                )}

                {/* Selected highlight ring */}
                {isSelected && (
                  <circle r="16" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 2" />
                )}

                {/* Specific Node Icons by Type */}
                {w.type === 'origin' && (
                  <g>
                    <circle r="8" fill="#10b981" stroke="#ffffff" strokeWidth="2" filter="url(#glow)" />
                    <circle r="3" fill="#ffffff" />
                  </g>
                )}

                {w.type === 'checkpoint' && (
                  <g>
                    <circle r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                    <circle r="2.2" fill="#0f172a" />
                  </g>
                )}

                {w.type === 'current' && (
                  <g>
                    <circle r="11" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" filter="url(#pulseGlow)" />
                    {isIntercontinental ? (
                      <path
                        d="M -4 -2 L 0 -5 L 4 -2 L 1 3 L -1 3 Z"
                        fill="#ffffff"
                      />
                    ) : (
                      <circle r="3.5" fill="#ffffff" />
                    )}
                  </g>
                )}

                {w.type === 'destination' && (
                  <g>
                    <circle
                      r="9"
                      fill={w.isCompleted ? '#10b981' : '#f59e0b'}
                      stroke="#ffffff"
                      strokeWidth="2"
                      filter="url(#glow)"
                    />
                    <path
                      d="M -3 -3 L 2 -3 L -1 0 L 2 3 L -3 3 Z"
                      fill="#ffffff"
                    />
                  </g>
                )}

                {/* Permanent city label for origin, current, and destination */}
                {(w.type === 'origin' || w.type === 'current' || w.type === 'destination') && (
                  <g transform="translate(0, 18)" pointerEvents="none">
                    <rect
                      x={-(w.location.length * 3.2 + 8)}
                      y="-10"
                      width={w.location.length * 6.4 + 16}
                      height="18"
                      rx="4"
                      fill="rgba(11, 19, 41, 0.85)"
                      stroke={w.isCurrent ? '#38bdf8' : 'rgba(255,255,255,0.2)'}
                      strokeWidth="0.8"
                    />
                    <text
                      textAnchor="middle"
                      y="2"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight={w.isCurrent ? '700' : '500'}
                      fontFamily="system-ui, sans-serif"
                    >
                      {w.location.split(',')[0]}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Active Waypoint Inspector Card */}
        {activeWaypoint && (
          <div className="tracking-point-inspector">
            <div className="flex items-center justify-between gap-3 border-b pb-2 mb-2">
              <div className="flex items-center gap-2">
                {activeWaypoint.type === 'origin' ? (
                  <span className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-500">
                    <Navigation size={14} />
                  </span>
                ) : activeWaypoint.type === 'destination' ? (
                  <span className="p-1.5 rounded-full bg-amber-500/10 text-amber-500">
                    <CheckCircle2 size={14} />
                  </span>
                ) : (
                  <span className="p-1.5 rounded-full bg-sky-500/10 text-sky-500">
                    {isIntercontinental ? <Plane size={14} /> : <Truck size={14} />}
                  </span>
                )}
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                    {activeWaypoint.label}
                  </span>
                  <strong className="text-sm font-semibold text-foreground">
                    {activeWaypoint.location}
                  </strong>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  activeWaypoint.isCurrent
                    ? 'bg-sky-500 text-white animate-pulse'
                    : activeWaypoint.isCompleted
                    ? 'bg-emerald-500/20 text-emerald-600'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {activeWaypoint.title}
              </span>
            </div>

            {activeWaypoint.description && (
              <p className="text-xs text-muted-foreground mb-1.5">
                {activeWaypoint.description}
              </p>
            )}

            {activeWaypoint.occurredAt && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Clock size={12} className="text-primary" />
                {new Date(activeWaypoint.occurredAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Journey Progress Bar */}
      {progressPercent !== null && <div className="tracking-map-progress-bar">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-foreground flex items-center gap-1.5">
            <Compass size={14} className="text-primary" />
            Route Completion: <strong>{progressPercent}%</strong>
          </span>
          <span className="text-muted-foreground">
            {record.status === 'Delivered'
              ? 'Delivery Complete'
              : `ETA: ${record.estimated_delivery ? new Date(record.estimated_delivery).toLocaleDateString() : 'Pending confirmation'}`}
          </span>
        </div>
        <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden p-0.5 border">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>}

      {/* Understandable Waypoint Milestones Strip */}
      <div className="tracking-milestone-strip">
        {waypoints.map((wp, idx) => (
          <button
            key={wp.id}
            type="button"
            className={`milestone-pill ${
              selectedPoint?.id === wp.id
                ? 'is-selected'
                : wp.isCurrent
                ? 'is-current'
                : wp.isCompleted
                ? 'is-completed'
                : 'is-pending'
            }`}
            onClick={() => setSelectedPoint(wp)}
          >
            <div className="milestone-icon">
              {wp.isCompleted ? (
                <CheckCircle2 size={13} className="text-emerald-500" />
              ) : (
                <span className="milestone-num">{idx + 1}</span>
              )}
            </div>
            <div className="milestone-text">
              <strong>{wp.location.split(',')[0]}</strong>
              <small>{wp.title}</small>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
