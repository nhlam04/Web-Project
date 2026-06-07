import { apiClient } from './apiClient';
import { API_BASES } from '../utils/constants';

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

export const adminService = {
  listUsers(params = {}) {
    return apiClient.get(`${API_BASES.auth}/admin/users${buildQuery(params)}`, { rawResponseData: true });
  },

  getUser(userId) {
    return apiClient.get(`${API_BASES.auth}/admin/users/${userId}`);
  },

  updateUserRole(userId, role) {
    return apiClient.patch(`${API_BASES.auth}/admin/users/${userId}/role`, { role });
  },

  updateUserApprovalStatus(userId, approvalStatus) {
    return apiClient.patch(`${API_BASES.auth}/admin/users/${userId}/approval-status`, { approvalStatus });
  },

  lockUser(userId, hours = 24) {
    return apiClient.patch(`${API_BASES.auth}/admin/users/${userId}/lock`, { hours });
  },

  unlockUser(userId) {
    return apiClient.patch(`${API_BASES.auth}/admin/users/${userId}/unlock`);
  },
};

export default adminService;