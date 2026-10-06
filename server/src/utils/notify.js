import Notification from '../models/Notification.js';

const PREF_KEY = { order: 'notifyOrders', stock: 'notifyStock', product: 'notifyProducts', account: 'notifyAccount' };

/** Creates a notification for a user, respecting their notification preferences. */
export async function notify(user, { type = 'system', title, message = '', link = '' }) {
  try {
    const key = PREF_KEY[type];
    if (key && user?.preferences && user.preferences[key] === false) return null;
    return await Notification.create({ owner: user._id, type, title, message, link });
  } catch (err) {
    console.error('[novara] notification failed', err.message);
    return null;
  }
}

export async function notifyStockLevel(user, product) {
  if (product.stock <= 0) {
    return notify(user, {
      type: 'stock',
      title: `${product.name} is out of stock`,
      message: `SKU ${product.sku} has 0 units left. Restock to keep taking orders.`,
      link: '/dashboard/products',
    });
  }
  if (product.stock <= product.lowStockThreshold) {
    return notify(user, {
      type: 'stock',
      title: `Low stock: ${product.name}`,
      message: `Only ${product.stock} ${product.stock === 1 ? "unit" : "units"} left, alert level is ${product.lowStockThreshold}.`,
      link: '/dashboard/products',
    });
  }
  return null;
}
