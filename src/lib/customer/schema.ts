import { z } from 'zod';

export const profileInput = z.object({
  first_name: z.string().trim().min(1).max(80), last_name: z.string().trim().max(80),
  address: z.string().trim().max(300), city: z.string().trim().max(100),
  state: z.string().trim().max(100), country: z.string().trim().max(100),
  postal_code: z.string().trim().max(30), date_of_birth: z.string().refine(v => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Enter a valid date.'),
}).strict();
export const supportInput = z.object({
  subject: z.string().trim().min(3).max(150), message: z.string().trim().min(10).max(5000),
  tracking_id: z.string().trim().max(100).default(''),
  kind: z.enum(['support', 'phone_verification', 'deactivation']).default('support'),
}).strict();
export const avatarInput = z.object({path: z.string().max(250)}).strict();
export const pictureTypes = ['image/jpeg', 'image/png', 'image/webp'];
export const pictureLimit = 5 * 1024 * 1024;
export function validatePicture(file: {type: string; size: number}) {
  if (!pictureTypes.includes(file.type)) throw new Error('Choose a JPG, PNG or WebP picture.');
  if (file.size > pictureLimit) throw new Error('Pictures must be no larger than 5 MB.');
}
export function shipmentGroup(status: string, cancelled: string | null = null) {
  if (cancelled) return 'Cancelled';
  if (status === 'Shipment Registered') return 'Pending';
  if (status === 'Delivered') return 'Delivered';
  if (status === 'Out for Delivery') return 'Out for Delivery';
  if (status.includes('Delayed') || status === 'Delivery Attempted') return 'Delayed';
  if (['Picked Up', 'Processing'].includes(status)) return 'Processing';
  return 'In Transit';
}
export const customerSections = ['dashboard', 'profile', 'shipments', 'track', 'history', 'notifications', 'support', 'settings'] as const;
export type CustomerSection = typeof customerSections[number];