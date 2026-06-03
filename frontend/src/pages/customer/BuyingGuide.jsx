import React from 'react';
import PageShell from '../../components/shared/PageShell';
import { Card } from '../../components/shared/designSystem';

const steps = [
  'Đăng nhập hoặc đăng ký tài khoản khách hàng.',
  'Chọn sản phẩm từ trang chủ, danh mục hoặc danh sách sản phẩm.',
  'Thêm sản phẩm vào giỏ hàng và kiểm tra số lượng.',
  'Checkout COD để tạo đơn hàng.',
  'Theo dõi trạng thái fulfillment và đánh giá sau khi đơn hoàn tất.',
];

export default function BuyingGuide() {
  return (
    <PageShell title="Hướng dẫn mua hàng" subtitle="Các bước mua hàng trên giao diện demo.">
      <div className="ops-grid">
        {steps.map((step, index) => (
          <Card key={step}>
            <h2>Bước {index + 1}</h2>
            <p className="ops-muted">{step}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
