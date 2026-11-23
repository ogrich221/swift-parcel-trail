import { useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PackageSearch, ArrowRight, Info, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TrackingPanel() {
  const [number, setNumber] = useState('');
  const navigate = useNavigate();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (number.trim()) {
      void navigate({
        to: '/track',
        search: { id: number.trim().toUpperCase() },
      });
    }
  }

  function trySample(code: string) {
    setNumber(code);
    void navigate({
      to: '/track',
      search: { id: code },
    });
  }

  return (
    <div className="tracking-panel">
      <div className="tracking-intro">
        <div className="icon-tile">
          <PackageSearch />
        </div>
        <div>
          <h2>Track your shipment</h2>
          <p>Real-time radar updates, interactive maps, and delivery tracking.</p>
        </div>
      </div>
      <form onSubmit={submit}>
        <div className="tracking-input">
          <PackageSearch size={19} />
          <input
            aria-label="Tracking number"
            placeholder="Enter your tracking number (e.g. SDE-EXP-772910)"
            required
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
          <Button variant="premium" type="submit">
            Track Shipment <ArrowRight />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap mt-2">
          <p className="tracking-hint">
            <Info size={13} />
            Find your tracking number on your receipt or confirmation email.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles size={12} className="text-primary" />
            <span>Try sample:</span>
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => trySample('SDE-EXP-772910')}
            >
              SDE-EXP-772910
            </button>
            <span>·</span>
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => trySample('SDE-PRI-482015')}
            >
              SDE-PRI-482015
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
