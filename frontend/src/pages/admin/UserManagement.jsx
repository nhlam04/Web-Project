import React from 'react';
import { Card } from '../../components/shared/designSystem';

export default function UserManagement() {
  return (
    <div className="ops-stack">
      <header className="ops-header">
        <div>
          <h1>Quản lý người dùng</h1>
          <p>IAM là source of truth cho user và role.</p>
        </div>
      </header>
      <Card>
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead><tr><th>Role</th><th>Trạng thái frontend</th><th>Endpoint liên quan</th></tr></thead>
            <tbody>
              <tr><td>CUSTOMER</td><td>Đăng ký/đăng nhập/profile</td><td>/api/auth/register, /login, /me</td></tr>
              <tr><td>SELLER</td><td>Dashboard và order fulfillment</td><td>/api/fulfillment/seller/orders</td></tr>
              <tr><td>ADMIN</td><td>Route guard đã sẵn sàng</td><td>Cần seed/admin account</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
