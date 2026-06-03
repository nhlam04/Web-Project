import React, { useCallback, useEffect, useState } from 'react';
import PageShell from '../shared/PageShell';
import { getStoredUser, listSellerOrders, updateSellerOrder } from '../../utils/appApi';
import { formatVnd } from '../../utils/orderingApi';
import { Button, Card, EmptyState, ErrorState, Input, OrderStatusBadge, Select, Skeleton, Toast } from '../shared/designSystem';

const nextActions = {
  PENDING: { action: 'confirm', label: 'Xác nhận' },
  CONFIRMED: { action: 'ship', label: 'Gửi hàng' },
  SHIPPED: { action: 'deliver', label: 'Đã gi?o' },
  DELIVERED: { action: 'complete', label: 'Hoàn tất' },
};

const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED'];

const SellerOrdersPage = () => {
  const [user] = useState(getStoredUser());
  const sellerId = user?.role === 'SELLER' ? user.id : '';
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
    <PageShell
      title="Đơn hàng người bán"
      subtitle={sellerId ? `Seller ID: ${sellerId}` : 'Cần tài khoản người bán'}
      actions={[{ label: 'Hồ sơ', to: '/profile' }, { label: 'Thông báo', to: '/notifications' }]}
      context={(
        <div className="ops-grid">
          <div className="ops-kpi">
            <span className="ops-muted">Đang hiển thị</span>
            <strong>{orders.length}</strong>
          </div>
          <div className="ops-kpi">
            <span className="ops-muted">Giá trị</span>
            <strong>{formatVnd(totalValue)}</strong>
          </div>
        </div>
      )}
    >
      <style>{`
        .seller-dashboard { display: grid; gap: 16px; }
        .seller-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
        .seller-kpi { display: grid; gap: 6px; min-height: 108px; }
        .seller-kpi span { color: #64748b; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
        .seller-kpi strong { color: #0f172a; font-size: 30px; }
        .seller-controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; align-items: end; }
        .seller-table-id { display: grid; gap: 4px; min-width: 220px; }
        .seller-item-list { display: grid; gap: 4px; min-width: 220px; }
        .seller-action-cell { min-width: 140px; }
      `}</style>
      {message ? <Toast>{message}</Toast> : null}
      {error ? <ErrorState title="Không thể tải đơn người bán" description={error} /> : null}
      {!sellerId ? (
        <Toast variant="error">Cần đăng nhập bằng tài khoản SELLER để xem và cập nhật đơn người bán.</Toast>
      ) : null}

      <div className="seller-dashboard">
        <div className="seller-summary">
          {statuses.map((item) => (
            <Card className="seller-kpi" key={item}>
              <span>{item}</span>
              <strong>{summary[item] || 0}</strong>
              <OrderStatusBadge status={item} />
            </Card>
          ))}
        </div>

        <Card className="seller-controls">
          <Input label="Seller ID" value={sellerId || 'Chưa có seller đăng nhập'} readOnly />
          <Select label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Input label="Đơn vị vận ch?yển mặc định khi gửi hàng" value={shipping.carrier} onChange={(e) => setShipping({ ...shipping, carrier: e.target.value })} />
          <Input label="Mã theo dõi khi gửi hàng" value={shipping.trackingCode} onChange={(e) => setShipping({ ...shipping, trackingCode: e.target.value })} />
          <Button onClick={loadOrders} disabled={!sellerId || loading}>{loading ? 'Đang tải...' : 'Tải danh sách'}</Button>
        </Card>

        {loading ? <Skeleton className="card" /> : null}

        {!loading && !orders.length ? (
          <EmptyState
            title="Không có đơn fulfillment"
            description="Tài khoản seller mới chỉ thấy đơn hàng có product sellerId khớp với IAM user ID."
          />
        ) : null}

        {!loading && orders.length ? (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Fulfillment</th>
                  <th>Trạng thái</th>
                  <th>Sản phẩm</th>
                  <th>Tổng</th>
                  <th>Vận ch?yển</th>
                  <th>Hành động tiếp theo</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const nextAction = nextActions[order.status];
                  const orderTotal = (order.items || []).reduce((total, item) => total + Number(item.lineTotal || 0), 0);
                  return (
                    <tr key={order.id}>
                      <td>
                        <div className="seller-table-id">
                          <strong>{order.id}</strong>
                          <span className="ops-muted ops-small">Đơn hàng: {order.orderId}</span>
                          <span className="ops-muted ops-small">Khách hàng: {order.customerId}</span>
                        </div>
                      </td>
                      <td><OrderStatusBadge status={order.status} /></td>
                      <td>
                        <div className="seller-item-list">
                          {(order.items || []).map((item) => (
                            <span key={item.productId}>{item.name || item.productId} x {item.quantity}</span>
                          ))}
                        </div>
                      </td>
                      <td>{formatVnd(orderTotal)}</td>
                      <td>
                        <div className="seller-item-list">
                          <span>{order.carrier || 'Chưa có'}</span>
                          <span className="ops-muted ops-small">{order.trackingCode || 'Chưa có mã theo dõi'}</span>
                        </div>
                      </td>
                      <td className="seller-action-cell">
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
    </PageShell>
  );
};

export default SellerOrdersPage;
