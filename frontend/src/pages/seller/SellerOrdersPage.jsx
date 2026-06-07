import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { listSellerOrders, updateSellerOrder } from '../../utils/appApi';
import { formatVnd } from '../../utils/orderingApi';
import { Button, Card, EmptyState, ErrorState, Input, OrderStatusBadge, Select, Skeleton, Toast } from '../../components/shared/designSystem';

const nextActions = {
  PENDING: { action: 'confirm', label: 'Xác nhận' },
  CONFIRMED: { action: 'ship', label: 'Gửi hàng' },
  SHIPPED: { action: 'deliver', label: 'Đã giao' },
  DELIVERED: { action: 'complete', label: 'Hoàn tất' },
};

const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED'];

export default function SellerOrdersPage() {
  const auth = useAuth();
  const sellerId = auth.user?.id || '';
  const [status, setStatus] = useState('');
  const [orders, setOrders] = useState([]);
  const [shipping, setShipping] = useState({ carrier: 'GHN', trackingCode: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      if (!sellerId) {
        setOrders([]);
        return;
      }
      const payload = await listSellerOrders({ sellerId, status });
      setOrders(payload.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sellerId, status]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function runAction(order, action) {
    const allowedAction = nextActions[order.status]?.action;
    if (action !== allowedAction) return;

    setBusyId(order.id);
    setMessage('');
    setError('');
    try {
      const body = action === 'ship'
        ? { carrier: shipping.carrier, trackingCode: shipping.trackingCode || `TRK-${order.id.slice(0, 8)}` }
        : {};
      await updateSellerOrder(order.id, action, body, sellerId);
      setMessage(`Đã cập nhật ${order.id}.`);
      await loadOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  const summary = statuses.reduce((acc, item) => {
    acc[item] = orders.filter((order) => order.status === item).length;
    return acc;
  }, {});

  const totalValue = orders.reduce((total, order) => (
    total + (order.items || []).reduce((lineTotal, item) => lineTotal + Number(item.lineTotal || 0), 0)
  ), 0);

  return (
    <div className="ops-stack">
      <header className="ops-header">
        <div>
          <h1>Đơn hàng người bán</h1>
          <p>{sellerId ? `ID người bán: ${sellerId}` : 'Cần tài khoản NGƯỜI BÁN để xem đơn hàng.'}</p>
        </div>
        <div className="ops-kpi">
          <span className="ops-muted">Giá trị</span>
          <strong>{formatVnd(totalValue)}</strong>
        </div>
      </header>

      {message ? <Toast>{message}</Toast> : null}
      {error ? <ErrorState title="Không thể tải đơn người bán" description={error} /> : null}

      <div className="ops-grid">
        {statuses.map((item) => (
          <Card className="ops-kpi" key={item}>
            <span className="ops-muted">{item}</span>
            <strong>{summary[item] || 0}</strong>
            <OrderStatusBadge status={item} />
          </Card>
        ))}
      </div>

      <Card className="ops-grid">
        <Input label="ID Người bán" value={sellerId || 'Chưa có người bán đăng nhập'} readOnly />
        <Select label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tất cả</option>
          {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Input label="Đơn vị vận chuyển" value={shipping.carrier} onChange={(event) => setShipping({ ...shipping, carrier: event.target.value })} />
        <Input label="Mã theo dõi" value={shipping.trackingCode} onChange={(event) => setShipping({ ...shipping, trackingCode: event.target.value })} />
        <Button onClick={loadOrders} disabled={!sellerId || loading}>{loading ? 'Đang tải...' : 'Tải danh sách'}</Button>
      </Card>

      {loading ? <Skeleton className="card" /> : null}
      {!loading && !orders.length ? <EmptyState title="Không có đơn giao hàng" description="Người bán chỉ có thể xem các đơn hàng chứa sản phẩm của mình." /> : null}

      {!loading && orders.length ? (
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Mã giao hàng</th>
                <th>Trạng thái</th>
                <th>Sản phẩm</th>
                <th>Tổng</th>
                <th>Vận chuyển</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const nextAction = nextActions[order.status];
                const orderTotal = (order.items || []).reduce((total, item) => total + Number(item.lineTotal || 0), 0);
                return (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.id}</strong>
                      <div className="ops-muted ops-small">Đơn hàng: {order.orderId}</div>
                    </td>
                    <td><OrderStatusBadge status={order.status} /></td>
                    <td>{(order.items || []).map((item) => <div key={item.productId}>{item.name || item.productId} x {item.quantity}</div>)}</td>
                    <td>{formatVnd(orderTotal)}</td>
                    <td>
                      <div>{order.carrier || 'Chưa có'}</div>
                      <div className="ops-muted ops-small">{order.trackingCode || 'Chưa có mã theo dõi'}</div>
                    </td>
                    <td>
                      {nextAction ? (
                        <Button disabled={busyId === order.id} onClick={() => runAction(order, nextAction.action)}>
                          {busyId === order.id ? 'Đang xử lý...' : nextAction.label}
                        </Button>
                      ) : (
                        <Button disabled variant="secondary">Không có hành động</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
