const express = require('express');
const { z } = require('zod');
const notificationService = require('../services/notificationService');

const router = express.Router();

const eventSchema = z.object({
  eventId: z.string().optional(),
  eventName: z.string().optional(),
  eventType: z.string().optional(),
  payload: z.record(z.any()).optional(),
  data: z.record(z.any()).optional(),
});

router.post('/events', async (req, res, next) => {
  try {
    const payload = eventSchema.parse(req.body || {});
    const notification = await notificationService.handleEvent(payload, 'notification.manual');
    return res.json({ data: notification });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
