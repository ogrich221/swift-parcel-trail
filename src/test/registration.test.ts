import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  validatePhone,
  getPasswordStrength,
  validateRegistrationData,
  type RegistrationData
} from '@/lib/customer/registration';

describe('Swift Delivery Express - Open an Account validation', () => {
  describe('phone number format validation', () => {
    it('accepts valid domestic and international phone numbers', () => {
      expect(validatePhone('+1 (555) 019-2834')).toBe(true);
      expect(validatePhone('+44 20 7183 8750')).toBe(true);
      expect(validatePhone('555-019-2834')).toBe(true);
      expect(validatePhone('0123456789')).toBe(true);
    });

    it('rejects numbers that are too short or non-numeric', () => {
      expect(validatePhone('12345')).toBe(false);
      expect(validatePhone('')).toBe(false);
      expect(validatePhone('abc-phone-xyz')).toBe(false);
    });
  });

  describe('password strength and security requirements', () => {
    it('evaluates weak passwords that do not meet minimum requirements', () => {
      const weak = getPasswordStrength('pass');
      expect(weak.score).toBeLessThanOrEqual(2);
      expect(weak.hasLength).toBe(false);
    });

    it('identifies strong passwords meeting complexity criteria', () => {
      const strong = getPasswordStrength('Swift@Express2026!');
      expect(strong.hasLength).toBe(true);
      expect(strong.hasLetter).toBe(true);
      expect(strong.hasNumber).toBe(true);
      expect(strong.hasSpecial).toBe(true);
      expect(strong.label).toBe('Strong');
    });
  });

  describe('registration form completeness', () => {
    const validData: RegistrationData = {
      first_name: 'Alexander',
      last_name: 'Wright',
      email: 'alex.wright@example.com',
      phone: '+1 (555) 234-5678',
      country: 'United States',
      city: 'New York',
      address: '742 Evergreen Terrace',
      password: 'SecurePassword123!',
      confirm: 'SecurePassword123!',
      agree: true
    };

    it('accepts valid, complete registration data', () => {
      const result = validateRegistrationData(validData);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('detects missing personal information fields', () => {
      const missingName = validateRegistrationData({ ...validData, first_name: '', last_name: '' });
      expect(missingName.valid).toBe(false);
      expect(missingName.errors.first_name).toBeDefined();
      expect(missingName.errors.last_name).toBeDefined();

      const missingAddress = validateRegistrationData({ ...validData, address: '', city: '', country: '' });
      expect(missingAddress.valid).toBe(false);
      expect(missingAddress.errors.address).toBeDefined();
      expect(missingAddress.errors.city).toBeDefined();
      expect(missingAddress.errors.country).toBeDefined();
    });

    it('detects password mismatches and unaccepted terms', () => {
      const mismatch = validateRegistrationData({ ...validData, confirm: 'DifferentPassword123!' });
      expect(mismatch.valid).toBe(false);
      expect(mismatch.errors.confirm).toBe('Passwords do not match.');

      const noTerms = validateRegistrationData({ ...validData, agree: false });
      expect(noTerms.valid).toBe(false);
      expect(noTerms.errors.agree).toBeDefined();
    });

    it('detects invalid email format', () => {
      const badEmail = validateRegistrationData({ ...validData, email: 'not-an-email' });
      expect(badEmail.valid).toBe(false);
      expect(badEmail.errors.email).toBeDefined();
    });
  });

  describe('backend database customer synchronization', () => {
    it('synchronizes customer metadata into profiles on user registration', () => {
      const sql = readFileSync('drizzle/migrations/0015_sync_customer_registration_profile.sql', 'utf8');
      expect(sql).toContain('NEW.raw_user_meta_data->>\'first_name\'');
      expect(sql).toContain('NEW.raw_user_meta_data->>\'last_name\'');
      expect(sql).toContain('NEW.raw_user_meta_data->>\'phone\'');
      expect(sql).toContain('NEW.raw_user_meta_data->>\'address\'');
      expect(sql).toContain('NEW.raw_user_meta_data->>\'city\'');
      expect(sql).toContain('NEW.raw_user_meta_data->>\'country\'');
      expect(sql).toContain('ON CONFLICT(id) DO UPDATE SET');
    });
  });
});
