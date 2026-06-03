export function formatCurrency(value, currency = 'VND') {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}
