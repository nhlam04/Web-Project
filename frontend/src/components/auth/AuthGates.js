import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import PageShell from '../shared/PageShell';
import { Button, Card, ErrorState, Skeleton } from '../shared/designSystem';
import { getRoleHomePath } from '../../utils/authRoutes';

const AuthRequiredState = ({ requiredRole }) => (
  <PageShell title="Cần đăng nhập" actions={[{ label: 'Đăng nhập', to: '/login' }, { label: 'Đăng ký', to: '/register' }]}>
    <Card className="ops-stack">
      <h2>Cần đăng nhập</h2>
      <p className="ops-muted">
        {requiredRole ? `Trang này yêu cầu vai trò ${requiredRole}.` : 'Vui lòng đăng nhập để tiếp tục.'}
      </p>
      <div className="ops-actions">
        <Button as={Link} to="/login">Đăng nhập</Button>
        <Button as={Link} variant="secondary" to="/register">Đăng ký</Button>
      </div>
    </Card>
  </PageShell>
);

const AccessDeniedState = ({ requiredRole }) => (
  <PageShell title="Không có quyền truy cập" actions={[{ label: 'Trang chủ', to: '/' }, { label: 'Hồ sơ', to: '/profile' }]}>
    <ErrorState
      title="Không có quyền truy cập"
      description={requiredRole ? `Trang này chỉ dành ch? ${requiredRole}.` : 'Tài khoản hiện tại không đủ quyền truy cập trang này.'}
      action={<Button as={Link} to="/">Về trang chủ</Button>}
    />
  </PageShell>
);

const RequireAuth = ({ children }) => {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) return <PageShell title="Đang kiểm tra đăng nhập"><Skeleton className="card" /></PageShell>;
  if (!auth.isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
};

const RequireRole = ({ children, roles = [] }) => {
  const auth = useAuth();
  const location = useLocation();
  const allowed = roles.includes(auth.role);

  if (auth.loading) return <PageShell title="Đang kiểm tra quyền"><Skeleton className="card" /></PageShell>;
  if (!auth.isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!allowed) return <AccessDeniedState requiredRole={roles.join(' hoac ')} />;
  return children;
};

const GuestOnly = ({ children }) => {
  const auth = useAuth();
  if (auth.loading) return <PageShell title="Đang tải"><Skeleton className="card" /></PageShell>;
  if (auth.isAuthenticated) return <Navigate to={getRoleHomePath(auth.role)} replace />;
  return children;
};

export { AuthRequiredState, GuestOnly, RequireAuth, RequireRole };
