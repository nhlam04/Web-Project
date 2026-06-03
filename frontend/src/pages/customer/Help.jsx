import React from 'react';
import PageShell from '../../components/shared/PageShell';
import { Card } from '../../components/shared/designSystem';

export default function Help() {
  return (
    <PageShell title="Hỗ trợ" subtitle="Các bước mua hàng cơ bản trong demo.">
      <div className="ops-grid">
        {['Đăng nhập hoặc đăng ký CUSTOMER', 'Chọn sản phẩm và thêm vào giỏ', 'Checkout COD', 'Theo dõi đơn hàng và fulfillment', 'Đánh giá sản phẩm sau khi hoàn tất'].map((item, index) => (
          <Card key={item}>
            <h2>Bước {index + 1}</h2>
            <p className="ops-muted">{item}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
