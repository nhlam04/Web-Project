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
      title="Theo dõi giao hàng"
      subtitle={`Order ID: ${orderId}`}
    >
      {error ? <ErrorState title="Không thể tải thông tin giao hàng" description={error} /> : null}
      {!fulfillments.length && !error ? <EmptyState title="Chưa có thông tin giao hàng" description="Fulfillment sẽ xuất hiện sau khi đơn hàng được đặt thành công." /> : null}
      <div className="grid gap-6">
        {fulfillments.map((fulfillment) => {
          const currentIndex = steps.indexOf(fulfillment.status);
          return (
            <Card className="flex flex-col gap-4" key={fulfillment.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900 m-0">{fulfillment.sellerId}</h2>
                <OrderStatusBadge status={fulfillment.status} />
              </div>
              <div className="grid gap-1">
                <p className="m-0 text-slate-700"><strong>Đơn vị vận chuyển:</strong> {fulfillment.carrier || 'Chưa có'}</p>
                <p className="m-0 text-slate-700"><strong>Mã theo dõi:</strong> {fulfillment.trackingCode || 'Chưa có'}</p>
              </div>
              <ul className="flex flex-col gap-4 border-l-2 border-slate-200 ml-2 pl-4 py-2">
                {steps.map((step, index) => (
                  <li key={step} className="relative">
                    <div className={`absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 ${index <= currentIndex ? 'bg-brand-600 border-brand-600' : 'bg-white border-slate-300'}`} />
                    <strong className={`text-sm ${index <= currentIndex ? 'text-slate-900' : 'text-slate-500'}`}>{step}</strong>
                    <div className="text-xs text-slate-500 mt-0.5">{index <= currentIndex ? 'Đã đạt mốc' : 'Đang chờ'}</div>
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-1">
                <p className="text-xs text-slate-500 m-0">Đã gửi hàng: {fulfillment.shippedAt ? new Date(fulfillment.shippedAt).toLocaleString() : 'Chưa có'}</p>
                <p className="text-xs text-slate-500 m-0">Đã giao hàng: {fulfillment.deliveredAt ? new Date(fulfillment.deliveredAt).toLocaleString() : 'Chưa có'}</p>
                <p className="text-xs text-slate-500 m-0">Hoàn tất: {fulfillment.completedAt ? new Date(fulfillment.completedAt).toLocaleString() : 'Chưa có'}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
};

export default FulfillmentTrackingPage;
