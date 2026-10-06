// End-to-end API smoke test. Run while the API is up:
//   node scripts/smoke.mjs                 (defaults to http://127.0.0.1:5000)
//   API_URL=http://127.0.0.1:5173 node scripts/smoke.mjs   (through the Vite proxy)
const BASE = (process.env.API_URL || 'http://127.0.0.1:5000') + '/api';
let token = '';
let failed = 0;

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function check(label, ok, extra = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? `  ${extra}` : ''}`);
  if (!ok) failed += 1;
}

const email = `smoke${Date.now()}@novara.app`;
const password = 'smoke1234';

let r = await call('GET', '/health');
check('health', r.status === 200 && r.data.db === 'connected', JSON.stringify(r.data));

r = await call('POST', '/auth/signup', { name: 'Smoke Test', businessName: 'Smoke Shop', email, password });
check('signup', r.status === 201 && !!r.data.token, `${r.status} ${r.data.message || ''}`);
token = r.data.token;

r = await call('POST', '/auth/login', { email, password });
check('login', r.status === 200 && !!r.data.token, `${r.status} ${r.data.message || ''}`);
token = r.data.token || token;

r = await call('POST', '/auth/login', { email, password: 'wrong-pass1' });
check('login rejects wrong password', r.status === 401);

r = await call('POST', '/products', { name: 'Stoneware Mug 350ml', category: 'Home & Living', price: 24, cost: 8, stock: 12 });
check('create product + auto SKU', r.status === 201 && /^SS-HOL-STM-350-\d{4}$/.test(r.data.product?.sku || ''), r.data.product?.sku || r.data.message);
const productId = r.data.product?._id;

r = await call('POST', '/orders', { customer: { name: 'Bilal Ahmed', email: 'bilal@example.com' }, items: [{ product: productId, quantity: 3 }], shipping: 5 });
check('create order', r.status === 201 && r.data.order?.total === 77, `${r.status} total=${r.data.order?.total} ${r.data.message || ''}`);

r = await call('GET', `/products/${productId}`);
check('stock reserved', r.data.product?.stock === 9, `stock=${r.data.product?.stock}`);

r = await call('GET', '/analytics?range=30');
check('analytics counts the order', r.data.kpis?.orders === 1 && r.data.kpis?.revenue === 77, JSON.stringify(r.data.kpis || r.data));

r = await call('GET', '/notifications');
check('notifications', r.status === 200 && r.data.notifications?.length > 0, `unread=${r.data.unread}`);

console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
