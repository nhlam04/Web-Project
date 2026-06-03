import { apiClient } from './apiClient';
import { API_BASES } from '../utils/constants';

function sellerHeaders(sellerId) {
  return { 'x-seller-id': sellerId };
}

export const catalogService = {
  listProducts({ skip = 0, limit = 12 } = {}) {
    return apiClient.get(`${API_BASES.catalog}/api/v1/products/`, { params: { skip, limit } });
  },
  getProduct(productId) {
    return apiClient.get(`${API_BASES.catalog}/api/v1/products/${productId}`);
  },
  listCategories() {
    return apiClient.get(`${API_BASES.catalog}/api/v1/catalogs/`);
  },
  listCatalogProducts(catalogId, { skip = 0, limit = 50 } = {}) {
    return apiClient.get(`${API_BASES.catalog}/api/v1/catalogs/${catalogId}/products`, { params: { skip, limit } });
  },
  listSellerProducts(sellerId, { skip = 0, limit = 100 } = {}) {
    return apiClient.get(`${API_BASES.catalog}/api/v1/products/seller`, {
      params: { skip, limit },
      headers: sellerHeaders(sellerId),
    });
  },
  createSellerProduct(sellerId, payload) {
    return apiClient.post(`${API_BASES.catalog}/api/v1/products/seller`, payload, {
      headers: sellerHeaders(sellerId),
    });
  },
  updateSellerProduct(sellerId, productId, payload) {
    return apiClient.put(`${API_BASES.catalog}/api/v1/products/seller/${productId}`, payload, {
      headers: sellerHeaders(sellerId),
    });
  },
};
