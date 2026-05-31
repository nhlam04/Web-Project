const config = require("../config");

function buildError(message, status, code) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

async function getProductAvailability(productId) {
  const baseUrl = config.catalog.baseUrl.replace(/\/$/, "");
  let response;
  try {
    response = await fetch(`${baseUrl}/api/v1/products/${encodeURIComponent(productId)}/availability`);
  } catch (err) {
    throw buildError(`Catalog availability check failed: ${err.message}`, 502, "CATALOG_UNAVAILABLE");
  }

  if (response.status === 404) {
    throw buildError(`Product not found: ${productId}`, 409, "PRODUCT_UNAVAILABLE");
  }

  if (!response.ok) {
    throw buildError(`Catalog availability check failed for product ${productId}`, 502, "CATALOG_UNAVAILABLE");
  }

  return response.json();
}

async function validateCartItems(items) {
  for (const item of items) {
    const availability = await getProductAvailability(item.productId);
    if (!availability.available || Number(availability.quantity) < Number(item.quantity)) {
      throw buildError(`Product ${item.productId} does not have enough stock`, 409, "INSUFFICIENT_STOCK");
    }

    if (Number(availability.price) !== Number(item.unitPrice)) {
      throw buildError(`Product ${item.productId} price changed`, 409, "PRICE_CHANGED");
    }
  }
}

module.exports = {
  getProductAvailability,
  validateCartItems,
};
