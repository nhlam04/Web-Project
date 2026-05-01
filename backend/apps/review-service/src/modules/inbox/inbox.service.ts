import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessedMessageEntity } from './processed-message.entity';

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    @InjectRepository(ProcessedMessageEntity)
    private readonly repo: Repository<ProcessedMessageEntity>,
  ) {}

  async isDuplicate(consumerName: string, messageId: string): Promise<boolean> {
    const existing = await this.repo.findOne({
      where: { consumerName, messageId },
    });
    return !!existing;
  }

  async markProcessed(consumerName: string, messageId: string): Promise<void> {
    try {
      await this.repo.save({ consumerName, messageId });
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY') {
        this.logger.warn(
          `Message ${messageId} already processed by ${consumerName}`,
        );
        return;
      }
      throw err;
    }
  }
}
