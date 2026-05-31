import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitmqConsumer } from '@backend/messaging';
import { BaseEvent } from '@backend/common';
import { OrderCancelledPayload } from '@backend/contracts';
import { FulfillmentService } from '../fulfillment/fulfillment.service';
import { QUEUES, ROUTING_KEYS } from '../../shared/constants';

@Injectable()
export class OrderCancelledConsumer implements OnModuleInit {
  private readonly logger = new Logger(OrderCancelledConsumer.name);
  private readonly CONSUMER_NAME = 'fulfillment.OrderCancelledConsumer';

  constructor(
    private readonly consumer: RabbitmqConsumer,
    private readonly fulfillmentService: FulfillmentService,
  ) {}

  async onModuleInit() {
    await this.consumer.subscribe<BaseEvent<OrderCancelledPayload>>(
      QUEUES.ORDER_CANCELLED,
      async (event) => {
        this.logger.log(
          `Received OrderCancelled event ${event.eventId} for order ${event.payload.orderId}`,
        );

        const cancelled = await this.fulfillmentService.cancelFromOrderCancelled(
          event.eventId,
          event.payload,
          this.CONSUMER_NAME,
        );
        this.logger.log(
          `Cancelled ${cancelled.length} fulfillment(s) for order ${event.payload.orderId}`,
        );
      },
      [ROUTING_KEYS.ORDER_CANCELLED],
    );
    this.logger.log(`Subscribed to queue: ${QUEUES.ORDER_CANCELLED}`);
  }
}
