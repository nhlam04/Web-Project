import { Inject, Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { RABBITMQ_CHANNEL } from './rabbitmq.provider';

@Injectable()
export class RabbitmqConsumer {
  private readonly logger = new Logger(RabbitmqConsumer.name);

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: amqp.Channel,
  ) {}

  async subscribe<T>(
    queue: string,
    handler: (payload: T) => Promise<void>,
    bindingKeys: string[] = [],
    exchange = process.env.EVENT_EXCHANGE ?? 'cnweb.events',
  ) {
    await this.channel.assertQueue(queue, { durable: true });
    for (const bindingKey of bindingKeys) {
      await this.channel.bindQueue(queue, exchange, bindingKey);
    }

    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString()) as T;
        await handler(payload);
        this.channel.ack(msg);
      } catch (error) {
        this.logger.error(`Consume failed on ${queue}`, error as Error);
        this.channel.nack(msg, false, false);
      }
    });
  }
}
