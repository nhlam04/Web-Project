const ORDER_STATUS = {
  PLACED: "PLACED",
  SELLER_CONFIRMED: "SELLER_CONFIRMED",
  IN_DELIVERY: "IN_DELIVERY",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

const ALLOWED_TRANSITIONS = {
  [ORDER_STATUS.PLACED]: [ORDER_STATUS.SELLER_CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SELLER_CONFIRMED]: [ORDER_STATUS.IN_DELIVERY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.IN_DELIVERY]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

function canTransition(fromStatus, toStatus) {
  return (ALLOWED_TRANSITIONS[fromStatus] || []).includes(toStatus);
}

function assertCanTransition(fromStatus, toStatus) {
  if (!canTransition(fromStatus, toStatus)) {
    const err = new Error(
      `Invalid order status transition: ${fromStatus} -> ${toStatus}`,
    );
    err.code = "INVALID_ORDER_TRANSITION";
    err.status = 409;
    throw err;
  }
}

module.exports = {
  ORDER_STATUS,
  canTransition,
  assertCanTransition,
};
