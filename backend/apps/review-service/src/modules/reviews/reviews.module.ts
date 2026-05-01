import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewEligibilityEntity } from './entities/review.entity';
import { ReviewRecordEntity } from './entities/review-record.entity';
import { OutboxEntity } from '../outbox/outbox.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReviewEligibilityEntity,
      ReviewRecordEntity,
      OutboxEntity,
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
