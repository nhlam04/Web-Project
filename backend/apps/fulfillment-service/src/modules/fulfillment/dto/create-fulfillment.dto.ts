export class CreateFulfillmentDto {
  orderId: string;
  customerId: string;
  sellerId: string;
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
}
