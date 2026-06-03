import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/shared/designSystem';

export default function CategoryManagement() {
  return (
    <div className="ops-stack">
      <header className="ops-header">
        <div>
          <h1>Quản lý danh mục</h1>
          <p>Điều hướng tới catalog categories và chuẩn bị CRUD khi backend mở endpoint ghi.</p>
        </div>
        <Button as={Link} to="/">Trang chủ</Button>
      </header>
      <Card>
        <p className="ops-muted">Catalog category browse đã có ở customer route `/catalogs/:catalogId`; admin write API chưa được expose trong frontend hiện tại.</p>
      </Card>
    </div>
  );
}
