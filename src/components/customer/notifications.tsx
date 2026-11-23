import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCustomer, customerQuery } from '@/lib/customer/query';
import { updateCustomerNotification } from '@/lib/customer/customer.functions';
import { Heading, Empty, date } from './common';
export function CustomerNotifications() {
  const {notifications}=useCustomer();const [busy,setBusy]=useState(false);const manage=useServerFn(updateCustomerNotification);const client=useQueryClient();
  async function update(id:string|null,action:'read'|'delete'){setBusy(true);try{await manage({data:{id,action}});await client.invalidateQueries({queryKey:customerQuery.queryKey});}catch(err){toast.error(err instanceof Error?err.message:'Could not update notifications.');}finally{setBusy(false);}}
  return <><Heading title="Notifications" subtitle={`${notifications.filter(n=>!n.read_at).length} unread updates`} actions={<Button variant="outline" disabled={busy || !notifications.some(n=>!n.read_at)} onClick={()=>void update(null,'read')}><CheckCheck/>Mark all as read</Button>}/>{notifications.length?<div className="customer-notifications">{notifications.map(n=><article key={n.id} className={n.read_at?'read':'unread'}><Bell/><div><strong>{n.title}</strong><p>{n.message}</p><small>{date(n.created_at,true)}</small></div><div className="customer-notification-actions">{!n.read_at?<Button variant="ghost" size="icon" aria-label={`Mark ${n.title} as read`} title="Mark as read" disabled={busy} onClick={()=>void update(n.id,'read')}><Check/></Button>:<Button variant="ghost" size="icon" aria-label={`Delete ${n.title}`} title="Delete read notification" disabled={busy} onClick={()=>void update(n.id,'delete')}><Trash2/></Button>}</div></article>)}</div>:<Empty title="You're all caught up"/>}</>;
}