import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const owner='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
let db: PGlite;
beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`CREATE ROLE authenticated;CREATE ROLE anon;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE SCHEMA storage;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT current_setting('request.jwt.claim.sub',true)::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT jsonb_build_object('session_id','verified-session') $$;
    CREATE FUNCTION public.is_master_admin() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT false $$;
    CREATE TABLE public.profiles(id uuid PRIMARY KEY,first_name text DEFAULT '',last_name text DEFAULT '',phone text DEFAULT 'original-phone',customer_id text DEFAULT 'SDE-C-ORIGINAL',account_status text DEFAULT 'active',address text DEFAULT '',city text DEFAULT '',state text DEFAULT '',country text DEFAULT '',avatar_path text DEFAULT '',updated_by uuid);
    CREATE FUNCTION public.is_active_customer() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND account_status='active') $$;
    CREATE TABLE public.service_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,kind text CHECK(kind IN('contact','quote','booking','newsletter')),email text,details jsonb);
    CREATE TABLE public.support_replies(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),request_id uuid,message text);
    CREATE TABLE public.customer_notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,shipment_id uuid,category text,title text,message text,read_at timestamptz,updated_by uuid);
    CREATE TABLE public.shipments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,tracking_id text,destination text,estimated_delivery timestamptz,cancelled_at timestamptz,updated_by uuid);
    CREATE TABLE public.shipment_events(id uuid PRIMARY KEY,shipment_id uuid,status text,location text,description text,updated_by uuid);
    CREATE TABLE storage.objects(bucket_id text,name text);
    GRANT USAGE ON SCHEMA public,auth,storage TO authenticated;
    GRANT SELECT ON public.profiles,public.service_requests,public.support_replies,public.customer_notifications TO authenticated;
    GRANT INSERT ON public.service_requests TO authenticated;GRANT UPDATE(read_at) ON public.customer_notifications TO authenticated;
    GRANT SELECT,INSERT,DELETE ON storage.objects TO authenticated;
    ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;ALTER TABLE public.support_replies ENABLE ROW LEVEL SECURITY;ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Customers create booking requests" ON service_requests FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
    CREATE POLICY "Own requests" ON service_requests FOR SELECT TO authenticated USING(user_id=auth.uid() AND is_active_customer());
    CREATE POLICY "Own notices" ON customer_notifications FOR SELECT TO authenticated USING(user_id=auth.uid() AND is_active_customer());
    CREATE POLICY "Read own notifications" ON customer_notifications FOR UPDATE TO authenticated USING(user_id=auth.uid());
    INSERT INTO profiles(id) VALUES('${owner}'),('${other}');`);
  await db.exec(readFileSync('drizzle/migrations/0009_customer_dashboard_access.sql','utf8'));
  await db.exec(readFileSync('drizzle/migrations/0010_customer_notification_preferences.sql','utf8'));
  await db.exec(readFileSync('drizzle/migrations/0017_require_admin_approval_for_new_users.sql','utf8'));
  await db.exec(`SET request.jwt.claim.sub='${owner}';`);
},35000);
afterAll(async()=>{await db?.close();});
describe('customer database security',()=>{
  it('updates permitted own details without changing customer ID, phone or account status',async()=>{
    await db.exec(`SET ROLE authenticated;SELECT update_customer_profile('{"first_name":"Maya","last_name":"Chen","city":"Toronto","customer_id":"spoofed","phone":"spoofed","account_status":"suspended"}');RESET ROLE;`);
    const rows=await db.query<{id:string;first_name:string;phone:string;customer_id:string;account_status:string}>('SELECT * FROM profiles ORDER BY id');
    expect(rows.rows[0]).toMatchObject({id:owner,first_name:'Maya',phone:'original-phone',customer_id:'SDE-C-ORIGINAL',account_status:'active'});
    expect(rows.rows[1]?.first_name).toBe('');
  });
  it('only records a session matching the verified identity',async()=>{
    await db.exec("SET ROLE authenticated;SELECT record_customer_session('verified-session');RESET ROLE;");
    expect((await db.query('SELECT * FROM customer_sessions')).rows).toHaveLength(1);
    await db.exec('SET ROLE authenticated');
    await expect(db.exec("SELECT record_customer_session('spoofed-session')")).rejects.toThrow('Active verified session required');
    await db.exec('RESET ROLE');
  });
  it('only exposes replies to the owner of the support request',async()=>{
    await db.exec(`INSERT INTO service_requests(id,user_id,kind) VALUES('33333333-3333-4333-8333-333333333333','${owner}','support'),('44444444-4444-4444-8444-444444444444','${other}','support');INSERT INTO support_replies(request_id,message) SELECT id,'Company response' FROM service_requests;SET ROLE authenticated;`);
    expect((await db.query('SELECT * FROM support_replies')).rows).toHaveLength(1);
    await db.exec('RESET ROLE');
  });
  it('allows deletion of read notices only and never another customer notice',async()=>{
    await db.exec(`INSERT INTO customer_notifications(id,user_id,category) VALUES('55555555-5555-4555-8555-555555555555','${owner}','shipment'),('66666666-6666-4666-8666-666666666666','${other}','shipment');SET ROLE authenticated;SELECT manage_customer_notification('55555555-5555-4555-8555-555555555555','delete');RESET ROLE;`);
    expect((await db.query('SELECT * FROM customer_notifications')).rows).toHaveLength(2);
    await db.exec("SET ROLE authenticated;SELECT manage_customer_notification(NULL,'read');SELECT manage_customer_notification('55555555-5555-4555-8555-555555555555','delete');SELECT manage_customer_notification('66666666-6666-4666-8666-666666666666','delete');RESET ROLE;");
    expect((await db.query<{user_id:string}>('SELECT * FROM customer_notifications')).rows[0]?.user_id).toBe(other);
  });
  it('keeps customer pictures private to their owner',async()=>{
    await db.exec(`INSERT INTO storage.objects(bucket_id,name) VALUES('customer-pictures','${owner}/pic.png'),('customer-pictures','${other}/pic.png');SET ROLE authenticated;`);
    expect((await db.query('SELECT * FROM storage.objects')).rows).toHaveLength(1);
    await expect(db.exec(`SELECT update_customer_avatar('${other}/pic.png')`)).rejects.toThrow('Invalid picture');
    await db.exec('RESET ROLE');
  });
  it('blocks all protected customer writes and replies after suspension in the same session',async()=>{
    await db.exec(`UPDATE profiles SET account_status='suspended' WHERE id='${owner}';SET ROLE authenticated;`);
    expect((await db.query('SELECT * FROM support_replies')).rows).toHaveLength(0);
    await expect(db.exec("SELECT update_customer_profile('{\"first_name\":\"Forbidden\"}')")).rejects.toThrow('Active customer required');
    await expect(db.exec("SELECT manage_customer_notification(NULL,'read')")).rejects.toThrow('Active customer required');
    await expect(db.exec(`INSERT INTO service_requests(user_id,kind) VALUES('${owner}','booking')`)).rejects.toThrow('row-level security');
    await db.exec(`RESET ROLE;UPDATE profiles SET account_status='active' WHERE id='${owner}';`);
  });
  it('honours notification preferences for genuine record events',async()=>{
    await db.exec(`SET ROLE authenticated;SELECT update_customer_preferences('{"shipment":false,"account":true,"support":true}');RESET ROLE;INSERT INTO customer_notifications(user_id,category) VALUES('${owner}','shipment');`);
    const result=await db.query<{count:number}>(`SELECT count(*)::int AS count FROM customer_notifications WHERE user_id='${owner}' AND category='shipment'`);
    expect(result.rows[0]?.count).toBe(0);
  });
  it('defaults newly registered profiles to pending and blocks protected access until approved',async()=>{
    const newcomer='77777777-7777-4777-8777-777777777777';
    await db.exec(`INSERT INTO profiles(id) VALUES('${newcomer}');SET request.jwt.claim.sub='${newcomer}';SET ROLE authenticated;`);
    const created=await db.query<{account_status:string}>(`SELECT account_status FROM profiles WHERE id='${newcomer}'`);
    expect(created.rows[0]?.account_status).toBe('pending');
    await expect(db.exec("SELECT update_customer_profile('{\"first_name\":\"Early\"}')")).rejects.toThrow('Active customer required');
    await expect(db.exec(`INSERT INTO service_requests(user_id,kind) VALUES('${newcomer}','booking')`)).rejects.toThrow('row-level security');
    await db.exec(`RESET ROLE;UPDATE profiles SET account_status='active' WHERE id='${newcomer}';SET ROLE authenticated;`);
    await db.exec("SELECT update_customer_profile('{\"first_name\":\"Approved\"}')");
    await db.exec(`RESET ROLE;SET request.jwt.claim.sub='${owner}';`);
  });
});