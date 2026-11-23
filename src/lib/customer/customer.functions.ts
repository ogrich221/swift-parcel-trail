import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { profileInput, supportInput, avatarInput } from './schema';

export const getCustomerData = createServerFn({method: 'POST'}).middleware([requireSupabaseAuth]).handler(async ({context}) => {
  const {supabase, userId} = context;
  const {data: {user}, error} = await supabase.auth.getUser();
  if (error || !user) throw new Error('Your session is no longer available. Please sign in again.');
  const profile = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (profile.error || !profile.data) throw new Error('Your profile could not be loaded.');
  const account = {email: user.email ?? '', email_verified: Boolean(user.email_confirmed_at), phone_verified: Boolean(user.phone_confirmed_at), last_sign_in_at: user.last_sign_in_at ?? null};
  if (profile.data.account_status !== 'active') return {profile: profile.data, account, avatar: '', shipments: [], events: [], notifications: [], requests: [], replies: [], sessions: []};
  const sessionId = String(context.claims['session_id'] ?? '');
  if (sessionId) {
    const session = await supabase.rpc('record_customer_session', {p_session_id: sessionId});
    if (session.error) throw new Error('Your secure session could not be recorded.');
  }
  const results = await Promise.all([
    supabase.from('shipments').select('*').eq('user_id', userId).order('created_at', {ascending: false}),
    supabase.from('shipment_events').select('*').order('occurred_at', {ascending: false}),
    supabase.from('customer_notifications').select('*').eq('user_id', userId).order('created_at', {ascending: false}),
    supabase.from('service_requests').select('*').eq('user_id', userId).order('created_at', {ascending: false}),
    supabase.from('support_replies').select('*').order('created_at', {ascending: true}),
    supabase.from('customer_sessions').select('*').eq('user_id', userId).order('first_seen', {ascending: false}),
  ]);
  const [shipments, events, notifications, requests, replies, sessions] = results;
  if (results.some(r => r.error)) throw new Error('Your account records could not be loaded. Please try again.');
  let avatar = '';
  if (profile.data.avatar_path) {
    const bucket = profile.data.avatar_path.startsWith(`${userId}/`) ? 'customer-pictures' : 'admin-documents';
    const signed = await supabase.storage.from(bucket).createSignedUrl(profile.data.avatar_path, 120);
    avatar = signed.data?.signedUrl ?? '';
  }
  return {profile: profile.data, account, avatar, shipments: shipments.data ?? [], events: events.data ?? [], notifications: notifications.data ?? [], requests: requests.data ?? [], replies: replies.data ?? [], sessions: (sessions.data ?? []).map(s => ({...s, current: s.session_id === sessionId}))};
});

export const saveCustomerProfile = createServerFn({method: 'POST'}).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => profileInput.parse(input)).handler(async ({context, data}) => {
  const {error} = await context.supabase.rpc('update_customer_profile', {p_details: data});
  if (error) throw new Error('Your profile could not be saved. Check your details and account status.');
  return true;
});
export const saveCustomerAvatar = createServerFn({method: 'POST'}).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => avatarInput.parse(input)).handler(async ({context, data}) => {
  const {error} = await context.supabase.rpc('update_customer_avatar', {p_path: data.path});
  if (error) throw new Error('Your profile picture could not be saved.');
  return true;
});
export const sendCustomerSupport = createServerFn({method: 'POST'}).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => supportInput.parse(input)).handler(async ({context, data}) => {
  const {supabase, userId} = context;
  const {data: {user}, error} = await supabase.auth.getUser();
  if (error || !user?.email || !user.email_confirmed_at) throw new Error('Verify your email before submitting a request.');
  const profile = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (!profile.data || profile.data.account_status !== 'active') throw new Error('An active customer account is required.');
  const result = await supabase.from('service_requests').insert({user_id: userId, kind: data.kind, name: `${profile.data.first_name} ${profile.data.last_name}`.trim(), email: user.email, phone: profile.data.phone, subject: data.subject, details: {message: data.message, tracking_id: data.tracking_id}}).select('id').single();
  if (result.error) throw new Error('Your request could not be submitted.');
  return result.data;
});
export const updateCustomerNotification = createServerFn({method: 'POST'}).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({id: z.string().uuid().nullable(), action: z.enum(['read','delete'])}).strict().parse(input)).handler(async ({context, data}) => {
  const {error} = await context.supabase.rpc('manage_customer_notification', {p_id: data.id, p_action: data.action});
  if (error) throw new Error('Notifications could not be updated.');
  return true;
});
export const saveCustomerPreferences = createServerFn({method: 'POST'}).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({shipment: z.boolean(), account: z.boolean(), support: z.boolean()}).strict().parse(input)).handler(async ({context, data}) => {
  const {error} = await context.supabase.rpc('update_customer_preferences', {p_preferences: data});
  if (error) throw new Error('Your preferences could not be saved.');
  return true;
});