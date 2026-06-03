import { apiClient } from './apiClient';
import { API_BASES } from '../utils/constants';

export const authService = {
  register(payload) {
    return apiClient.post(`${API_BASES.auth}/register`, payload);
  },
  login(payload) {
    return apiClient.post(`${API_BASES.auth}/login`, payload);
  },
  me() {
    return apiClient.get(`${API_BASES.auth}/me`);
  },
};
