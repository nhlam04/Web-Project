const amqp = require("amqplib");
const config = require("../config");
const orderService = require("../services/orderService");

const ROUTING_KEY_EVENT_MAP = {
  "fulfillment.seller-confirmed": "SellerOrderConfirmed",
  "fulfillment.delivery.updated": "DeliveryUpdated",
  "fulfillment.completed": "OrderCompleted",
};

function tryParseJson(buffer) {
  try {
    return JSON.parse(buffer.toString("utf8"));
  } catch (_err) {
    return null;
  }
}

function normalizeFulfillmentEvent(message, routingKey) {
  if (!message || typeof message !== "object") {
    return null;
  }

  const inferredType = ROUTING_KEY_EVENT_MAP[routingKey] || null;
  const eventType = message.eventType || message.type || inferredType;

  // Supports common wrappers:
  // - { eventType, data }
  // - { eventType, payload }
  // - { type, payload }
  // - { payload: { orderId, ... } }
  let data = message.data;
  if (!data || typeof data !== "object") {
    data = message.payload;
  }
  if (!data || typeof data !== "object") {
    data = message;
  }

  if (!eventType || !data || !data.orderId) {
    return null;
  }

  return { eventType, data };
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

      await channel.assertQueue(config.fulfillmentConsumer.queue, {
        durable: true,
      });

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
            channel.ack(msg);
            return;
          }

          const routingKey = msg.fields.routingKey || "";
          const event = normalizeFulfillmentEvent(parsed, routingKey);
          if (!event) {
            // eslint-disable-next-line no-console
            console.error("fulfillment-consumer unsupported message", { routingKey });
            channel.ack(msg);
            return;
          }

          try {
            await orderService.applyFulfillmentEvent(event);
            channel.ack(msg);
          } catch (err) {
            // Acknowledge and log to avoid poison-loop. Retry policy can be layered later with DLQ.
            // eslint-disable-next-line no-console
            console.error("fulfillment-consumer failed to apply event", {
              message: err.message,
              eventType: event.eventType,
              orderId: event.data.orderId,
            });
            channel.ack(msg);
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
