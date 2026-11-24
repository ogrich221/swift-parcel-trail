import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Loader2, PackageSearch, Share2, Check, Sparkles, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TrackingPanel } from '@/components/tracking-panel';
import { TrackingMap } from '@/components/tracking-map';
import { DEMO_SHIPMENTS } from '@/lib/demo-shipments';
import { Button } from '@/components/ui/button';
import { startTrackingRefresh } from '@/lib/tracking-refresh';
import { pageHead, parseTracking, shipmentStages, stageState, trackingSchema } from '@/lib/shipment';

export const Route = createFileRoute('/track')({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () =>
    pageHead(
      'Track your shipment',
      'Look up actual shipment progress, live map locations and delivery history with your Swift Delivery Express tracking number.'
    ),
  component: Track,
});

function Track() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [record, setRecord] = useState<z.infer<typeof trackingSchema> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    let pending = false;
    setRecord(null);
    setError('');
    async function lookup(initial = true) {
      if (!id || !id.trim()) {
        setRecord(null);
        setError('');
        return;
      }

      const cleanId = id.trim().toUpperCase();
      if (pending) return;
      pending = true;
      if (initial) setBusy(true);

      // Check if it's one of the demo/sample tracking numbers
      const demoRecord = DEMO_SHIPMENTS[cleanId];
      if (demoRecord) {
        if (alive) {
          setRecord(demoRecord);
          setBusy(false);
        }
        pending = false;
        return;
      }

      try {
        const { data, error: err } = await supabase.rpc('track_shipment', {
          p_tracking_id: cleanId,
        });
        if (err) throw err;
        const row = parseTracking(data);
        if (alive) {
          setRecord(row);
          setError('');
          if (!row) {
            setError(
              'Tracking number not found. Check your shipping receipt or try one of our live sample numbers below.'
            );
          }
        }
      } catch {
        if (alive) setError('Tracking is temporarily unavailable. Please try again.');
      } finally {
        pending = false;
        if (alive) setBusy(false);
      }
    }

    void lookup();
    const stopRefresh = id?.trim() && !DEMO_SHIPMENTS[id.trim().toUpperCase()]
      ? startTrackingRefresh(() => lookup(false))
      : () => {};
    return () => {
      alive = false;
      stopRefresh();
    };
  }, [id]);

  const copyTrackingLink = async () => {
    if (!record) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Tracking link copied to clipboard.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.info(`Tracking URL: ${window.location.href}`);
    }
  };

  const selectDemo = (demoId: string) => {
    void navigate({
      to: '/track',
      search: { id: demoId },
    });
  };

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <div className="eyebrow">LIVE INTERACTIVE RADAR & ROUTE TRACKING</div>
          <h1>Track your shipment.</h1>
          <p>
            Stay informed every step of the way with live map visualizations, checkpoint progress, and real-time delivery updates.
          </p>
        </div>
      </section>

      <div className="container page-body">
        <TrackingPanel />

        {/* Quick Demo Tracking Helper Pills */}
        <div className="demo-tracking-chips">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles size={13} className="text-primary" />
            Quick sample tracking:
          </span>
          <button
            type="button"
            className="demo-chip-btn"
            onClick={() => selectDemo('SDE-EXP-772910')}
          >
            SDE-EXP-772910 <small className="text-muted-foreground ml-1">(Frankfurt → New York · In Transit)</small>
          </button>
          <button
            type="button"
            className="demo-chip-btn"
            onClick={() => selectDemo('SDE-PRI-482015')}
          >
            SDE-PRI-482015 <small className="text-muted-foreground ml-1">(Tokyo → Sydney · Out for Delivery)</small>
          </button>
          <button
            type="button"
            className="demo-chip-btn"
            onClick={() => selectDemo('SDE-DOM-104822')}
          >
            SDE-DOM-104822 <small className="text-muted-foreground ml-1">(Los Angeles → Toronto · Delivered)</small>
          </button>
        </div>

        {busy && (
          <div role="status" className="status-message flex items-center gap-3 mt-6">
            <Loader2 className="animate-spin text-primary" />
            Connecting to Swift Tracking Network…
          </div>
        )}

        {error && (
          <div role="alert" className="status-message mt-6">
            <PackageSearch className="mb-2 text-destructive" />
            <p className="font-medium text-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Need assistance with your tracking number? Contact our support desk at{' '}
              <a
                href="mailto:contactsupport@swiftdeliveryexpres.online"
                className="text-primary underline font-medium"
              >
                contactsupport@swiftdeliveryexpres.online
              </a>
            </p>
          </div>
        )}

        {record && (
          <section className="tracking-result">
            {/* Visual Interactive Map */}
            <TrackingMap record={record} />

            {/* Shipment Summary Header */}
            <div className="result-header">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-1">
                  {DEMO_SHIPMENTS[record.tracking_id] ? 'SAMPLE TRACKING RECORD' : 'OFFICIAL TRACKING RECORD'}
                </span>
                <h2 className="break-all text-xl sm:text-2xl">{record.tracking_id}</h2>
              </div>
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  onClick={copyTrackingLink}
                  title="Share or copy tracking link"
                >
                  {copied ? <Check size={13} className="text-primary" /> : <Share2 size={13} />}
                  {copied ? 'Link Copied' : 'Share Tracking'}
                </Button>
                <span className={`status-label status-${record.status.toLowerCase().replaceAll(' ', '-')}`}>
                  {record.status}
                </span>
              </div>
            </div>

            {/* Shipment Facts Grid */}
            <dl className="shipment-facts">
              {[
                ['Origin', record.origin],
                ['Destination', record.destination],
                ['Latest recorded location', record.latest_location ?? 'Not yet recorded'],
                ['Shipment created', new Date(record.created_at).toLocaleString()],
                ['Latest travel update', record.events[0] ? new Date(record.events[0].occurred_at).toLocaleString() : 'Awaiting first travel update'],
                [
                  'Estimated delivery',
                  record.status === 'Cancelled' ? 'Not applicable — shipment cancelled' : record.estimated_delivery
                    ? new Date(record.estimated_delivery).toLocaleString()
                    : 'Pending confirmation',
                ],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 break-words">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            {/* Linear Stage Progress */}
            <div className="shipment-progress">
              {shipmentStages.map((s, i) => (
                <div key={s} className={`shipment-stage ${stageState(record.status, i)}`}>
                  {s}
                </div>
              ))}
            </div>

            {/* Detailed Shipment History Timeline */}
            <div className="flex flex-wrap gap-3 items-center justify-between border-b pb-3 mt-8 mb-4">
              <h3 className="text-lg font-bold m-0 flex items-center gap-2">
                <MapPin size={18} className="text-primary" />
                Shipment History & Milestones
              </h3>
              <span className="text-xs text-muted-foreground">
                {record.events.length} recorded update{record.events.length === 1 ? '' : 's'}
              </span>
            </div>

            {record.events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No tracking events have been recorded yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {record.events.map((ev, i) => (
                  <div className="history-row break-words" key={`${ev.occurred_at}-${i}`}>
                    <small>{new Date(ev.occurred_at).toLocaleString()}</small>
                    <div>
                      <strong>{ev.status}</strong>
                      <p>
                        {ev.location} {ev.description && `— ${ev.description}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-7 text-xs text-muted-foreground border-t pt-4">
              Sender and recipient personal details are private and are strictly protected. For customs enquiries, reach out to{' '}
              <a href="mailto:contactsupport@swiftdeliveryexpres.online" className="text-primary underline">
                contactsupport@swiftdeliveryexpres.online
              </a>
              .
            </p>
          </section>
        )}
      </div>
    </>
  );
}
