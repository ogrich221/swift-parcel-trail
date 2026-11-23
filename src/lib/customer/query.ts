import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { getCustomerData } from './customer.functions';
export const customerQuery = queryOptions({queryKey: ['customer-account'], queryFn: () => getCustomerData(), staleTime: 0, refetchInterval: 15000, refetchOnWindowFocus: true, retry: false});
export type CustomerData = Awaited<ReturnType<typeof getCustomerData>>;
export function useCustomer() { const query=useSuspenseQuery(customerQuery);if(query.error && !query.isFetching)throw query.error;return query.data; }