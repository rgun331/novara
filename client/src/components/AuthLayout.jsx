import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, CircleNotch, WifiSlash } from '@phosphor-icons/react';
import { Logo } from './brand/Logo';

export function AuthLayout({ children, image, imageAlt, quote, author, role }) {
  return (
    <div className="grid min-h-[100dvh] bg-canvas lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Novara home">
            <Logo />
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-ink-600 transition hover:bg-ink-100 hover:text-ink-900">
            <ArrowLeft className="size-3.5" weight="bold" /> Back to site
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12"
        >
          {children}
        </motion.div>
        <p className="text-center text-xs text-ink-400 lg:text-left">&copy; {new Date().getFullYear()} Novara</p>
      </div>
      <div className="relative hidden p-3 lg:block">
        <motion.div
          initial={{ clipPath: 'inset(6% 6% 6% 6% round 28px)', opacity: 0.6 }}
          animate={{ clipPath: 'inset(0% 0% 0% 0% round 28px)', opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-full overflow-hidden rounded-[28px]"
        >
          <motion.img
            src={image}
            alt={imageAlt}
            className="absolute inset-0 size-full object-cover"
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" />
          <motion.figure
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="absolute inset-x-0 bottom-0 p-10 text-paper xl:p-12"
          >
            <blockquote className="max-w-[30ch] font-display text-[1.65rem] font-medium leading-snug tracking-[-0.02em]">&ldquo;{quote}&rdquo;</blockquote>
            <figcaption className="mt-5 text-sm">
              <span className="font-semibold">{author}</span>
              <span className="text-ink-300">, {role}</span>
            </figcaption>
          </motion.figure>
        </motion.div>
      </div>
    </div>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-rose-ink/20 bg-rose-soft px-3.5 py-2.5 text-[13px] font-medium text-rose-ink" role="alert">
      {message}
    </motion.div>
  );
}

export function ServerStatusBanner({ status }) {
  const show = status === 'offline' || status === 'db';
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
          role="status"
        >
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-ink/20 bg-amber-soft px-3.5 py-3 text-[13px] text-amber-ink">
            <WifiSlash className="mt-0.5 size-4 shrink-0" weight="bold" />
            <div className="flex-1">
              <p className="font-semibold">{status === 'db' ? 'The database is starting up' : 'The server is not responding'}</p>
              <p className="mt-0.5 opacity-90">This usually takes a few seconds. We will reconnect automatically.</p>
            </div>
            <CircleNotch className="mt-0.5 size-4 shrink-0 animate-spin" weight="bold" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
