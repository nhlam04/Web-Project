import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitmqConsumer } from '@backend/messaging';
import { BaseEvent } from '@backend/common';
import { OrderPlacedPayload } from '@backend/contracts';
import { FulfillmentService } from '../fulfillment/fulfillment.service';
import { QUEUES } from '../../shared/constants';

@Injectable()
export class OrderPlacedConsumer implements OnModuleInit {
  private readonly logger = new Logger(OrderPlacedConsumer.name);
  private readonly CONSUMER_NAME = 'fulfillment.OrderPlacedConsumer';

  constructor(
    private readonly consumer: RabbitmqConsumer,
    private readonly fulfillmentService: FulfillmentService,
  ) {}

  async onModuleInit() {
    await this.consumer.subscribe<BaseEvent<OrderPlacedPayload>>(
      QUEUES.ORDER_PLACED,
      async (event) => {
        this.logger.log(
          `Received OrderPlaced event ${event.eventId} for order ${event.payload.orderId}`,
        );

        const fulfillments = await this.fulfillmentService.createFromOrderPlaced(
          event.eventId,
          event.payload,
          this.CONSUMER_NAME,
        );
        this.logger.log(
          `Created ${fulfillments.length} fulfillment(s) for order ${event.payload.orderId}`,
        );
      },
      ['order.placed'],
    );
    this.logger.log(`Subscribed to queue: ${QUEUES.ORDER_PLACED}`);
  }
}
