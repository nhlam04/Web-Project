import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import { DEMO_USER_ID, getStoredUser, listOrders } from '../../utils/appApi';
import { formatVnd } from '../../utils/orderingApi';
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

  const activeOrders = orders.filter((order) => !['CANCELLED', 'COMPLETED'].includes(order.status)).length;

  return (
    <PageShell
      title="Đơn hàng của tôi"
      subtitle={user ? `Tài khoản: ${user.username}` : 'Đơn hàng demo của khách'}
    >
      {error ? <ErrorState title="Không thể tải đơn hàng" description={error} /> : null}
      {!user ? (
        <Card className="ds-row" style={{ marginBottom: 16 }}>
          <div style={{ flex: '1 1 260px' }}>
            <Input
              label="User ID demo"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <Button onClick={() => loadOrders(userId)}>Tải lại</Button>
        </Card>
      ) : (
        <Card className="ds-row" style={{ marginBottom: 16 }}>
          <div>
            <strong>{user.username}</strong>
            <p className="ops-muted ops-small" style={{ margin: '4px 0 0' }}>Đang xem đơn hàng của tài khoản đang đăng nhập.</p>
          </div>
          <Button onClick={() => loadOrders(user.id)}>Tải lại</Button>
        </Card>
      )}
      {loading ? (
        <div className="ops-stack">
          <Skeleton className="card" />
          <Skeleton className="card" />
        </div>
      ) : null}
      {!loading && !orders.length ? <EmptyState title="Chưa có đơn hàng" description="Đơn hàng mới sẽ xuất hiện sau khi checkout thành công." /> : null}
      {!loading && orders.length ? (
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Trạng thái</th>
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
                  <td>{order.totals?.totalQuantity || order.items?.length || 0}</td>
                  <td>{formatVnd(order.totals?.subtotal || 0)}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
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
