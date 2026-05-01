import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitmqConsumer } from '@backend/messaging';
import { BaseEvent } from '@backend/common';
import { OrderCreatedPayload } from '@backend/contracts';
import { FulfillmentService } from '../fulfillment/fulfillment.service';
import { InboxService } from '../inbox/inbox.service';
import { QUEUES } from '../../shared/constants';

@Injectable()
export class OrderCreatedConsumer implements OnModuleInit {
  private readonly logger = new Logger(OrderCreatedConsumer.name);
  private readonly CONSUMER_NAME = 'fulfillment.OrderCreatedConsumer';

  constructor(
    private readonly consumer: RabbitmqConsumer,
    private readonly fulfillmentService: FulfillmentService,
    private readonly inboxService: InboxService,
  ) {}

  async onModuleInit() {
    await this.consumer.subscribe<BaseEvent<OrderCreatedPayload>>(
      QUEUES.ORDER_CREATED,
      async (event) => {
        this.logger.log(
          `Received OrderCreated event ${event.eventId} for order ${event.payload.orderId}`,
        );

        // Idempotency check (inbox pattern)
        if (await this.inboxService.isDuplicate(this.CONSUMER_NAME, event.eventId)) {
          this.logger.warn(`Duplicate event ${event.eventId}, skipping`);
          return;
        }

        // Create a new fulfillment for this order
        await this.fulfillmentService.create({
          orderId: event.payload.orderId,
          customerId: event.payload.customerId,
          sellerId: event.payload.sellerId,
          items: event.payload.items,
        });

        // Mark as processed
        await this.inboxService.markProcessed(this.CONSUMER_NAME, event.eventId);
        this.logger.log(`Created fulfillment for order ${event.payload.orderId}`);
      },
    );
    this.logger.log(`Subscribed to queue: ${QUEUES.ORDER_CREATED}`);
  }
}
