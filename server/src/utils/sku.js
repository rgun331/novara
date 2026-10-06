import Product from '../models/Product.js';

const STOP_WORDS = new Set(['the', 'and', 'of', 'for', 'with', 'a', 'an', 'in', 'on']);

const clean = (s = '') =>
  String(s)
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/_/g, ' ')
    .trim();

/** "Home & Living" -> "HOM", "Food & Beverage" -> "FNB" style codes */
export function categoryCode(category = '') {
  const words = clean(category).split(/\s+/).filter((w) => w && !STOP_WORDS.has(w.toLowerCase()));
  return code3(words, 'GEN');
}

/** 1 word -> first 3 letters, 2 words -> 2 + 1 letters, 3+ words -> initials */
function code3(words, fallback) {
  if (!words.length) return fallback;
  let code;
  if (words.length === 1) code = words[0].slice(0, 3);
  else if (words.length === 2) code = words[0].slice(0, 2) + words[1][0];
  else code = words.slice(0, 3).map((w) => w[0]).join('');
  return code.toUpperCase().padEnd(3, 'X');
}

/** "Stoneware Coffee Mug 350ml" -> "SCM", "Lamp" -> "LAM" */
export function nameCode(name = '') {
  const words = clean(name).split(/\s+/).filter((w) => w && !STOP_WORDS.has(w.toLowerCase()) && !/^\d+\w*$/.test(w));
  return code3(words, 'ITM');
}

/** Variant hint pulled from trailing size/colour tokens, e.g. "350ml" -> "350" */
function variantCode(name = '') {
  const m = clean(name).match(/(\d{2,4})\s*(ml|l|g|kg|cm|mm|in|oz)?\b/i);
  return m ? m[1] : '';
}

export function composeSku({ prefix = 'NV', category, name, seq }) {
  const parts = [prefix.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4) || 'NV', categoryCode(category), nameCode(name)];
  const variant = variantCode(name);
  if (variant) parts.push(variant);
  parts.push(String(seq).padStart(4, '0'));
  return parts.join('-');
}

/** Generates a SKU that is unique for this owner. */
export async function generateUniqueSku(ownerId, { prefix, category, name }) {
  let seq = (await Product.countDocuments({ owner: ownerId })) + 1;
  for (let i = 0; i < 50; i++) {
    const sku = composeSku({ prefix, category, name, seq });
    // eslint-disable-next-line no-await-in-loop
    const exists = await Product.exists({ owner: ownerId, sku });
    if (!exists) return sku;
    seq += 1;
  }
  return composeSku({ prefix, category, name, seq: Date.now() % 100000 });
}
