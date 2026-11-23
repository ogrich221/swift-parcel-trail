import { createFileRoute } from '@tanstack/react-router';
import { customerQuery } from '@/lib/customer/query';
import { CustomerShell, CustomerError } from '@/components/customer/shell';
import { BrandLoading } from '@/components/brand-loading';
export const Route = createFileRoute('/_authenticated/account')({
  loader: ({context}) => context.queryClient.ensureQueryData(customerQuery),
  component: CustomerShell,
  pendingComponent: BrandLoading,
  errorComponent: CustomerError,
  notFoundComponent: () => <div className="admin-access"><h1>Account page not found</h1></div>,
});