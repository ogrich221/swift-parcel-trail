import { createFileRoute } from '@tanstack/react-router';
import { pageHead } from '@/lib/shipment';
import { ShipmentDetails } from '@/components/customer/shipments';
export const Route = createFileRoute('/_authenticated/account/shipments_/$id')({
  head:()=>({...pageHead('My shipment details','Private shipment information and recorded delivery activity for your Swift Delivery Express account.'),meta:[...pageHead('My shipment details','Private shipment information and recorded delivery activity for your Swift Delivery Express account.').meta,{name:'robots',content:'noindex,nofollow'}]}),
  component:Details,
});
function Details(){const {id}=Route.useParams();return <ShipmentDetails id={id}/>;}