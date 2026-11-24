import { describe, it, expect } from 'vitest';
import { resolveCoordinates, projectCoordinates, resolveCurrentLocationTarget } from '@/lib/geocoding';
import { DEMO_SHIPMENTS } from '@/lib/demo-shipments';
import { trackingSchema } from '@/lib/shipment';

describe('tracking map and geocoding', () => {
  it('resolves known logistics hubs accurately', () => {
    const [nyLat, nyLon] = resolveCoordinates('New York, United States');
    expect(nyLat).toBeCloseTo(40.71, 1);
    expect(nyLon).toBeCloseTo(-74.0, 1);

    const [lhrLat, lhrLon] = resolveCoordinates('London Heathrow, United Kingdom');
    expect(lhrLat).toBeCloseTo(51.5, 1);
    expect(lhrLon).toBeCloseTo(-0.12, 1);

    const [fraLat, fraLon] = resolveCoordinates('Frankfurt, Germany');
    expect(fraLat).toBeCloseTo(50.11, 1);
    expect(fraLon).toBeCloseTo(8.68, 1);

    const [tokyoLat, tokyoLon] = resolveCoordinates('Tokyo, Japan');
    expect(tokyoLat).toBeCloseTo(35.67, 1);
    expect(tokyoLon).toBeCloseTo(139.65, 1);

    const [sydLat, sydLon] = resolveCoordinates('Sydney, Australia');
    expect(sydLat).toBeCloseTo(-33.86, 1);
    expect(sydLon).toBeCloseTo(151.2, 1);
  });

  it('provides deterministic fallbacks for custom or unlisted locations without throwing', () => {
    const coords1 = resolveCoordinates('Rural Distribution Facility 902');
    const coords2 = resolveCoordinates('Rural Distribution Facility 902');
    expect(coords1[0]).toBe(coords2[0]);
    expect(coords1[1]).toBe(coords2[1]);
    expect(Number.isFinite(coords1[0])).toBe(true);
    expect(Number.isFinite(coords1[1])).toBe(true);
  });

  it('projects coordinates properly within SVG canvas boundaries', () => {
    const [x, y] = projectCoordinates(0, 0, 960, 480);
    expect(x).toBe(480);
    expect(y).toBe(240);

    const [northX, northY] = projectCoordinates(80, -180, 960, 480);
    expect(northX).toBe(0);
    expect(northY).toBeGreaterThanOrEqual(0);
    expect(northY).toBeLessThan(100);
  });

  it('validates that all demo shipments conform strictly to trackingSchema', () => {
    expect(Object.keys(DEMO_SHIPMENTS).length).toBeGreaterThanOrEqual(3);
    for (const [id, record] of Object.entries(DEMO_SHIPMENTS)) {
      expect(record.tracking_id).toBe(id);
      expect(() => trackingSchema.parse(record)).not.toThrow();
      expect(record.events.length).toBeGreaterThan(0);
      expect(record.origin).toBeTruthy();
      expect(record.destination).toBeTruthy();
    }
  });

  it('resolves exact current location target for active, delivered, and newly registered shipments', () => {
    const active = resolveCurrentLocationTarget({
      tracking_id: 'SDE-LIVE-01',
      origin: 'New York, United States',
      destination: 'London, United Kingdom',
      status: 'In Transit',
      latest_location: 'Frankfurt, Germany',
      created_at: '2026-11-24T08:00:00Z',
      events: [
        {
          status: 'In Transit',
          location: 'Frankfurt, Germany',
          description: 'Departed sorting hub',
          occurred_at: '2026-11-24T09:30:00Z',
        },
      ],
    });
    expect(active.location).toBe('Frankfurt, Germany');
    expect(active.lat).toBeCloseTo(50.1109, 3);
    expect(active.lon).toBeCloseTo(8.6821, 3);
    expect(active.isCancelled).toBe(false);

    const delivered = resolveCurrentLocationTarget({
      tracking_id: 'SDE-LIVE-02',
      origin: 'New York, United States',
      destination: 'Tokyo, Japan',
      status: 'Delivered',
      latest_location: 'Frankfurt, Germany',
      created_at: '2026-11-24T08:00:00Z',
      events: [
        {
          status: 'Delivered',
          location: 'Tokyo, Japan',
          description: 'Signed by recipient',
          occurred_at: '2026-11-24T12:00:00Z',
        },
      ],
    });
    expect(delivered.location).toBe('Tokyo, Japan');
    expect(delivered.lat).toBeCloseTo(35.6762, 3);
    expect(delivered.lon).toBeCloseTo(139.6503, 3);

    const registered = resolveCurrentLocationTarget({
      tracking_id: 'SDE-LIVE-03',
      origin: 'London, United Kingdom',
      destination: 'Sydney, Australia',
      status: 'Shipment Registered',
      latest_location: null,
      created_at: '2026-11-24T08:00:00Z',
      events: [],
    });
    expect(registered.location).toBe('London, United Kingdom');
    expect(registered.lat).toBeCloseTo(51.5074, 3);
    expect(registered.lon).toBeCloseTo(-0.1278, 3);
  });
});
