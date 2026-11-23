import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';

const sql = readFileSync('drizzle/migrations/0005_protect_website_drafts.sql', 'utf8');

describe('website content privacy', () => {
  it('restricts direct website content reads to the master administrator', () => {
    expect(sql).toContain('TO authenticated USING (public.is_master_admin())');
    expect(sql).toContain('REVOKE SELECT ON public.website_content FROM anon');
    expect(sql).not.toMatch(/USING\s*\(\s*true\s*\)/i);
  });

  it('exposes only published content after publication to visitors', () => {
    const body = sql.split('$function$')[1];
    expect(body).toBeDefined();
    expect(body).toContain('SELECT w.published FROM public.website_content');
    expect(body).toContain('w.id = true AND w.published_at IS NOT NULL');
    expect(body).not.toMatch(/\bdraft\b|\bupdated_by\b|SELECT\s+\*/i);
    expect(sql).toContain("SET search_path = ''");
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.get_published_website_content() FROM PUBLIC');
    expect(sql).toContain('TO anon, authenticated, service_role');
  });
});