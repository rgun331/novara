// Client mirror of server/src/utils/sku.js for instant previews.
const STOP = new Set(['the', 'and', 'of', 'for', 'with', 'a', 'an', 'in', 'on']);
const clean = (s = '') => String(s).normalize('NFKD').replace(/[^\w\s-]/g, ' ').replace(/_/g, ' ').trim();

function code3(words, fallback) {
  if (!words.length) return fallback;
  let code;
  if (words.length === 1) code = words[0].slice(0, 3);
  else if (words.length === 2) code = words[0].slice(0, 2) + words[1][0];
  else code = words.slice(0, 3).map((w) => w[0]).join('');
  return code.toUpperCase().padEnd(3, 'X');
}

export const categoryCode = (c = '') => code3(clean(c).split(/\s+/).filter((w) => w && !STOP.has(w.toLowerCase())), 'GEN');
export const nameCode = (n = '') =>
  code3(clean(n).split(/\s+/).filter((w) => w && !STOP.has(w.toLowerCase()) && !/^\d+\w*$/.test(w)), 'ITM');
export const variantCode = (n = '') => {
  const m = clean(n).match(/(\d{2,4})\s*(ml|l|g|kg|cm|mm|in|oz)?\b/i);
  return m ? m[1] : '';
};

export function skuParts({ prefix = 'NV', category = '', name = '', seq = 1 }) {
  const parts = [
    { key: 'prefix', label: 'Brand', value: (prefix || 'NV').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4) || 'NV' },
    { key: 'category', label: 'Category', value: categoryCode(category) },
    { key: 'name', label: 'Product', value: nameCode(name) },
  ];
  const v = variantCode(name);
  if (v) parts.push({ key: 'variant', label: 'Variant', value: v });
  parts.push({ key: 'seq', label: 'Sequence', value: String(seq).padStart(4, '0') });
  return parts;
}
