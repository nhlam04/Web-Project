const amqp = require("amqplib");
const config = require("../config");
const orderService = require("../services/orderService");
const { normalizeFulfillmentEvent } = require("../contracts/eventContract");

const CONSUMER_NAME = "ordering.FulfillmentConsumer";

function tryParseJson(buffer) {
  try {
    return JSON.parse(buffer.toString("utf8"));
  } catch (_err) {
    return null;
  }
}

function getAttemptCount(msg) {
  return Number(msg.properties?.headers?.["x-attempt"] || 0);
}

function buildHeaders(msg, event, nextAttempt, lastError) {
  return {
    ...(msg.properties?.headers || {}),
    "x-attempt": nextAttempt,
    "x-consumer": CONSUMER_NAME,
    "x-original-event-id": event.eventId || null,
    "x-original-routing-key": msg.fields.routingKey || null,
    "x-last-error": lastError || null,
  };
}

async function republishForRetry(channel, msg, event, nextAttempt, lastError) {
  const routingKey = msg.fields.routingKey || event.routingKey || event.eventType;
  const published = channel.publish(
    config.rabbitmq.exchange,
    routingKey,
    msg.content,
    {
      contentType: "application/json",
      persistent: true,
      headers: buildHeaders(msg, event, nextAttempt, lastError),
    },
  );

  if (!published) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => channel.once("drain", resolve));
  }
}

function startFulfillmentConsumer() {
  if (!config.fulfillmentConsumer.enabled) {
    // eslint-disable-next-line no-console
    console.log("fulfillment-consumer disabled by configuration");
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
      connection.on("error", (err) => {
        // eslint-disable-next-line no-console
        console.error("fulfillment-consumer connection error", err.message);
      });

      connection.on("close", () => {
        channel = null;
        connection = null;
      });

      channel = await connection.createChannel();
      await channel.assertExchange(config.rabbitmq.exchange, config.rabbitmq.exchangeType, {
        durable: true,
      });
      await channel.assertExchange(config.fulfillmentConsumer.dlqExchange, config.rabbitmq.exchangeType, {
        durable: true,
      });

      await channel.assertQueue(config.fulfillmentConsumer.queue, {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": config.fulfillmentConsumer.dlqExchange,
        },
      });
      await channel.assertQueue(config.fulfillmentConsumer.dlqQueue, { durable: true });
      await channel.bindQueue(config.fulfillmentConsumer.dlqQueue, config.fulfillmentConsumer.dlqExchange, "#");

      for (const routingKey of config.fulfillmentConsumer.routingKeys) {
        // eslint-disable-next-line no-await-in-loop
        await channel.bindQueue(config.fulfillmentConsumer.queue, config.rabbitmq.exchange, routingKey);
      }

      await channel.prefetch(config.fulfillmentConsumer.prefetch);

      const consumeResult = await channel.consume(
        config.fulfillmentConsumer.queue,
        async (msg) => {
          if (!msg) {
            return;
          }

          const parsed = tryParseJson(msg.content);
          if (!parsed) {
            // eslint-disable-next-line no-console
            console.error("fulfillment-consumer invalid JSON message");
            channel.nack(msg, false, false);
            return;
          }

          const routingKey = msg.fields.routingKey || "";
          const event = normalizeFulfillmentEvent(parsed, routingKey);
          if (!event) {
            // eslint-disable-next-line no-console
            console.error("fulfillment-consumer unsupported message", { routingKey });
            channel.nack(msg, false, false);
            return;
          }

          try {
            await orderService.applyFulfillmentEvent(event, CONSUMER_NAME);
            channel.ack(msg);
          } catch (err) {
            const nextAttempt = getAttemptCount(msg) + 1;
            // eslint-disable-next-line no-console
            console.error("fulfillment-consumer failed to apply event", {
              message: err.message,
              eventType: event.eventType,
              orderId: event.data.orderId,
              attempt: nextAttempt,
            });

            if (nextAttempt < config.fulfillmentConsumer.maxAttempts) {
              await republishForRetry(channel, msg, event, nextAttempt, err.message);
              channel.ack(msg);
              return;
            }

            channel.nack(msg, false, false);
          }
        },
        { noAck: false },
      );

      consumerTag = consumeResult.consumerTag;

      // eslint-disable-next-line no-console
      console.log("fulfillment-consumer connected", {
        queue: config.fulfillmentConsumer.queue,
        routingKeys: config.fulfillmentConsumer.routingKeys,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("fulfillment-consumer connect failed", err.message);
      await cleanup();
    }
  }

  reconnectTimer = setInterval(() => {
    connectAndConsume().catch(() => {});
  }, config.fulfillmentConsumer.reconnectIntervalMs);
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
  startFulfillmentConsumer,
};
