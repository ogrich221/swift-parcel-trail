import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { PackageOpen, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shipmentGroup } from '@/lib/customer/schema';
import type { CustomerData } from '@/lib/customer/query';
export function date(value: string | null | undefined, time = false) { return value ? time ? new Date(value).toLocaleString() : new Date(value).toLocaleDateString() : 'Not scheduled'; }
export function Empty({title, children}: {title: string; children?: ReactNode}) { return <div className="customer-empty"><PackageOpen/><h3>{title}</h3>{children && <p>{children}</p>}</div>; }
export function Heading({title, subtitle, actions}: {title: string; subtitle?: string; actions?: ReactNode}) { return <div className="customer-heading"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{actions && <div className="customer-actions">{actions}</div>}</div>; }
export function Status({status, cancelled}: {status: string; cancelled?: string | null}) { const group = shipmentGroup(status, cancelled ?? null); return <span className={`customer-status ${group.toLowerCase().replaceAll(' ', '-')}`}>{cancelled ? 'Cancelled' : status}</span>; }
export function ShipmentTable({shipments}: {shipments: CustomerData['shipments']}) {
  if (!shipments.length) return <Empty title="No shipments found">Your confirmed shipments will appear here.</Empty>;
  return <div className="customer-table-wrap"><table className="customer-table"><thead><tr>{['Tracking number','Recipient / destination','Shipment date','Status','Estimated delivery',''].map((h,i) => <th key={i}>{h}</th>)}</tr></thead><tbody>{shipments.map(s => <tr key={s.id}><td><Link to="/account/shipments/$id" params={{id: s.id}} className="text-primary font-medium">{s.tracking_id}</Link></td><td>{s.recipient_name || '—'}<small>{s.destination}</small></td><td>{date(s.created_at)}</td><td><Status status={s.status} cancelled={s.cancelled_at}/></td><td>{date(s.estimated_delivery)}</td><td><Button asChild variant="ghost" size="icon" title="View shipment details" aria-label={`View ${s.tracking_id}`}><Link to="/account/shipments/$id" params={{id: s.id}}><ArrowUpRight/></Link></Button></td></tr>)}</tbody></table></div>;
}