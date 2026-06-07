import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import { DEMO_USER_ID, getStoredUser, listOrders } from '../../utils/appApi';
import { formatVnd } from '../../utils/orderingApi';
import { formatShippingAddress, formatShippingRecipient } from '../../utils/shippingAddress';
import { Button, Card, EmptyState, ErrorState, Input, OrderStatusBadge, Skeleton } from '../shared/designSystem';

const OrderListPage = () => {
  const [user] = useState(getStoredUser());
  const [userId, setUserId] = useState(user?.id || DEMO_USER_ID);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async (nextUserId = userId) => {
    setLoading(true);
    setError('');
    try {
      setOrders(await listOrders(nextUserId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <PageShell
      title="Đơn hàng của tôi"
      subtitle={user ? `Tài khoản: ${user.username}` : 'Đơn hàng demo của khách'}
    >
      {error ? <ErrorState title="Không thể tải đơn hàng" description={error} /> : null}
      {!user ? (
        <Card className="ds-row" style={{ marginBottom: 16 }}>
          <div>
            <strong>Đơn hàng demo</strong>
            <p className="ops-muted ops-small" style={{ margin: '4px 0 0' }}>Đang xem đơn hàng của tài khoản khách.</p>
          </div>
          <Button onClick={() => loadOrders(userId)}>Tải lại</Button>
        </Card>
      ) : (
        <Card className="ds-row" style={{ marginBottom: 16 }}>
          <Button onClick={() => loadOrders(user.id)}>Tải lại</Button>
        </Card>
      )}
      {loading ? (
        <div className="ops-stack">
          <Skeleton className="card" />
          <Skeleton className="card" />
        </div>
      ) : null}
      {!loading && !orders.length ? <EmptyState title="Chưa có đơn hàng" description="Đơn hàng mới sẽ xuất hiện sau khi đặt hàng thành công." /> : null}
      {!loading && orders.length ? (
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Trạng thái</th>
                <th>Giao đến</th>
                <th>Số lượng</th>
                <th>Tổng tiền</th>
                <th>Ngày tạo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td><OrderStatusBadge status={order.status} /></td>
                  <td>
                    <strong>{formatShippingRecipient(order.shippingAddress) || 'Chưa có thông tin'}</strong>
                    <div className="ops-muted ops-small">{formatShippingAddress(order.shippingAddress) || 'Chưa có địa chỉ'}</div>
                  </td>
                  <td>{order.totals?.totalQuantity || order.items?.length || 0}</td>
                  <td>{formatVnd(order.totals?.subtotal || order.totals?.totalAmount || 0)}</td>
                  <td>{order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'N/A'}</td>
                  <td><Button as={Link} variant="secondary" to={`/orders/${order.id}`}>Chi tiết</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </PageShell>
  );
};

export default OrderListPage;
