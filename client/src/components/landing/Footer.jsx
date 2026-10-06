import { Link } from 'react-router-dom';
import { GithubLogo, InstagramLogo, LinkedinLogo } from '@phosphor-icons/react';
import { Logo } from '../brand/Logo';

const COLS = [
  { title: 'Product', links: [['Features', '#features'], ['Workflow', '#workflow'], ['Stories', '#stories'], ['FAQ', '#faq']] },
  { title: 'Account', links: [['Log in', '/login'], ['Sign up', '/signup'], ['Dashboard', '/dashboard']] },
  { title: 'Company', links: [['About', '#'], ['Privacy', '#'], ['Terms', '#']] },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-[1320px] px-5 pt-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-ink-500">The calm workspace for products, orders, customers and the numbers behind them.</p>
            <div className="mt-6 flex gap-2">
              {[InstagramLogo, LinkedinLogo, GithubLogo].map((I, i) => (
                <a key={i} href="#" aria-label="Social link" className="grid size-10 place-items-center rounded-full border border-line-strong text-ink-600 transition hover:border-ink-900 hover:text-ink-900">
                  <I className="size-4.5" />
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLS.map((c) => (
              <div key={c.title}>
                <p className="text-sm font-semibold text-ink-900">{c.title}</p>
                <ul className="mt-4 space-y-3">
                  {c.links.map(([label, href]) => (
                    <li key={label}>
                      {href.startsWith('/') ? (
                        <Link to={href} className="text-[15px] text-ink-500 transition hover:text-ink-900">
                          {label}
                        </Link>
                      ) : (
                        <a href={href} className="text-[15px] text-ink-500 transition hover:text-ink-900">
                          {label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-3 border-t border-line py-6 text-sm text-ink-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Novara. All rights reserved.</p>
          <p>Built with the MERN stack.</p>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none select-none overflow-hidden">
        <p className="-mb-[0.22em] text-center font-display text-[24vw] font-semibold leading-none tracking-[-0.06em] text-ink-100">novara</p>
      </div>
    </footer>
  );
}
