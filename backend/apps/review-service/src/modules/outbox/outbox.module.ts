import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEntity } from './outbox.entity';
import { OutboxPoller } from './outbox.poller';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEntity])],
  providers: [OutboxPoller],
  exports: [OutboxPoller],
})
export class OutboxModule {}
