const config = require("../config");

const EVENT_ROUTING = {
  "order.created": "order.created",
  "order.cancelled": "order.cancelled",
  "order.status.updated": "order.status.updated",
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
