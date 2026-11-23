import { PasswordInput } from '@/components/password-input';
import {createFileRoute, Link, useNavigate} from '@tanstack/react-router';
import {useState, useEffect, type FormEvent} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {ShieldCheck, ArrowRight, Package, LockKeyhole, Mail, KeyRound, Clock, RefreshCw, Key} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {supabase} from '@/integrations/supabase/client';
import {pageHead} from '@/lib/shipment';
import {adminCredentials, masterAdminEmail} from '@/lib/admin/login';
import {
  sendAdminRecoveryCode,
  verifyAdminRecoveryCode,
  updateAdminPasscode,
  mapOtpErrorMessage,
  RECOVERY_EXPIRY_MINUTES
} from '@/lib/admin/recovery';

export const Route = createFileRoute('/admin_/login')({
  head: () => ({
    meta: [
      ...pageHead('ceo 001 sign in', 'Secure ceo 001 sign-in and recovery for Swift Delivery Express.').meta,
      {name: 'robots', content: 'noindex,nofollow'}
    ]
  }),
  component: AdminLogin
});

type LoginMode = 'login' | 'otp' | 'recovery';
type RecoveryStep = 'verifyCode' | 'setPasscode';

function AdminLogin() {
  const [mode, setMode] = useState<LoginMode>('login');
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>('verifyCode');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [factor, setFactor] = useState('');
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const cache = useQueryClient();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const type = params.get('type');
    if (type === 'recovery' || type === 'invite') {
      setMode('recovery');
      setRecoveryStep('setPasscode');
      setMessage('Recovery link verified. You must create and confirm your new passcode to access the admin dashboard.');
    }
    if (params.get('access_token')) {
      void (async () => {
        try {
          const {data: {user}} = await supabase.auth.getUser();
          if (user && user.email?.toLowerCase() === masterAdminEmail.toLowerCase()) {
            // Require admin to create and confirm new password before granting access
            setMode('recovery');
            setRecoveryStep('setPasscode');
            setMessage('Email link verified. Please create and confirm your new passcode before accessing the dashboard.');
          }
        } catch {
          // ignore parsing error
        }
      })();
    }
  }, []);

  async function enter() {
    const {data: factors} = await supabase.auth.mfa.listFactors();
    const totp = factors?.totp.find(f => f.status === 'verified');
    if (totp) {
      setFactor(totp.id);
      return;
    }
    await cache.invalidateQueries({queryKey: ['admin-session']});
    // Clean up hash if any
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    await navigate({to: '/admin'});
  }

  async function handleSendRecoveryCode() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const res = await sendAdminRecoveryCode(window.location.origin);
      setMessage(res.message);
      setMode('recovery');
      setRecoveryStep('verifyCode');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not dispatch recovery code.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSendOtpCode() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const {error: err} = await supabase.auth.signInWithOtp({
        email: masterAdminEmail,
        options: {
          emailRedirectTo: window.location.origin + '/admin/login'
        }
      });
      if (err) throw err;
      setMode('otp');
      setMessage(`Confirmation code sent to ${masterAdminEmail}. Please enter the 6-digit code below.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send confirmation code.');
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const f = new FormData(e.currentTarget);
    const email = masterAdminEmail;

    try {
      if (mode === 'recovery') {
        if (recoveryStep === 'verifyCode') {
          const token = String(f.get('token') ?? '').trim();
          await verifyAdminRecoveryCode(token);
          // Transition to required passcode creation step
          setRecoveryStep('setPasscode');
          setMessage('Code verified successfully. Now create and confirm your new passcode to access the workspace.');
        } else {
          // Required passcode creation & confirmation step
          const password = String(f.get('password') ?? '');
          const confirm = String(f.get('confirm') ?? '');
          await updateAdminPasscode(password, confirm);
          setMessage('New passcode saved. Entering admin dashboard…');
          await enter();
        }
      } else if (mode === 'otp') {
        const token = String(f.get('token') ?? '').trim();
        if (!token) throw new Error('Please enter the confirmation code.');

        let verifyResult = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email'
        });

        if (verifyResult.error) {
          verifyResult = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'magiclink'
          });
        }

        if (verifyResult.error) {
          verifyResult = await supabase.auth.verifyOtp({email, token, type: 'signup'});
        }

        if (verifyResult.error) throw new Error(mapOtpErrorMessage(verifyResult.error.message));

        const {data: master, error: roleError} = await supabase.rpc('is_master_admin');
        if (roleError || !master) {
          await supabase.auth.signOut();
          throw new Error('Access is not authorised for this workspace.');
        }
        await enter();
      } else {
        const password = String(f.get('password') ?? '');
        const {error: err} = await supabase.auth.signInWithPassword(
          adminCredentials(password)
        );
        if (err) throw err;
        const {data: master, error: roleError} = await supabase.rpc('is_master_admin');
        if (roleError || !master) {
          await supabase.auth.signOut();
          throw new Error('Access is not authorised for this workspace.');
        }
        await enter();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-brand">
        <Package />
        <span>
          SWIFT DELIVERY <small>EXPRESS · OPERATIONS</small>
        </span>
      </div>
      <section className="admin-login-panel">
        <span className="admin-lock-icon">
          <LockKeyhole />
        </span>
        <div className="admin-kicker">AUTHORISED PERSONNEL ONLY</div>
        <h1>
          {factor
            ? 'Verify your identity.'
            : mode === 'otp'
              ? 'Enter confirmation code.'
              : mode === 'recovery'
                ? recoveryStep === 'verifyCode'
                  ? 'Verify recovery code.'
                  : 'Create new passcode.'
                : 'ceo 001'}
        </h1>
        <p>
          {factor
            ? 'Enter the code from your authenticator.'
            : mode === 'otp'
              ? `A secure confirmation code was dispatched to ${masterAdminEmail}.`
              : mode === 'recovery'
                ? recoveryStep === 'verifyCode'
                  ? `Enter the one-time verification code dispatched to ${masterAdminEmail}.`
                  : 'Create and confirm your new passcode before accessing the dashboard.'
                : 'One workspace. Complete operational control.'}
        </p>

        {factor ? (
          <form
            className="admin-form"
            onSubmit={async e => {
              e.preventDefault();
              const {error} = await supabase.auth.mfa.challengeAndVerify({
                factorId: factor,
                code
              });
              if (error) setError(error.message);
              else {
                await cache.invalidateQueries({queryKey: ['admin-session']});
                await navigate({to: '/admin'});
              }
            }}
          >
            <label>
              Authenticator code
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                maxLength={6}
                required
                autoComplete="one-time-code"
              />
            </label>
            <Button variant="premium">Verify & Continue</Button>
          </form>
        ) : (
          <form className="admin-form" onSubmit={submit}>
            {mode === 'otp' && (
              <label>
                Confirmation code
                <input
                  name="token"
                  type="text"
                  placeholder="Enter 6-digit code"
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  className="font-mono text-center tracking-widest text-lg"
                />
              </label>
            )}

            {mode === 'recovery' && recoveryStep === 'verifyCode' && (
              <>
                <label>
                  One-time verification code
                  <input
                    name="token"
                    type="text"
                    placeholder="Enter 6-digit recovery code"
                    required
                    autoFocus
                    autoComplete="one-time-code"
                    className="font-mono text-center tracking-widest text-lg"
                  />
                </label>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground my-1 bg-secondary/50 p-2 rounded border border-border/50">
                  <Clock size={13} className="shrink-0 text-primary" />
                  <span>Codes expire in {RECOVERY_EXPIRY_MINUTES} minutes and can only be used once.</span>
                </div>
              </>
            )}

            {mode === 'recovery' && recoveryStep === 'setPasscode' && (
              <>
                <div className="flex items-center gap-1.5 text-[11px] text-primary/90 mb-2 bg-primary/10 p-2.5 rounded border border-primary/20">
                  <Key size={14} className="shrink-0 text-primary" />
                  <span>Identity verified. You must create and confirm your new passcode to access the workspace.</span>
                </div>
                <label>
                  New passcode
                  <PasswordInput
                    name="password"
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    autoFocus
                    autoComplete="new-password"
                  />
                </label>
                <label>
                  Confirm new passcode
                  <PasswordInput
                    name="confirm"
                    required
                    minLength={8}
                    placeholder="Repeat new passcode"
                    autoComplete="new-password"
                  />
                </label>
              </>
            )}

            {mode === 'login' && (
              <label>
                Passcode
                <PasswordInput
                  name="password"
                  required
                  minLength={8}
                  autoComplete="current-password"
                />
              </label>
            )}

            <Button variant="premium" disabled={busy}>
              {busy
                ? 'Please wait…'
                : mode === 'otp'
                  ? 'Verify Code & Access Workspace'
                  : mode === 'recovery'
                    ? recoveryStep === 'verifyCode'
                      ? 'Verify Code & Proceed'
                      : 'Save Passcode & Access Dashboard'
                    : 'Sign In to Workspace'}
              <ArrowRight />
            </Button>
          </form>
        )}

        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="status-message">
            {message}
          </p>
        )}

        <div className="flex flex-col gap-2 mt-4 text-center">
          {mode === 'login' && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={handleSendOtpCode}
                className="flex items-center justify-center gap-2"
              >
                <Mail size={14} /> Send confirmation code to email
              </Button>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleSendRecoveryCode}
                className="flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={13} /> Forgot passcode? Recover access
              </Button>
            </>
          )}

          {mode === 'recovery' && (
            <>
              {recoveryStep === 'verifyCode' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={handleSendRecoveryCode}
                  className="flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} /> Resend one-time verification code
                </Button>
              )}
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => {
                  setMode('login');
                  setRecoveryStep('verifyCode');
                  setError('');
                  setMessage('');
                }}
              >
                <KeyRound size={14} className="mr-1" /> Back to passcode sign-in
              </Button>
            </>
          )}

          {mode === 'otp' && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={handleSendOtpCode}
                className="flex items-center justify-center gap-2"
              >
                <Mail size={14} /> Resend confirmation code
              </Button>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setMessage('');
                }}
              >
                <KeyRound size={14} className="mr-1" /> Use passcode instead
              </Button>
            </>
          )}
        </div>

        <div className="admin-login-security">
          <ShieldCheck size={15} />
          ceo 001 · Encrypted session · {masterAdminEmail}
        </div>
      </section>
      <Link to="/" className="admin-return">
        ← Return to public website
      </Link>
    </div>
  );
}
