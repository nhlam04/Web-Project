import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEntity } from './outbox.entity';
import { RabbitmqPublisher } from '@backend/messaging';
import { EXCHANGE } from '../../shared/constants';

/**
 * Outbox poller: periodically scans the outbox table for PENDING events
 * and publishes them to RabbitMQ. This ensures at-least-once delivery
 * even if the application crashes after the DB transaction commits.
 */
@Injectable()
export class OutboxPoller implements OnModuleInit {
  private readonly logger = new Logger(OutboxPoller.name);
  private intervalHandle: ReturnType<typeof setInterval>;

  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepo: Repository<OutboxEntity>,

    private readonly publisher: RabbitmqPublisher,
  ) {}

  onModuleInit() {
    // Poll every 2 seconds
    this.intervalHandle = setInterval(() => this.pollAndPublish(), 2000);
    this.logger.log('Outbox poller started (interval=2s)');
  }

  async pollAndPublish() {
    try {
      const pending = await this.outboxRepo.find({
        where: { status: 'PENDING' },
        order: { createdAt: 'ASC' },
        take: 50,
      });

      for (const event of pending) {
        try {
          await this.publisher.publish(
            EXCHANGE,
            event.eventName,
            event.payload,
          );

          event.status = 'PUBLISHED';
          event.publishedAt = new Date();
          await this.outboxRepo.save(event);

          this.logger.log(
            `Published outbox event ${event.eventId} (${event.eventName})`,
          );
        } catch (err: any) {
          event.retries += 1;
          event.lastError = err?.message ?? String(err);
          if (event.retries >= 5) {
            event.status = 'FAILED';
          }
          await this.outboxRepo.save(event);
          this.logger.error(
            `Failed to publish event ${event.eventId}: ${event.lastError}`,
          );
        }
      }
    } catch (err) {
      this.logger.error('Outbox poller error', err);
    }
  }
}
