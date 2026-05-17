const app = require("./app");
const { port } = require("./config");
const { initDatabase } = require("./db/postgres");
const { startOutboxPublisher } = require("./messaging/outboxPublisher");
const { startFulfillmentConsumer } = require("./messaging/fulfillmentConsumer");

async function start() {
  await initDatabase();
  const stopPublisher = startOutboxPublisher();
  const stopConsumer = startFulfillmentConsumer();

  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`ordering-service listening on port ${port}`);
  });

  async function shutdown(signal) {
    // eslint-disable-next-line no-console
    console.log(`ordering-service shutdown signal=${signal}`);
    await stopPublisher();
    await stopConsumer();
    server.close(() => {
      process.exit(0);
    });
  }

  process.on("SIGINT", () => {
    shutdown("SIGINT").catch(() => process.exit(1));
  });
  process.on("SIGTERM", () => {
    shutdown("SIGTERM").catch(() => process.exit(1));
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start ordering-service", err);
  process.exit(1);
});
