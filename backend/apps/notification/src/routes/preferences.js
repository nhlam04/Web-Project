const express = require('express');
const { z } = require('zod');
const preferenceService = require('../services/preferenceService');

const router = express.Router();

const channelsSchema = z.object({
  inApp: z.boolean().optional(),
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  push: z.boolean().optional(),
});

router.get('/:userId', async (req, res, next) => {
  try {
    const preferences = await preferenceService.getPreferences(req.params.userId);
    return res.json({ data: preferences });
  } catch (err) {
    return next(err);
  }
});

router.put('/:userId', async (req, res, next) => {
  try {
    const channels = channelsSchema.parse(req.body || {});
    const preferences = await preferenceService.updatePreferences(req.params.userId, channels);
    return res.json({ data: preferences });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
