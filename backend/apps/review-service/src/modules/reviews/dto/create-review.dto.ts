export class CreateReviewDto {
  productId: string;
  customerId: string;
  orderId: string;
  fulfillmentId: string;
  rating: number;  // 1-5
  comment: string;
}
