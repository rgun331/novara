// Seeds a ready-to-explore demo workspace so the preview always has a working login.
//   Email: demo@novara.app   Password: demo1234
// Runs on startup when config.seedDemo is true. It is idempotent: if the demo
// user already exists it only makes sure the password still works.
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Notification from './models/Notification.js';
import Counter from './models/Counter.js';
import { composeSku } from './utils/sku.js';

export const DEMO = { email: 'demo@novara.app', password: 'demo1234' };

const PRODUCTS = [
  { name: 'Stoneware Mug 350ml', category: 'Home & Living', price: 24, cost: 8, stock: 48, supplier: 'Kiln Works', tags: ['ceramic', 'handmade'] },
  { name: 'Speckled Dinner Plate', category: 'Home & Living', price: 32, cost: 11, stock: 22, supplier: 'Kiln Works', tags: ['ceramic'] },
  { name: 'Linen Table Runner', category: 'Accessories', price: 38, cost: 14, stock: 6, supplier: 'Loom & Co', tags: ['linen'] },
  { name: 'Olive Linen Apron', category: 'Apparel', price: 45, cost: 16, stock: 18, supplier: 'Loom & Co', tags: ['linen', 'kitchen'] },
  { name: 'Cardamom Black Tea 200g', category: 'Food & Beverage', price: 14, cost: 5, stock: 64, supplier: 'Hill Estate', tags: ['tea'] },
  { name: 'Beeswax Candle Set', category: 'Home & Living', price: 28, cost: 9, stock: 0, supplier: 'Hive Studio', tags: ['candle'] },
  { name: 'Recycled Paper Notebook', category: 'Stationery', price: 12, cost: 3.5, stock: 35, supplier: 'Paper Mill', tags: ['paper'] },
  { name: 'Hand Poured Soap Bar', category: 'Beauty', price: 9, cost: 2.5, stock: 9, supplier: 'Hive Studio', tags: ['soap'] },
];

const CUSTOMERS = [
  { name: 'Bilal Ahmed', email: 'bilal.ahmed@example.com', phone: '+92 300 1234567', address: 'Gulberg III, Lahore' },
  { name: 'Hina Raza', email: 'hina.raza@example.com', phone: '+92 321 7654321', address: 'DHA Phase 5, Karachi' },
  { name: 'Omar Siddiqui', email: 'omar.s@example.com', phone: '', address: 'F-7, Islamabad' },
  { name: 'Leila Haddad', email: 'leila@littlefern.co', phone: '', address: 'Dubai Marina, Dubai' },
  { name: 'Daniel Cho', email: 'daniel@oakline.co', phone: '', address: 'Shoreditch, London' },
  { name: 'Sana Iqbal', email: 'sana.iqbal@example.com', phone: '+92 333 5550101', address: 'Model Town, Lahore' },
  { name: 'Ayaan Khan', email: 'ayaan.k@example.com', phone: '', address: 'Saddar, Rawalpindi' },
];

const STATUSES = ['delivered', 'delivered', 'delivered', 'shipped', 'processing', 'pending', 'cancelled'];
const METHODS = ['card', 'card', 'cash_on_delivery', 'bank_transfer', 'wallet'];
const CHANNELS = ['online_store', 'online_store', 'social', 'retail', 'marketplace'];

// Small deterministic PRNG so the demo looks the same on every machine
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const round2 = (n) => Math.round(n * 100) / 100;

