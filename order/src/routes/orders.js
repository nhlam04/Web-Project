const express = require("express");
const { z } = require("zod");
const orderService = require("../services/orderService");

const router = express.Router();

const createOrderSchema = z.object({
  cartId: z.string().min(1),
  userId: z.string().min(1),
  shippingAddress: z.object({
    recipientName: z.string().min(1),
    phone: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    ward: z.string().min(1),
    district: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
  }),
  paymentMethod: z.enum(["COD", "CARD", "WALLET"]),
});

const cancelOrderSchema = z.object({
  reason: z.string().min(1).optional(),
});

router.post("/", (req, res, next) => {
  try {
    const payload = createOrderSchema.parse(req.body);
    const order = orderService.createOrderFromCart(payload);
    return res.status(201).json({ data: order });
  } catch (err) {
    return next(err);
  }
});

router.get("/:orderId", (req, res, next) => {
  try {
    const order = orderService.getOrder(req.params.orderId);
    return res.json({ data: order });
  } catch (err) {
    return next(err);
  }
});

router.get("/", (req, res, next) => {
  try {
    const userId = req.query.userId;

    if (!userId || typeof userId !== "string") {
      const err = new Error("Missing userId query parameter");
      err.status = 400;
      err.code = "INVALID_QUERY";
      throw err;
    }

    const orders = orderService.listOrdersByUser(userId);
    return res.json({ data: orders });
  } catch (err) {
    return next(err);
  }
});

router.post("/:orderId/cancel", (req, res, next) => {
  try {
    const payload = cancelOrderSchema.parse(req.body || {});
    const order = orderService.cancelOrder(req.params.orderId, payload.reason);
    return res.json({ data: order });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
