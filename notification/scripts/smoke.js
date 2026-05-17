const { initDatabase, getPool } = require("../src/db/postgres");
const notificationService = require("../src/services/notificationService");
const store = require("../src/store/notificationStore");

async function run() {
  await initDatabase();

  const event = {
    eventId: `smoke-${Date.now()}`,
    eventName: "OrderPlaced",
    payload: {
      orderId: "order-smoke-1",
      customerId: "user-smoke-1",
      totalAmount: 150000,
    },
  };

  const notification = await notificationService.handleEvent(event, "notification.smoke");
  if (!notification) {
    throw new Error("Expected notification to be created");
  }

  const list = await store.listNotificationsByUser("user-smoke-1");
  if (!list.length) {
    throw new Error("Expected notification list to include new entry");
  }

  // eslint-disable-next-line no-console
  console.log(
    `smoke-ok notificationId=${notification.id} total=${list.length}`,
  );
}

run()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("smoke-failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPool().end();
  });
