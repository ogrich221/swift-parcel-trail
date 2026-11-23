import {createFileRoute} from '@tanstack/react-router';
import {z} from 'zod';
import {AdminSection} from '@/components/admin/section';
import {pageHead} from '@/lib/shipment';
import {adminNav} from '@/components/admin/shell';
export const Route=createFileRoute('/admin/$section')({validateSearch:z.object({q:z.string().optional(),action:z.string().optional()}),head:({params})=>{const title=adminNav.find(n=>n.key===params.section)?.label??'Administration';return {meta:[...pageHead(title,`Swift Delivery Express administrator ${title.toLowerCase()}.`).meta,{name:'robots',content:'noindex,nofollow'}]};},component:Section});
function Section(){const {section}=Route.useParams();const {q,action}=Route.useSearch();return <AdminSection key={`${section}-${action??''}-${q??''}`} section={section} q={q} action={action}/>}
