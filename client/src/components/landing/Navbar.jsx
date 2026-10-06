import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, List, X } from '@phosphor-icons/react';
import { Logo } from '../brand/Logo';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#workflow', label: 'Workflow' },
  { href: '#stories', label: 'Stories' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5">
      <nav
        className={cn(
          'mx-auto flex h-16 max-w-[1320px] items-center justify-between rounded-full pl-5 pr-2.5 transition-all duration-300',
          scrolled ? 'border border-line bg-paper/85 shadow-soft backdrop-blur-xl' : 'border border-transparent'
        )}
      >
        <Link to="/" aria-label="Novara home">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-full px-3.5 py-2 text-[14px] font-medium text-ink-600 transition-colors hover:bg-ink-100/70 hover:text-ink-900">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-1.5 md:flex">
          {isAuthenticated ? (
            <Button as={Link} to="/dashboard" size="md">
              Open dashboard <ArrowRight weight="bold" className="size-4" />
            </Button>
          ) : (
            <>
              <Button as={Link} to="/login" variant="ghost" size="md">
                Log in
              </Button>
              <Button as={Link} to="/signup" size="md">
                Sign up <ArrowRight weight="bold" className="size-4" />
              </Button>
            </>
          )}
        </div>
        <button className="grid size-11 place-items-center rounded-full text-ink-900 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X className="size-5" weight="bold" /> : <List className="size-5" weight="bold" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mt-2 max-w-[1320px] rounded-3xl border border-line bg-paper p-3 shadow-lift md:hidden"
          >
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-[15px] font-medium text-ink-800 hover:bg-ink-100">
                {l.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3">
              <Button as={Link} to="/login" variant="secondary" size="lg">
                Log in
              </Button>
              <Button as={Link} to="/signup" size="lg">
                Sign up
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
