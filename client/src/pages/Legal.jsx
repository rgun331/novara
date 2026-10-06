import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { Logo } from '../components/brand/Logo';
import { cn } from '../lib/cn';

const UPDATED = '6 October 2026';

const DOCS = {
  privacy: {
    title: 'Privacy policy',
    intro: 'Novara stores only what it needs to run your workspace. This page explains what that is and how you stay in control of it.',
    sections: [
      {
        heading: 'What we store',
        body: [
          'Your account: name, email, business name and the optional profile details and photo you add in Settings.',
          'Your workspace: the products, orders, customer contact details on those orders, and notifications you create.',
          'Your password is never stored as written. It is hashed with bcrypt before it is saved.',
        ],
      },
      {
        heading: 'How it is used',
        body: [
          'Data is used only to show your workspace back to you: tables, analytics, stock alerts and notifications.',
          'There are no advertising trackers, analytics scripts or third-party fonts. Everything the app loads comes from the Novara server.',
        ],
      },
      {
        heading: 'Sessions',
        body: [
          'When you log in, a signed session token is kept in your browser. Choosing "Keep me logged in" keeps it after the browser closes. Otherwise it is cleared when the tab closes.',
          'Changing your password signs out every other device straight away.',
        ],
      },
      {
        heading: 'Your choices',
        body: [
          'You can edit your profile, export products and orders to CSV, and turn each notification type on or off at any time.',
          'Deleting your account in Settings, Security permanently removes your account together with all products, orders and notifications.',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of use',
    intro: 'The short version: use Novara to run your shop, keep your login safe, and keep the data you enter accurate and lawful.',
    sections: [
      {
        heading: 'Your account',
        body: [
          'You are responsible for activity under your account and for keeping your password private.',
        ],
      },
      {
        heading: 'Your content',
        body: [
          'Products, orders and customer details you enter remain yours. You confirm you have the right to store the customer information you add.',
          'Do not upload content that is illegal or that you do not have rights to use.',
        ],
      },
      {
        heading: 'Fair use',
        body: [
          'Do not attempt to access other workspaces, disrupt the service or overload it with automated requests. Login and sign-up are rate limited.',
          'The shared demo workspace is for trying Novara. Its email and password are locked and its data may be reset.',
        ],
      },
      {
        heading: 'Availability',
        body: [
          'Novara is provided as is. We work to keep it available and your data safe, but please keep your own exports of anything business critical.',
        ],
      },
    ],
  },
};

export default function Legal() {
  const { pathname } = useLocation();
  const key = pathname.includes('terms') ? 'terms' : 'privacy';
  const doc = DOCS[key];

  return (
    <div className="min-h-[100dvh] bg-canvas">
      <header className="mx-auto flex max-w-[1080px] items-center justify-between px-5 py-6 sm:px-8">
        <Link to="/" aria-label="Novara home">
          <Logo />
        </Link>
        <Link to="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-ink-600 transition hover:bg-ink-100 hover:text-ink-900">
          <ArrowLeft className="size-3.5" weight="bold" /> Back to site
        </Link>
      </header>

      <main className="mx-auto grid max-w-[1080px] gap-10 px-5 pb-24 pt-8 sm:px-8 md:grid-cols-[200px_1fr] md:pt-14">
        <nav aria-label="Legal" className="flex gap-2 md:flex-col">
          {Object.entries(DOCS).map(([k, d]) => (
            <Link
              key={k}
              to={`/${k}`}
              aria-current={k === key ? 'page' : undefined}
              className={cn(
                'rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition',
                k === key ? 'bg-paper text-ink-900 shadow-[0_1px_2px_rgba(18,24,21,0.06)] ring-1 ring-line' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900'
              )}
            >
              {d.title}
            </Link>
          ))}
        </nav>

        <article className="max-w-[68ch]">
          <p className="text-[13px] font-medium text-ink-500">Last updated {UPDATED}</p>
          <h1 className="mt-2 font-display text-[2.4rem] font-semibold leading-tight tracking-[-0.035em] text-ink-900">{doc.title}</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-600">{doc.intro}</p>
          <div className="mt-10 space-y-9">
            {doc.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="font-display text-[1.25rem] font-semibold tracking-[-0.02em] text-ink-900">{s.heading}</h2>
                <ul className="mt-3 space-y-2.5">
                  {s.body.map((line) => (
                    <li key={line} className="flex gap-3 text-[15px] leading-relaxed text-ink-600">
                      <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-pine-500" />
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p className="mt-12 border-t border-line pt-6 text-[14px] text-ink-500">
            Questions? Write to <a className="font-medium text-pine-700 underline decoration-pine-300 underline-offset-4 hover:decoration-pine-600" href="mailto:hello@novara.app">hello@novara.app</a>.
          </p>
        </article>
      </main>
    </div>
  );
}
