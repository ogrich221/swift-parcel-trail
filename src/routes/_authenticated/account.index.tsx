import { createFileRoute, redirect } from '@tanstack/react-router';
import { pageHead } from '@/lib/shipment';
export const Route = createFileRoute('/_authenticated/account/')({
  head: () => pageHead('Customer dashboard','Your Swift Delivery Express customer account.'),
  beforeLoad: () => { throw redirect({to:'/account/$section',params:{section:'dashboard'}}); },
});