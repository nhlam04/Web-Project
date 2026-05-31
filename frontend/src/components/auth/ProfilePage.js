import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import { getActiveUserId } from '../../utils/appApi';
import { useAuth } from './AuthProvider';

const ProfilePage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth.user;

  function handleLogout() {
    auth.logout();
    navigate('/login');
  }

  return (
    <PageShell
      title="Hồ sơ người dùng"
      subtitle="Thông tin tài khoản đang đăng nhập."
      actions={[
        ...(auth.isCustomer ? [{ label: 'Đơn hàng', to: '/orders' }] : []),
        { label: 'Thông báo', to: '/notifications' },
        ...(auth.isSeller ? [{ label: 'Đơn người bán', to: '/seller/orders' }] : []),
      ]}
      context={(
        <div className="ops-stack">
          <div className="ops-kpi">
            <span className="ops-muted">Vai trò</span>
            <strong>{user?.role || 'Khách'}</strong>
          </div>
          <p className="ops-muted ops-small">{user?.id || getActiveUserId()}</p>
        </div>
      )}
    >
      <div className="ops-grid">
        <section className="ops-card ops-stack">
          <h2>Thông tin tài khoản</h2>
          <p><strong>User ID:</strong> {user?.id || getActiveUserId()}</p>
          <p><strong>Tên đăng nhập:</strong> {user?.username || 'Chưa đăng nhập'}</p>
          <p><strong>Vai trò:</strong> {user?.role || 'Chưa có'}</p>
          <div className="ops-actions">
            {auth.isCustomer ? <Link className="ops-button" to="/orders">Xem đơn hàng</Link> : null}
            <Link className="ops-button secondary" to="/notifications">Xem thông báo</Link>
            {auth.isSeller ? <Link className="ops-button secondary" to="/seller/orders">Đơn người bán</Link> : null}
            <button className="ops-button danger" onClick={handleLogout}>Đăng xuất</button>
          </div>
        </section>
      </div>
    </PageShell>
  );
};

export default ProfilePage;
