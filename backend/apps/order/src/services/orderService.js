const { randomUUID } = require("crypto");
const store = require("../store/memoryStore");
const { ORDER_STATUS, assertCanTransition } = require("../domain/orderStateMachine");
const { recalculateTotals } = require("./cartService");
const {
  buildOrderCancelledPayload,
  buildOrderCreatedPayload,
  buildOrderStatusUpdatedPayload,
  canonicalizeFulfillmentEventName,
} = require("../contracts/eventContract");
const FULFILLMENT_CONSUMER_NAME = "ordering.FulfillmentConsumer";

function orderNotFound(orderId) {
  const err = new Error(`Order not found: ${orderId}`);
  err.status = 404;
  err.code = "ORDER_NOT_FOUND";
  return err;
}

async function createOrderFromCart({ cartId, userId, shippingAddress, paymentMethod }) {
  return store.withTransaction(async (client) => {
    const cart = await store.getCart(cartId, client);

    if (!cart) {
      const err = new Error(`Cart not found: ${cartId}`);
      err.status = 404;
      err.code = "CART_NOT_FOUND";
      throw err;
    }

    if (cart.status !== "ACTIVE") {
      const err = new Error("Cart is already checked out");
      err.status = 409;
      err.code = "INVALID_CART_STATUS";
      throw err;
    }

    if (!cart.items.length) {
      const err = new Error("Cannot place order from empty cart");
      err.status = 400;
      err.code = "EMPTY_CART";
      throw err;
    }

    const totals = recalculateTotals(cart.items);
    const createdAt = new Date().toISOString();

    const order = {
      id: randomUUID(),
      userId,
      cartId,
      status: ORDER_STATUS.PLACED,
      shippingAddress,
      paymentMethod,
      currency: cart.currency,
      items: cart.items.map((item) => ({
        productId: item.productId,
        sellerId: item.sellerId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice,
      })),
      totals,
      createdAt,
      updatedAt: createdAt,
      history: [
        {
          from: null,
          to: ORDER_STATUS.PLACED,
          at: createdAt,
          by: "SYSTEM",
          reason: "Order created from cart checkout",
        },
      ],
    };

    await store.saveOrder(order, client);

    await store.markCartCheckedOut(cartId, createdAt, client);

    await store.pushOutboxEvent(
      {
        aggregateId: order.id,
        eventType: "order.created",
        payload: buildOrderCreatedPayload(order),
      },
      client,
    );

    return order;
  });
}

async function getOrder(orderId, client) {
  const order = await store.getOrder(orderId, client);
  if (!order) {
    throw orderNotFound(orderId);
  }
  return order;
}

async function listOrdersByUser(userId) {
  return store.listOrdersByUser(userId);
}

async function cancelOrder(orderId, reason = "Cancelled by user") {
  return store.withTransaction(async (client) => {
    const order = await getOrder(orderId, client);

    assertCanTransition(order.status, ORDER_STATUS.CANCELLED);

    const cancelledAt = new Date().toISOString();

    const next = await store.updateOrder(
      orderId,
      (current) => ({
        ...current,
        status: ORDER_STATUS.CANCELLED,
        cancelledAt,
        history: [
          ...current.history,
          {
            from: current.status,
            to: ORDER_STATUS.CANCELLED,
            at: cancelledAt,
            by: "ORDER_SERVICE",
            reason,
          },
        ],
      }),
      client,
    );

    await store.pushOutboxEvent(
      {
        aggregateId: next.id,
        eventType: "order.cancelled",
        payload: buildOrderCancelledPayload(next, reason, cancelledAt),
      },
      client,
    );

    return next;
  });
}

async function transitionOrderStatus(orderId, toStatus, metadata = {}, client) {
  return executeWithTransaction(client, async (transactionClient) => {
    const order = await getOrder(orderId, transactionClient);
    assertCanTransition(order.status, toStatus);

    const changedAt = new Date().toISOString();

    const next = await store.updateOrder(
      orderId,
      (current) => ({
        ...current,
        status: toStatus,
        history: [
          ...current.history,
          {
            from: current.status,
            to: toStatus,
            at: changedAt,
            by: metadata.by || "INTEGRATION",
            reason: metadata.reason || "Status updated",
            sourceEventType: metadata.sourceEventType || null,
          },
        ],
      }),
      transactionClient,
    );

    await store.pushOutboxEvent(
      {
        aggregateId: next.id,
        eventType: "order.status.updated",
        payload: buildOrderStatusUpdatedPayload(
          next.id,
          order.status,
          toStatus,
          changedAt,
          metadata.sourceEventType,
        ),
      },
      transactionClient,
    );

    return next;
  });
}

