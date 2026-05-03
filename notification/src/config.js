function parseCsv(value, fallback) {
  const source = value || fallback;
  return source
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const config = {
  port: Number(process.env.PORT || 8086),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASS || 'password123',
    database: process.env.DB_NAME || 'microservices_db',
    max: Number(process.env.DB_POOL_MAX || 10),
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'ecommerce.events',
    exchangeType: process.env.RABBITMQ_EXCHANGE_TYPE || 'topic',
  },
  consumer: {
    enabled: process.env.NOTIFICATION_CONSUMER_ENABLED !== 'false',
    queue: process.env.NOTIFICATION_CONSUMER_QUEUE || 'notification.events',
    routingKeys: parseCsv(
      process.env.NOTIFICATION_CONSUMER_ROUTING_KEYS,
      'order.*,fulfillment.*,review.*,chat.*,catalog.*',
    ),
    prefetch: Number(process.env.NOTIFICATION_CONSUMER_PREFETCH || 20),
    reconnectIntervalMs: Number(process.env.NOTIFICATION_CONSUMER_RECONNECT_MS || 5000),
  },
};

module.exports = config;
