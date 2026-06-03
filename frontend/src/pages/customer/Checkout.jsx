import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/shared/PageShell';
import { Button, Card, EmptyState } from '../../components/shared/designSystem';
import { useCart } from '../../components/cart/CartProvider';
import { formatPrice } from '../../utils/formatters';

export default function Checkout() {
  const { cart, checkout, isBusy, refreshCart } = useCart();
  const items = cart?.items || [];

  useEffect(() => {
    refreshCart().catch(() => {});
  }, [refreshCart]);

  return (
    <PageShell title="Checkout" subtitle="Thanh toán COD bằng Ordering Service hiện tại.">
      {!items.length ? (
        <EmptyState
          title="Chưa có sản phẩm để checkout"
          description="Giỏ hàng cần có ít nhất một sản phẩm trước khi tạo đơn."
          action={<Button as={Link} to="/products">Quay lại sản phẩm</Button>}
        />
      ) : (
        <div className="ops-grid">
          <Card className="ops-stack">
            <h2>Địa chỉ giao hàng demo</h2>
            <p className="ops-muted">Recipient: Người dùng demo</p>
            <p className="ops-muted">Phone: 0900000000</p>
            <p className="ops-muted">Address: 123 Nguyen Trai, Quan 1, TP Ho Chi Minh</p>
          </Card>
          <Card className="ops-stack">
            <h2>Tóm tắt đơn hàng</h2>
            {items.map((item) => (
              <div className="ops-row" key={item.productId}>
                <span>{item.name} x {item.quantity}</span>
                <strong>{formatPrice(item.lineTotal || item.unitPrice * item.quantity)}</strong>
              </div>
            ))}
            <div className="ops-row">
              <strong>Tổng thanh toán</strong>
              <strong>{formatPrice(cart?.totals?.totalAmount || 0)}</strong>
            </div>
            <Button onClick={checkout} disabled={isBusy}>{isBusy ? 'Đang tạo đơn...' : 'Đặt hàng COD'}</Button>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
