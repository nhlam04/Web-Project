import React from 'react';
import { Card } from '../../components/shared/designSystem';
import { useAuth } from '../../components/auth/AuthProvider';

export default function ShopProfile() {
  const auth = useAuth();

  return (
    <div className="ops-stack">
      <header className="ops-header">
        <div>
          <h1>Hồ sơ shop</h1>
          <p>Thông tin shop gắn với tài khoản seller đang đăng nhập.</p>
        </div>
      </header>
      <Card className="ops-stack">
        <div><strong>Chủ shop:</strong> {auth.user?.username || 'Chưa có'}</div>
        <div><strong>Trạng thái:</strong> <span className="ops-badge success">Đang hoạt động</span></div>
      </Card>
    </div>
  );
}
