import React from 'react';
import ChangePasswordForm from '../../components/auth/ChangePasswordForm';
import { useAuth } from '../../components/auth/AuthProvider';
import { Card } from '../../components/shared/designSystem';

export default function AdminChangePasswordPage() {
  const auth = useAuth();

  return (
    <div className="ops-stack">
      <header className="ops-header">
        <div>
          <h1>Đổi mật khẩu admin</h1>
          <p>Cập nhật mật khẩu đăng nhập cho tài khoản quản trị.</p>
        </div>
      </header>

      <Card className="ops-stack">
        <h2>Thông tin tài khoản</h2>
        <div><strong>Tên đăng nhập:</strong> {auth.user?.username || 'Admin'}</div>
        <div><strong>Vai trò:</strong> {auth.role || 'ADMIN'}</div>
      </Card>

      <Card className="ops-stack">
        <h2>Đổi mật khẩu</h2>
        <p className="ops-muted">Sau khi đổi mật khẩu thành công, bạn sẽ được chuyển về trang đăng nhập.</p>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}