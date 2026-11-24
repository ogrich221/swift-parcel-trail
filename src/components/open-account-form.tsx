import { useState, useId, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ShieldCheck, ArrowRight, UserPlus, CheckCircle2, Lock, Sparkles, Building, Globe, MapPin, Phone, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/password-input';
import { supabase } from '@/integrations/supabase/client';
import companyLogo from '@/assets/swift-company-logo.asset.json';
import {
  type RegistrationData,
  type RegistrationErrors,
  validateRegistrationData,
  getPasswordStrength
} from '@/lib/customer/registration';

export function OpenAccountForm({
  onSwitchToLogin
}: {
  onSwitchToLogin?: () => void;
}) {
  const navigate = useNavigate();
  const formId = useId();

  const [formData, setFormData] = useState<RegistrationData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    password: '',
    confirm: '',
    agree: false
  });

  const [fieldErrors, setFieldErrors] = useState<RegistrationErrors>({});
  const [generalError, setGeneralError] = useState('');
  const [busy, setBusy] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<{
    name: string;
    email: string;
    customerId: string;
  } | null>(null);

  const strength = getPasswordStrength(formData.password);

  function handleChange(field: keyof RegistrationData, value: string | boolean) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (generalError) setGeneralError('');
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    const validation = validateRegistrationData(formData);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setBusy(true);

    try {
      const email = formData.email.trim().toLowerCase();
      const firstName = formData.first_name.trim();
      const lastName = formData.last_name.trim();
      const phone = formData.phone.trim();
      const country = formData.country.trim();
      const city = formData.city.trim();
      const address = formData.address.trim();

      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?mode=login`,
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
            country,
            city,
            address
          }
        }
      });

      if (error) {
        if (
          error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('already exists') ||
          error.message.toLowerCase().includes('user already registered')
        ) {
          throw new Error('An account with this email address is already registered. Please sign in or use password recovery.');
        }
        throw error;
      }

      // Generate or retrieve customer ID
      const customerId = data.user?.id
        ? 'SDE-C-' + data.user.id.replace(/-/g, '').slice(0, 12).toUpperCase()
        : 'SDE-C-PENDING';

      // If session is returned immediately (e.g. dev or auto-confirmed email)
      if (data.session && data.user) {
        try {
          await supabase.from('profiles').update({
            first_name: firstName,
            last_name: lastName,
            phone,
            country,
            city,
            address
          }).eq('id', data.user.id);
        } catch {
          // ignore if handled by DB trigger
        }
      }

      setRegisteredUser({
        name: `${firstName} ${lastName}`,
        email,
        customerId
      });
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Registration could not be completed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // REGISTRATION SUCCESS PAGE
  if (registeredUser) {
    return (
      <section className="open-account-card mx-auto max-w-xl p-8 md:p-12 text-center rounded-2xl border border-white/40 shadow-2xl backdrop-blur-2xl bg-white/85">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 shadow-inner border border-emerald-100">
          <CheckCircle2 size={36} className="text-emerald-500" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase mb-3">
          <Sparkles size={14} /> Official Customer Registration
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-3">
          WELCOME TO SWIFT DELIVERY EXPRESS!
        </h1>

        <p className="text-sm md:text-base text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
          Your account has been created. First, confirm your email address using the link sent to your inbox. Once confirmed, your account will wait for administrator approval before you can access the customer dashboard.
        </p>

        {/* Customer Account Summary Card */}
        <div className="text-left bg-gradient-to-br from-slate-50 to-blue-50/40 p-5 rounded-xl border border-blue-100/70 mb-8 space-y-2.5 text-xs text-slate-700 shadow-sm">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="font-semibold text-slate-500">Customer Name</span>
            <span className="font-medium text-slate-900">{registeredUser.name}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="font-semibold text-slate-500">Email Address</span>
            <span className="font-medium text-slate-900">{registeredUser.email}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="font-semibold text-slate-500">Customer Reference ID</span>
            <span className="font-mono font-bold text-primary tracking-wide">{registeredUser.customerId}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold text-slate-500">Account Status</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Pending Email Confirmation &amp; Admin Approval
            </span>
          </div>
        </div>

        <Button
          type="button"
          className="w-full py-6 text-base font-semibold btn-blue-gradient rounded-xl shadow-lg hover:shadow-xl transition-all"
          onClick={() => {
            if (onSwitchToLogin) {
              onSwitchToLogin();
            } else {
              void navigate({ to: '/auth', search: { mode: 'login' } });
            }
          }}
        >
          GO TO LOGIN <ArrowRight size={18} className="ml-2" />
        </Button>
      </section>
    );
  }

  // REGISTRATION FORM
  return (
    <div className="open-account-card mx-auto max-w-2xl p-6 sm:p-10 rounded-2xl border border-white/60 shadow-2xl backdrop-blur-2xl bg-white/90">
      {/* 1. REGISTRATION PAGE HEADER */}
      <div className="text-center mb-8">
        {/* Creative Company Logo Treatment */}
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/95 border border-primary/25 shadow-md shadow-primary/5 mb-5 backdrop-blur-md hover:border-primary/50 transition-colors">
          <img
            src={companyLogo.url}
            alt="Swift Delivery Express Logo"
            className="h-7 w-auto object-contain"
          />
          <div className="h-4 w-px bg-slate-300" />
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
            Customer Portal
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
          CREATE YOUR ACCOUNT
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Join Swift Delivery Express and enjoy a convenient way to manage your shipments, track deliveries, and stay updated on your packages.
        </p>
      </div>

      {generalError && (
        <div role="alert" className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2.5">
          <span className="shrink-0 font-bold">Error:</span>
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* 2. PERSONAL INFORMATION */}
        <div>
          <div className="form-section-header">
            <User size={14} className="text-primary" />
            <span>Personal Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${formId}-fn`} className="block text-xs font-semibold text-slate-700 mb-1">
                First Name <span className="text-destructive">*</span>
              </label>
              <input
                id={`${formId}-fn`}
                name="first_name"
                type="text"
                required
                placeholder="John"
                value={formData.first_name}
                onChange={e => handleChange('first_name', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                  fieldErrors.first_name ? 'border-destructive' : 'border-slate-300 focus:border-primary'
                }`}
              />
              {fieldErrors.first_name && (
                <p className="text-[11px] text-destructive mt-1">{fieldErrors.first_name}</p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-ln`} className="block text-xs font-semibold text-slate-700 mb-1">
                Last Name <span className="text-destructive">*</span>
              </label>
              <input
                id={`${formId}-ln`}
                name="last_name"
                type="text"
                required
                placeholder="Doe"
                value={formData.last_name}
                onChange={e => handleChange('last_name', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                  fieldErrors.last_name ? 'border-destructive' : 'border-slate-300 focus:border-primary'
                }`}
              />
              {fieldErrors.last_name && (
                <p className="text-[11px] text-destructive mt-1">{fieldErrors.last_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor={`${formId}-email`} className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  id={`${formId}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                    fieldErrors.email ? 'border-destructive' : 'border-slate-300 focus:border-primary'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-destructive mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-phone`} className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <input
                id={`${formId}-phone`}
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                  fieldErrors.phone ? 'border-destructive' : 'border-slate-300 focus:border-primary'
                }`}
              />
              {fieldErrors.phone && (
                <p className="text-[11px] text-destructive mt-1">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor={`${formId}-country`} className="block text-xs font-semibold text-slate-700 mb-1">
                Country <span className="text-destructive">*</span>
              </label>
              <input
                id={`${formId}-country`}
                name="country"
                type="text"
                required
                placeholder="United States"
                value={formData.country}
                onChange={e => handleChange('country', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                  fieldErrors.country ? 'border-destructive' : 'border-slate-300 focus:border-primary'
                }`}
              />
              {fieldErrors.country && (
                <p className="text-[11px] text-destructive mt-1">{fieldErrors.country}</p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-city`} className="block text-xs font-semibold text-slate-700 mb-1">
                City <span className="text-destructive">*</span>
              </label>
              <input
                id={`${formId}-city`}
                name="city"
                type="text"
                required
                placeholder="New York"
                value={formData.city}
                onChange={e => handleChange('city', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                  fieldErrors.city ? 'border-destructive' : 'border-slate-300 focus:border-primary'
                }`}
              />
              {fieldErrors.city && (
                <p className="text-[11px] text-destructive mt-1">{fieldErrors.city}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor={`${formId}-addr`} className="block text-xs font-semibold text-slate-700 mb-1">
              Residential Address <span className="text-destructive">*</span>
            </label>
            <input
              id={`${formId}-addr`}
              name="address"
              type="text"
              required
              placeholder="123 Ocean Avenue, Suite 400"
              value={formData.address}
              onChange={e => handleChange('address', e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                fieldErrors.address ? 'border-destructive' : 'border-slate-300 focus:border-primary'
              }`}
            />
            {fieldErrors.address && (
              <p className="text-[11px] text-destructive mt-1">{fieldErrors.address}</p>
            )}
          </div>
        </div>

        {/* 3. ACCOUNT SECURITY */}
        <div>
          <div className="form-section-header">
            <Lock size={14} className="text-primary" />
            <span>Account Security</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${formId}-pwd`} className="block text-xs font-semibold text-slate-700 mb-1">
                Create Password <span className="text-destructive">*</span>
              </label>
              <PasswordInput
                id={`${formId}-pwd`}
                name="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={formData.password}
                onChange={e => handleChange('password', e.target.value)}
              />
              {fieldErrors.password && (
                <p className="text-[11px] text-destructive mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-cpwd`} className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <PasswordInput
                id={`${formId}-cpwd`}
                name="confirm"
                required
                minLength={8}
                placeholder="Confirm password"
                autoComplete="new-password"
                value={formData.confirm}
                onChange={e => handleChange('confirm', e.target.value)}
              />
              {fieldErrors.confirm && (
                <p className="text-[11px] text-destructive mt-1">{fieldErrors.confirm}</p>
              )}
            </div>
          </div>

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-600 text-[11px]">Password Strength:</span>
                <span className="font-bold text-[11px] text-slate-800">{strength.label}</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${(strength.score / 4) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 mt-2">
                <span className={strength.hasLength ? 'text-emerald-600 font-semibold' : ''}>
                  {strength.hasLength ? '✓' : '•'} 8+ characters
                </span>
                <span className={strength.hasLetter ? 'text-emerald-600 font-semibold' : ''}>
                  {strength.hasLetter ? '✓' : '•'} Letters included
                </span>
                <span className={strength.hasNumber ? 'text-emerald-600 font-semibold' : ''}>
                  {strength.hasNumber ? '✓' : '•'} Numbers included
                </span>
                <span className={strength.hasSpecial ? 'text-emerald-600 font-semibold' : ''}>
                  {strength.hasSpecial ? '✓' : '•'} Special characters
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4. TERMS AND CONDITIONS */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="agree"
              required
              checked={formData.agree}
              onChange={e => handleChange('agree', e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary shrink-0"
            />
            <span className="text-xs text-slate-600 leading-relaxed">
              I agree to the Swift Delivery Express{' '}
              <Link to="/terms" target="_blank" className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy" target="_blank" className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {fieldErrors.agree && (
            <p className="text-[11px] text-destructive mt-1.5">{fieldErrors.agree}</p>
          )}
        </div>

        {/* 5. CREATE ACCOUNT BUTTON */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={busy}
            className="w-full py-6 text-base font-bold btn-blue-gradient rounded-xl shadow-lg transition-all"
          >
            {busy ? (
              <span>Creating your account…</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <UserPlus size={18} /> CREATE MY ACCOUNT <ArrowRight size={16} />
              </span>
            )}
          </Button>
        </div>

        <div className="text-center pt-2">
          <span className="text-xs text-slate-500">Already registered with Swift Delivery Express? </span>
          <button
            type="button"
            className="text-xs font-bold text-primary hover:underline ml-1"
            onClick={() => {
              if (onSwitchToLogin) {
                onSwitchToLogin();
              } else {
                void navigate({ to: '/auth', search: { mode: 'login' } });
              }
            }}
          >
            Sign in here
          </button>
        </div>
      </form>
    </div>
  );
}
