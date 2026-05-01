export const ORDER_CREATED_EVENT = 'order.created';

export interface OrderCreatedPayload {
  orderId: string;
  customerId: string;
  sellerId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
}
