import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const migration = readFileSync('drizzle/migrations/0008_block_suspended_shipment_reads.sql', 'utf8');

describe('selected suspended-customer shipment protections', () => {
  it('requires ownership and active status for private shipments', () => {
    expect(migration).toContain('ON public.shipments TO authenticated USING (user_id = auth.uid() AND public.is_active_customer())');
  });
  it('requires active status and ownership for shipment history', () => {
    expect(migration).toContain('ON public.shipment_events TO authenticated USING (public.is_active_customer() AND EXISTS');
    expect(migration).toContain('s.id = shipment_events.shipment_id AND s.user_id = auth.uid()');
  });
  it('leaves master policies and public tracking unchanged', () => {
    expect(migration).not.toMatch(/Master reads|CREATE.*FUNCTION|DROP.*FUNCTION/i);
    expect(migration.match(/ALTER POLICY/g)).toHaveLength(2);
  });
  it('enforces suspension on PostgreSQL rows in one unchanged session, then rolls back', async () => {
    const db = new PGlite();
    try {
      await db.exec(`
        CREATE ROLE authenticated;
        CREATE ROLE service_role;
        CREATE SCHEMA auth;
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
        GRANT USAGE ON SCHEMA auth,public TO authenticated;
        GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
        CREATE TABLE public.profiles(id uuid PRIMARY KEY,account_status text,created_at timestamptz DEFAULT now());
        INSERT INTO public.profiles(id,account_status) VALUES('aabf41ee-2586-452f-84eb-7309f2a4f010','active');
        CREATE TABLE public.shipments(id uuid PRIMARY KEY,user_id uuid,tracking_id text,origin text,destination text);
        CREATE TABLE public.shipment_events(id uuid PRIMARY KEY,shipment_id uuid,status text,location text);
        GRANT SELECT ON public.shipments,public.shipment_events TO authenticated;
        ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
        CREATE FUNCTION public.is_master_admin() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT auth.uid()='aabf41ee-2586-452f-84eb-7309f2a4f011'::uuid $$;
        CREATE POLICY "Master reads shipments" ON public.shipments FOR SELECT TO authenticated USING(public.is_master_admin());
        CREATE POLICY "Master reads events" ON public.shipment_events FOR SELECT TO authenticated USING(public.is_master_admin());
        CREATE POLICY "Owners read private shipment details" ON public.shipments FOR SELECT TO authenticated USING(user_id=auth.uid());
        CREATE POLICY "Owners read shipment events" ON public.shipment_events FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.shipments s WHERE s.id=shipment_events.shipment_id AND s.user_id=auth.uid()));
      `);
      const activeHelper = readFileSync('drizzle/migrations/0006_block_suspended_customer_reads.sql', 'utf8').split('DROP POLICY')[0];
      if (!activeHelper) throw new Error('Active customer helper is missing');
      await db.exec(activeHelper);
      await db.exec(migration);
      await db.exec(readFileSync('src/test/shipment-suspension-security.sql', 'utf8'));
      const result = await db.query<{ count: number }>('SELECT count(*)::int AS count FROM public.shipments');
      expect(result.rows[0]?.count).toBe(0);
    } finally {
      await db.close();
    }
  }, 35000);
});