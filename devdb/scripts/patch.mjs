// Applies small compatibility fixes to @rckflr/easydb-server so it behaves
// closer to a real MongoDB server when used with Mongoose:
//  1. Nested ObjectIds (refs, sub-document _ids) are stored as hex strings
//     instead of being corrupted into { buffer } objects.
//  2. Regex queries honour `$options` (e.g. case-insensitive search) and
//     implicit RegExp / BSONRegExp equality.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pkgDir = path.join(root, 'node_modules', '@rckflr', 'easydb-server', 'src');
const MARK = '/* novara-patched */';

function patch(file, fn) {
  const p = path.join(pkgDir, file);
  if (!fs.existsSync(p)) return console.warn('[devdb] skip, missing', file);
  let src = fs.readFileSync(p, 'utf8');
  if (src.includes(MARK)) return;
  src = fn(src);
  fs.writeFileSync(p, MARK + '\n' + src);
  console.log('[devdb] patched', file);
}

patch('storage/database-manager.js', (src) => {
  const helper = `
function __deepOid(v) {
  if (v == null || typeof v !== 'object') return v;
  if (v._bsontype === 'ObjectId' || v._bsontype === 'ObjectID') return v.toHexString();
  if (v instanceof Date || v instanceof RegExp || ArrayBuffer.isView(v) || v._bsontype) return v;
  if (Array.isArray(v)) return v.map(__deepOid);
  const out = {};
  for (const k of Object.keys(v)) out[k] = __deepOid(v[k]);
  return out;
}
`;
  src = src.replace(/await coll\.docs\.put\((\w+)\)/g, 'await coll.docs.put(__deepOid($1))');
  return src + helper;
});

patch('query/matcher.js', (src) => {
  src = src.replace(
    'ops.push(compileOperator(field, op, operand));',
    `ops.push(compileOperator(field, op, op === '$regex' && condition.$options
      ? new RegExp(operand instanceof RegExp ? operand.source : (operand && operand.pattern) || operand, String(condition.$options).replace(/[^imsu]/g, ''))
      : operand));`
  );
  src = src.replace(
    "const flags = operand instanceof RegExp ? operand.flags : '';\n      const pattern = operand instanceof RegExp ? operand.source : operand;",
    "const flags = operand instanceof RegExp ? operand.flags : (operand && operand._bsontype === 'BSONRegExp' ? String(operand.options).replace(/[^imsu]/g, '') : '');\n      const pattern = operand instanceof RegExp ? operand.source : (operand && operand._bsontype === 'BSONRegExp' ? operand.pattern : operand);"
  );
  src = src.replace(
    'function compareEqual(a, b) {\n  if (a === b) return true;',
    `function compareEqual(a, b) {
  if (a === b) return true;
  if (b instanceof RegExp) return typeof a === 'string' && b.test(a);
  if (b && b._bsontype === 'BSONRegExp') return typeof a === 'string' && new RegExp(b.pattern, String(b.options).replace(/[^imsu]/g, '')).test(a);`
  );
  return src;
});
