import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import { listFulfillmentsByOrder } from '../../utils/appApi';
import { Card, EmptyState, ErrorState, OrderStatusBadge } from '../shared/designSystem';

const steps = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED'];

const FulfillmentTrackingPage = () => {
  const { orderId } = useParams();
  const [fulfillments, setFulfillments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    listFulfillmentsByOrder(orderId).then(setFulfillments).catch((err) => setError(err.message));
  }, [orderId]);

  return (
    <PageShell
      title="Theo d?i giao h?ng"
      subtitle={`Order ID: ${orderId}`}
    >
      {error ? <ErrorState title="Không thể tải thông tin giao hàng" description={error} /> : null}
      {!fulfillments.length && !error ? <EmptyState title="Chưa có thông tin giao hàng" description="Fulfillment sẽ xuất hiện sau khi đơn hàng được đặt thành công." /> : null}
      <div className="ops-grid">
        {fulfillments.map((fulfillment) => {
          const currentIndex = steps.indexOf(fulfillment.status);
          return (
            <Card className="ops-stack" key={fulfillment.id}>
              <div className="ops-row">
                <h2>{fulfillment.sellerId}</h2>
                <OrderStatusBadge status={fulfillment.status} />
              </div>
              <p><strong>Đơn vị vận chuyển:</strong> {fulfillment.carrier || 'Chưa có'}</p>
              <p><strong>Mã theo dõi:</strong> {fulfillment.trackingCode || 'Chưa có'}</p>
              <ul className="ops-timeline">
                {steps.map((step, index) => (
                  <li key={step}>
                    <strong>{step}</strong>
                    <div className="ops-muted ops-small">{index <= currentIndex ? 'Đã đạt mốc' : 'Đang chờ'}</div>
                  </li>
                ))}
              </ul>
              <div>
                <p className="ops-muted ops-small">Đã gửi hàng: {fulfillment.shippedAt ? new Date(fulfillment.shippedAt).toLocaleString() : 'Chưa có'}</p>
                <p className="ops-muted ops-small">Đã giao hàng: {fulfillment.deliveredAt ? new Date(fulfillment.deliveredAt).toLocaleString() : 'Chưa có'}</p>
                <p className="ops-muted ops-small">Hoàn tất: {fulfillment.completedAt ? new Date(fulfillment.completedAt).toLocaleString() : 'Chưa có'}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
};

export default FulfillmentTrackingPage;
