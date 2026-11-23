-- All fixture and status changes are rolled back, including on connection failure.
BEGIN;
CREATE TEMP TABLE security_test_identity AS SELECT id FROM public.profiles ORDER BY created_at LIMIT 1;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM security_test_identity) THEN RAISE EXCEPTION 'A customer fixture is required'; END IF; END $$;
SELECT set_config('request.jwt.claim.sub', (SELECT id::text FROM security_test_identity), true);
UPDATE public.profiles SET account_status='active' WHERE id=(SELECT id FROM security_test_identity);
INSERT INTO public.shipments(id,user_id,tracking_id,origin,destination) VALUES
('aabf41ee-2586-452f-84eb-7309f2a4f001',(SELECT id FROM security_test_identity),'SDE-SECURITY-ROLLBACK-OWN','Test origin','Test destination'),
('aabf41ee-2586-452f-84eb-7309f2a4f002','aabf41ee-2586-452f-84eb-7309f2a4f099','SDE-SECURITY-ROLLBACK-OTHER','Other origin','Other destination');
INSERT INTO public.shipment_events(id,shipment_id,status,location) VALUES
('aabf41ee-2586-452f-84eb-7309f2a4f003','aabf41ee-2586-452f-84eb-7309f2a4f001','Processing','Test location'),
('aabf41ee-2586-452f-84eb-7309f2a4f004','aabf41ee-2586-452f-84eb-7309f2a4f002','Processing','Other location');
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF public.is_master_admin() THEN RAISE EXCEPTION 'Test needs an ordinary customer'; END IF;
 IF (SELECT count(*) FROM public.shipments WHERE id IN ('aabf41ee-2586-452f-84eb-7309f2a4f001','aabf41ee-2586-452f-84eb-7309f2a4f002'))<>1 THEN RAISE EXCEPTION 'Active customer must read only their own shipment'; END IF;
 IF (SELECT count(*) FROM public.shipment_events WHERE id IN ('aabf41ee-2586-452f-84eb-7309f2a4f003','aabf41ee-2586-452f-84eb-7309f2a4f004'))<>1 THEN RAISE EXCEPTION 'Active customer must read only their own history'; END IF;
END $$;
RESET ROLE;
UPDATE public.profiles SET account_status='suspended' WHERE id=(SELECT id FROM security_test_identity);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.shipments WHERE id='aabf41ee-2586-452f-84eb-7309f2a4f001')<>0 THEN RAISE EXCEPTION 'Suspended customer can still read private shipment'; END IF;
 IF (SELECT count(*) FROM public.shipment_events WHERE id='aabf41ee-2586-452f-84eb-7309f2a4f003')<>0 THEN RAISE EXCEPTION 'Suspended customer can still read shipment history'; END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','aabf41ee-2586-452f-84eb-7309f2a4f011',true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.shipments)<>2 THEN RAISE EXCEPTION 'Master shipment access must remain unchanged'; END IF;
 IF (SELECT count(*) FROM public.shipment_events)<>2 THEN RAISE EXCEPTION 'Master history access must remain unchanged'; END IF;
END $$;
RESET ROLE;
ROLLBACK;