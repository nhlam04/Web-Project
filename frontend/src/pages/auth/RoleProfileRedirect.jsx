import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../components/auth/AuthProvider';
import ProfilePage from './ProfilePage';

export default function RoleProfileRedirect() {
  const auth = useAuth();
  if (auth.role === 'SELLER') return <Navigate to="/seller/profile" replace />;
  return <ProfilePage />;
}
