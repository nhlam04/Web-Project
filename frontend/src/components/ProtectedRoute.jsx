import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PageShell from './shared/PageShell';
import { Skeleton } from './shared/designSystem';
import { useAuth } from './auth/AuthProvider';

export default function ProtectedRoute({ children, role, roles }) {
  const auth = useAuth();
  const location = useLocation();
  const allowedRoles = roles || (role ? [role.toUpperCase()] : []);

  if (auth.loading) {
    return (
      <PageShell title="?ang ki?m tra quy?n">
        <Skeleton className="card" />
      </PageShell>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles.length && !allowedRoles.includes(auth.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
