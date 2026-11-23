import {describe, expect, it} from 'vitest';
import {adminCredentials, masterAdminEmail} from '@/lib/admin/login';

describe('passcode and confirmation code master sign-in', () => {
  it('uses only the authorised master account as its implicit identity', () => {
    expect(adminCredentials('test-only-passcode').email).toBe('swiftdeliveryexpress4@gmail.com');
    expect(masterAdminEmail).toBe('swiftdeliveryexpress4@gmail.com');
  });

  it('passes the entered credential unchanged for Cloud verification', () => {
    expect(adminCredentials(' test-only-passcode ').password).toBe(' test-only-passcode ');
    expect(adminCredentials('').password).toBe('');
  });
});
