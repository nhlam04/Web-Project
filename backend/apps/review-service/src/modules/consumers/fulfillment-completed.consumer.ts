import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitmqConsumer } from '@backend/messaging';
import { BaseEvent } from '@backend/common';
import { FulfillmentCompletedPayload } from '@backend/contracts';
import { ReviewsService } from '../reviews/reviews.service';
import { InboxService } from '../inbox/inbox.service';
import { QUEUES } from '../../shared/constants';

@Injectable()
export class FulfillmentCompletedConsumer implements OnModuleInit {
  private readonly logger = new Logger(FulfillmentCompletedConsumer.name);
  private readonly CONSUMER_NAME = 'review.FulfillmentCompletedConsumer';

  constructor(
    private readonly consumer: RabbitmqConsumer,
    private readonly reviewsService: ReviewsService,
    private readonly inboxService: InboxService,
  ) {}

  async onModuleInit() {
    await this.consumer.subscribe<BaseEvent<FulfillmentCompletedPayload>>(
      QUEUES.FULFILLMENT_COMPLETED,
      async (event) => {
        this.logger.log(
          `Received FulfillmentCompleted event ${event.eventId} for order ${event.payload.orderId}`,
        );

        // Idempotency check
        if (await this.inboxService.isDuplicate(this.CONSUMER_NAME, event.eventId)) {
          this.logger.warn(`Duplicate event ${event.eventId}, skipping`);
          return;
        }

        // Create review eligibility
        await this.reviewsService.createEligibility({
          fulfillmentId: event.payload.fulfillmentId,
          orderId: event.payload.orderId,
          customerId: event.payload.customerId,
          sellerId: event.payload.sellerId,
        });

        await this.inboxService.markProcessed(this.CONSUMER_NAME, event.eventId);
        this.logger.log(
          `Review eligibility created for order ${event.payload.orderId}`,
        );
      },
    );
    this.logger.log(`Subscribed to queue: ${QUEUES.FULFILLMENT_COMPLETED}`);
  }
}
