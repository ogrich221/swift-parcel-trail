import { createFileRoute, redirect } from '@tanstack/react-router';
import { pageHead } from '@/lib/shipment';

export const Route = createFileRoute('/register')({
  head: () =>
    pageHead(
      'Open an Account',
      'Create your Swift Delivery Express customer account to manage shipments, track deliveries, and stay updated.'
    ),
  beforeLoad: () => {
    throw redirect({
      to: '/auth',
      search: { mode: 'signup' }
    });
  }
});
