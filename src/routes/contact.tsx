import {PublishedContact} from '@/lib/public-content';
import { createFileRoute } from '@tanstack/react-router';
import { pageHead } from '@/lib/shipment';
import { RequestForm } from '@/components/request-form';
export const Route=createFileRoute('/contact')({head:()=>pageHead('Contact & customer support','Contact Swift Delivery Express for shipment support, delivery enquiries and business logistics requests.'),component:Contact});
function Contact(){return <><section className="page-banner"><div className="container"><div className="eyebrow">LET’S MAKE THE CONNECTION</div><h1>We’re here to help.</h1><p>A shipping question, a business opportunity or a parcel that needs extra attention. Tell us what you need.</p></div></section><section className="container page-body contact-grid"><div><h2>A conversation starts here.</h2><p>Send your enquiry securely. For shipment assistance, please include your tracking number in the message.</p><div className="contact-note"><strong>Business contact information</strong><PublishedContact/></div></div><RequestForm/></section></>}
