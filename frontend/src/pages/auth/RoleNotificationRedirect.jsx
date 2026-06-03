import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../components/auth/AuthProvider';
import NotificationPage from '../notifications/NotificationPage';

export default function RoleNotificationRedirect() {
  const auth = useAuth();
  if (auth.role === 'SELLER') return <Navigate to="/seller/notifications" replace />;
  return <NotificationPage />;
}
