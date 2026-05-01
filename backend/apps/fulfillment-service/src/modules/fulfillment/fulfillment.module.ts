import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FulfillmentEntity } from './entities/fulfillment.entity';
import { OutboxEntity } from '../outbox/outbox.entity';
import { FulfillmentController } from './fulfillment.controller';
import { FulfillmentService } from './fulfillment.service';

@Module({
  imports: [TypeOrmModule.forFeature([FulfillmentEntity, OutboxEntity])],
  controllers: [FulfillmentController],
  providers: [FulfillmentService],
  exports: [FulfillmentService],
})
export class FulfillmentModule {}
