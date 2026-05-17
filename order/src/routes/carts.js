const express = require("express");
const { z } = require("zod");
const cartService = require("../services/cartService");

const router = express.Router();

const createCartSchema = z.object({
  userId: z.string().min(1),
  currency: z.string().min(3).max(3).optional(),
});

const addItemSchema = z.object({
  productId: z.string().min(1),
  sellerId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(0),
});

router.post("/", async (req, res, next) => {
  try {
    const payload = createCartSchema.parse(req.body);
    const cart = await cartService.createCart(payload);
    return res.status(201).json({ data: cart });
  } catch (err) {
    return next(err);
  }
});

router.get("/:cartId", async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.params.cartId);
    return res.json({ data: cart });
  } catch (err) {
    return next(err);
  }
});

router.post("/:cartId/items", async (req, res, next) => {
  try {
    const payload = addItemSchema.parse(req.body);
    const cart = await cartService.addCartItem(req.params.cartId, payload);
    return res.json({ data: cart });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:cartId/items/:productId", async (req, res, next) => {
  try {
    const payload = updateItemSchema.parse(req.body);
    const cart = await cartService.updateCartItem(
      req.params.cartId,
      req.params.productId,
      payload.quantity,
    );
    return res.json({ data: cart });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
