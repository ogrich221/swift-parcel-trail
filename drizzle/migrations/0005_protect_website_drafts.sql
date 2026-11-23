ALTER POLICY "Published content reads" ON public.website_content TO authenticated USING (public.is_master_admin());
REVOKE SELECT ON public.website_content FROM anon;
GRANT SELECT ON public.website_content TO authenticated;
GRANT ALL ON public.website_content TO service_role;
CREATE OR REPLACE FUNCTION public.get_published_website_content()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT COALESCE((SELECT w.published FROM public.website_content AS w WHERE w.id = true AND w.published_at IS NOT NULL), '{}'::jsonb);
$function$;
REVOKE ALL ON FUNCTION public.get_published_website_content() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_website_content() TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.get_published_website_content() IS 'Public read-only projection of published website content; never exposes drafts or editor details.';