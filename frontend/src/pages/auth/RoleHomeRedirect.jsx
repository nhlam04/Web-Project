import React from 'react';
import { Navigate } from 'react-router-dom';
import PageShell from '../../components/shared/PageShell';
import { Skeleton } from '../../components/shared/designSystem';
import { useAuth } from '../../components/auth/AuthProvider';
import Home from '../customer/Home';
import { getRoleHomePath } from '../../utils/authRoutes';

export default function RoleHomeRedirect() {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <PageShell title="Đang tải">
        <Skeleton className="card" />
      </PageShell>
    );
  }

  if (auth.role === 'ADMIN' || auth.role === 'SELLER') {
    return <Navigate to={getRoleHomePath(auth.role)} replace />;
  }

  return <Home />;
}
