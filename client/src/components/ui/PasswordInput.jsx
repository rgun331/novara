import { forwardRef, useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { Input } from './Field';

export const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <Input
      ref={ref}
      type={show ? 'text' : 'password'}
      suffix={
        <button type="button" onClick={() => setShow((s) => !s)} className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900" aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
      {...props}
    />
  );
});

export function passwordScore(pw = '') {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++;
  return s;
}

const LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
const COLORS = ['bg-ink-200', 'bg-rose-ink', 'bg-[#c58a2c]', 'bg-pine-400', 'bg-pine-600'];

export function StrengthMeter({ value }) {
  const score = value ? passwordScore(value) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="grid flex-1 grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1 rounded-full transition-colors duration-300 ${score >= i ? COLORS[score] : 'bg-ink-100'}`} />
        ))}
      </div>
      <span className="w-16 text-right text-xs text-ink-500">{value ? LABELS[score] : ''}</span>
    </div>
  );
}
