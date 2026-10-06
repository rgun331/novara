import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight } from '@phosphor-icons/react';
import { AuthLayout, FormError } from '../components/AuthLayout';
import { Field, Input } from '../components/ui/Field';
import { PasswordInput, StrengthMeter } from '../components/ui/PasswordInput';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', businessName: '', email: '', password: '', agree: false });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = 'Enter a valid email address';
    if (form.password.length < 8) errs.password = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) errs.password = 'Mix letters and numbers';
    if (!form.agree) errs.agree = 'Please accept the terms to continue';
    setErrors(errs);
    setError('');
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const user = await signup({ name: form.name, businessName: form.businessName, email: form.email, password: form.password });
      toast.success(`Your workspace is ready, ${user.name.split(' ')[0]}`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setErrors(err.details || {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      image="/images/signup-team.webp"
      imageAlt="Two coworkers reviewing stock levels on a laptop in a small warehouse"
      quote="We set up our catalog on a Tuesday and took our first tracked order that evening."
      author="Leila Haddad"
      role="Operations Lead, Little Fern"
    >
      <h1 className="font-display text-[2.1rem] font-semibold leading-tight tracking-[-0.035em]">Create your workspace</h1>
      <p className="mt-2 text-[15px] text-ink-500">Free to start. Your dashboard is ready the moment you sign up.</p>

      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        <FormError message={error} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" error={errors.name} required>
            <Input id="name" autoComplete="name" placeholder="Ayesha Raza" value={form.name} onChange={set('name')} invalid={!!errors.name} />
          </Field>
          <Field label="Business name" htmlFor="businessName" hint="Used for your SKU prefix">
            <Input id="businessName" autoComplete="organization" placeholder="Kiln & Co" value={form.businessName} onChange={set('businessName')} />
          </Field>
        </div>
        <Field label="Work email" htmlFor="email" error={errors.email} required>
          <Input id="email" type="email" autoComplete="email" placeholder="you@yourbrand.com" value={form.email} onChange={set('email')} invalid={!!errors.email} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} required>
          <PasswordInput id="password" autoComplete="new-password" placeholder="8+ characters, letters and numbers" value={form.password} onChange={set('password')} invalid={!!errors.password} />
          <StrengthMeter value={form.password} />
        </Field>
        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-ink-700">
            <input type="checkbox" checked={form.agree} onChange={set('agree')} className="mt-0.5 size-4 rounded border-line-strong accent-pine-600" />
            I agree to the Terms of Service and Privacy Policy.
          </label>
          {errors.agree && <p className="mt-1.5 text-xs font-medium text-rose-ink">{errors.agree}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Sign up {!loading && <ArrowRight weight="bold" className="size-4" />}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-pine-700 underline decoration-pine-300 underline-offset-4 hover:decoration-pine-600">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
