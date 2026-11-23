import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { masterAdminEmail } from '@/lib/admin/login';
import { customerQuery } from '@/lib/customer/query';
import { CustomerShell, CustomerError } from '@/components/customer/shell';
import { BrandLoading } from '@/components/brand-loading';
export const Route = createFileRoute('/_authenticated/account')({
  beforeLoad: async () => { const {data} = await supabase.auth.getUser(); if (data.user?.email?.toLowerCase() === masterAdminEmail) throw redirect({to: '/admin'}); },
  loader: ({context}) => context.queryClient.ensureQueryData(customerQuery),
  component: CustomerShell,
  pendingComponent: BrandLoading,
  errorComponent: CustomerError,
  notFoundComponent: () => <div className="admin-access"><h1>Account page not found</h1></div>,
});