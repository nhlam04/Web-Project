import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/shared/designSystem';

export default function OrderManagement() {
  return (
    <div className="ops-stack">
      <header className="ops-header">
        <div>
          <h1>Quản lý đơn hàng</h1>
          <p>Theo dõi order flow và fulfillment theo role.</p>
        </div>
        <Button as={Link} to="/orders">Customer orders</Button>
      </header>
      <Card>
        <p className="ops-muted">Admin aggregate order API chưa có trong backend. Customer order detail và seller fulfillment đang được route riêng.</p>
      </Card>
    </div>
  );
}
