export const ORDER_CANCELLED_EVENT = 'OrderCancelled';
export const ORDER_CANCELLED_ROUTING_KEY = 'order.cancelled';

export interface OrderCancelledPayload {
  orderId: string;
  customerId: string;
  reason?: string;
  cancelledAt: string;
  items?: Array<{
    productId: string;
    sellerId?: string;
    name?: string;
    quantity: number;
    unitPrice?: number;
    lineTotal?: number;
  }>;
}
