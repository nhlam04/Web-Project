import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitmqConsumer } from '@backend/messaging';
import { BaseEvent } from '@backend/common';
import { OrderCompletedPayload } from '@backend/contracts';
import { ReviewsService } from '../reviews/reviews.service';
import { QUEUES, ROUTING_KEYS } from '../../shared/constants';

@Injectable()
export class OrderCompletedConsumer implements OnModuleInit {
  private readonly logger = new Logger(OrderCompletedConsumer.name);
  private readonly CONSUMER_NAME = 'review.OrderCompletedConsumer';

  constructor(
    private readonly consumer: RabbitmqConsumer,
    private readonly reviewsService: ReviewsService,
  ) {}

  async onModuleInit() {
    await this.consumer.subscribe<BaseEvent<OrderCompletedPayload>>(
      QUEUES.ORDER_COMPLETED,
      async (event) => {
        this.logger.log(
          `Received OrderCompleted event ${event.eventId} for order ${event.payload.orderId}`,
        );

        const created =
          await this.reviewsService.createEligibilityFromOrderCompleted(
            event.eventId,
            event.payload,
            this.CONSUMER_NAME,
          );
        this.logger.log(
          `Created ${created} review eligibility record(s) for order ${event.payload.orderId}`,
        );
      },
      [ROUTING_KEYS.ORDER_COMPLETED],
    );
    this.logger.log(`Subscribed to queue: ${QUEUES.ORDER_COMPLETED}`);
  }
}
