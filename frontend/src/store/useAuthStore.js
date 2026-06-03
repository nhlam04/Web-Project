import { create } from 'zustand';
import { authService } from '../services/authService';
import { STORAGE_KEYS } from '../utils/constants';

function readStoredUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

export const useAuthStore = create((set, get) => ({
  user: readStoredUser(),
  token: localStorage.getItem(STORAGE_KEYS.accessToken),
  loading: false,
  error: '',
  get role() {
    return get().user?.role || '';
  },
  get isAuthenticated() {
    return Boolean(get().user);
  },
  async login(username, password) {
    set({ loading: true, error: '' });
    try {
      const payload = await authService.login({ username, password });
      localStorage.setItem(STORAGE_KEYS.accessToken, payload.accessToken);
      localStorage.setItem(STORAGE_KEYS.refreshToken, payload.refreshToken);
      const user = await authService.me();
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      set({ user, token: payload.accessToken, loading: false });
      return user;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  async register(username, password, role = 'CUSTOMER') {
    return authService.register({ username, password, role });
  },
  async fetchMe() {
    if (!localStorage.getItem(STORAGE_KEYS.accessToken)) return null;
    set({ loading: true, error: '' });
    try {
      const user = await authService.me();
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      set({ user, loading: false });
      return user;
    } catch (error) {
      get().logout();
      set({ error: error.message, loading: false });
      return null;
    }
  },
  logout() {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.cart);
    set({ user: null, token: null, error: '' });
  },
}));
