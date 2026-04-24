const config = require("../config");

const EVENT_ROUTING = {
  OrderPlaced: "order.created",
  OrderCancelled: "order.cancelled",
  OrderStatusUpdated: "order.status.updated",
};

function getRoutingMetadata(eventType) {
  return {
    exchangeName: config.rabbitmq.exchange,
    routingKey: EVENT_ROUTING[eventType] || "order.unknown",
  };
}

module.exports = {
  getRoutingMetadata,
};
