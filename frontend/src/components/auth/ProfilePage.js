import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import ChangePasswordForm from './ChangePasswordForm';
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
    >
      <section className="ops-card ops-stack">
        <h2>Thông tin tài khoản</h2>
        <p><strong>Tên đăng nhập:</strong> {user?.username || 'Chưa đăng nhập'}</p>
        <p><strong>Vai trò:</strong> {user?.role || 'Chưa có'}</p>

        <div className="ops-actions">
          <button className="ops-button danger" onClick={handleLogout}>Đăng xuất</button>
        </div>

        <div className="ops-divider" />

        <h2>Đổi mật khẩu</h2>
        <p className="ops-muted">Cập nhật mật khẩu đăng nhập cho tài khoản hiện tại.</p>
        <ChangePasswordForm />
      </section>
    </PageShell>
  );
};

export default ProfilePage;
