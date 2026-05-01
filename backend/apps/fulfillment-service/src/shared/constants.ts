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
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

/** RabbitMQ exchange and queue names */
export const EXCHANGE = 'ecommerce.events';

export const QUEUES = {
  ORDER_CREATED: 'fulfillment.order-created',
};

export const ROUTING_KEYS = {
  SELLER_ORDER_CONFIRMED: 'fulfillment.seller-order-confirmed',
  FULFILLMENT_STATUS_UPDATED: 'fulfillment.status-updated',
  FULFILLMENT_COMPLETED: 'fulfillment.completed',
};
