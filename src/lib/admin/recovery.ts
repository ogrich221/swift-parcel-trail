import {supabase} from '@/integrations/supabase/client';
import {masterAdminEmail} from './login';

export const RECOVERY_EXPIRY_MINUTES = 60;

export interface VerifyAndResetParams {
  token: string;
  password: string;
  confirm: string;
  hasActiveSession?: boolean;
}

export function validatePasscodePair(password: string, confirm: string): void {
  if (!password || password.length < 8) {
    throw new Error('Passcode must be at least 8 characters long.');
  }
  if (password !== confirm) {
    throw new Error('Passcodes do not match.');
  }
}

export function mapOtpErrorMessage(rawMessage: string): string {
  const lower = rawMessage.toLowerCase();
  if (lower.includes('expired') || lower.includes('invalid') || lower.includes('token') || lower.includes('otp')) {
    return 'This verification code is invalid, has expired, or has already been used once. Please request a new code.';
  }
  return rawMessage;
}

/**
 * Sends a one-time verification code to the registered master admin email.
 * Supabase handles single-use token generation with expiration.
 */
export async function sendAdminRecoveryCode(origin?: string): Promise<{email: string; message: string}> {
  const redirectTo = origin ? `${origin}/admin/login` : undefined;

  // Dispatch password recovery OTP
  const {error: recoveryErr} = await supabase.auth.resetPasswordForEmail(masterAdminEmail, {
    redirectTo
  });

  if (recoveryErr) {
    // If resetPasswordForEmail fails (e.g. rate limit), also attempt OTP sign-in code
    const {error: otpErr} = await supabase.auth.signInWithOtp({
      email: masterAdminEmail,
      options: {
        emailRedirectTo: redirectTo
      }
    });
    if (otpErr) {
      throw recoveryErr || otpErr;
    }
  }

  return {
    email: masterAdminEmail,
    message: `A secure one-time verification code was dispatched to ${masterAdminEmail}. The code expires in ${RECOVERY_EXPIRY_MINUTES} minutes and can only be used once.`
  };
}

/**
 * Verifies the single-use recovery code against Supabase Auth.
 * Invalidates the single-use token and establishes the recovery session.
 */
export async function verifyAdminRecoveryCode(token: string): Promise<boolean> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    throw new Error('Please enter the one-time verification code sent to your email.');
  }

  let {error} = await supabase.auth.verifyOtp({
    email: masterAdminEmail,
    token: cleanToken,
    type: 'recovery'
  });

  if (error) {
    const fallback = await supabase.auth.verifyOtp({
      email: masterAdminEmail,
      token: cleanToken,
      type: 'email'
    });
    if (fallback.error) {
      throw new Error(mapOtpErrorMessage(error.message || fallback.error.message));
    }
  }

  return true;
}

/**
 * Validates, saves the new admin passcode, and ensures the user has master admin rights.
 */
export async function updateAdminPasscode(password: string, confirm: string): Promise<boolean> {
  validatePasscodePair(password, confirm);

  const {error: updateErr} = await supabase.auth.updateUser({password});
  if (updateErr) throw updateErr;

  const {data: isMaster, error: roleError} = await supabase.rpc('is_master_admin');
  if (roleError || !isMaster) {
    await supabase.auth.signOut();
    throw new Error('Access is not authorised for this workspace.');
  }

  return true;
}

/**
 * Verifies the single-use recovery code, updates the admin passcode,
 * and confirms master admin status.
 */
export async function verifyRecoveryCodeAndResetPasscode({
  token,
  password,
  confirm,
  hasActiveSession = false
}: VerifyAndResetParams): Promise<boolean> {
  validatePasscodePair(password, confirm);

  if (!hasActiveSession) {
    await verifyAdminRecoveryCode(token);
  }

  return updateAdminPasscode(password, confirm);
}
