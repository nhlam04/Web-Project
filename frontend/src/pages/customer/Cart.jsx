import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/shared/PageShell';
import { Button, Card, EmptyState } from '../../components/shared/designSystem';
import { useCart } from '../../components/cart/CartProvider';
import { formatPrice } from '../../utils/formatters';

export default function Cart() {
  const { cart, isBusy, refreshCart, removeItem, updateItemQuantity } = useCart();
  const items = cart?.items || [];

  useEffect(() => {
    refreshCart().catch(() => {});
  }, [refreshCart]);

  return (
    <PageShell title="Giỏ hàng" actions={[{ label: 'Tiếp tục mua', to: '/products' }, { label: 'Checkout', to: '/checkout' }]}>
      {!items.length ? (
        <EmptyState
          title="Giỏ hàng đang trống"
          description="Chọn sản phẩm trong trang sản phẩm để bắt đầu tạo đơn hàng."
          action={<Button as={Link} to="/products">Xem sản phẩm</Button>}
        />
      ) : (
        <Card className="ops-stack">
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Tạm tính</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td>{item.name}</td>
                    <td>
                      <div className="ops-actions">
                        <Button variant="ghost" disabled={isBusy} onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}>-</Button>
                        <strong>{item.quantity}</strong>
                        <Button variant="ghost" disabled={isBusy} onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}>+</Button>
                      </div>
                    </td>
                    <td>{formatPrice(item.unitPrice)}</td>
                    <td>{formatPrice(item.lineTotal || item.unitPrice * item.quantity)}</td>
                    <td><Button variant="ghost" disabled={isBusy} onClick={() => removeItem(item.productId)}>Xóa</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ops-row">
            <strong>Tổng: {formatPrice(cart?.totals?.subtotal || cart?.totals?.totalAmount || 0)}</strong>
            <Button as={Link} to="/checkout">Nhập địa chỉ giao hàng</Button>
          </div>
        </Card>
      )}
    </PageShell>
  );
}
