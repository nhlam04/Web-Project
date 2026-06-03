import React from 'react';
import { Card } from '../../components/shared/designSystem';

export default function ShopManagement() {
  return (
    <div className="ops-stack">
      <header className="ops-header">
        <div>
          <h1>Quản lý shop</h1>
          <p>Khung UI cho shop approval và seller profile.</p>
        </div>
      </header>
      <div className="ops-grid">
        <Card><h2>Shop đang hoạt động</h2><p className="ops-muted">Đọc từ seller/catalog khi backend có endpoint tổng hợp.</p></Card>
        <Card><h2>Cần duyệt</h2><p className="ops-muted">Chờ shop registration workflow.</p></Card>
      </div>
    </div>
  );
}
