import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

export const apiClient = axios.create({
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.accessToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => (response.config.rawResponseData ? response.data : response.data?.data ?? response.data),
  (error) => {
    const payload = error.response?.data;
    const message = payload?.error?.message || payload?.error || payload?.message || error.message || 'Không thể kết nối API';
    return Promise.reject(new Error(message));
  },
);
