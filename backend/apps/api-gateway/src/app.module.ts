import { Module } from '@nestjs/common';
import { FulfillmentProxyController } from './routes/fulfillment.proxy.controller';
import { ReviewProxyController } from './routes/review.proxy.controller';

@Module({
  controllers: [FulfillmentProxyController, ReviewProxyController],
})
export class AppModule {}
