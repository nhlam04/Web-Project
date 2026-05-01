import { Module } from '@nestjs/common';
import { OrderCreatedConsumer } from './order-created.consumer';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';
import { InboxModule } from '../inbox/inbox.module';

@Module({
  imports: [FulfillmentModule, InboxModule],
  providers: [OrderCreatedConsumer],
})
export class ConsumersModule {}
