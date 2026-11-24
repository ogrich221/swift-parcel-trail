/** Keep selections by identity, not by an outdated copy of a periodically refreshed row. */
export function currentRecord<T extends {id: string}>(rows: T[], id: string | null): T | null {
  return rows.find(row => row.id === id) ?? null;
}