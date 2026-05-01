import { Module } from '@nestjs/common';
import { FulfillmentCompletedConsumer } from './fulfillment-completed.consumer';
import { ReviewsModule } from '../reviews/reviews.module';
import { InboxModule } from '../inbox/inbox.module';

@Module({
  imports: [ReviewsModule, InboxModule],
  providers: [FulfillmentCompletedConsumer],
})
export class ConsumersModule {}
