import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { pageHead } from '@/lib/shipment';
import { ServicesGrid, services, BusinessBand } from '@/components/site';
import { Button } from '@/components/ui/button';
export const Route=createFileRoute('/services')({validateSearch:z.object({service:z.string().optional()}),head:()=>pageHead('Courier & logistics services','Explore domestic courier delivery, international shipping, express delivery, corporate logistics, freight and document delivery.'),component:Services});
function Services(){const {service}=Route.useSearch();const selected=services.find(s=>s.title===service);return <><section className="page-banner"><div className="container"><div className="eyebrow">SOLUTIONS THAT GO THE EXTRA MILE</div><h1>Our courier & logistics services.</h1><p>From a single document to your next commercial shipment, find the right service for your needs.</p></div></section><section className="page-body container">{selected&&<div className="mb-10 content-narrow"><h2>{selected.title}</h2><p>{selected.description} Service availability, rates, collection options and delivery estimates are confirmed individually for your route and parcel.</p><Button variant="premium" asChild><Link to="/quote">Get a quote for this service</Link></Button></div>}<ServicesGrid/></section><BusinessBand/></>}
