import {createFileRoute} from '@tanstack/react-router';
import {Overview} from '@/components/admin/overview';
import {pageHead} from '@/lib/shipment';
export const Route=createFileRoute('/admin/')({head:()=>({...pageHead('Administrator overview','Swift Delivery Express master administrator operational overview.'),meta:[...pageHead('Administrator overview','Swift Delivery Express master administrator operational overview.').meta,{name:'robots',content:'noindex,nofollow'}]}),component:Overview});
