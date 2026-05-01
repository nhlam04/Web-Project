export const FULFILLMENT_STATUS_UPDATED_EVENT = 'fulfillment.status-updated';

export interface FulfillmentStatusUpdatedPayload {
  fulfillmentId: string;
  orderId: string;
  customerId: string;
  sellerId: string;
  previousStatus: string;
  newStatus: string;
  trackingCode?: string;
  carrier?: string;
  updatedAt: string;
}
