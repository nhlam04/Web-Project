import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import { cancelOrder, getOrder, listFulfillmentsByOrder } from '../../utils/appApi';
import { formatVnd } from '../../utils/orderingApi';
import { formatShippingAddress, formatShippingRecipient } from '../../utils/shippingAddress';
import { Button, Card, EmptyState, ErrorState, Input, OrderStatusBadge, Select, Skeleton, Toast } from '../shared/designSystem';
import OrderReviewPanel from '../reviews/OrderReviewPanel';

const cancellableStatuses = ['PLACED', 'SELLER_CONFIRMED'];
const fulfillmentSteps = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED'];

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [fulfillments, setFulfillments] = useState([]);
  const [reason, setReason] = useState('Khách hàng yêu cầu hủy đơn');
  const [selectedHistorySource, setSelectedHistorySource] = useState('order');
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

  const selectedFulfillment = useMemo(() => (
    fulfillments.find((item) => String(item.id) === selectedHistorySource) || null
  ), [fulfillments, selectedHistorySource]);

  const canCancel = order ? cancellableStatuses.includes(order.status) : false;
  const itemCount = order?.totals?.totalQuantity || order?.items?.reduce((total, item) => total + Number(item.quantity || 0), 0) || 0;

  return (
    <PageShell
      title="Chi tiết đơn hàng"
      subtitle={orderId}
    >
      {message ? <Toast>{message}</Toast> : null}
      {error ? <ErrorState title="Không thể tải chi tiết đơn hàng" description={error} /> : null}
      {!order && !error ? <Skeleton className="card" /> : null}
      {order ? (
        <div className="ops-stack">
          <Card className="ops-stack">
            <div className="ops-row">
              <div>
                <h2>Tóm tắt đơn hàng</h2>
                <p className="ops-muted">Mã đơn: {order.id}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="ops-grid">
              <div className="ops-kpi">
                <span className="ops-muted">Tổng tiền</span>
                <strong>{formatVnd(order.totals?.subtotal || order.totals?.totalAmount || 0)}</strong>
              </div>
              <div className="ops-kpi">
                <span className="ops-muted">Số lượng</span>
                <strong>{itemCount}</strong>
              </div>
              <div className="ops-kpi">
                <span className="ops-muted">Thanh toán</span>
                <strong>{order.paymentMethod || 'N/A'}</strong>
              </div>
              <div className="ops-kpi">
                <span className="ops-muted">Ngày tạo</span>
                <strong style={{ fontSize: 16 }}>{order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'N/A'}</strong>
              </div>
            </div>
            <div className="ops-actions">
              <Button as={Link} variant="secondary" to={`/fulfillment-tracking/${order.id}`}>Theo dõi giao hàng</Button>
            </div>
          </Card>

          <Card className="ops-stack">
            <h2>Địa chỉ giao hàng</h2>
            <div className="ops-grid">
              <div className="ops-kpi">
                <span className="ops-muted">Người nhận</span>
                <strong>{formatShippingRecipient(order.shippingAddress) || 'Chưa có thông tin'}</strong>
              </div>
              <div className="ops-kpi">
                <span className="ops-muted">Địa chỉ</span>
                <strong style={{ fontSize: 16 }}>{formatShippingAddress(order.shippingAddress) || 'Chưa có địa chỉ'}</strong>
              </div>
            </div>
          </Card>

          <Card className="ops-stack">
            <h2>Sản phẩm</h2>
            <div className="ops-table-wrap">
              <table className="ops-table">
                <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.productId}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatVnd(item.unitPrice)}</td>
                      <td>{formatVnd(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <section className="ops-grid">
            <Card className="ops-stack">
              <div className="ops-row">
                <div>
                  <h3>Lịch sử trạng thái</h3>
                  <p className="ops-muted ops-small">Chọn đơn hàng hoặc fulfillment để xem timeline tương ứng.</p>
                </div>
                <Select
                  label="Nguồn trạng thái"
                  value={selectedHistorySource}
                  onChange={(event) => setSelectedHistorySource(event.target.value)}
                >
                  <option value="order">Đơn hàng tổng</option>
                  {fulfillments.map((item, index) => (
                    <option key={item.id} value={String(item.id)}>
                      Fulfillment #{item.id || index + 1} - Seller {item.sellerId || 'N/A'}
                    </option>
                  ))}
                </Select>
              </div>

              {selectedFulfillment ? (
                <>
                  <div className="ops-row">
                    <div>
                      <p><strong>Fulfillment:</strong> {selectedFulfillment.id}</p>
                      <p className="ops-muted ops-small">Seller: {selectedFulfillment.sellerId || 'N/A'}</p>
                    </div>
                    <OrderStatusBadge status={selectedFulfillment.status} />
                  </div>
                  <ul className="ops-timeline">
                    {fulfillmentSteps.map((step) => {
                      const currentIndex = fulfillmentSteps.indexOf(selectedFulfillment.status);
                      const stepIndex = fulfillmentSteps.indexOf(step);
                      return (
                        <li key={step}>
                          <strong>{step}</strong>
                          <div className="ops-muted ops-small">{stepIndex <= currentIndex ? 'Đã đạt mốc' : 'Đang chờ'}</div>
                        </li>
                      );
                    })}
                  </ul>
                  <div>
                    <p className="ops-muted ops-small">Đơn vị vận chuyển: {selectedFulfillment.carrier || 'Chưa có'}</p>
                    <p className="ops-muted ops-small">Mã theo dõi: {selectedFulfillment.trackingCode || 'Chưa có'}</p>
                    <p className="ops-muted ops-small">Đã gửi hàng: {selectedFulfillment.shippedAt ? new Date(selectedFulfillment.shippedAt).toLocaleString('vi-VN') : 'Chưa có'}</p>
                    <p className="ops-muted ops-small">Đã giao hàng: {selectedFulfillment.deliveredAt ? new Date(selectedFulfillment.deliveredAt).toLocaleString('vi-VN') : 'Chưa có'}</p>
                    <p className="ops-muted ops-small">Hoàn tất: {selectedFulfillment.completedAt ? new Date(selectedFulfillment.completedAt).toLocaleString('vi-VN') : 'Chưa có'}</p>
                  </div>
                </>
              ) : (
                <ul className="ops-timeline">
                  {order.history?.map((item, index) => (
                    <li key={`${item.to}-${index}`}>
                      <strong>{item.to}</strong>
                      <div className="ops-muted ops-small">{new Date(item.at).toLocaleString('vi-VN')} - {item.reason}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            {canCancel ? (
              <Card className="ops-stack">
                <h3>Hủy đơn</h3>
                <Input label="Lý do" value={reason} onChange={(e) => setReason(e.target.value)} />
                <Button variant="danger" disabled={busy} onClick={handleCancel}>
                  {busy ? 'Đang hủy...' : 'Hủy đơn hàng'}
                </Button>
              </Card>
            ) : null}
          </section>

          <Card>
            <h3>Giao hàng liên quan</h3>
            {!fulfillments.length ? <EmptyState title="Chưa có thông tin giao hàng" description="Thông tin giao hàng sẽ được cập nhật sau khi đơn hàng được xử lý." /> : null}
            {fulfillments.map((item) => (
              <p key={item.id}>{item.id} - <OrderStatusBadge status={item.status} /> - {item.carrier || 'Chưa có đơn vị vận chuyển'} {item.trackingCode || ''}</p>
            ))}
          </Card>
          <OrderReviewPanel order={order} fulfillments={fulfillments} />
        </div>
      ) : null}
    </PageShell>
  );
};

export default OrderDetailPage;
