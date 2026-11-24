CREATE OR REPLACE FUNCTION public.track_shipment(p_tracking_id text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object(
    'tracking_id',s.tracking_id,
    'origin',s.origin,
    'destination',s.destination,
    'status',CASE WHEN s.cancelled_at IS NOT NULL THEN 'Cancelled' ELSE s.status END,
    'latest_location',s.latest_location,
    'estimated_delivery',s.estimated_delivery,
    'created_at',s.created_at,
    'events',COALESCE((
      SELECT jsonb_agg(jsonb_build_object('status',e.status,'location',e.location,'description',e.description,'occurred_at',e.occurred_at) ORDER BY e.occurred_at DESC)
      FROM public.shipment_events e WHERE e.shipment_id=s.id
    ),'[]'::jsonb)
  ) FROM public.shipments s WHERE s.tracking_id=upper(trim(p_tracking_id)) LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.track_shipment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_shipment(text) TO anon, authenticated, service_role;