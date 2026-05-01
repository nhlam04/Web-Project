import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingModule } from '@backend/messaging';
import dataSource from './database/typeorm.config';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { ConsumersModule } from './modules/consumers/consumers.module';

@Module({
  imports: [
    MessagingModule,
    TypeOrmModule.forRoot({
      ...dataSource.options,
      autoLoadEntities: true,
    }),
    ReviewsModule,
    OutboxModule,
    ConsumersModule,
  ],
})
export class AppModule {}