async function executeWithTransaction(client, work) {
  if (client) {
    return work(client);
  }

  return store.withTransaction(work);
}

async function applyFulfillmentEvent(event, client) {
  if (!event || typeof event !== "object") {
    const err = new Error("Invalid fulfillment event payload");
    err.status = 400;
    err.code = "INVALID_EVENT_PAYLOAD";
    throw err;
  }

  const normalizedEventType = canonicalizeFulfillmentEventName(event.eventType || event.eventName || event.type);
  const { data } = event;

  if (!data || !data.orderId) {
    const err = new Error("Missing orderId in fulfillment event data");
    err.status = 400;
    err.code = "INVALID_EVENT_PAYLOAD";
    throw err;
  }

  return executeWithTransaction(client, async (transactionClient) => {
    if (event.eventId && await store.isDuplicateEvent(FULFILLMENT_CONSUMER_NAME, event.eventId, transactionClient)) {
      return getOrder(data.orderId, transactionClient);
    }

    let nextOrder;

    if (normalizedEventType === "fulfillment.seller-order-confirmed") {
      nextOrder = await transitionOrderStatus(data.orderId, ORDER_STATUS.SELLER_CONFIRMED, {
        by: "FULFILLMENT_SERVICE",
        reason: "Seller confirmed order",
        sourceEventType: normalizedEventType,
      }, transactionClient);
    } else if (normalizedEventType === "fulfillment.status-updated") {
      if (data.newStatus === "CONFIRMED") {
        nextOrder = await transitionOrderStatus(data.orderId, ORDER_STATUS.SELLER_CONFIRMED, {
          by: "FULFILLMENT_SERVICE",
          reason: "Seller confirmed order",
          sourceEventType: normalizedEventType,
        }, transactionClient);
      } else if (data.newStatus === "SHIPPED" || data.deliveryStatus === "IN_TRANSIT") {
        nextOrder = await transitionOrderStatus(data.orderId, ORDER_STATUS.IN_DELIVERY, {
          by: "FULFILLMENT_SERVICE",
          reason: "Delivery is in transit",
          sourceEventType: normalizedEventType,
        }, transactionClient);
      } else if (data.newStatus === "DELIVERED" || data.deliveryStatus === "DELIVERED") {
        nextOrder = await transitionOrderStatus(data.orderId, ORDER_STATUS.DELIVERED, {
          by: "FULFILLMENT_SERVICE",
          reason: "Delivery completed to customer",
          sourceEventType: normalizedEventType,
        }, transactionClient);
      } else if (data.newStatus === "COMPLETED") {
        nextOrder = await transitionOrderStatus(data.orderId, ORDER_STATUS.COMPLETED, {
          by: "FULFILLMENT_SERVICE",
          reason: "Order completed by fulfillment",
          sourceEventType: normalizedEventType,
        }, transactionClient);
      } else {
        nextOrder = await getOrder(data.orderId, transactionClient);
      }
    } else if (normalizedEventType === "fulfillment.completed") {
      nextOrder = await transitionOrderStatus(data.orderId, ORDER_STATUS.COMPLETED, {
        by: "FULFILLMENT_SERVICE",
        reason: "Order completed by fulfillment",
        sourceEventType: normalizedEventType,
      }, transactionClient);
    } else {
      const err = new Error(`Unsupported fulfillment event type: ${normalizedEventType}`);
      err.status = 400;
      err.code = "UNSUPPORTED_EVENT_TYPE";
      throw err;
    }

    if (event.eventId) {
      await store.markEventProcessed(FULFILLMENT_CONSUMER_NAME, event.eventId, transactionClient);
    }

    return nextOrder;
  });
}

async function listPendingOutbox() {
  return store.listOutboxPending();
}

async function markOutboxPublished(outboxId) {
  const outbox = await store.markOutboxPublished(outboxId);
  if (!outbox) {
    const err = new Error(`Outbox event not found: ${outboxId}`);
    err.status = 404;
    err.code = "OUTBOX_NOT_FOUND";
    throw err;
  }
  return outbox;
}

module.exports = {
  createOrderFromCart,
  getOrder,
  listOrdersByUser,
  cancelOrder,
  applyFulfillmentEvent,
  listPendingOutbox,
  markOutboxPublished,
};
