import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { parseTracking } from '@/lib/shipment';

const owner = '959f26f8-d3ec-4571-88ef-9193951149ad';
const customer = 'aabf41ee-2586-452f-84eb-7309f2a4f099';
const db = new PGlite();

describe('administrator shipment and public tracking flow', () => {
  beforeAll(async () => {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
        $$ SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
      INSERT INTO auth.users VALUES ('${owner}'), ('${customer}');
    `);
    await db.exec(readFileSync('drizzle/migrations/0000_courier_requests_and_tracking.sql', 'utf8'));
    await db.exec(readFileSync('drizzle/migrations/0001_master_admin_operations.sql', 'utf8'));
    await db.exec(readFileSync('drizzle/migrations/0016_sync_cancelled_public_tracking.sql', 'utf8'));
    await db.query('INSERT INTO public.user_roles(user_id) VALUES ($1)', [owner]);
  }, 35000);
  afterAll(async () => { await db.close(); });

  async function createShipment() {
    const result = await db.query<{ id: string; tracking_id: string }>(`
      INSERT INTO public.shipments(origin,destination,sender_name,recipient_name,updated_by)
      VALUES ('London, United Kingdom','New York, United States','Isolated test sender','Isolated test recipient',$1)
      RETURNING id,tracking_id
    `, [owner]);
    const row = result.rows[0];
    if (!row) throw new Error('Shipment creation returned no record');
    return row;
  }
  async function update(shipment: string, status: string, location: string, at: string, event?: string) {
    const result = await db.query<{ id: string }>(`
      SELECT public.admin_tracking_event($1,$2,$3,'Isolated journey verification',$4,$5,false,$6) AS id
    `, [shipment, status, location, at, owner, event ?? null]);
    const row = result.rows[0];
    if (!row) throw new Error('Tracking update returned no event');
    return row.id;
  }
  async function lookup(tracking: string) {
    const result = await db.query<{ record: unknown }>('SELECT public.track_shipment($1) AS record', [tracking]);
    return parseTracking(result.rows[0]?.record ?? null);
  }

  it('creates distinct shipment numbers and reads the registered event through public tracking', async () => {
    const first = await createShipment();
    const second = await createShipment();
    expect(first.tracking_id).toMatch(/^SDE-[A-F0-9]{32}$/);
    expect(first.tracking_id).not.toBe(second.tracking_id);
    await update(first.id, 'Shipment Registered', 'London collection hub', '2026-01-01T08:00:00Z');
    const record = await lookup(`  ${first.tracking_id.toLowerCase()}  `);
    expect(record?.status).toBe('Shipment Registered');
    expect(record?.origin).toBe('London, United Kingdom');
    expect(record?.events).toHaveLength(1);
    expect(record).not.toHaveProperty('sender_name');
    expect(await lookup('SDE-NOT-A-REAL-SHIPMENT')).toBeNull();
  });

  it('publishes tracking updates and corrections from the latest timestamp while preserving audit history', async () => {
    const shipment = await createShipment();
    await update(shipment.id, 'Picked Up', 'London collection hub', '2026-01-01T08:00:00Z');
    const transit = await update(shipment.id, 'In Transit', 'London airport', '2026-01-01T10:00:00Z');
    await update(shipment.id, 'Processing', 'London sorting centre', '2026-01-01T09:00:00Z');
    expect((await lookup(shipment.tracking_id))?.status).toBe('In Transit');
    await update(shipment.id, 'In Transit', 'New York airport', '2026-01-01T10:00:00Z', transit);
    const record = await lookup(shipment.tracking_id);
    expect(record?.latest_location).toBe('New York airport');
    expect(record?.events).toHaveLength(3);
    expect(record?.events[0]?.location).toBe('New York airport');
    const audit = await db.query<{ total: number }>(
      "SELECT count(*)::int AS total FROM public.admin_activity WHERE entity_type='shipment_events' AND entity_id=$1",
      [transit],
    );
    expect(audit.rows[0]?.total).toBe(2);
  });

  it('shows cancelled public tracking without deleting journey history or permitting more progress', async () => {
    const shipment = await createShipment();
    await update(shipment.id, 'In Transit', 'London airport', '2026-01-01T10:00:00Z');
    await db.query('UPDATE public.shipments SET cancelled_at=now(),updated_by=$1 WHERE id=$2', [owner, shipment.id]);
    const record = await lookup(shipment.tracking_id);
    expect(record?.status).toBe('Cancelled');
    expect(record?.events).toHaveLength(1);
    expect(record?.events[0]?.status).toBe('In Transit');
    expect(record).not.toHaveProperty('sender_name');
    expect(record).not.toHaveProperty('recipient_name');
    await expect(update(shipment.id, 'Delivered', 'New York', '2026-01-01T12:00:00Z')).rejects.toThrow();
    await expect(update(shipment.id, 'Processing', 'London', '2026-01-01T12:00:00Z')).rejects.toThrow('Shipment unavailable');
  });

  it('denies ordinary customer tracking writes and unverified delivery confirmations', async () => {
    const shipment = await createShipment();
    await expect(db.query(`SELECT public.admin_tracking_event($1,'In Transit','London','Unauthorized update',now(),$2,false)`, [shipment.id, customer])).rejects.toThrow('Forbidden');
    await expect(update(shipment.id, 'Delivered', 'New York address', '2026-01-01T12:00:00Z')).rejects.toThrow('Delivery must be verified');
    expect((await lookup(shipment.tracking_id))?.events).toHaveLength(0);
  });
});