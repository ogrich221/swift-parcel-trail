import type { z } from 'zod';
import type { trackingSchema } from './shipment';

export type TrackingRecord = z.infer<typeof trackingSchema>;

export const DEMO_SHIPMENTS: Record<string, TrackingRecord> = {
  'SDE-EXP-772910': {
    tracking_id: 'SDE-EXP-772910',
    origin: 'Frankfurt, Germany',
    destination: 'New York, United States',
    status: 'In Transit',
    latest_location: 'London Heathrow Transit Hub, United Kingdom',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    estimated_delivery: new Date(Date.now() + 2 * 86400000).toISOString(),
    events: [
      {
        status: 'In Transit',
        location: 'London Heathrow Transit Hub, United Kingdom',
        description: 'Departed sorting facility on flight SDE-402 to JFK International',
        occurred_at: new Date(Date.now() - 6 * 3600000).toISOString(),
      },
      {
        status: 'Arrived at Sorting Facility',
        location: 'London Logistics Gateway, United Kingdom',
        description: 'Processed through international express transit customs',
        occurred_at: new Date(Date.now() - 18 * 3600000).toISOString(),
      },
      {
        status: 'Processing',
        location: 'Frankfurt Air Hub, Germany',
        description: 'Customs clearance completed, transferred to international dispatch',
        occurred_at: new Date(Date.now() - 36 * 3600000).toISOString(),
      },
      {
        status: 'Picked Up',
        location: 'Frankfurt Central Logistics Center, Germany',
        description: 'Package collected from merchant warehouse and verified',
        occurred_at: new Date(Date.now() - 54 * 3600000).toISOString(),
      },
      {
        status: 'Shipment Registered',
        location: 'Frankfurt, Germany',
        description: 'Electronic shipping order registered with Swift Delivery Express',
        occurred_at: new Date(Date.now() - 72 * 3600000).toISOString(),
      },
    ],
  },

  'SDE-PRI-482015': {
    tracking_id: 'SDE-PRI-482015',
    origin: 'Tokyo, Japan',
    destination: 'Sydney, Australia',
    status: 'Out for Delivery',
    latest_location: 'Sydney Logistics Facility, Australia',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    estimated_delivery: new Date(Date.now() + 6 * 3600000).toISOString(),
    events: [
      {
        status: 'Out for Delivery',
        location: 'Sydney Logistics Facility, Australia',
        description: 'Courier assigned and en route for priority contactless delivery',
        occurred_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        status: 'Arrived at Sorting Facility',
        location: 'Sydney Airport Gateway, Australia',
        description: 'Import customs cleared and sorted to local delivery vehicle',
        occurred_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
      {
        status: 'In Transit',
        location: 'Singapore Changi Transit Hub, Singapore',
        description: 'Transferred to Pacific express flight SDE-881 to Sydney',
        occurred_at: new Date(Date.now() - 32 * 3600000).toISOString(),
      },
      {
        status: 'Processing',
        location: 'Tokyo Narita Freight Facility, Japan',
        description: 'International air freight security scan passed',
        occurred_at: new Date(Date.now() - 60 * 3600000).toISOString(),
      },
      {
        status: 'Shipment Registered',
        location: 'Tokyo, Japan',
        description: 'Priority courier order initialized',
        occurred_at: new Date(Date.now() - 96 * 3600000).toISOString(),
      },
    ],
  },

  'SDE-DOM-104822': {
    tracking_id: 'SDE-DOM-104822',
    origin: 'Los Angeles, United States',
    destination: 'Toronto, Canada',
    status: 'Delivered',
    latest_location: 'Toronto Downtown Delivery Hub, Canada',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    estimated_delivery: new Date(Date.now() - 12 * 3600000).toISOString(),
    events: [
      {
        status: 'Delivered',
        location: 'Toronto, Canada',
        description: 'Delivered directly to recipient front desk with verified signature',
        occurred_at: new Date(Date.now() - 10 * 3600000).toISOString(),
      },
      {
        status: 'Out for Delivery',
        location: 'Toronto Central Delivery Center, Canada',
        description: 'Loaded into delivery van for final mile delivery',
        occurred_at: new Date(Date.now() - 18 * 3600000).toISOString(),
      },
      {
        status: 'Arrived at Sorting Facility',
        location: 'Chicago Gateway Hub, United States',
        description: 'Cross-border clearance processed and sorted for Canadian ground delivery',
        occurred_at: new Date(Date.now() - 48 * 3600000).toISOString(),
      },
      {
        status: 'In Transit',
        location: 'Denver Logistics Center, United States',
        description: 'Linehaul vehicle departed heading East',
        occurred_at: new Date(Date.now() - 72 * 3600000).toISOString(),
      },
      {
        status: 'Shipment Registered',
        location: 'Los Angeles, United States',
        description: 'Ground express tracking label generated',
        occurred_at: new Date(Date.now() - 120 * 3600000).toISOString(),
      },
    ],
  },
};
