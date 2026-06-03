import { create } from 'zustand';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notificationService';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: '',
  async fetchNotifications(userId, unreadOnly = false) {
    set({ loading: true, error: '' });
    try {
      const notifications = await listNotifications(userId, unreadOnly);
      set({
        notifications,
        unreadCount: notifications.filter((item) => !item.readAt).length,
        loading: false,
      });
      return notifications;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  async markRead(notificationId) {
    await markNotificationRead(notificationId);
    const notifications = get().notifications.map((item) => (
      item.id === notificationId ? { ...item, readAt: item.readAt || new Date().toISOString() } : item
    ));
    set({ notifications, unreadCount: notifications.filter((item) => !item.readAt).length });
  },
  async markAllRead(userId) {
    await markAllNotificationsRead(userId);
    const notifications = get().notifications.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }));
    set({ notifications, unreadCount: 0 });
  },
}));
