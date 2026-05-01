/** RabbitMQ exchange and queue names for review service */
export const EXCHANGE = 'ecommerce.events';

export const QUEUES = {
  FULFILLMENT_COMPLETED: 'review.fulfillment-completed',
};

export const ROUTING_KEYS = {
  REVIEW_CREATED: 'review.created',
};
