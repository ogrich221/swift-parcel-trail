import {describe,it,expect} from 'vitest';
import {parseTracking,stageState,requestSchema,shipmentStages,shipmentDisplayStatus} from '@/lib/shipment';
import {readFileSync} from 'node:fs';
describe('shipment rules',()=>{
 it('never fabricates tracking for missing records',()=>{expect(parseTracking(null)).toBeNull();});
 it('shows cancellation rather than the last travel status in account and administrator maps',()=>{expect(shipmentDisplayStatus('In Transit','2026-11-24T09:50:00Z')).toBe('Cancelled');expect(shipmentDisplayStatus('In Transit',null)).toBe('In Transit');});
 it('rejects incomplete tracking records',()=>{expect(()=>parseTracking({tracking_id:'UNKNOWN'})).toThrow();});
 it('marks completed active and pending delivery stages separately',()=>{expect(stageState('In Transit',0)).toBe('completed');expect(stageState('In Transit',3)).toBe('active');expect(stageState('In Transit',6)).toBe('pending');});
 it('includes registered and delivered operational stages',()=>{expect(shipmentStages[0]).toBe('Shipment Registered');expect(shipmentStages[6]).toBe('Delivered');});
 it('validates customer email before accepting requests',()=>{expect(requestSchema.safeParse({name:'Test Customer',email:'invalid',phone:'',message:'Please help with this shipment.'}).success).toBe(false);});
 it('does not expose sender or recipient information in public tracking',()=>{const sql=readFileSync('drizzle/migrations/0000_courier_requests_and_tracking.sql','utf8');const rpc=sql.slice(sql.indexOf('CREATE FUNCTION public.track_shipment'));expect(rpc).not.toContain('sender_name');expect(rpc).not.toContain('recipient_name');expect(rpc).toContain('s.tracking_id=upper(trim(p_tracking_id))');});
});
