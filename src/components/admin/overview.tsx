import {useState} from 'react';
import {z} from 'zod';
import {Link} from '@tanstack/react-router';
import {
  Users,
  Package,
  Truck,
  CheckCircle2,
  ArrowUpRight,
  Clock3,
  CircleAlert,
  Wallet,
  Plus,
  Route,
  ArrowRight,
  Activity,
  Headphones,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useAdmin} from '@/lib/admin/context';
import {AdminHeading,Badge,Table,Empty,date,money} from './common';

const statsSchema=z.object({users:z.number(),active_users:z.number(),suspended_users:z.number(),shipments:z.number(),pending:z.number(),in_transit:z.number(),delivered:z.number(),delayed:z.number(),revenue:z.number(),pending_payments:z.number(),support_open:z.number(),months:z.array(z.object({month:z.string(),total:z.number(),delivered:z.number(),delayed:z.number()})),destinations:z.array(z.object({destination:z.string(),total:z.number()}))});
export function readStats(value:unknown){return statsSchema.safeParse(value);}

const OVERVIEW_SECTIONS = ['stats', 'activity', 'performance', 'shipments', 'recent', 'actions'] as const;
type OverviewSectionKey = typeof OVERVIEW_SECTIONS[number];

export function Overview(){
  const {data,stats}=useAdmin();
  const [folded, setFolded] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('swift_admin_overview_folded');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return {};
  });

  const toggleFold = (key: OverviewSectionKey) => {
    setFolded((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('swift_admin_overview_folded', JSON.stringify(next));
      }
      return next;
    });
  };

  const allFolded = OVERVIEW_SECTIONS.every((k) => folded[k]);

  const toggleAll = () => {
    const nextVal = !allFolded;
    const next: Record<string, boolean> = {};
    OVERVIEW_SECTIONS.forEach((k) => {
      next[k] = nextVal;
    });
    setFolded(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('swift_admin_overview_folded', JSON.stringify(next));
    }
  };

  const parsed=readStats(stats);
  if(!parsed.success)return <Empty title="Statistics unavailable" detail="Try refreshing the operational records."/>;
  const s=parsed.data;
  const cards=[{name:'Total shipments',value:s.shipments,detail:`${s.pending} awaiting collection`,icon:Package,style:'blue'},{name:'In transit',value:s.in_transit,detail:'Active shipping operations',icon:Truck,style:'blue'},{name:'Delivered',value:s.delivered,detail:'Verified delivery records',icon:CheckCircle2,style:'green'},{name:'Shipping revenue',value:money(s.revenue,data.settings.currency),detail:'Verified paid transactions only',icon:Wallet,style:'neutral'}];
  const max=Math.max(1,...s.months.map(m=>m.total));

  return (
    <>
      <AdminHeading
        title="Operations overview"
        subtitle="A clear view of your deliveries, customers and daily operations."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
              title={allFolded ? 'Expand all dashboard sections' : 'Fold all dashboard sections'}
              className="gap-1.5 text-xs h-8"
            >
              <ChevronsUpDown size={14} />
              {allFolded ? 'Expand Dashboard' : 'Fold Dashboard'}
            </Button>
            <Button asChild variant="premium">
              <Link to="/admin/$section" params={{section:'shipments'}} search={{action:'create'}}>
                <Plus/>Create Shipment
              </Link>
            </Button>
          </div>
        }
      />

      <div className="overview-status">
        <div><span className="status-dot"/>Operational workspace</div>
        <span>All figures reflect recorded business activity</span>
      </div>

      {/* Foldable Section 1: KPI Stats & Secondary metrics */}
      <div className="mb-6">
        <div
          role="button"
          tabIndex={0}
          className="admin-section-fold-bar"
          onClick={() => toggleFold('stats')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleFold('stats'); }}
        >
          <h2>
            <Package size={15} className="text-primary" />
            Key Operational Metrics
            {folded['stats'] && <span className="admin-folded-badge">Folded</span>}
          </h2>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span>{folded['stats'] ? 'Click to expand' : 'Click to fold'}</span>
            <ChevronDown size={14} className={`admin-fold-chevron ${folded['stats'] ? 'rotate-[-90deg]' : ''}`} />
          </div>
        </div>

        {!folded['stats'] && (
          <>
            <div className="admin-stats">
              {cards.map(({name,value,detail,icon:Icon,style})=>(
                <article className={`admin-stat ${style}`} key={name}>
                  <div><span>{name}</span><Icon/></div>
                  <strong>{value}</strong>
                  <small>{detail}</small>
                </article>
              ))}
            </div>

            <div className="admin-secondary-stats">
              {[
                {label:'Registered users',value:s.users,icon:Users},
                {label:'Active users',value:s.active_users,icon:Activity},
                {label:'Suspended users',value:s.suspended_users,icon:CircleAlert},
                {label:'Pending shipments',value:s.pending,icon:Clock3},
                {label:'Delayed shipments',value:s.delayed,icon:CircleAlert},
                {label:'Pending payments',value:s.pending_payments,icon:Wallet}
              ].map(({label,value,icon:Icon})=>(
                <div key={label}>
                  <Icon/><span>{label}</span><strong>{value}</strong>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Foldable Section 2: Charts & Performance */}
      <div className="admin-overview-grid">
        {/* Module: Shipment Activity */}
        <section className={`admin-module ${folded['activity'] ? 'is-folded' : ''}`}>
          <div className="module-heading">
            <button
              type="button"
              className="admin-module-toggle"
              onClick={() => toggleFold('activity')}
            >
              <ChevronDown size={14} className="admin-fold-chevron" />
              <div>
                <h2>Shipment activity</h2>
                <p>Monthly shipment registrations</p>
              </div>
              {folded['activity'] && <span className="admin-folded-badge">Folded</span>}
            </button>
            <span className="legend"><i/>Shipments</span>
          </div>
          {!folded['activity'] && (
            <>
              {s.months.length ? (
                <div className="admin-bar-chart">
                  {s.months.slice(-8).map((m)=>(
                    <div key={m.month}>
                      <div className="chart-column">
                        <progress value={m.total} max={max} aria-label={`${m.month}: ${m.total} shipments`}/>
                        <strong>{m.total}</strong>
                      </div>
                      <small>{new Date(m.month+'-01T12:00:00Z').toLocaleDateString('en',{month:'short'})}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty title="Your shipment activity starts here" detail="Create your first operational shipment to see activity over time."/>
              )}
              <div className="chart-summary">
                <span>Total registered <strong>{s.shipments}</strong></span>
                <span>Delivery success <strong>{s.shipments?Math.round(s.delivered/s.shipments*100):0}%</strong></span>
                <span>Exceptions <strong>{s.delayed}</strong></span>
              </div>
            </>
          )}
        </section>

        {/* Module: Delivery Performance */}
        <section className={`admin-module ${folded['performance'] ? 'is-folded' : ''}`}>
          <div className="module-heading">
            <button
              type="button"
              className="admin-module-toggle"
              onClick={() => toggleFold('performance')}
            >
              <ChevronDown size={14} className="admin-fold-chevron" />
              <div>
                <h2>Delivery performance</h2>
                <p>Recorded shipment outcomes</p>
              </div>
              {folded['performance'] && <span className="admin-folded-badge">Folded</span>}
            </button>
            <CheckCircle2/>
          </div>
          {!folded['performance'] && (
            <>
              <div className="performance-total">
                <strong>{s.delivered}</strong><span>completed deliveries</span>
              </div>
              {[
                {name:'Delivered',value:s.delivered},
                {name:'In transit',value:s.in_transit},
                {name:'Pending',value:s.pending},
                {name:'Delayed',value:s.delayed}
              ].map(m=>(
                <div className="performance-row" key={m.name}>
                  <div><span>{m.name}</span><strong>{m.value}</strong></div>
                  <progress value={m.value} max={Math.max(1,s.shipments)}/>
                </div>
              ))}
              <Link to="/admin/$section" params={{section:'reports'}} className="module-link">
                Explore detailed reports <ArrowUpRight size={14}/>
              </Link>
            </>
          )}
        </section>
      </div>

      {/* Foldable Section 3: Recent Shipments */}
      <section className={`admin-module ${folded['shipments'] ? 'is-folded' : ''}`}>
        <div className="module-heading">
          <button
            type="button"
            className="admin-module-toggle"
            onClick={() => toggleFold('shipments')}
          >
            <ChevronDown size={14} className="admin-fold-chevron" />
            <div>
              <h2>Recent shipments</h2>
              <p>The latest movements across your network</p>
            </div>
            {folded['shipments'] && <span className="admin-folded-badge">Folded</span>}
          </button>
          <Link to="/admin/$section" params={{section:'shipments'}}>View all shipments <ArrowRight size={14}/></Link>
        </div>
        {!folded['shipments'] && (
          <Table
            head={['Tracking number','Customer / sender','Destination','Status','Created','']}
            rows={data.shipments.slice(0,5).map(r=>[
              <strong className="tracking-code" key={r.id}>{r.tracking_id}</strong>,
              r.sender_name??'—',
              r.destination,
              <Badge key={`badge-${r.id}`}>{r.cancelled_at?'Cancelled':r.status}</Badge>,
              date(r.created_at),
              <Button asChild variant="ghost" size="icon" title="View shipment" key={`btn-${r.id}`}>
                <Link to="/admin/$section" params={{section:'shipments'}} search={{q:r.tracking_id}}>
                  <ArrowUpRight/>
                </Link>
              </Button>
            ])}
            empty="No operational shipments yet"
          />
        )}
      </section>

      {/* Foldable Section 4: Secondary Grids */}
      <div className="mb-6">
        <div
          role="button"
          tabIndex={0}
          className="admin-section-fold-bar"
          onClick={() => toggleFold('recent')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleFold('recent'); }}
        >
          <h2>
            <Users size={15} className="text-primary" />
            Activity Feeds (Customers, Transactions & Support)
            {folded['recent'] && <span className="admin-folded-badge">Folded</span>}
          </h2>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span>{folded['recent'] ? 'Click to expand' : 'Click to fold'}</span>
            <ChevronDown size={14} className={`admin-fold-chevron ${folded['recent'] ? 'rotate-[-90deg]' : ''}`} />
          </div>
        </div>

        {!folded['recent'] && (
          <div className="admin-overview-grid three">
            <section className="admin-module">
              <div className="module-heading"><h2>Recent customers</h2><Users size={17}/></div>
              {data.users.length?data.users.slice(0,4).map(u=>(
                <div className="recent-item" key={u.id}>
                  <span className="mini-avatar">{u.email.slice(0,2).toUpperCase()}</span>
                  <div><strong>{u.email}</strong><small>{date(u.created_at)}</small></div>
                  <ArrowUpRight size={14}/>
                </div>
              )):<Empty title="No customer registrations"/>}
            </section>

            <section className="admin-module">
              <div className="module-heading"><h2>Latest transactions</h2><Wallet size={17}/></div>
              {data.payments.length?data.payments.slice(0,4).map(r=>(
                <div className="recent-item" key={r.id}>
                  <div><strong>{money(r.amount,r.currency)}</strong><small>{r.provider_reference}</small></div>
                  <Badge>{r.status}</Badge>
                </div>
              )):<Empty title="No payment activity" detail="No payment provider is connected."/>}
            </section>

            <section className="admin-module">
              <div className="module-heading"><h2>Support inbox</h2><Headphones size={17}/></div>
              {data.requests.filter(r=>r.kind==='contact').length?data.requests.filter(r=>r.kind==='contact').slice(0,4).map(r=>(
                <div className="recent-item" key={r.id}>
                  <div><strong>{r.subject||'Customer enquiry'}</strong><small>{r.name} · {date(r.created_at)}</small></div>
                  <Badge>{r.status}</Badge>
                </div>
              )):<Empty title="Your inbox is clear"/>}
            </section>
          </div>
        )}
      </div>

      {/* Foldable Section 5: Quick actions */}
      <div className="admin-quick-links">
        <strong>Quick actions</strong>
        {[
          {key:'users',label:'Create new user',icon:Users},
          {key:'shipments',label:'Create shipment',icon:Package},
          {key:'tracking',label:'Update tracking',icon:Route}
        ].map(({key,label,icon:Icon})=>(
          <Button key={key} asChild variant="outline">
            <Link to="/admin/$section" params={{section:key}} search={{action:'create'}}>
              <Icon/>{label}<ArrowUpRight/>
            </Link>
          </Button>
        ))}
      </div>
    </>
  );
}
