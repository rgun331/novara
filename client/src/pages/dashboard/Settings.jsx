import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { Camera, Globe, LockKey, MapPin, Phone, SlidersHorizontal, Trash, UploadSimple, UserCircle, Warning } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { api, tokenStore } from '../../lib/api';
import { resizeImage } from '../../lib/image';
import { formatDate, formatMoney } from '../../lib/format';
import { skuParts } from '../../lib/sku';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { Avatar } from '../../components/ui/Avatar';
import { Switch } from '../../components/ui/Switch';
import { Modal } from '../../components/ui/Modal';
import { PasswordInput, StrengthMeter } from '../../components/ui/PasswordInput';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { cn } from '../../lib/cn';

const TABS = [
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { id: 'security', label: 'Security', icon: LockKey },
];

const CURRENCIES = [
  ['USD', 'US Dollar'],
  ['EUR', 'Euro'],
  ['GBP', 'British Pound'],
  ['PKR', 'Pakistani Rupee'],
  ['AED', 'UAE Dirham'],
  ['INR', 'Indian Rupee'],
];

function Section({ title, description, children, footer }) {
  return (
    <section className="rounded-2xl border border-line bg-paper shadow-soft">
      <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <div>
          <h3 className="text-[15px] font-semibold">{title}</h3>
          {description && <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{description}</p>}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
      {footer && <div className="flex items-center justify-end gap-2 rounded-b-2xl border-t border-line bg-canvas/50 px-5 py-3.5 md:px-6">{footer}</div>}
    </section>
  );
}

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'profile';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Settings" description="Manage your profile, workspace defaults and account security." />
      <div className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setParams(t.id === 'profile' ? {} : { tab: t.id }, { replace: true })}
            className={cn('relative inline-flex items-center gap-2 px-3.5 pb-3 pt-1 text-sm font-medium transition-colors', tab === t.id ? 'text-ink-900' : 'text-ink-500 hover:text-ink-800')}
          >
            <t.icon className="size-4" weight={tab === t.id ? 'fill' : 'regular'} />
            {t.label}
            {tab === t.id && <motion.span layoutId="settings-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink-900" />}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }} className="space-y-6">
          {tab === 'profile' && <ProfileTab />}
          {tab === 'preferences' && <PreferencesTab />}
          {tab === 'security' && <SecurityTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Profile ---------------- */

function ProfileTab() {
  const { user, setUser } = useAuth();
  const { refresh } = useNotifications();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const pick = (u) => ({
    name: u.name || '',
    email: u.email || '',
    businessName: u.businessName || '',
    jobTitle: u.jobTitle || '',
    phone: u.phone || '',
    location: u.location || '',
    website: u.website || '',
    bio: u.bio || '',
  });
  const [form, setForm] = useState(() => pick(user));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(pick(user));
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await resizeImage(file, { size: 320 });
      const d = await api('/profile/avatar', { method: 'PUT', body: { avatar: dataUrl } });
      setUser(d.user);
      refresh();
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeAvatar = async () => {
    setUploading(true);
    try {
      const d = await api('/profile/avatar', { method: 'PUT', body: { avatar: '' } });
      setUser(d.user);
      refresh();
      toast.success('Profile photo removed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) er.email = 'Enter a valid email address';
    if (form.website && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+/.test(form.website.trim())) er.website = 'Enter a valid URL';
    if (Object.keys(er).length) return setErrors(er);
    setSaving(true);
    try {
      const d = await api('/profile', { method: 'PATCH', body: form });
      setUser(d.user);
      setForm(pick(d.user));
      refresh();
      toast.success('Profile saved');
    } catch (err) {
      setErrors(err.details || {});
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Section title="Profile photo" description="Shown in the sidebar, menus and activity. Square images work best.">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            upload(e.dataTransfer.files?.[0]);
          }}
          className={cn('flex flex-col items-start gap-5 rounded-2xl border border-dashed p-5 transition-colors sm:flex-row sm:items-center', dragging ? 'border-pine-500 bg-pine-50' : 'border-line-strong')}
        >
          <div className="relative">
            <Avatar src={user.avatar} name={user.name} size={88} />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-ink-900 text-paper ring-4 ring-paper transition hover:bg-pine-700"
              aria-label="Change photo"
            >
              <Camera className="size-4" weight="bold" />
            </button>
            {uploading && <div className="absolute inset-0 grid place-items-center rounded-full bg-ink-900/40"><span className="size-6 animate-spin rounded-full border-2 border-paper border-t-transparent" /></div>}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Drag an image here or upload one</p>
            <p className="mt-0.5 text-[13px] text-ink-500">PNG, JPG or WebP, up to 8 MB. We crop and compress it for you.</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} loading={uploading}>
                <UploadSimple className="size-4" /> Upload photo
              </Button>
              {user.avatar && (
                <Button size="sm" variant="danger-ghost" onClick={removeAvatar} disabled={uploading}>
                  Remove
                </Button>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => upload(e.target.files?.[0])} />
        </div>
      </Section>

      <form onSubmit={save}>
        <Section
          title="Personal details"
          description="Your name and business appear on your workspace. Your email is used to log in."
          footer={
            <>
              {dirty && (
                <Button variant="ghost" onClick={() => { setForm(pick(user)); setErrors({}); }}>
                  Discard
                </Button>
              )}
              <Button type="submit" loading={saving} disabled={!dirty}>
                Save changes
              </Button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="p-name" error={errors.name} required>
              <Input id="p-name" value={form.name} onChange={set('name')} invalid={!!errors.name} autoComplete="name" />
            </Field>
            <Field label="Email" htmlFor="p-email" error={errors.email} required>
              <Input id="p-email" type="email" value={form.email} onChange={set('email')} invalid={!!errors.email} autoComplete="email" />
            </Field>
            <Field label="Business name" htmlFor="p-biz">
              <Input id="p-biz" value={form.businessName} onChange={set('businessName')} />
            </Field>
            <Field label="Role" htmlFor="p-role">
              <Input id="p-role" value={form.jobTitle} onChange={set('jobTitle')} placeholder="Owner" />
            </Field>
            <Field label="Phone" htmlFor="p-phone">
              <Input id="p-phone" value={form.phone} onChange={set('phone')} prefix={<Phone className="size-4" />} autoComplete="tel" />
            </Field>
            <Field label="Location" htmlFor="p-loc">
              <Input id="p-loc" value={form.location} onChange={set('location')} prefix={<MapPin className="size-4" />} placeholder="Lahore, Pakistan" />
            </Field>
            <Field label="Website" htmlFor="p-web" error={errors.website} className="sm:col-span-2">
              <Input id="p-web" value={form.website} onChange={set('website')} prefix={<Globe className="size-4" />} placeholder="yourshop.com" invalid={!!errors.website} />
            </Field>
            <Field label="Bio" htmlFor="p-bio" hint={`${form.bio.length}/280`} className="sm:col-span-2">
              <Textarea id="p-bio" rows={3} maxLength={280} value={form.bio} onChange={set('bio')} placeholder="A line about you and what you sell." />
            </Field>
          </div>
        </Section>
      </form>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-1 text-[13px] text-ink-500">
        <span>Member since {formatDate(user.createdAt, { month: 'long', year: 'numeric' })}</span>
        {user.lastLoginAt && <span>Last login {formatDate(user.lastLoginAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
      </div>
    </>
  );
}

/* ---------------- Preferences ---------------- */

function PreferencesTab() {
  const { user, setUser } = useAuth();
  const pick = (p = {}) => ({
    currency: p.currency || 'USD',
    taxRate: p.taxRate ?? 0,
    lowStockThreshold: p.lowStockThreshold ?? 10,
    skuPrefix: p.skuPrefix || 'NV',
    notifyOrders: p.notifyOrders ?? true,
    notifyStock: p.notifyStock ?? true,
    notifyProducts: p.notifyProducts ?? true,
    notifyAccount: p.notifyAccount ?? true,
  });
  const [form, setForm] = useState(() => pick(user.preferences));
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(pick(user.preferences));
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const example = skuParts({ prefix: form.skuPrefix || 'NV', category: 'Home Living', name: 'Stoneware Mug 350ml', seq: 1 });
  const exampleSku = example.map((part) => part.value).join('-');

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const d = await api('/profile/preferences', { method: 'PATCH', body: form });
      setUser(d.user);
      setForm(pick(d.user.preferences));
      toast.success('Preferences saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <Section title="Money" description="Currency is used for every price, chart and export. Tax is the default for new orders.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Currency" htmlFor="pr-cur" hint={formatMoney(1249.5, form.currency)}>
            <Select id="pr-cur" value={form.currency} onChange={(e) => set('currency', e.target.value)}>
              {CURRENCIES.map(([c, l]) => (
                <option key={c} value={c}>
                  {c}, {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Default tax rate" htmlFor="pr-tax">
            <Input id="pr-tax" type="number" min="0" max="100" step="0.1" value={form.taxRate} onChange={(e) => set('taxRate', e.target.value)} suffix={<span className="pr-2 text-sm text-ink-500">%</span>} />
          </Field>
        </div>
      </Section>

      <Section title="Inventory" description="Defaults for new products. You can override them per product.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SKU prefix" htmlFor="pr-sku" hint="Up to 4 letters or numbers">
            <Input id="pr-sku" value={form.skuPrefix} maxLength={4} onChange={(e) => set('skuPrefix', e.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase())} className="font-mono uppercase" />
          </Field>
          <Field label="Low stock alert at" htmlFor="pr-low" hint="Units remaining">
            <Input id="pr-low" type="number" min="0" value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 rounded-xl bg-canvas p-4">
          <p className="text-xs text-ink-500">Example SKU for "Stoneware Mug 350ml" in Home Living</p>
          <p className="mt-1 font-mono text-[15px] font-semibold tracking-wide text-ink-900">{exampleSku}</p>
          <p className="mt-1 text-xs text-ink-500">Order numbers will look like {form.skuPrefix || 'NV'}-1001.</p>
        </div>
      </Section>

      <Section title="Notifications" description="Choose which events create a notification in your feed.">
        <div className="space-y-5">
          <Switch checked={form.notifyOrders} onChange={(v) => set('notifyOrders', v)} label="Orders" description="New orders, status changes and deletions." />
          <Switch checked={form.notifyStock} onChange={(v) => set('notifyStock', v)} label="Stock alerts" description="When a product reaches its low stock level or runs out." />
          <Switch checked={form.notifyProducts} onChange={(v) => set('notifyProducts', v)} label="Products" description="Products added, edited or removed." />
          <Switch checked={form.notifyAccount} onChange={(v) => set('notifyAccount', v)} label="Account" description="Profile, photo and password changes." />
        </div>
      </Section>

      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="sticky bottom-4 z-20 mx-auto flex max-w-md items-center justify-between gap-3 rounded-full bg-ink-900 py-2 pl-5 pr-2 text-sm text-paper shadow-lift"
          >
            <span>You have unsaved changes</span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="text-ink-300 hover:bg-white/10 hover:text-paper" onClick={() => setForm(pick(user.preferences))}>
                Reset
              </Button>
              <Button size="sm" variant="light" type="submit" loading={saving}>
                Save
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

/* ---------------- Security ---------------- */

function SecurityTab() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delPassword, setDelPassword] = useState('');
  const [delConfirm, setDelConfirm] = useState('');
  const [delError, setDelError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!delOpen) {
      setDelPassword('');
      setDelConfirm('');
      setDelError('');
    }
  }, [delOpen]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const save = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.currentPassword) er.currentPassword = 'Enter your current password';
    if (form.newPassword.length < 8 || !/[A-Za-z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) er.newPassword = 'Use 8+ characters with letters and numbers';
    if (form.confirm !== form.newPassword) er.confirm = 'Passwords do not match';
    if (Object.keys(er).length) return setErrors(er);
    setSaving(true);
    try {
      const d = await api('/profile/password', { method: 'PUT', body: { currentPassword: form.currentPassword, newPassword: form.newPassword } });
      // Other sessions are signed out by the server; keep this one signed in with the fresh token
      if (d.token) tokenStore.replace(d.token);
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password updated');
    } catch (err) {
      setErrors(err.details || {});
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setDelError('');
    try {
      await api('/profile', { method: 'DELETE', body: { password: delPassword } });
      toast.success('Your account was deleted');
      logout();
      navigate('/', { replace: true });
    } catch (err) {
      setDelError(err.details?.password || err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <form onSubmit={save}>
        <Section
          title="Change password"
          description="Use at least 8 characters with a mix of letters and numbers."
          footer={
            <Button type="submit" loading={saving}>
              Update password
            </Button>
          }
        >
          <div className="grid max-w-md gap-4">
            <Field label="Current password" htmlFor="s-cur" error={errors.currentPassword}>
              <PasswordInput id="s-cur" value={form.currentPassword} onChange={set('currentPassword')} invalid={!!errors.currentPassword} autoComplete="current-password" />
            </Field>
            <Field label="New password" htmlFor="s-new" error={errors.newPassword}>
              <PasswordInput id="s-new" value={form.newPassword} onChange={set('newPassword')} invalid={!!errors.newPassword} autoComplete="new-password" />
            </Field>
            {form.newPassword && <StrengthMeter value={form.newPassword} />}
            <Field label="Confirm new password" htmlFor="s-conf" error={errors.confirm}>
              <PasswordInput id="s-conf" value={form.confirm} onChange={set('confirm')} invalid={!!errors.confirm} autoComplete="new-password" />
            </Field>
          </div>
        </Section>
      </form>

      <section className="rounded-2xl border border-rose-ink/25 bg-paper p-5 shadow-soft md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-soft text-rose-ink">
              <Warning className="size-5" weight="bold" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold">Delete account</h3>
              <p className="mt-0.5 max-w-[52ch] text-[13px] text-ink-500">Permanently removes your workspace, products, orders and notifications. This cannot be undone.</p>
            </div>
          </div>
          <Button variant="danger" onClick={() => setDelOpen(true)}>
            <Trash className="size-4" /> Delete account
          </Button>
        </div>
      </section>

      <Modal
        open={delOpen}
        onClose={() => setDelOpen(false)}
        size="sm"
        icon={Trash}
        title="Delete your account?"
        description="All products, orders and notifications are removed for good."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDelOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} disabled={!delPassword || delConfirm !== 'DELETE'} onClick={deleteAccount}>
              Delete forever
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Your password" htmlFor="d-pw" error={delError}>
            <PasswordInput id="d-pw" value={delPassword} onChange={(e) => setDelPassword(e.target.value)} invalid={!!delError} autoComplete="current-password" />
          </Field>
          <Field label='Type "DELETE" to confirm' htmlFor="d-conf">
            <Input id="d-conf" value={delConfirm} onChange={(e) => setDelConfirm(e.target.value)} className="font-mono" autoComplete="off" />
          </Field>
        </div>
      </Modal>
    </>
  );
}
