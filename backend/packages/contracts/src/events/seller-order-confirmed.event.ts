export const SELLER_ORDER_CONFIRMED_EVENT = 'fulfillment.seller-order-confirmed';

export interface SellerOrderConfirmedPayload {
  fulfillmentId: string;
  orderId: string;
  customerId: string;
  sellerId: string;
  confirmedAt: string;
}
