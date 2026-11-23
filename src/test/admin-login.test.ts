import {describe, expect, it} from 'vitest';
import {adminCredentials, masterAdminEmail} from '@/lib/admin/login';
import {
  validatePasscodePair,
  mapOtpErrorMessage,
  RECOVERY_EXPIRY_MINUTES
} from '@/lib/admin/recovery';

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

describe('secure admin login recovery', () => {
  it('enforces recovery code expiration of 60 minutes', () => {
    expect(RECOVERY_EXPIRY_MINUTES).toBe(60);
  });

  it('rejects passcodes that do not match or are shorter than 8 characters', () => {
    expect(() => validatePasscodePair('short', 'short')).toThrow('at least 8 characters');
    expect(() => validatePasscodePair('securePasscode1', 'differentPasscode2')).toThrow('do not match');
    expect(() => validatePasscodePair('validPasscode123', 'validPasscode123')).not.toThrow();
  });

  it('maps expired or already-used OTP errors to a clear security message', () => {
    const expiredMsg = mapOtpErrorMessage('Token has expired or is invalid');
    expect(expiredMsg).toContain('invalid, has expired, or has already been used once');

    const otpExpired = mapOtpErrorMessage('otp_expired');
    expect(otpExpired).toContain('invalid, has expired, or has already been used once');

    const genericMsg = mapOtpErrorMessage('Network request failed');
    expect(genericMsg).toBe('Network request failed');
  });
});
