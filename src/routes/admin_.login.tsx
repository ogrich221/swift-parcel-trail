import { PasswordInput } from '@/components/password-input';
import {createFileRoute, Link, useNavigate} from '@tanstack/react-router';
import {useState, useEffect, type FormEvent} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {ShieldCheck, ArrowRight, Package, LockKeyhole, Mail, KeyRound} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {supabase} from '@/integrations/supabase/client';
import {pageHead} from '@/lib/shipment';
import {adminCredentials, masterAdminEmail} from '@/lib/admin/login';

export const Route = createFileRoute('/admin_/login')({
  head: () => ({
    meta: [
      ...pageHead('ceo 001 sign in', 'Secure ceo 001 sign-in for Swift Delivery Express.').meta,
      {name: 'robots', content: 'noindex,nofollow'}
    ]
  }),
  component: AdminLogin
});

type LoginMode = 'login' | 'otp' | 'forgot' | 'recovery';

function AdminLogin() {
  const [mode, setMode] = useState<LoginMode>('login');
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
    }
    if (params.get('access_token')) {
      void (async () => {
        try {
          const {data: {user}} = await supabase.auth.getUser();
          if (user && user.email?.toLowerCase() === masterAdminEmail.toLowerCase()) {
            const {data: master} = await supabase.rpc('is_master_admin');
            if (master) {
              await enter();
            }
          }
        } catch {
          // ignore
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
    await navigate({to: '/admin'});
  }

  async function sendOtpCode() {
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
      setMessage(`Confirmation code sent to ${masterAdminEmail}. Please check your inbox and enter the code below.`);
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
      if (mode === 'otp') {
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

        if (verifyResult.error) throw verifyResult.error;

        const {data: master, error: roleError} = await supabase.rpc('is_master_admin');
        if (roleError || !master) {
          await supabase.auth.signOut();
          throw new Error('Access is not authorised for this workspace.');
        }
        await enter();
      } else if (mode === 'forgot') {
        const {error: err} = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/admin/login'
        });
        if (err) throw err;
        setMessage('If the authorised account exists, check your email for a secure recovery link.');
      } else if (mode === 'recovery') {
        const password = String(f.get('password'));
        if (password !== String(f.get('confirm'))) throw new Error('Passcodes do not match.');
        const {error: err} = await supabase.auth.updateUser({password});
        if (err) throw err;
        setMessage('Passcode saved. You can now sign in securely.');
        setMode('login');
      } else {
        const {error: err} = await supabase.auth.signInWithPassword(
          adminCredentials(String(f.get('password') ?? ''))
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
      setError(err instanceof Error ? err.message : 'Sign-in could not be completed.');
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
              : mode === 'forgot'
                ? 'Recover your access.'
                : mode === 'recovery'
                  ? 'Set your secure passcode.'
                  : 'ceo 001'}
        </h1>
        <p>
          {factor
            ? 'Enter the code from your authenticator.'
            : mode === 'otp'
              ? `A secure confirmation code was dispatched to ${masterAdminEmail}.`
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

            {(mode === 'login' || mode === 'recovery') && (
              <label>
                {mode === 'recovery' ? 'New passcode' : 'Passcode'}
                <PasswordInput
                  name="password"
                  required
                  minLength={8}
                  autoComplete={mode === 'recovery' ? 'new-password' : 'current-password'}
                />
              </label>
            )}

            {mode === 'recovery' && (
              <label>
                Confirm new passcode
                <PasswordInput name="confirm" required minLength={8} />
              </label>
            )}

            <Button variant="premium" disabled={busy}>
              {busy
                ? 'Please wait…'
                : mode === 'otp'
                  ? 'Verify Code & Access Workspace'
                  : mode === 'forgot'
                    ? 'Send Recovery Link'
                    : mode === 'recovery'
                      ? 'Save Passcode'
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
                onClick={sendOtpCode}
                className="flex items-center justify-center gap-2"
              >
                <Mail size={14} /> Send confirmation code to email
              </Button>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => {
                  setMode('forgot');
                  setError('');
                  setMessage('');
                }}
              >
                Forgot your passcode?
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
                onClick={sendOtpCode}
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

          {mode === 'forgot' && (
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
              Back to sign in
            </Button>
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