export async function seedDemo() {
  const existing = await User.findOne({ email: DEMO.email }).select('+password');
  if (existing) {
    if (!(await existing.comparePassword(DEMO.password))) {
      existing.password = DEMO.password;
      await existing.save();
    }
    return { created: false };
  }

  const user = await User.create({
    name: 'Ayesha Malik',
    email: DEMO.email,
    password: DEMO.password,
    businessName: 'Kiln & Cloth',
    jobTitle: 'Founder',
    location: 'Lahore, Pakistan',
    bio: 'Handmade ceramics and linen for slow mornings.',
    preferences: { skuPrefix: 'KC', currency: 'USD', lowStockThreshold: 10 },
  });

  const products = [];
  for (let i = 0; i < PRODUCTS.length; i += 1) {
    const p = PRODUCTS[i];
    products.push(
      // eslint-disable-next-line no-await-in-loop
      await Product.create({
        ...p,
        owner: user._id,
        sku: composeSku({ prefix: 'KC', category: p.category, name: p.name, seq: i + 1 }),
        lowStockThreshold: 10,
        description: `${p.name} from ${p.supplier}.`,
      })
    );
  }

  const rand = rng(42);
  const now = Date.now();
  const DAY = 86400000;
  const orderCount = 44;
  for (let i = 0; i < orderCount; i += 1) {
    // Spread across ~60 days with slightly more recent activity, so 30-day deltas look realistic
    const t = 1 - i / orderCount;
    const daysAgo = Math.max(0, Math.round(59 * t ** 1.12 + (rand() - 0.5) * 2));
    const createdAt = new Date(now - daysAgo * DAY - Math.floor(rand() * 10) * 3600000);
    const customer = CUSTOMERS[Math.floor(rand() * CUSTOMERS.length)];
    const lineCount = 1 + Math.floor(rand() * 2);
    const picked = new Set();
    const items = [];
    while (items.length < lineCount) {
      const p = products[Math.floor(rand() * products.length)];
      if (picked.has(String(p._id))) continue;
      picked.add(String(p._id));
      items.push({ product: p._id, name: p.name, sku: p.sku, category: p.category, price: p.price, cost: p.cost, quantity: 1 + Math.floor(rand() * 3) });
    }
    const subtotal = round2(items.reduce((s, it) => s + it.price * it.quantity, 0));
    const shipping = subtotal > 80 ? 0 : 5;
    const status = i >= orderCount - 3 ? ['pending', 'processing', 'pending'][orderCount - 1 - i] : STATUSES[Math.floor(rand() * STATUSES.length)];
    const paymentStatus = status === 'cancelled' ? 'refunded' : status === 'pending' ? 'pending' : 'paid';
    const timeline = [{ status: 'pending', note: 'Order created', at: createdAt }];
    if (status !== 'pending') timeline.push({ status, note: `Marked as ${status[0].toUpperCase()}${status.slice(1)}`, at: new Date(createdAt.getTime() + 6 * 3600000) });

    // eslint-disable-next-line no-await-in-loop
    const order = await Order.create({
      owner: user._id,
      orderNumber: `KC-${1001 + i}`,
      customer,
      items,
      subtotal,
      discount: 0,
      shipping,
      tax: 0,
      total: round2(subtotal + shipping),
      status,
      paymentStatus,
      paymentMethod: METHODS[Math.floor(rand() * METHODS.length)],
      channel: CHANNELS[Math.floor(rand() * CHANNELS.length)],
      timeline,
    });
    // Backdate so analytics has history (timestamps would otherwise be "now")
    // eslint-disable-next-line no-await-in-loop
    await Order.collection.updateOne({ _id: order._id }, { $set: { createdAt, updatedAt: createdAt } });
  }
  await Counter.findOneAndUpdate({ _id: `${user._id}:order` }, { $set: { seq: orderCount } }, { upsert: true });

  const notes = [
    { type: 'system', title: 'Welcome to Novara, Ayesha', message: 'This is a demo workspace with sample products and orders. Feel free to change anything.', link: '/dashboard', read: true },
    { type: 'stock', title: 'Beeswax Candle Set is out of stock', message: 'SKU KC-HOL-BCS-0006 has 0 units left. Restock to keep taking orders.', link: '/dashboard/products?q=KC-HOL-BCS-0006' },
    { type: 'stock', title: 'Low stock: Linen Table Runner', message: 'Only 6 units left, alert level is 10.', link: '/dashboard/products?q=KC-ACC-LTR-0003' },
    { type: 'order', title: `New order KC-${1000 + orderCount}`, message: 'A new order is waiting to be processed.', link: `/dashboard/orders?q=KC-${1000 + orderCount}` },
  ];
  await Notification.insertMany(notes.map((n) => ({ ...n, owner: user._id })));

  return { created: true };
}
