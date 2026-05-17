const app = require('./app');
const { port } = require('./config');
const { initDatabase } = require('./db/postgres');
const { startEventConsumer } = require('./messaging/eventConsumer');

async function start() {
  await initDatabase();
  const stopConsumer = startEventConsumer();

  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`notification-service listening on port ${port}`);
  });

  async function shutdown(signal) {
    // eslint-disable-next-line no-console
    console.log(`notification-service shutdown signal=${signal}`);
    await stopConsumer();
    server.close(() => {
      process.exit(0);
    });
  }

  process.on('SIGINT', () => {
    shutdown('SIGINT').catch(() => process.exit(1));
  });
  process.on('SIGTERM', () => {
    shutdown('SIGTERM').catch(() => process.exit(1));
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start notification-service', err);
  process.exit(1);
});
