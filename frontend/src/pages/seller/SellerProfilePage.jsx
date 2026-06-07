import React from 'react';
import ChangePasswordForm from '../../components/auth/ChangePasswordForm';
import { Card } from '../../components/shared/designSystem';
import { useAuth } from '../../components/auth/AuthProvider';

export default function SellerProfilePage() {
  const auth = useAuth();

  return (
    <div className="ops-stack">
      <header className="ops-header">
        <div>
          <h1>Hồ sơ seller</h1>
          <p>Thông tin tài khoản người bán đang đăng nhập.</p>
        </div>
      </header>
      <Card className="ops-stack">
        <div><strong>Tên đăng nhập:</strong> {auth.user?.username}</div>
        <div><strong>Email:</strong> {auth.user?.email || 'Chưa có'}</div>
        <div><strong>Vai trò:</strong> {auth.role}</div>
      </Card>

      <Card className="ops-stack">
        <h2>Đổi mật khẩu</h2>
        <p className="ops-muted">Cập nhật mật khẩu đăng nhập cho tài khoản người bán.</p>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
