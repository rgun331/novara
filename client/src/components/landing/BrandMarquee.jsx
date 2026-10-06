import { Coffee, Feather, Flower, Leaf, Mountains, Needle, Plant, Tree } from '@phosphor-icons/react';

const BRANDS = [
  { name: 'Kiln & Co', icon: Coffee, cls: 'font-display font-semibold tracking-tight' },
  { name: 'SALTMARSH', icon: Mountains, cls: 'font-sans font-semibold tracking-[0.18em] text-[15px]' },
  { name: 'Mehr Textiles', icon: Needle, cls: 'font-display font-medium italic' },
  { name: 'oakline supply', icon: Tree, cls: 'font-mono font-medium lowercase' },
  { name: 'Little Fern', icon: Leaf, cls: 'font-display font-bold tracking-[-0.04em]' },
  { name: 'Tamarind House', icon: Plant, cls: 'font-sans font-medium tracking-tight' },
  { name: 'NORTHBOUND', icon: Feather, cls: 'font-display font-semibold tracking-[0.12em] text-[15px]' },
  { name: 'Studio Ruma', icon: Flower, cls: 'font-sans font-semibold' },
];

export function BrandMarquee() {
  const row = [...BRANDS, ...BRANDS];
  return (
    <section aria-label="Brands using Novara" className="border-y border-line bg-paper/60">
      <div className="mx-auto flex max-w-[1320px] flex-col items-center gap-4 px-5 py-7 md:flex-row md:gap-10 md:px-8">
        <p className="shrink-0 text-sm text-ink-500">Used by independent brands</p>
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <div className="flex w-max animate-marquee items-center gap-14 hover:[animation-play-state:paused]">
            {row.map((b, i) => (
              <span key={i} className={`flex items-center gap-2 whitespace-nowrap text-lg text-ink-500 ${b.cls}`} aria-hidden={i >= BRANDS.length}>
                <b.icon className="size-5" weight="duotone" />
                {b.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
