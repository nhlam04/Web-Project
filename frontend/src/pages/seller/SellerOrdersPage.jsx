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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 m-0 mb-1">Đơn hàng người bán</h1>
          <p className="text-slate-500 m-0">{sellerId ? `Seller ID: ${sellerId}` : 'Cần tài khoản SELLER để xem đơn.'}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Giá trị</span>
          <strong className="text-2xl font-bold text-brand-600">{formatVnd(totalValue)}</strong>
        </div>
      </header>

      {message ? <Toast>{message}</Toast> : null}
      {error ? <ErrorState title="Không thể tải đơn người bán" description={error} /> : null}

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
        <Select label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tất cả</option>
          {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Input label="Đơn vị vận chuyển" value={shipping.carrier} onChange={(event) => setShipping({ ...shipping, carrier: event.target.value })} />
        <Input label="Mã theo dõi" value={shipping.trackingCode} onChange={(event) => setShipping({ ...shipping, trackingCode: event.target.value })} />
        <Button onClick={loadOrders} disabled={!sellerId || loading} className="w-full">{loading ? 'Đang tải...' : 'Tải danh sách'}</Button>
      </Card>

      {loading ? <Skeleton className="h-[400px]" /> : null}
      {!loading && !orders.length ? <EmptyState title="Không có đơn fulfillment" description="Seller chỉ thấy đơn hàng có product sellerId khớp với IAM user ID." /> : null}

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
                <th className="px-4 py-3">Hành động</th>
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
                        <span className="text-xs text-slate-500">Order: {order.orderId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1 min-w-[220px]">
                        {(order.items || []).map((item) => <div key={item.productId} className="text-slate-700">{item.name || item.productId} x {item.quantity}</div>)}
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
  );
}
