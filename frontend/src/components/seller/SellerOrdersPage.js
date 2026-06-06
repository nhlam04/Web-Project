import React, { useCallback, useEffect, useState } from 'react';
import PageShell from '../shared/PageShell';
import { getStoredUser, listSellerOrders, updateSellerOrder } from '../../utils/appApi';
import { formatVnd } from '../../utils/orderingApi';
import { Button, Card, EmptyState, ErrorState, Input, OrderStatusBadge, Select, Skeleton, Toast } from '../shared/designSystem';

const nextActions = {
  PENDING: { action: 'confirm', label: 'Xác nhận' },
  CONFIRMED: { action: 'ship', label: 'Gửi hàng' },
  SHIPPED: { action: 'deliver', label: 'Đã giao' },
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
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Đang hiển thị</span>
          <strong className="text-2xl text-slate-900">{orders.length}</strong>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Giá trị</span>
          <strong className="text-2xl text-brand-600">{formatVnd(totalValue)}</strong>
        </div>
      </div>

      {message ? <Toast>{message}</Toast> : null}
      {error ? <ErrorState title="Không thể tải đơn người bán" description={error} /> : null}
      {!sellerId ? (
        <Toast variant="error">Cần đăng nhập bằng tài khoản SELLER để xem và cập nhật đơn người bán.</Toast>
      ) : null}

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statuses.map((item) => (
            <Card className="flex flex-col gap-2 min-h-[108px] justify-between" key={item}>
              <span className="text-[13px] font-extrabold text-slate-500 uppercase tracking-widest">{item}</span>
              <strong className="text-3xl text-slate-900 leading-none">{summary[item] || 0}</strong>
              <OrderStatusBadge status={item} />
            </Card>
          ))}
        </div>

        <Card className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <Input label="Seller ID" value={sellerId || 'Chưa có seller đăng nhập'} readOnly />
          <Select label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Input label="Đơn vị vận chuyển mặc định khi gửi hàng" value={shipping.carrier} onChange={(e) => setShipping({ ...shipping, carrier: e.target.value })} />
          <Input label="Mã theo dõi khi gửi hàng" value={shipping.trackingCode} onChange={(e) => setShipping({ ...shipping, trackingCode: e.target.value })} />
          <Button onClick={loadOrders} disabled={!sellerId || loading} className="w-full">{loading ? 'Đang tải...' : 'Tải danh sách'}</Button>
        </Card>

        {loading ? <Skeleton className="h-[400px]" /> : null}

        {!loading && !orders.length ? (
          <EmptyState
            title="Không có đơn fulfillment"
            description="Tài khoản seller mới chỉ thấy đơn hàng có product sellerId khớp với IAM user ID."
          />
        ) : null}

        {!loading && orders.length ? (
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Fulfillment</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Tổng</th>
                  <th className="px-4 py-3">Vận chuyển</th>
                  <th className="px-4 py-3">Hành động tiếp theo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const nextAction = nextActions[order.status];
                  const orderTotal = (order.items || []).reduce((total, item) => total + Number(item.lineTotal || 0), 0);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1 min-w-[220px]">
                          <strong className="text-slate-900">{order.id}</strong>
                          <span className="text-xs text-slate-500">Đơn hàng: {order.orderId}</span>
                          <span className="text-xs text-slate-500">Khách hàng: {order.customerId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4"><OrderStatusBadge status={order.status} /></td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1 min-w-[220px]">
                          {(order.items || []).map((item) => (
                            <span key={item.productId} className="text-slate-700">{item.name || item.productId} x {item.quantity}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-brand-600">{formatVnd(orderTotal)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1 min-w-[220px]">
                          <span className="text-slate-700">{order.carrier || 'Chưa có'}</span>
                          <span className="text-xs text-slate-500">{order.trackingCode || 'Chưa có mã theo dõi'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 min-w-[140px]">
                        {nextAction ? (
                          <Button disabled={busyId === order.id} onClick={() => runAction(order, nextAction.action)} className="w-full">
                            {busyId === order.id ? 'Đang xử lý...' : nextAction.label}
                          </Button>
                        ) : (
                          <Button disabled variant="secondary" className="w-full">Không có hành động</Button>
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
