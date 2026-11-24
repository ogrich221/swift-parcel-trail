import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CurrentLocationTarget } from '@/lib/geocoding';

function buildPopupContent(target: CurrentLocationTarget): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'current-location-popup';

  const title = document.createElement('strong');
  title.textContent = target.location;
  wrap.appendChild(title);

  const status = document.createElement('div');
  status.textContent = target.status;
  wrap.appendChild(status);

  if (target.description) {
    const desc = document.createElement('p');
    desc.textContent = target.description;
    wrap.appendChild(desc);
  }
  return wrap;
}

export default function CurrentLocationMap({ target }: { target: CurrentLocationTarget }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = L.map(el, {
      center: [target.lat, target.lon],
      zoom: 12,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    const icon = L.divIcon({
      className: 'current-location-pin-wrap',
      html: `<span class="current-location-pin${target.isCancelled ? ' is-cancelled' : ''}"></span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -14],
    });

    const marker = L.marker([target.lat, target.lon], { icon })
      .addTo(map)
      .bindPopup(buildPopupContent(target), { maxWidth: 220 });
    marker.openPopup();

    mapRef.current = map;
    markerRef.current = marker;

    const raf = window.requestAnimationFrame(() => map.invalidateSize());
    const timer = window.setTimeout(() => map.invalidateSize(), 220);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLatLng([target.lat, target.lon]);
    marker.setPopupContent(buildPopupContent(target));
    map.setView([target.lat, target.lon], map.getZoom(), { animate: true });
  }, [target.lat, target.lon, target.location, target.status, target.description, target.isCancelled]);

  const recenter = () => {
    mapRef.current?.setView([target.lat, target.lon], 12, { animate: true });
    markerRef.current?.openPopup();
  };

  return (
    <div className="space-y-3" data-no-translate>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
            <MapPin size={14} className="text-primary" />
            {target.location}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-secondary text-foreground font-medium">
            {target.status}
          </span>
          {target.occurredAt && (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} className="text-primary" />
              {new Date(target.occurredAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={recenter}>
          <Crosshair size={14} className="mr-1.5" />
          Recenter
        </Button>
      </div>

      <div
        ref={containerRef}
        className="current-location-leaflet"
        role="region"
        aria-label={`Interactive street map of current location: ${target.location}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>
          Coordinates: {target.lat.toFixed(4)}, {target.lon.toFixed(4)}
        </span>
        <span>Map data © OpenStreetMap contributors</span>
      </div>
    </div>
  );
}