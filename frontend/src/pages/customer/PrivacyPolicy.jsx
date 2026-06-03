import React from 'react';
import PageShell from '../../components/shared/PageShell';
import { Card } from '../../components/shared/designSystem';

export default function PrivacyPolicy() {
  return (
    <PageShell title="Chính sách bảo mật" subtitle="Cách hệ thống demo xử lý thông tin tài khoản và đơn hàng.">
      <Card className="ops-stack">
        <h2>Dữ liệu được lưu</h2>
        <p className="ops-muted">Hệ thống lưu thông tin đăng nhập, vai trò người dùng, giỏ hàng, đơn hàng, thông báo và đánh giá để phục vụ các luồng nghiệp vụ.</p>
        <h2>Phạm vi sử dụng</h2>
        <p className="ops-muted">Dữ liệu chỉ được dùng trong phạm vi demo microservices và kiểm thử cục bộ của dự án.</p>
      </Card>
    </PageShell>
  );
}
