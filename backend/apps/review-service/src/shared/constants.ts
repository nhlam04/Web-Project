/** RabbitMQ exchange and queue names for review service */
export const EXCHANGE = process.env.EVENT_EXCHANGE ?? 'cnweb.events';

export const QUEUES = {
  ORDER_COMPLETED: 'review.order_completed.q',
};

export const ROUTING_KEYS = {
  ORDER_COMPLETED: 'fulfillment.order_completed',
  REVIEW_CREATED: 'review.created',
};
