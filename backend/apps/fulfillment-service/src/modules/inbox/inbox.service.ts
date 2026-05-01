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

  /**
   * Returns true if message was already processed (duplicate).
   */
  async isDuplicate(consumerName: string, messageId: string): Promise<boolean> {
    const existing = await this.repo.findOne({
      where: { consumerName, messageId },
    });
    return !!existing;
  }

  /**
   * Marks a message as processed.
   */
  async markProcessed(consumerName: string, messageId: string): Promise<void> {
    try {
      await this.repo.save({ consumerName, messageId });
    } catch (err: any) {
      // If duplicate key error, the message was already processed
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
