import { Module } from '@nestjs/common';
import { OrderPlacedConsumer } from './order-placed.consumer';
import { OrderCancelledConsumer } from './order-cancelled.consumer';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';
import { InboxModule } from '../inbox/inbox.module';

@Module({
  imports: [FulfillmentModule, InboxModule],
  providers: [OrderPlacedConsumer, OrderCancelledConsumer],
})
export class ConsumersModule {}
