import { useState, type FormEvent } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCustomer, customerQuery } from '@/lib/customer/query';
import { sendCustomerSupport } from '@/lib/customer/customer.functions';
import { supportInput } from '@/lib/customer/schema';
import { Heading, Empty, date } from './common';
function message(details: unknown){return details && typeof details==='object' && 'message' in details && typeof details.message==='string'?details.message:'';}
export function CustomerSupport() {
  const data=useCustomer();const [busy,setBusy]=useState(false);const send=useServerFn(sendCustomerSupport);const client=useQueryClient();
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget;setBusy(true);try{const f=new FormData(form);const input=supportInput.parse({subject:f.get('subject'),message:f.get('message'),tracking_id:f.get('tracking_id')});await send({data:input});await client.invalidateQueries({queryKey:customerQuery.queryKey});form.reset();toast.success('Your support request has been submitted.');}catch(err){toast.error(err instanceof Error?err.message:'Could not submit your request.');}finally{setBusy(false);}}
  const requests=data.requests.filter(r=>['support','phone_verification','deactivation'].includes(r.kind));
  return <><Heading title="Help & Support" subtitle="Your conversation with Swift Delivery Express."/><form className="customer-form" onSubmit={submit}><h2>New support request</h2><div className="customer-form-grid"><label>Full Name<input value={`${data.profile.first_name} ${data.profile.last_name}`.trim()} readOnly/></label><label>Registered Email<input value={data.account.email} readOnly/></label><label>Tracking Number (optional)<input name="tracking_id" maxLength={100}/></label><label>Subject<input name="subject" required minLength={3} maxLength={150}/></label></div><label>Message<textarea name="message" required minLength={10} maxLength={5000} rows={4}/></label><Button variant="premium" type="submit" disabled={busy}><Send/>{busy?'Submitting…':'Submit Request'}</Button></form><h2 className="mt-10">Previous requests</h2>{requests.length?<div className="customer-conversations">{requests.map(r=><details key={r.id} open={requests[0]?.id===r.id}><summary><strong>{r.subject}</strong><span>{r.status} · {date(r.created_at)}</span></summary><p>{message(r.details)}</p>{data.replies.filter(reply=>reply.request_id===r.id).map(reply=><div className="customer-support-reply" key={reply.id}><strong>Swift Delivery Express</strong><p>{reply.message}</p><small>{date(reply.created_at,true)}</small></div>)}</details>)}</div>:<Empty title="No support requests yet"/>}</>;
}