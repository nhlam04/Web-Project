const amqp = require("amqplib");
const config = require("../config");
const store = require("../store/memoryStore");

function startOutboxPublisher() {
  if (!config.outboxPublisher.enabled) {
    // eslint-disable-next-line no-console
    console.log("outbox-publisher disabled by configuration");
    return () => {};
  }

  let timer = null;
  let isRunning = false;
  let connection = null;
  let channel = null;

  async function connect() {
    if (channel) {
      return channel;
    }

    connection = await amqp.connect(config.rabbitmq.url);
    connection.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("outbox-publisher connection error", err.message);
    });

    connection.on("close", () => {
      channel = null;
      connection = null;
    });

    channel = await connection.createChannel();
    await channel.assertExchange(config.rabbitmq.exchange, config.rabbitmq.exchangeType, {
      durable: true,
    });

    return channel;
  }

  async function publishBatch() {
    if (isRunning) {
      return;
    }

    isRunning = true;
    try {
      const pending = await store.listOutboxPending();
      if (!pending.length) {
        return;
      }

      const ch = await connect();
      const items = pending.slice(0, config.outboxPublisher.batchSize);

      for (const event of items) {
        const exchangeName = event.exchangeName || config.rabbitmq.exchange;
        const routingKey = event.routingKey || "order.unknown";
        const published = ch.publish(
          exchangeName,
          routingKey,
          Buffer.from(
            JSON.stringify(
              event.payload && event.payload.eventId
                ? event.payload
                : {
                    eventId: event.id,
                    eventType: event.eventType,
                    eventName: event.eventType,
                    aggregateId: event.aggregateId,
                    occurredAt: event.createdAt,
                    producer: "ordering-service",
                    version: 1,
                    payload: event.payload,
                  },
            ),
          ),
          { contentType: "application/json", persistent: true },
        );

        if (!published) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => ch.once("drain", resolve));
        }

        // eslint-disable-next-line no-await-in-loop
        await store.markOutboxPublished(event.id);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("outbox-publisher failed", err.message);
      try {
        if (channel) {
          await channel.close();
        }
      } catch (_err) {
        // ignore close errors
      }
      try {
        if (connection) {
          await connection.close();
        }
      } catch (_err) {
        // ignore close errors
      }
      channel = null;
      connection = null;
    } finally {
      isRunning = false;
    }
  }

  timer = setInterval(() => {
    publishBatch().catch(() => {});
  }, config.outboxPublisher.pollIntervalMs);
  timer.unref();

  publishBatch().catch(() => {});

  return async () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    try {
      if (channel) {
        await channel.close();
      }
    } catch (_err) {
      // ignore close errors
    }

    try {
      if (connection) {
        await connection.close();
      }
    } catch (_err) {
      // ignore close errors
    }
  };
}

module.exports = {
  startOutboxPublisher,
};
