function formatPrice(value, currency = 'VND') {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function getProductImage(product) {
  const fallback = 'https://via.placeholder.com/320?text=No+Image';
  if (!product?.images || product.images.length === 0) {
    return product?.image || fallback;
  }

  if (Array.isArray(product.images)) {
    return product.images[0] || fallback;
  }

  if (typeof product.images === 'string') {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    } catch (_error) {
      return product.images;
    }
    return product.images;
  }

  return fallback;
}

function formatDateTime(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

export { formatDateTime, formatPrice, getProductImage };
