export const FULFILLMENT_COMPLETED_EVENT = 'fulfillment.completed';

export interface FulfillmentCompletedPayload {
  fulfillmentId: string;
  orderId: string;
  customerId: string;
  sellerId: string;
  completedAt: string;
}
