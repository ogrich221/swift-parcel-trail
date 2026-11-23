import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { pageHead } from '@/lib/shipment';
import { customerSections } from '@/lib/customer/schema';
import { Overview, ShipmentList, CustomerTracking } from '@/components/customer/shipments';
import { CustomerProfile } from '@/components/customer/profile';
import { CustomerNotifications } from '@/components/customer/notifications';
import { CustomerSupport } from '@/components/customer/support';
import { CustomerSettings } from '@/components/customer/settings';
const titles:Record<string,string>={dashboard:'Customer dashboard',profile:'My profile',shipments:'My shipments',track:'Track my shipment',history:'Shipment history',notifications:'Customer notifications',support:'Customer support',settings:'Account settings'};
export const Route = createFileRoute('/_authenticated/account/$section')({
  validateSearch:z.object({q:z.string().max(100).optional(),filter:z.string().optional()}),
  beforeLoad:({params})=>{if(!customerSections.some(s=>s===params.section))throw notFound();},
  head:({params})=>({...pageHead(titles[params.section]??'Customer account',`Manage your ${titles[params.section]?.toLowerCase()??'account'} with Swift Delivery Express.`),meta:[...pageHead(titles[params.section]??'Customer account',`Manage your ${titles[params.section]?.toLowerCase()??'account'} with Swift Delivery Express.`).meta,{name:'robots',content:'noindex,nofollow'}]}),
  component:AccountSection,
  notFoundComponent:()=> <h1>Account page not found</h1>,
});
function AccountSection(){const {section}=Route.useParams();const {q='',filter='All Shipments'}=Route.useSearch();const navigate=useNavigate({from:'/account/$section'});const onQuery=(value:string)=>void navigate({search:prev=>({...prev,q:value}),replace:true});const onFilter=(value:string)=>void navigate({search:prev=>({...prev,filter:value}),replace:true});switch(section){case'dashboard':return <Overview/>;case'profile':return <CustomerProfile/>;case'shipments':return <ShipmentList history={false} query={q} filter={filter} onQuery={onQuery} onFilter={onFilter}/>;case'history':return <ShipmentList history query={q} filter="All Shipments" onQuery={onQuery} onFilter={onFilter}/>;case'track':return <CustomerTracking query={q} onQuery={onQuery}/>;case'notifications':return <CustomerNotifications/>;case'support':return <CustomerSupport/>;case'settings':return <CustomerSettings/>;default:return null;}}