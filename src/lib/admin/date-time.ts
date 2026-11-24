/** datetime-local has no timezone; keep the original instant and millisecond precision. */
export function dateTimeInput(value: string | Date | null | undefined, offsetMinutes?: number): string {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const offset = offsetMinutes ?? date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 23);
}