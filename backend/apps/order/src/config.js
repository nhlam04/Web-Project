function parseCsv(value, fallback) {
  const source = value || fallback;
  return source
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const config = {
  port: Number(process.env.PORT || 8083),
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || "admin",
    password: process.env.DB_PASS || "password123",
    database: process.env.DB_NAME || "microservices_db",
    max: Number(process.env.DB_POOL_MAX || 10),
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || "amqp://admin:admin123@localhost:5672",
    exchange: process.env.RABBITMQ_EXCHANGE || "cnweb.events",
    exchangeType: process.env.RABBITMQ_EXCHANGE_TYPE || "topic",
  },
  iam: {
    baseUrl: process.env.IAM_BASE_URL || "http://localhost:3001",
    authRequired: process.env.ORDERING_AUTH_REQUIRED === "true",
  },
  catalog: {
    baseUrl: process.env.CATALOG_BASE_URL || "http://localhost:8000",
  },
  outboxPublisher: {
    enabled: process.env.OUTBOX_PUBLISHER_ENABLED !== "false",
    pollIntervalMs: Number(process.env.OUTBOX_PUBLISHER_POLL_MS || 3000),
    batchSize: Number(process.env.OUTBOX_PUBLISHER_BATCH_SIZE || 50),
  },
  fulfillmentConsumer: {
    enabled: process.env.FULFILLMENT_CONSUMER_ENABLED !== "false",
    queue: process.env.FULFILLMENT_CONSUMER_QUEUE || "ordering.fulfillment-events",
    routingKeys: parseCsv(
      process.env.FULFILLMENT_CONSUMER_ROUTING_KEYS,
      "fulfillment.seller_order_confirmed,fulfillment.delivery_updated,fulfillment.order_completed",
    ),
    prefetch: Number(process.env.FULFILLMENT_CONSUMER_PREFETCH || 20),
    maxAttempts: Number(process.env.FULFILLMENT_CONSUMER_MAX_ATTEMPTS || 5),
    dlqExchange: process.env.FULFILLMENT_CONSUMER_DLQ_EXCHANGE || "cnweb.events.dlq",
    dlqQueue: process.env.FULFILLMENT_CONSUMER_DLQ_QUEUE || "ordering.fulfillment-events.dlq",
    reconnectIntervalMs: Number(process.env.FULFILLMENT_CONSUMER_RECONNECT_MS || 5000),
  },
  cors: {
    allowedOrigins: parseCsv(
      process.env.ALLOWED_ORIGINS,
      "http://localhost:8080,http://localhost:3000",
    ),
  },
};

module.exports = config;
