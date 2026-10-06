import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Plus } from '@phosphor-icons/react';
import { Reveal } from './Reveal';

const FAQS = [
  {
    q: 'Where is my data stored?',
    a: 'Every account, product, order and notification is stored in MongoDB. Passwords are hashed with bcrypt and sessions use secure, http-only cookies.',
  },
  {
    q: 'How does the automatic SKU work?',
    a: 'Novara combines your brand prefix, a category code, a product code, an optional size or variant and a sequence number. You can edit or regenerate it before saving.',
  },
  {
    q: 'What happens to stock when an order is cancelled?',
    a: 'Stock is reserved when an order is created and returned to inventory when the order is cancelled or deleted, so your counts stay honest.',
  },
  {
    q: 'Can I choose my currency and alerts?',
    a: 'Yes. Pick from USD, EUR, GBP, PKR, AED or INR, set a default low stock threshold and switch each notification type on or off.',
  },
  {
    q: 'Does it work on my phone?',
    a: 'The whole workspace is responsive. Tables become scrollable, menus collapse into a drawer and forms open as bottom sheets.',
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-24 border-t border-line">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 py-24 md:px-8 md:py-32 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <h2 data-reveal className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.035em] md:text-5xl">
            Questions, answered.
          </h2>
          <p data-reveal className="mt-4 max-w-[38ch] text-lg leading-relaxed text-ink-600">
            Still unsure? Create a workspace and add a test product. It takes about a minute.
          </p>
          <Link data-reveal to="/signup" className="mt-6 inline-flex items-center gap-1 text-[15px] font-semibold text-pine-700 underline decoration-pine-300 underline-offset-4 hover:decoration-pine-600">
            Sign up for free
          </Link>
        </Reveal>
        <Reveal className="divide-y divide-line border-y border-line" stagger={0.06}>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div data-reveal key={f.q}>
                <button className="flex w-full items-center justify-between gap-6 py-6 text-left" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
                  <span className="font-display text-lg font-medium tracking-tight md:text-xl">{f.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }} className={`grid size-9 shrink-0 place-items-center rounded-full border ${isOpen ? 'border-ink-900 bg-ink-900 text-paper' : 'border-line-strong text-ink-700'}`}>
                    <Plus className="size-4" weight="bold" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }} className="overflow-hidden">
                      <p className="max-w-[62ch] pb-6 text-[15px] leading-relaxed text-ink-600">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
