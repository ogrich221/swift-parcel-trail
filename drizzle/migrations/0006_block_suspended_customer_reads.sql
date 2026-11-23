CREATE OR REPLACE FUNCTION public.is_active_customer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.account_status = 'active') $$;
REVOKE ALL ON FUNCTION public.is_active_customer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_customer() TO authenticated, service_role;
DROP POLICY IF EXISTS "Customers read own booking requests" ON public.service_requests;
CREATE POLICY "Customers read own booking requests" ON public.service_requests FOR SELECT TO authenticated USING (user_id = auth.uid() AND public.is_active_customer());
DROP POLICY IF EXISTS "Own in-app notifications or master" ON public.customer_notifications;
CREATE POLICY "Own in-app notifications or master" ON public.customer_notifications FOR SELECT TO authenticated USING ((user_id = auth.uid() AND public.is_active_customer()) OR public.is_master_admin());