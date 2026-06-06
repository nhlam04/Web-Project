import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import { cancelOrder, getOrder, listFulfillmentsByOrder } from '../../utils/appApi';
import { formatVnd } from '../../utils/orderingApi';
import { formatShippingAddress, formatShippingRecipient } from '../../utils/shippingAddress';
import { Button, Card, EmptyState, ErrorState, Input, OrderStatusBadge, Skeleton, Toast } from '../shared/designSystem';
import OrderReviewPanel from '../reviews/OrderReviewPanel';

const cancellableStatuses = ['PLACED', 'SELLER_CONFIRMED'];

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [fulfillments, setFulfillments] = useState([]);
  const [reason, setReason] = useState('Khách hàng yêu cầu hủy đơn');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadDetail = useCallback(async () => {
    setError('');
    try {
      const nextOrder = await getOrder(orderId);
      setOrder(nextOrder);
      setFulfillments(await listFulfillmentsByOrder(orderId));
    } catch (err) {
      setError(err.message);
    }
  }, [orderId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  async function handleCancel() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      setOrder(await cancelOrder(orderId, reason));
      setMessage('Đã gửi yêu cầu hủy đơn hàng.');
      setFulfillments(await listFulfillmentsByOrder(orderId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const canCancel = order ? cancellableStatuses.includes(order.status) : false;
  const itemCount = order?.totals?.totalQuantity || order?.items?.reduce((total, item) => total + Number(item.quantity || 0), 0) || 0;

  return (
    <PageShell
      title="Chi tiết đơn hàng"
      subtitle={orderId}
    >
      {message ? <Toast>{message}</Toast> : null}
      {error ? <ErrorState title="Không thể tải chi tiết đơn hàng" description={error} /> : null}
      {!order && !error ? <Skeleton className="h-[400px]" /> : null}
      {order ? (
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 m-0 mb-1">Tóm tắt đơn hàng</h2>
                <p className="text-sm text-slate-500 m-0">Mã đơn: {order.id}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-500">Tổng tiền</span>
                <strong className="text-xl text-slate-900">{formatVnd(order.totals?.subtotal || order.totals?.totalAmount || 0)}</strong>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-500">Số lượng</span>
                <strong className="text-xl text-slate-900">{itemCount}</strong>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-500">Thanh toán</span>
                <strong className="text-xl text-slate-900">{order.paymentMethod || 'N/A'}</strong>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-500">Ngày tạo</span>
                <strong className="text-base text-slate-900">{order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'N/A'}</strong>
              </div>
            </div>
            <div className="flex gap-2">
              <Button as={Link} variant="secondary" to={`/fulfillment-tracking/${order.id}`}>Theo dõi giao hàng</Button>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-900 m-0">Địa chỉ giao hàng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-500">Người nhận</span>
                <strong className="text-base text-slate-900">{formatShippingRecipient(order.shippingAddress) || 'Chưa có thông tin'}</strong>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-500">Địa chỉ</span>
                <strong className="text-base text-slate-900">{formatShippingAddress(order.shippingAddress) || 'Chưa có địa chỉ'}</strong>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-900 m-0">Sản phẩm</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">SL</th>
                    <th className="px-4 py-3">Đơn giá</th>
                    <th className="px-4 py-3">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items?.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-slate-700">{formatVnd(item.unitPrice)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{formatVnd(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-slate-900 m-0">Lịch sử trạng thái</h3>
              <ul className="flex flex-col gap-4 border-l-2 border-slate-200 ml-2 pl-4 py-2">
                {order.history?.map((item, index) => (
                  <li key={`${item.to}-${index}`} className="relative">
                    <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 bg-brand-600 border-brand-600" />
                    <strong className="text-sm text-slate-900 block">{item.to}</strong>
                    <div className="text-xs text-slate-500 mt-1">{new Date(item.at).toLocaleString('vi-VN')} - {item.reason}</div>
                  </li>
                ))}
              </ul>
            </Card>
            {canCancel ? (
              <Card className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-slate-900 m-0">Hủy đơn</h3>
                <Input label="Lý do" value={reason} onChange={(e) => setReason(e.target.value)} />
                <Button variant="danger" disabled={busy} onClick={handleCancel}>
                  {busy ? 'Đang hủy...' : 'Hủy đơn hàng'}
                </Button>
              </Card>
            ) : null}
          </section>

          <Card className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-900 m-0">Fulfillment liên quan</h3>
            {!fulfillments.length ? <EmptyState title="Chưa có fulfillment" description="Fulfillment sẽ được tạo sau khi sự kiện OrderPlaced được xử lý." /> : null}
            <div className="flex flex-col gap-2">
              {fulfillments.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                  <span className="font-medium text-slate-900">{item.id}</span>
                  <span className="text-slate-300">|</span>
                  <OrderStatusBadge status={item.status} />
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-600">{item.carrier || 'Chưa có đơn vị vận chuyển'} {item.trackingCode || ''}</span>
                </div>
              ))}
            </div>
          </Card>
          <OrderReviewPanel order={order} fulfillments={fulfillments} />
        </div>
      ) : null}
    </PageShell>
  );
};

export default OrderDetailPage;
