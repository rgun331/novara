/* Hand-drawn style empty-state illustrations in the Novara palette. */
const INK = '#17201C';
const PINE = '#2F5D4B';
const PINE_SOFT = '#DCE8E1';
const KRAFT = '#E2C08D';
const KRAFT_SOFT = '#F4EBDD';
const PAPER = '#FBFBF9';

export function BoxesIllustration({ className }) {
  return (
    <svg viewBox="0 0 220 160" className={className} fill="none" aria-hidden="true">
      <ellipse cx="110" cy="142" rx="84" ry="9" fill={PINE_SOFT} />
      {/* back box */}
      <path d="M118 46l42-16 40 16-42 16-40-16z" fill={KRAFT_SOFT} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M118 46v50l40 16V62l-40-16z" fill={KRAFT} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M158 62l42-16v50l-42 16V62z" fill="#D4AE77" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M139 38l40 16" stroke={INK} strokeWidth="1.6" />
      {/* front box */}
      <path d="M34 78l46-18 46 18-46 18-46-18z" fill={PAPER} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M34 78v48l46 18V96L34 78z" fill={PINE_SOFT} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M80 96l46-18v48l-46 18V96z" fill="#B9D1C4" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M57 69l46 18v14" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="46" y="104" width="22" height="12" rx="2" transform="skewY(21)" fill={PAPER} stroke={INK} strokeWidth="1.2" />
      {/* spark */}
      <path d="M182 14c.8 5 2.8 7 7.8 7.8-5 .8-7 2.8-7.8 7.8-.8-5-2.8-7-7.8-7.8 5-.8 7-2.8 7.8-7.8z" fill={PINE} />
      <circle cx="30" cy="40" r="3" fill={KRAFT} />
      <circle cx="204" cy="118" r="2.4" fill={PINE} />
    </svg>
  );
}

export function ReceiptIllustration({ className }) {
  return (
    <svg viewBox="0 0 220 160" className={className} fill="none" aria-hidden="true">
      <ellipse cx="110" cy="144" rx="80" ry="8" fill={PINE_SOFT} />
      <path d="M68 18h84v118l-10-7-11 7-10-7-11 7-10-7-11 7-10-7-11 7V18z" fill={PAPER} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="80" y="32" width="36" height="6" rx="3" fill={INK} />
      <rect x="80" y="48" width="60" height="4" rx="2" fill="#D6DBD6" />
      <rect x="80" y="58" width="48" height="4" rx="2" fill="#D6DBD6" />
      <rect x="80" y="68" width="54" height="4" rx="2" fill="#D6DBD6" />
      <path d="M80 86h60" stroke={INK} strokeWidth="1.2" strokeDasharray="3 3" />
      <rect x="80" y="96" width="24" height="5" rx="2.5" fill={INK} />
      <rect x="118" y="96" width="22" height="5" rx="2.5" fill={PINE} />
      <circle cx="160" cy="104" r="20" fill={PINE} stroke={INK} strokeWidth="1.6" />
      <path d="M151 104l6 6 12-13" stroke={PAPER} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="34" y="70" width="30" height="24" rx="4" fill={KRAFT} stroke={INK} strokeWidth="1.6" transform="rotate(-10 49 82)" />
      <path d="M40 76l18 10" stroke={INK} strokeWidth="1.2" transform="rotate(-10 49 82)" />
      <path d="M186 30c.7 4.4 2.4 6.1 6.8 6.8-4.4.7-6.1 2.4-6.8 6.8-.7-4.4-2.4-6.1-6.8-6.8 4.4-.7 6.1-2.4 6.8-6.8z" fill={KRAFT} />
    </svg>
  );
}

export function BellIllustration({ className }) {
  return (
    <svg viewBox="0 0 220 160" className={className} fill="none" aria-hidden="true">
      <ellipse cx="110" cy="144" rx="70" ry="8" fill={PINE_SOFT} />
      <path d="M110 26c-22 0-36 16-36 38v26l-10 16h92l-10-16V64c0-22-14-38-36-38z" fill={PINE_SOFT} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M96 112c2 8 7 12 14 12s12-4 14-12" fill={KRAFT} stroke={INK} strokeWidth="1.6" />
      <circle cx="110" cy="22" r="5" fill={PAPER} stroke={INK} strokeWidth="1.6" />
      <path d="M90 52c3-8 9-12 16-13" stroke={PAPER} strokeWidth="4" strokeLinecap="round" />
      <path d="M156 50c6 6 8 14 6 22M166 40c10 10 13 24 9 36" stroke={PINE} strokeWidth="2" strokeLinecap="round" />
      <path d="M64 50c-6 6-8 14-6 22M54 40c-10 10-13 24-9 36" stroke={PINE} strokeWidth="2" strokeLinecap="round" />
      <circle cx="140" cy="36" r="10" fill={INK} />
      <path d="M137 36h6" stroke={PAPER} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ChartIllustration({ className }) {
  return (
    <svg viewBox="0 0 220 160" className={className} fill="none" aria-hidden="true">
      <ellipse cx="110" cy="146" rx="84" ry="7" fill={PINE_SOFT} />
      <rect x="30" y="24" width="160" height="110" rx="12" fill={PAPER} stroke={INK} strokeWidth="1.6" />
      <rect x="48" y="92" width="16" height="28" rx="3" fill={PINE_SOFT} stroke={INK} strokeWidth="1.2" />
      <rect x="74" y="74" width="16" height="46" rx="3" fill="#B9D1C4" stroke={INK} strokeWidth="1.2" />
      <rect x="100" y="84" width="16" height="36" rx="3" fill={KRAFT} stroke={INK} strokeWidth="1.2" />
      <rect x="126" y="58" width="16" height="62" rx="3" fill={PINE} stroke={INK} strokeWidth="1.2" />
      <rect x="152" y="66" width="16" height="54" rx="3" fill="#B9D1C4" stroke={INK} strokeWidth="1.2" />
      <path d="M50 70l28-14 24 8 28-24 28 6" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="130" cy="40" r="4" fill={KRAFT} stroke={INK} strokeWidth="1.4" />
      <rect x="44" y="34" width="40" height="5" rx="2.5" fill={INK} />
    </svg>
  );
}

export function PeopleIllustration({ className }) {
  return (
    <svg viewBox="0 0 220 160" className={className} fill="none" aria-hidden="true">
      <ellipse cx="110" cy="146" rx="84" ry="7" fill={PINE_SOFT} />
      <circle cx="80" cy="56" r="20" fill={KRAFT} stroke={INK} strokeWidth="1.6" />
      <path d="M40 140c0-26 18-44 40-44s40 18 40 44" fill={PINE_SOFT} stroke={INK} strokeWidth="1.6" />
      <circle cx="146" cy="64" r="17" fill="#B9D1C4" stroke={INK} strokeWidth="1.6" />
      <path d="M112 140c2-22 16-38 34-38s32 16 34 38" fill={PINE} stroke={INK} strokeWidth="1.6" />
      <path d="M72 52c3 3 6 4 10 3M140 62c3 2 6 3 9 2" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M176 22c.7 4.4 2.4 6.1 6.8 6.8-4.4.7-6.1 2.4-6.8 6.8-.7-4.4-2.4-6.1-6.8-6.8 4.4-.7 6.1-2.4 6.8-6.8z" fill={PINE} />
    </svg>
  );
}
