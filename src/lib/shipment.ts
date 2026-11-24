import { z } from 'zod';
export const trackingSchema = z.object({ tracking_id: z.string(), origin: z.string(), destination: z.string(), status: z.string(), latest_location: z.string().nullable(), estimated_delivery: z.string().nullable(), created_at: z.string(), events: z.array(z.object({status:z.string(),location:z.string(),description:z.string(),occurred_at:z.string()})) });
export const requestSchema = z.object({email:z.string().email(),name:z.string().min(2),phone:z.string().max(40),message:z.string().min(10).max(5000)});
export const shipmentStages = ['Shipment Registered','Picked Up','Processing','In Transit','Arrived at Sorting Facility','Out for Delivery','Delivered'];
export function stageState(status:string,index:number) { const current=shipmentStages.indexOf(status); return index < current ? 'completed' : index === current ? 'active' : 'pending'; }
export function parseTracking(data:unknown) { return data === null ? null : trackingSchema.parse(data); }
export function shipmentDisplayStatus(status:string,cancelledAt:string|null|undefined) { return cancelledAt ? 'Cancelled' : status; }
export function pageHead(title:string,description:string) {return {meta:[{title:`${title} | Swift Delivery Express`},{name:'description',content:description},{property:'og:title',content:`${title} | Swift Delivery Express`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]};}
