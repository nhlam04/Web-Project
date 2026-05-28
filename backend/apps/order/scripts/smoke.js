const { initDatabase, getPool } = require("../src/db/postgres");
const cartService = require("../src/services/cartService");
const orderService = require("../src/services/orderService");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForDatabase(maxAttempts = 20, delayMs = 1500) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await initDatabase();
      return;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        // eslint-disable-next-line no-console
        console.log(`db-not-ready attempt=${attempt}/${maxAttempts}`);
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  await waitForDatabase();

  const cart = await cartService.createCart({
    userId: "smoke-user",
    currency: "VND",
  });

  await cartService.addCartItem(cart.id, {
    productId: "smoke-product-1",
    sellerId: "smoke-seller-1",
    name: "Smoke Test Item",
    quantity: 2,
    unitPrice: 150000,
  });

  const order = await orderService.createOrderFromCart({
    cartId: cart.id,
    userId: cart.userId,
    shippingAddress: {
      recipientName: "Smoke User",
      phone: "0900000000",
      line1: "123 Smoke Street",
      ward: "Ward 1",
      district: "District 1",
      city: "HCM",
      country: "VN",
    },
    paymentMethod: "COD",
  });

  const confirmed = await orderService.applyFulfillmentEvent({
    eventType: "fulfillment.seller-order-confirmed",
    data: { orderId: order.id },
  });

  assert(
    confirmed.status === "SELLER_CONFIRMED",
    "Expected SELLER_CONFIRMED status after fulfillment event",
  );

  const cancelCart = await cartService.createCart({
    userId: "smoke-user-cancel",
    currency: "VND",
  });

  await cartService.addCartItem(cancelCart.id, {
    productId: "smoke-product-2",
    sellerId: "smoke-seller-2",
    name: "Smoke Cancel Item",
    quantity: 1,
    unitPrice: 50000,
  });

  const cancelOrder = await orderService.createOrderFromCart({
    cartId: cancelCart.id,
    userId: cancelCart.userId,
    shippingAddress: {
      recipientName: "Smoke Cancel",
      phone: "0911111111",
      line1: "456 Smoke Street",
      ward: "Ward 2",
      district: "District 3",
      city: "HCM",
      country: "VN",
    },
    paymentMethod: "COD",
  });

  const cancelled = await orderService.cancelOrder(cancelOrder.id, "smoke-cancel");

  assert(cancelled.status === "CANCELLED", "Expected CANCELLED status after cancelOrder");

  const pendingOutbox = await orderService.listPendingOutbox();

  const hasPlaced = pendingOutbox.some((event) => event.eventType === "OrderPlaced");
  const hasCancelled = pendingOutbox.some((event) => event.eventType === "OrderCancelled");

  assert(hasPlaced, "Expected OrderPlaced event in outbox");
  assert(hasCancelled, "Expected OrderCancelled event in outbox");

  // eslint-disable-next-line no-console
  console.log(
    `smoke-ok confirmedOrder=${order.id} cancelledOrder=${cancelOrder.id} pendingOutbox=${pendingOutbox.length}`,
  );
}

run()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("smoke-failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPool().end();
  });
