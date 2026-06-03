import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/shared/designSystem';

export default function SellerDashboard() {
  return (
    <div className="ops-stack">
      <header className="ops-header">
        <div>
          <h1>Seller dashboard</h1>
          <p>Tập trung vào đơn cần xử lý, sản phẩm và hồ sơ shop.</p>
        </div>
        <div className="ops-actions">
          <Button as={Link} to="/seller/orders">Đơn hàng</Button>
          <Button as={Link} variant="secondary" to="/seller/products">Sản phẩm</Button>
        </div>
      </header>
      <div className="ops-grid">
        <Card className="ops-kpi">
          <span className="ops-muted">Đơn đang xử lý</span>
          <strong>0</strong>
        </Card>
        <Card className="ops-kpi">
          <span className="ops-muted">Sản phẩm</span>
          <strong>0</strong>
        </Card>
        <Card className="ops-kpi">
          <span className="ops-muted">Thông báo mới</span>
          <strong>0</strong>
        </Card>
      </div>
    </div>
  );
}
