import React from 'react';
import { Card } from '../../components/shared/designSystem';

export default function ProductManagement() {
  return (
    <div className="ops-stack">
      <header className="ops-header">
        <div>
          <h1>Quản lý sản phẩm</h1>
          <p>Theo dõi sản phẩm từ Catalog Service và luồng seller.</p>
        </div>
      </header>
      <Card>
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead><tr><th>Chức năng</th><th>Trạng thái</th><th>Nguồn</th></tr></thead>
            <tbody>
              <tr><td>Duyệt sản phẩm seller</td><td><span className="ops-badge warning">UI scaffold</span></td><td>Catalog Service</td></tr>
              <tr><td>Danh sách public</td><td><span className="ops-badge success">Đã route</span></td><td>/products</td></tr>
              <tr><td>Tạo/cập nhật seller</td><td><span className="ops-badge success">Đã route</span></td><td>/seller/products</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
