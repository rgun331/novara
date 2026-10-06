import { Router } from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';

const router = Router();
router.use(protect);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { filter = 'all', type = '', limit = 50 } = req.query;
    const q = { owner: req.user._id };
    if (filter === 'unread') q.read = false;
    if (type) q.type = type;
    const notifications = await Notification.find(q).sort({ createdAt: -1 }).limit(Math.min(200, Number(limit) || 50));
    const unread = await Notification.countDocuments({ owner: req.user._id, read: false });
    res.json({ notifications, unread });
  })
);

router.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ owner: req.user._id, read: false }, { $set: { read: true } });
    res.json({ unread: 0 });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const n = await Notification.findOne({ _id: req.params.id, owner: req.user._id });
    if (!n) throw new HttpError(404, 'Notification not found');
    n.read = req.body?.read !== undefined ? Boolean(req.body.read) : true;
    await n.save();
    res.json({ notification: n });
  })
);

router.delete(
  '/clear',
  asyncHandler(async (req, res) => {
    await Notification.deleteMany({ owner: req.user._id, read: true });
    res.json({ message: 'Cleared' });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await Notification.deleteOne({ _id: req.params.id, owner: req.user._id });
    res.json({ message: 'Deleted' });
  })
);

export default router;
