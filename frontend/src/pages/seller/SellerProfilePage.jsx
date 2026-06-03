import React from 'react';
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
    </div>
  );
}
