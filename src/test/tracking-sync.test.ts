import { afterEach, describe, expect, it, vi } from 'vitest';
import { dateTimeInput } from '@/lib/admin/date-time';
import { startTrackingRefresh } from '@/lib/tracking-refresh';

afterEach(() => { vi.useRealTimers(); });

describe('tracking synchronization', () => {
  it('keeps a same-minute progress update newer than shipment registration', () => {
    const registered = '2026-11-24T09:43:24.131Z';
    const updated = '2026-11-24T09:43:25.456Z';
    const input = dateTimeInput(updated);
    expect(new Date(input).toISOString()).toBe(updated);
    expect(new Date(input).getTime()).toBeGreaterThan(Date.parse(registered));
  });

  it('does not shift saved timestamps when an administrator edits in another timezone', () => {
    const instant = '2026-11-24T09:43:24.131Z';
    expect(dateTimeInput(instant, 300)).toBe('2026-11-24T04:43:24.131');
    expect(Date.parse(`${dateTimeInput(instant, 300)}-05:00`)).toBe(Date.parse(instant));
    expect(dateTimeInput(instant, -330)).toBe('2026-11-24T15:13:24.131');
    expect(dateTimeInput(null)).toBe('');
  });

  it('refreshes open public tracking on schedule and stops when leaving the page', async () => {
    vi.useFakeTimers();
    const refresh = vi.fn(async () => {});
    const stop = startTrackingRefresh(refresh);
    await vi.advanceTimersByTimeAsync(15000);
    expect(refresh).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(0);
    expect(refresh).toHaveBeenCalledTimes(2);
    stop();
    await vi.advanceTimersByTimeAsync(30000);
    window.dispatchEvent(new Event('focus'));
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('does not overlap tracking refresh requests', async () => {
    vi.useFakeTimers();
    let complete: (() => void) | undefined;
    const refresh = vi.fn(() => new Promise<void>(resolve => { complete = resolve; }));
    const stop = startTrackingRefresh(refresh);
    await vi.advanceTimersByTimeAsync(30000);
    expect(refresh).toHaveBeenCalledTimes(1);
    complete?.();
    await vi.advanceTimersByTimeAsync(15000);
    expect(refresh).toHaveBeenCalledTimes(2);
    complete?.();
    stop();
  });
});