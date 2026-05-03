const amqp = require('amqplib');
const config = require('../config');
const notificationService = require('../services/notificationService');

const CONSUMER_NAME = 'notification.EventConsumer';

function tryParseJson(buffer) {
  try {
    return JSON.parse(buffer.toString('utf8'));
  } catch (_err) {
    return null;
  }
}

function normalizeEvent(message) {
  if (!message || typeof message !== 'object') {
    return null;
  }

  const eventName = message.eventName || message.eventType || message.type;
  const payload = message.payload || message.data || message;

  if (!eventName || !payload) {
    return null;
  }

  return {
    eventId: message.eventId || message.id,
    eventName,
    payload,
  };
}

function startEventConsumer() {
  if (!config.consumer.enabled) {
    // eslint-disable-next-line no-console
    console.log('notification-consumer disabled by configuration');
    return async () => {};
  }

  let connection = null;
  let channel = null;
  let reconnectTimer = null;
  let stopped = false;
  let consumerTag = null;

  async function cleanup() {
    try {
      if (channel && consumerTag) {
        await channel.cancel(consumerTag);
      }
    } catch (_err) {
      // ignore cancel errors
    }
    consumerTag = null;

    try {
      if (channel) {
        await channel.close();
      }
    } catch (_err) {
      // ignore close errors
    }
    channel = null;

    try {
      if (connection) {
        await connection.close();
      }
    } catch (_err) {
      // ignore close errors
    }
    connection = null;
  }

  async function connectAndConsume() {
    if (stopped || channel) {
      return;
    }

    try {
      connection = await amqp.connect(config.rabbitmq.url);
      connection.on('error', (err) => {
        // eslint-disable-next-line no-console
        console.error('notification-consumer connection error', err.message);
      });

      connection.on('close', () => {
        channel = null;
        connection = null;
      });

      channel = await connection.createChannel();
      await channel.assertExchange(config.rabbitmq.exchange, config.rabbitmq.exchangeType, {
        durable: true,
      });

      await channel.assertQueue(config.consumer.queue, { durable: true });

      for (const routingKey of config.consumer.routingKeys) {
        // eslint-disable-next-line no-await-in-loop
        await channel.bindQueue(config.consumer.queue, config.rabbitmq.exchange, routingKey);
      }

      await channel.prefetch(config.consumer.prefetch);

      const consumeResult = await channel.consume(
        config.consumer.queue,
        async (msg) => {
          if (!msg) {
            return;
          }

          const parsed = tryParseJson(msg.content);
          if (!parsed) {
            // eslint-disable-next-line no-console
            console.error('notification-consumer invalid JSON message');
            channel.ack(msg);
            return;
          }

          const event = normalizeEvent(parsed);
          if (!event) {
            // eslint-disable-next-line no-console
            console.error('notification-consumer unsupported message');
            channel.ack(msg);
            return;
          }

          try {
            await notificationService.handleEvent(event, CONSUMER_NAME);
            channel.ack(msg);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('notification-consumer failed', {
              message: err.message,
              eventName: event.eventName,
            });
            channel.ack(msg);
          }
        },
        { noAck: false },
      );

      consumerTag = consumeResult.consumerTag;

      // eslint-disable-next-line no-console
      console.log('notification-consumer connected', {
        queue: config.consumer.queue,
        routingKeys: config.consumer.routingKeys,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('notification-consumer connect failed', err.message);
      await cleanup();
    }
  }

  reconnectTimer = setInterval(() => {
    connectAndConsume().catch(() => {});
  }, config.consumer.reconnectIntervalMs);
  reconnectTimer.unref();

  connectAndConsume().catch(() => {});

  return async () => {
    stopped = true;
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    }

    await cleanup();
  };
}

module.exports = {
  startEventConsumer,
};
