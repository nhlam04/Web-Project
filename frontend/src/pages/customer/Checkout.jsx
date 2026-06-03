import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/shared/PageShell';
import { Button, Card, EmptyState, Input, Toast } from '../../components/shared/designSystem';
import { useCart } from '../../components/cart/CartProvider';
import { formatPrice } from '../../utils/formatters';
import {
  formatShippingAddress,
  getStoredShippingAddress,
  saveShippingAddress,
} from '../../utils/shippingAddress';

export default function Checkout() {
  const { cart, checkout, isBusy, refreshCart } = useCart();
  const [shippingAddress, setShippingAddress] = useState(() => getStoredShippingAddress());
  const [error, setError] = useState('');
  const items = cart?.items || [];

  useEffect(() => {
    refreshCart().catch(() => {});
  }, [refreshCart]);

  const total = useMemo(
    () => cart?.totals?.subtotal || cart?.totals?.totalAmount || cart?.totals?.total || 0,
    [cart],
  );

  function updateField(field, value) {
    setShippingAddress((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const savedAddress = saveShippingAddress(shippingAddress);

    try {
      await checkout(savedAddress);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <PageShell title="Checkout" subtitle="Cập nhật địa chỉ giao hàng trước khi đặt đơn COD.">
      {!items.length ? (
        <EmptyState
          title="Chưa có sản phẩm để checkout"
          description="Giỏ hàng cần có ít nhất một sản phẩm trước khi tạo đơn."
          action={<Button as={Link} to="/products">Quay lại sản phẩm</Button>}
        />
      ) : (
        <form className="ops-grid" onSubmit={handleSubmit}>
          <Card className="ops-stack">
            <h2>Địa chỉ giao hàng</h2>
            {error ? <Toast variant="error">{error}</Toast> : null}
            <Input
              label="Người nhận"
              required
              value={shippingAddress.recipientName}
              onChange={(event) => updateField('recipientName', event.target.value)}
            />
            <Input
              label="Số điện thoại"
              required
              value={shippingAddress.phone}
              onChange={(event) => updateField('phone', event.target.value)}
            />
            <Input
              label="Địa chỉ chi tiết"
              required
              value={shippingAddress.line1}
              onChange={(event) => updateField('line1', event.target.value)}
            />
            <Input
              label="Căn hộ, tầng, ghi chú giao hàng"
              value={shippingAddress.line2}
              onChange={(event) => updateField('line2', event.target.value)}
            />
            <div className="ops-grid">
              <Input
                label="Phường/Xã"
                required
                value={shippingAddress.ward}
                onChange={(event) => updateField('ward', event.target.value)}
              />
              <Input
                label="Quận/Huyện"
                required
                value={shippingAddress.district}
                onChange={(event) => updateField('district', event.target.value)}
              />
            </div>
            <div className="ops-grid">
              <Input
                label="Tỉnh/Thành phố"
                required
                value={shippingAddress.city}
                onChange={(event) => updateField('city', event.target.value)}
              />
              <Input
                label="Quốc gia"
                required
                value={shippingAddress.country}
                onChange={(event) => updateField('country', event.target.value)}
              />
            </div>
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
              <strong>{formatPrice(total)}</strong>
            </div>
            <div>
              <p className="ops-muted ops-small" style={{ marginBottom: 4 }}>Giao đến</p>
              <strong>{formatShippingAddress(shippingAddress) || 'Chưa nhập địa chỉ giao hàng'}</strong>
            </div>
            <Button type="submit" disabled={isBusy}>
              {isBusy ? 'Đang tạo đơn...' : 'Đặt hàng COD'}
            </Button>
          </Card>
        </form>
      )}
    </PageShell>
  );
}
