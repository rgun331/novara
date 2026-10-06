import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Storefront } from '@phosphor-icons/react';
import { AuthLayout, FormError, ServerStatusBanner } from '../components/AuthLayout';
import { useServerStatus } from '../hooks/useServerStatus';
import { Field, Input } from '../components/ui/Field';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const server = useServerStatus();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const signIn = async (creds) => {
    setLoading(true);
    try {
      const user = await login(creds);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setErrors(err.details || {});
    } finally {
      setLoading(false);
    }
  };

  const openDemo = () => {
    const creds = { email: server.demo.email, password: server.demo.password, remember: true };
    setForm(creds);
    setErrors({});
    setError('');
    signIn(creds);
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Enter your password';
    setErrors(errs);
    setError('');
    if (Object.keys(errs).length) return;
    signIn(form);
  };

  return (
    <AuthLayout
      image="/images/auth-packing.webp"
      imageAlt="A shop owner packing customer orders at a wooden table"
      quote="Orders go out faster when the stock count is right the first time."
      author="Daniel Cho"
      role="Owner, Oakline Supply"
    >
      <h1 className="font-display text-[2.1rem] font-semibold leading-tight tracking-[-0.035em]">Log in to Novara</h1>
      <p className="mt-2 text-[15px] text-ink-500">Pick up where you left off with your products and orders.</p>

      <div className="mt-8">
        <ServerStatusBanner status={server.status} />
      </div>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <FormError message={error} />
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@yourbrand.com" value={form.email} onChange={set('email')} invalid={!!errors.email} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" autoComplete="current-password" placeholder="Your password" value={form.password} onChange={set('password')} invalid={!!errors.password} />
        </Field>
        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-700">
          <input type="checkbox" checked={form.remember} onChange={set('remember')} className="size-4 rounded border-line-strong accent-pine-600" />
          Keep me logged in on this device
        </label>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Log in {!loading && <ArrowRight weight="bold" className="size-4" />}
        </Button>
      </form>

      {server.demo && (
        <div className="mt-6 rounded-2xl border border-line bg-paper p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-pine-50 text-pine-700">
              <Storefront className="size-[18px]" weight="duotone" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ink-900">Just looking around?</p>
              <p className="truncate text-[12px] text-ink-500">
                {server.demo.email} / {server.demo.password}
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={openDemo} disabled={loading}>
              Open demo
            </Button>
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-ink-500">
        New to Novara?{' '}
        <Link to="/signup" className="font-semibold text-pine-700 underline decoration-pine-300 underline-offset-4 hover:decoration-pine-600">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
