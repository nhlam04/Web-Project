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
        <Card className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex-1 min-w-[260px]">
            <Input
              label="User ID demo"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <Button onClick={() => loadOrders(userId)}>Tải lại</Button>
        </Card>
      ) : (
        <Card className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <strong className="text-lg text-slate-900">{user.username}</strong>
            <p className="text-sm text-slate-500 m-0 mt-1">Đang xem đơn hàng của tài khoản đăng nhập.</p>
          </div>
          <Button onClick={() => loadOrders(user.id)}>Tải lại</Button>
        </Card>
      )}
      
      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : null}
      
      {!loading && !orders.length ? <EmptyState title="Chưa có đơn hàng" description="Đơn hàng mới sẽ xuất hiện sau khi checkout thành công." /> : null}
      
      {!loading && orders.length ? (
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Giao đến</th>
                <th className="px-4 py-3">Số lượng</th>
                <th className="px-4 py-3">Tổng tiền</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4 font-medium text-slate-900">{order.id}</td>
                  <td className="px-4 py-4"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-4 py-4">
                    <strong className="block text-slate-900 mb-0.5">{formatShippingRecipient(order.shippingAddress) || 'Chưa có thông tin'}</strong>
                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{formatShippingAddress(order.shippingAddress) || 'Chưa có địa chỉ'}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{order.totals?.totalQuantity || order.items?.length || 0}</td>
                  <td className="px-4 py-4 font-medium text-brand-600">{formatVnd(order.totals?.subtotal || order.totals?.totalAmount || 0)}</td>
                  <td className="px-4 py-4 text-slate-600">{order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'N/A'}</td>
                  <td className="px-4 py-4 text-right"><Button as={Link} variant="secondary" to={`/orders/${order.id}`}>Chi tiết</Button></td>
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
