import { createFileRoute } from '@tanstack/react-router';
import { pageHead } from '@/lib/shipment';
import { FaqSection } from '@/components/faq-section';
export const Route=createFileRoute('/faq')({head:()=>pageHead('Frequently asked questions','Answers about shipment tracking, booking, collections, delivery times and restricted items.'),component:Faq});
function Faq(){return <><section className="page-banner"><div className="container"><div className="eyebrow">SHIPPING WITH CLARITY</div><h1>Your questions, answered.</h1><p>Helpful information for every step of your shipping experience.</p></div></section><section className="page-body container"><FaqSection/></section></>}
