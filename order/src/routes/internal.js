const express = require("express");
const { z } = require("zod");
const orderService = require("../services/orderService");

const router = express.Router();

const fulfillmentEventSchema = z.object({
  eventType: z.enum(["SellerOrderConfirmed", "DeliveryUpdated", "OrderCompleted"]),
  data: z.object({
    orderId: z.string().min(1),
    deliveryStatus: z.enum(["CREATED", "IN_TRANSIT", "DELIVERED", "FAILED"]).optional(),
  }),
});

const markOutboxSchema = z.object({
  outboxId: z.string().min(1),
});

router.post("/events/fulfillment", (req, res, next) => {
  try {
    const payload = fulfillmentEventSchema.parse(req.body);
    const order = orderService.applyFulfillmentEvent(payload);
    return res.json({ data: order });
  } catch (err) {
    return next(err);
  }
});

router.get("/outbox/pending", (req, res, next) => {
  try {
    const events = orderService.listPendingOutbox();
    return res.json({ data: events });
  } catch (err) {
    return next(err);
  }
});

router.post("/outbox/mark-published", (req, res, next) => {
  try {
    const payload = markOutboxSchema.parse(req.body);
    const event = orderService.markOutboxPublished(payload.outboxId);
    return res.json({ data: event });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
