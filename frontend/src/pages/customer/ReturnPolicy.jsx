import React from 'react';
import PageShell from '../../components/shared/PageShell';
import { Card } from '../../components/shared/designSystem';

export default function ReturnPolicy() {
  return (
    <PageShell title="Chính sách đổi trả" subtitle="Quy định đổi trả áp dụng cho demo marketplace.">
      <Card className="ops-stack">
        <h2>Điều kiện đổi trả</h2>
        <p className="ops-muted">Sản phẩm còn nguyên trạng, đủ phụ kiện và được gửi yêu cầu trong vòng 7 ngày sau khi nhận hàng.</p>
        <h2>Quy trình xử lý</h2>
        <p className="ops-muted">Khách hàng gửi yêu cầu qua trang đơn hàng, seller xác nhận tình trạng sản phẩm, sau đó hệ thống cập nhật trạng thái hoàn tất.</p>
      </Card>
    </PageShell>
  );
}
