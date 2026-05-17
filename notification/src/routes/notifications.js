const express = require('express');
const { z } = require('zod');
const store = require('../store/notificationStore');

const router = express.Router();

const listQuerySchema = z.object({
  userId: z.string().min(1),
  unreadOnly: z.string().optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const unreadOnly = query.unreadOnly === 'true';
    const notifications = await store.listNotificationsByUser(query.userId, { unreadOnly });
    return res.json({ data: notifications });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:notificationId/read', async (req, res, next) => {
  try {
    const notification = await store.markNotificationRead(req.params.notificationId);
    if (!notification) {
      const err = new Error('Notification not found');
      err.status = 404;
      err.code = 'NOTIFICATION_NOT_FOUND';
      throw err;
    }
    return res.json({ data: notification });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
