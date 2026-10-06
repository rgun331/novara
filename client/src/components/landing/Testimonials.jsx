import { Quotes } from '@phosphor-icons/react';
import { Reveal } from './Reveal';

const SMALL = [
  {
    quote: 'Our stock count finally matches the shelf. Low stock alerts alone saved our busiest weekend.',
    name: 'Leila Haddad',
    role: 'Operations Lead, Little Fern',
    img: '/images/portrait-2.webp',
  },
  {
    quote: 'I add a product, the SKU is there, the label prints. My team stopped asking me what code to use.',
    name: 'Daniel Cho',
    role: 'Owner, Oakline Supply',
    img: '/images/portrait-3.webp',
  },
];

export function Testimonials() {
  return (
    <section id="stories" className="mx-auto max-w-[1320px] scroll-mt-24 px-5 py-24 md:px-8 md:py-32">
      <Reveal className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <figure data-reveal className="grid overflow-hidden rounded-[28px] border border-line bg-paper shadow-soft md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[300px]">
            <img src="/images/portrait-1.webp" alt="Hamza Qureshi" loading="lazy" className="absolute inset-0 size-full object-cover" />
          </div>
          <div className="flex flex-col justify-between p-7 md:p-10">
            <Quotes className="size-9 text-pine-300" weight="fill" />
            <blockquote className="mt-6 font-display text-2xl font-medium leading-snug tracking-[-0.02em] text-ink-900 md:text-[1.7rem]">
              &ldquo;We moved three spreadsheets and a notebook into Novara in an afternoon. Now orders, stock and revenue tell the same story.&rdquo;
            </blockquote>
            <figcaption className="mt-8">
              <p className="font-semibold">Hamza Qureshi</p>
              <p className="text-sm text-ink-500">Founder, Tamarind House</p>
            </figcaption>
          </div>
        </figure>

        <div className="grid gap-4">
          {SMALL.map((t) => (
            <figure data-reveal key={t.name} className="flex flex-col justify-between rounded-[28px] border border-line bg-paper p-7 shadow-soft">
              <blockquote className="text-[17px] leading-relaxed text-ink-800">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <img src={t.img} alt={t.name} loading="lazy" className="size-11 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-[13px] text-ink-500">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
