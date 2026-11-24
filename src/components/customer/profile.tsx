import { useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import {
  Pencil,
  Upload,
  Trash2,
  Save,
  X,
  Copy,
  Check,
  ShieldCheck,
  MapPin,
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  Globe,
  Clock,
  Package,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCustomer, customerQuery } from '@/lib/customer/query';
import { saveCustomerProfile, saveCustomerAvatar } from '@/lib/customer/customer.functions';
import { validatePicture, profileInput } from '@/lib/customer/schema';
import { supabase } from '@/integrations/supabase/client';
import { shipmentDisplayStatus } from '@/lib/shipment';

export function CustomerProfile() {
  const { profile, account, avatar, shipments = [] } = useCustomer();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState('');
  const [picture, setPicture] = useState<File | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const save = useServerFn(saveCustomerProfile);
  const saveAvatar = useServerFn(saveCustomerAvatar);
  const queryClient = useQueryClient();

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: customerQuery.queryKey });
  }

  function handleCopyId() {
    if (!profile.customer_id) return;
    void navigator.clipboard.writeText(profile.customer_id);
    setCopiedId(true);
    toast.success('Customer ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const values = Object.fromEntries(new FormData(e.currentTarget));
      await save({ data: profileInput.parse(values) });
      await refresh();
      setEditing(false);
      toast.success('Profile details saved successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setBusy(false);
    }
  }

  async function attach(remove = false) {
    setBusy(true);
    let path = '';
    try {
      if (!remove) {
        if (!picture) return;
        validatePicture(picture);
        const extension = picture.type === 'image/png' ? 'png' : picture.type === 'image/webp' ? 'webp' : 'jpg';
        path = `${profile.id}/${crypto.randomUUID()}.${extension}`;
        const uploaded = await supabase.storage.from('customer-pictures').upload(path, picture);
        if (uploaded.error) throw new Error('Your picture could not be uploaded.');
      }
      await saveAvatar({ data: { path } });
      if (profile.avatar_path && profile.avatar_path.startsWith(`${profile.id}/`)) {
        await supabase.storage.from('customer-pictures').remove([profile.avatar_path]);
      }
      await refresh();
      if (preview) URL.revokeObjectURL(preview);
      setPreview('');
      setPicture(null);
      toast.success(remove ? 'Profile picture removed.' : 'Profile picture updated successfully.');
    } catch (err) {
      if (path) await supabase.storage.from('customer-pictures').remove([path]);
      toast.error(err instanceof Error ? err.message : 'Picture could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim() || 'Customer Account';
  const initials = [profile.first_name, profile.last_name].map(s => s[0] ?? '').join('') || 'C';
  const memberSince = profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent';
  const activeShipmentsCount = shipments.filter(s => s.status !== 'Delivered' && !s.cancelled_at).length;
  const completedShipmentsCount = shipments.filter(s => shipmentDisplayStatus(s.status, s.cancelled_at) === 'Delivered').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary tracking-wider uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Swift Delivery Express · Customer Profile
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Profile & Details
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your personal credentials, default shipping locations, and account status.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {!editing ? (
            <Button
              variant="outline"
              className="bg-white hover:bg-slate-50 border-slate-300 font-semibold text-slate-700 shadow-xs"
              onClick={() => setEditing(true)}
            >
              <Pencil size={14} className="mr-1.5 text-primary" />
              Edit Profile
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="text-slate-600 hover:text-slate-900 font-medium"
              onClick={() => {
                setEditing(false);
                if (preview) {
                  URL.revokeObjectURL(preview);
                  setPreview('');
                  setPicture(null);
                }
              }}
            >
              <X size={14} className="mr-1.5" />
              Cancel Editing
            </Button>
          )}

          <Button asChild variant="premium" className="shadow-xs">
            <Link to="/account/$section" params={{ section: 'shipments' }}>
              <Package size={14} className="mr-1.5" />
              My Shipments
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Profile Identity Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar and Basic Details */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-primary font-bold text-2xl sm:text-3xl">
                {preview || avatar ? (
                  <img
                    src={preview || avatar}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials.toUpperCase()}</span>
                )}
              </div>

              {/* Photo Upload Overlay Button */}
              <label
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 cursor-pointer transition-all border-2 border-white"
                title="Upload or change profile picture"
              >
                <Upload size={14} />
                <input
                  aria-label="Upload profile picture"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={busy}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      validatePicture(file);
                      if (preview) URL.revokeObjectURL(preview);
                      setPicture(file);
                      setPreview(URL.createObjectURL(file));
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Invalid picture format or size.');
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                  {fullName}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  Verified Customer
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5 mt-1 truncate">
                <Mail size={13} className="text-slate-400 shrink-0" />
                {account.email}
              </p>

              {profile.phone && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  {profile.phone}
                </p>
              )}

              {/* Picture Action Buttons when changed */}
              {picture && (
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="premium"
                    className="h-7 text-xs"
                    disabled={busy}
                    onClick={() => void attach()}
                  >
                    <Save size={12} className="mr-1" />
                    Save Picture
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-slate-500"
                    onClick={() => {
                      if (preview) URL.revokeObjectURL(preview);
                      setPreview('');
                      setPicture(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {profile.avatar_path && !picture && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-destructive transition-colors mt-2"
                  onClick={() => void attach(true)}
                  disabled={busy}
                >
                  <Trash2 size={11} />
                  Remove photo
                </button>
              )}
            </div>
          </div>

          {/* Customer ID & Status Pill */}
          <div className="flex flex-row md:flex-col items-start md:items-end justify-between gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="text-left md:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Official Customer ID
              </span>
              <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 font-mono text-xs font-bold">
                <span>{profile.customer_id}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-sky-600 hover:text-sky-800 transition-colors p-0.5 rounded"
                  title="Copy Customer ID"
                  aria-label="Copy Customer ID"
                >
                  {copiedId ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Status: <strong className="text-slate-800 capitalize">{profile.account_status}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Member since {memberSince}</span>
            </div>
          </div>
        </div>

        {/* Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Shipments
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {shipments.length}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Active Deliveries
            </span>
            <div className="text-xl font-extrabold text-sky-600 mt-0.5">
              {activeShipmentsCount}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Completed
            </span>
            <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
              {completedShipmentsCount}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Email Status
            </span>
            <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1">
              {account.email_verified ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Verified
                </>
              ) : (
                <>
                  <AlertCircle size={14} className="text-amber-500" />
                  Pending
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form (Personal + Address) */}
      <form
        key={String(editing) + JSON.stringify(profile)}
        className="space-y-6"
        onSubmit={submit}
      >
        {/* Section 1: Personal Information */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-primary flex items-center justify-center font-bold">
              <User size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
              <p className="text-xs text-slate-500">
                Your legal identity recorded on Swift Delivery Express shipments.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                First Name <span className="text-destructive">*</span>
              </label>
              <input
                name="first_name"
                defaultValue={profile.first_name}
                required
                maxLength={80}
                disabled={!editing || busy}
                placeholder="Enter first name"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 disabled:bg-slate-50/90 disabled:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Last Name
              </label>
              <input
                name="last_name"
                defaultValue={profile.last_name}
                maxLength={80}
                disabled={!editing || busy}
                placeholder="Enter last name"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 disabled:bg-slate-50/90 disabled:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Date of Birth (Optional)
              </label>
              <input
                name="date_of_birth"
                type="date"
                defaultValue={profile.date_of_birth ?? ''}
                max={new Date().toISOString().slice(0, 10)}
                disabled={!editing || busy}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 disabled:bg-slate-50/90 disabled:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registered Email Address
              </label>
              <input
                value={account.email}
                readOnly
                disabled
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/80 text-sm text-slate-600 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Primary authentication email. Change in Account Settings.
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registered Contact Phone
              </label>
              <input
                value={profile.phone || 'Not recorded at registration'}
                readOnly
                disabled
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/80 text-sm text-slate-600 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Phone updates require customer security verification to prevent identity interception.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Residential & Delivery Address */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-primary flex items-center justify-center font-bold">
              <MapPin size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Residential & Delivery Address</h3>
              <p className="text-xs text-slate-500">
                Primary pickup and destination address associated with your customer ID.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Street Address
              </label>
              <input
                name="address"
                defaultValue={profile.address}
                maxLength={300}
                disabled={!editing || busy}
                placeholder="e.g. 742 Evergreen Terrace, Suite 10"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 disabled:bg-slate-50/90 disabled:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                City
              </label>
              <input
                name="city"
                defaultValue={profile.city}
                maxLength={100}
                disabled={!editing || busy}
                placeholder="e.g. Springfield"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 disabled:bg-slate-50/90 disabled:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                State / Province / Region
              </label>
              <input
                name="state"
                defaultValue={profile.state}
                maxLength={100}
                disabled={!editing || busy}
                placeholder="e.g. Oregon"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 disabled:bg-slate-50/90 disabled:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Postal / ZIP Code
              </label>
              <input
                name="postal_code"
                defaultValue={profile.postal_code}
                maxLength={30}
                disabled={!editing || busy}
                placeholder="e.g. 97477"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 disabled:bg-slate-50/90 disabled:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Country
              </label>
              <input
                name="country"
                defaultValue={profile.country}
                maxLength={100}
                disabled={!editing || busy}
                placeholder="e.g. United States"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 disabled:bg-slate-50/90 disabled:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Editing Submit & Cancel Bar */}
        {editing && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setEditing(false)}
              className="border-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="premium"
              disabled={busy}
              className="px-6 font-semibold shadow-sm"
            >
              <Save size={14} className="mr-1.5" />
              {busy ? 'Saving Changes…' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
