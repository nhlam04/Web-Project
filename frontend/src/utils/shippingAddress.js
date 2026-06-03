const SHIPPING_ADDRESS_STORAGE_KEY = 'checkout_shipping_address';

const DEFAULT_SHIPPING_ADDRESS = {
  recipientName: '',
  phone: '',
  line1: '',
  line2: '',
  ward: '',
  district: '',
  city: '',
  country: 'VN',
};

function normalizeShippingAddress(address = {}) {
  if (typeof address === 'string') {
    try {
      return normalizeShippingAddress(JSON.parse(address));
    } catch (_error) {
      return { ...DEFAULT_SHIPPING_ADDRESS };
    }
  }

  return {
    ...DEFAULT_SHIPPING_ADDRESS,
    ...address,
    country: address.country || DEFAULT_SHIPPING_ADDRESS.country,
  };
}

function getStoredShippingAddress() {
  const raw = localStorage.getItem(SHIPPING_ADDRESS_STORAGE_KEY);
  if (!raw) {
    return { ...DEFAULT_SHIPPING_ADDRESS };
  }

  try {
    return normalizeShippingAddress(JSON.parse(raw));
  } catch (_error) {
    localStorage.removeItem(SHIPPING_ADDRESS_STORAGE_KEY);
    return { ...DEFAULT_SHIPPING_ADDRESS };
  }
}

function saveShippingAddress(address) {
  const normalized = normalizeShippingAddress(address);
  localStorage.setItem(SHIPPING_ADDRESS_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function formatShippingAddress(address = {}) {
  const normalized = normalizeShippingAddress(address);
  return [
    normalized.line1,
    normalized.line2,
    normalized.ward,
    normalized.district,
    normalized.city,
    normalized.country,
  ].filter(Boolean).join(', ');
}

function formatShippingRecipient(address = {}) {
  const normalized = normalizeShippingAddress(address);
  return [normalized.recipientName, normalized.phone].filter(Boolean).join(' - ');
}

export {
  DEFAULT_SHIPPING_ADDRESS,
  SHIPPING_ADDRESS_STORAGE_KEY,
  formatShippingAddress,
  formatShippingRecipient,
  getStoredShippingAddress,
  normalizeShippingAddress,
  saveShippingAddress,
};
