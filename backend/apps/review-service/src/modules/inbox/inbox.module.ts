import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedMessageEntity } from './processed-message.entity';
import { InboxService } from './inbox.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProcessedMessageEntity])],
  providers: [InboxService],
  exports: [InboxService],
})
export class InboxModule {}
