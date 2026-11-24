import {describe,expect,it} from 'vitest';
import {matchesShipmentStatus,projectShipmentForExport,shipmentDisplayStatus,trackingMapState} from '@/lib/shipment';
import {currentRecord} from '@/lib/admin/live-record';

describe('shipment views follow current status',()=>{
 it('does not include cancelled shipments in an active status filter',()=>{
  const shipment={status:'In Transit',cancelled_at:'2026-11-24T10:00:00Z'};
  expect(matchesShipmentStatus(shipment,'In Transit')).toBe(false);
  expect(matchesShipmentStatus(shipment,'Cancelled')).toBe(true);
  expect(matchesShipmentStatus(shipment,'all')).toBe(true);
 });
 it('excludes cancelled deliveries and delays from their current outcome totals',()=>{
  const rows=[{status:'Delivered',cancelled_at:null},{status:'Delivered',cancelled_at:'2026-11-24'},{status:'Exception / Delayed',cancelled_at:'2026-11-24'}];
  expect(rows.filter(s=>shipmentDisplayStatus(s.status,s.cancelled_at)==='Delivered')).toHaveLength(1);
  expect(rows.filter(s=>shipmentDisplayStatus(s.status,s.cancelled_at)==='Exception / Delayed')).toHaveLength(0);
 });
 it('exports cancellation without changing the stored record or original travel status',()=>{
  const original={status:'In Transit',cancelled_at:'2026-11-24T10:00:00Z',tracking_id:'TEST',shipping_cost:0};
  expect(projectShipmentForExport(original)).toEqual({...original,status:'Cancelled'});
  expect(original.status).toBe('In Transit');
  expect(projectShipmentForExport({...original,cancelled_at:null}).status).toBe('In Transit');
 });
 it('does not present a cancelled journey as live progress',()=>{
  expect(trackingMapState('Cancelled')).toEqual({cancelled:true,delivered:false,progressPercent:null});
  expect(trackingMapState('In Transit').progressPercent).toBe(65);
  expect(trackingMapState('Delivered').progressPercent).toBe(100);
 });
 it('resolves an open selection from the latest refreshed row',()=>{
  const before=[{id:'shipment-1',status:'In Transit'}];
  const after=[{id:'shipment-1',status:'Cancelled'}];
  expect(currentRecord(before,'shipment-1')?.status).toBe('In Transit');
  expect(currentRecord(after,'shipment-1')?.status).toBe('Cancelled');
  expect(currentRecord(after,'missing')).toBeNull();
 });
});