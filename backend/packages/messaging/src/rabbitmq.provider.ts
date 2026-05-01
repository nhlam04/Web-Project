import { Provider } from '@nestjs/common';
import * as amqp from 'amqplib';

export const RABBITMQ_CONNECTION = Symbol('RABBITMQ_CONNECTION');
export const RABBITMQ_CHANNEL = Symbol('RABBITMQ_CHANNEL');

export const rabbitConnectionProvider: Provider = {
  provide: RABBITMQ_CONNECTION,
  useFactory: async () => {
    const url = process.env.RABBITMQ_URL ?? 'amqp://admin:admin123@localhost:5672';
    return amqp.connect(url);
  },
};

export const rabbitChannelProvider: Provider = {
  provide: RABBITMQ_CHANNEL,
  inject: [RABBITMQ_CONNECTION],
  useFactory: async (connection: any) => {
    const channel = await connection.createChannel();
    await channel.assertExchange('ecommerce.events', 'topic', { durable: true });
    return channel;
  },
};