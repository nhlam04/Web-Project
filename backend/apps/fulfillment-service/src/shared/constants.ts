/** Fulfillment status transitions */
export const FULFILLMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

/** Allowed transitions map */
export const ALLOWED_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'SHIPPED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

/** RabbitMQ exchange and queue names */
export const EXCHANGE = process.env.EVENT_EXCHANGE ?? 'cnweb.events';

export const QUEUES = {
  ORDER_PLACED: 'fulfillment.order_placed.q',
  ORDER_CANCELLED: 'fulfillment.order_cancelled.q',
};

export const ROUTING_KEYS = {
  ORDER_CANCELLED: 'order.cancelled',
  SELLER_ORDER_CONFIRMED: 'fulfillment.seller_order_confirmed',
  DELIVERY_UPDATED: 'fulfillment.delivery_updated',
  ORDER_COMPLETED: 'fulfillment.order_completed',
};
