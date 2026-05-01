export const REVIEW_CREATED_EVENT = 'review.created';

export interface ReviewCreatedPayload {
  reviewId: string;
  productId: string;
  customerId: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
}
