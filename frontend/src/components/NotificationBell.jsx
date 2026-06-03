import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import { useNotificationStore } from '../store/useNotificationStore';

export default function NotificationBell() {
  const auth = useAuth();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id) {
      fetchNotifications(auth.user.id, false).catch(() => {});
    }
  }, [auth.isAuthenticated, auth.user?.id, fetchNotifications]);

  if (!auth.isAuthenticated) return null;

  return (
    <Link className="ops-icon-btn" to="/notifications" aria-label="Thông báo">
      <Bell size={18} />
      {unreadCount ? <span className="ops-cart-count">{unreadCount}</span> : null}
    </Link>
  );
}
