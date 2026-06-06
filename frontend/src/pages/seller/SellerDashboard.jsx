import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/shared/designSystem';

export default function SellerDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 m-0 mb-1">Seller dashboard</h1>
          <p className="text-slate-500 m-0">Tập trung vào đơn cần xử lý, sản phẩm và hồ sơ shop.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button as={Link} to="/seller/orders">Đơn hàng</Button>
          <Button as={Link} variant="secondary" to="/seller/products">Sản phẩm</Button>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col gap-1 min-h-[108px] justify-center">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Đơn đang xử lý</span>
          <strong className="text-3xl font-bold text-slate-900">0</strong>
        </Card>
        <Card className="flex flex-col gap-1 min-h-[108px] justify-center">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Sản phẩm</span>
          <strong className="text-3xl font-bold text-slate-900">0</strong>
        </Card>
        <Card className="flex flex-col gap-1 min-h-[108px] justify-center">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Thông báo mới</span>
          <strong className="text-3xl font-bold text-slate-900">0</strong>
        </Card>
      </div>
    </div>
  );
}
