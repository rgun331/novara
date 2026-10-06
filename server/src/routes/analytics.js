import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, round2 } from '../utils/asyncHandler.js';

const router = Router();
router.use(protect);

const DAY = 24 * 60 * 60 * 1000;
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const pct = (cur, prev) => (prev === 0 ? (cur > 0 ? 100 : 0) : round2(((cur - prev) / prev) * 100));

function kpis(orders) {
  const live = orders.filter((o) => o.status !== 'cancelled');
  const revenue = round2(live.reduce((s, o) => s + o.total, 0));
  const units = live.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0);
  const cogs = live.reduce((s, o) => s + o.items.reduce((a, i) => a + (i.cost || 0) * i.quantity, 0), 0);
  const customers = new Set(live.map((o) => (o.customer.email || o.customer.name).toLowerCase())).size;
  return {
    revenue,
    orders: live.length,
    aov: live.length ? round2(revenue / live.length) : 0,
    units,
    grossProfit: round2(live.reduce((s, o) => s + (o.subtotal - o.discount), 0) - cogs),
    customers,
  };
}

// GET /api/analytics?range=30
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const range = Math.min(365, Math.max(7, Number(req.query.range) || 30));
    const now = Date.now();
    const start = new Date(now - range * DAY);
    start.setHours(0, 0, 0, 0);
    const prevStart = new Date(start.getTime() - range * DAY);

    const [orders, products] = await Promise.all([
      Order.find({ owner: req.user._id, createdAt: { $gte: prevStart } }).lean(),
      Product.find({ owner: req.user._id }).lean(),
    ]);

    const current = orders.filter((o) => new Date(o.createdAt) >= start);
    const previous = orders.filter((o) => new Date(o.createdAt) < start);
    const cur = kpis(current);
    const prev = kpis(previous);
    const deltas = Object.fromEntries(Object.keys(cur).map((k) => [k, pct(cur[k], prev[k])]));

    // Daily series
    const series = [];
    const byDay = new Map();
    for (let i = range; i >= 0; i--) {
      const key = dayKey(now - i * DAY);
      const row = { date: key, revenue: 0, orders: 0, units: 0 };
      byDay.set(key, row);
      series.push(row);
    }
    for (const o of current) {
      if (o.status === 'cancelled') continue;
      const row = byDay.get(dayKey(o.createdAt));
      if (!row) continue;
      row.revenue = round2(row.revenue + o.total);
      row.orders += 1;
      row.units += o.items.reduce((a, i) => a + i.quantity, 0);
    }

    // Breakdowns
    const count = (arr, key) => arr.reduce((m, o) => ((m[o[key]] = (m[o[key]] || 0) + 1), m), {});
    const statusBreakdown = count(current, 'status');
    const paymentBreakdown = count(current, 'paymentMethod');
    const live = current.filter((o) => o.status !== 'cancelled');
    const channelRevenue = live.reduce((m, o) => ((m[o.channel] = round2((m[o.channel] || 0) + o.total)), m), {});

    const productMap = new Map(products.map((p) => [String(p._id), p]));
    const productAgg = new Map();
    const categoryAgg = new Map();
    for (const o of live) {
      for (const i of o.items) {
        const id = String(i.product);
        const row = productAgg.get(id) || { id, name: i.name, sku: i.sku, units: 0, revenue: 0 };
        row.units += i.quantity;
        row.revenue = round2(row.revenue + i.price * i.quantity);
        productAgg.set(id, row);
        const cat = i.category || productMap.get(id)?.category || 'Other';
        categoryAgg.set(cat, round2((categoryAgg.get(cat) || 0) + i.price * i.quantity));
      }
    }
    const topProducts = [...productAgg.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
    const categoryRevenue = [...categoryAgg.entries()].map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);

    // Inventory health
    const inventory = products.reduce(
      (acc, p) => {
        acc.products += 1;
        acc.units += p.stock;
        acc.value = round2(acc.value + p.price * p.stock);
        acc.cost = round2(acc.cost + (p.cost || 0) * p.stock);
        if (p.stock <= 0) acc.out += 1;
        else if (p.stock <= p.lowStockThreshold) acc.low += 1;
        else acc.healthy += 1;
        return acc;
      },
      { products: 0, units: 0, value: 0, cost: 0, low: 0, out: 0, healthy: 0 }
    );
    const lowStock = products
      .filter((p) => p.stock <= p.lowStockThreshold)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6)
      .map((p) => ({ id: p._id, name: p.name, sku: p.sku, stock: p.stock, threshold: p.lowStockThreshold, category: p.category }));

    // Weekday performance
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => ({ day: d, revenue: 0, orders: 0 }));
    for (const o of live) {
      const w = weekdays[new Date(o.createdAt).getDay()];
      w.revenue = round2(w.revenue + o.total);
      w.orders += 1;
    }

    res.json({
      range,
      kpis: cur,
      previous: prev,
      deltas,
      series,
      statusBreakdown,
      paymentBreakdown,
      channelRevenue,
      topProducts,
      categoryRevenue,
      inventory,
      lowStock,
      weekdays,
    });
  })
);

// GET /api/analytics/customers  -> customers derived from orders
router.get(
  '/customers',
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ owner: req.user._id }).sort({ createdAt: 1 }).lean();
    const map = new Map();
    for (const o of orders) {
      const key = (o.customer.email || o.customer.name).toLowerCase();
      const row = map.get(key) || {
        key,
        name: o.customer.name,
        email: o.customer.email,
        phone: o.customer.phone,
        address: o.customer.address,
        orders: 0,
        spent: 0,
        firstOrder: o.createdAt,
        lastOrder: o.createdAt,
      };
      row.name = o.customer.name || row.name;
      row.phone = o.customer.phone || row.phone;
      row.address = o.customer.address || row.address;
      if (o.status !== 'cancelled') {
        row.orders += 1;
        row.spent = round2(row.spent + o.total);
      }
      row.lastOrder = o.createdAt;
      map.set(key, row);
    }
    const customers = [...map.values()].sort((a, b) => b.spent - a.spent);
    res.json({ customers });
  })
);

export default router;
