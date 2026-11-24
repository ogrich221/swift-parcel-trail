export const trackingRefreshMilliseconds = 15000;

/** Subscribe only after hydration; keep the last confirmed result visible between reads. */
export function startTrackingRefresh(refresh: () => Promise<void>): () => void {
  let stopped = false;
  let pending = false;
  const update = async () => {
    if (stopped || pending || document.visibilityState === 'hidden') return;
    pending = true;
    try { await refresh(); } finally { pending = false; }
  };
  const onFocus = () => { void update(); };
  const timer = window.setInterval(onFocus, trackingRefreshMilliseconds);
  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onFocus);
  return () => {
    stopped = true;
    window.clearInterval(timer);
    window.removeEventListener('focus', onFocus);
    document.removeEventListener('visibilitychange', onFocus);
  };
}