import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getReviewEligibility, submitReview } from '../../utils/appApi';
import { useAuth } from '../auth/AuthProvider';
import { Button, Card, ErrorState, Select, Skeleton, Toast } from '../shared/designSystem';

function findFulfillmentForProduct(fulfillments, productId) {
  return fulfillments.find((fulfillment) => (
    fulfillment.items || []
  ).some((item) => String(item.productId) === String(productId))) || fulfillments[0];
}

const OrderReviewPanel = ({ order, fulfillments = [] }) => {
  const auth = useAuth();
  const [eligibilities, setEligibilities] = useState([]);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(false);
  const [busyProductId, setBusyProductId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const reviewableItems = useMemo(() => {
    if (!order || order.status !== 'COMPLETED' || !auth.user?.id) return [];
    return (order.items || []).map((item) => ({
      ...item,
      fulfillment: findFulfillmentForProduct(fulfillments, item.productId),
    })).filter((item) => item.fulfillment?.id);
  }, [auth.user?.id, fulfillments, order]);

  const loadEligibilities = useCallback(async () => {
    if (!reviewableItems.length) {
      setEligibilities([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const results = await Promise.all(reviewableItems.map(async (item) => {
        const eligibility = await getReviewEligibility({
          customerId: auth.user.id,
          orderId: order.id,
          productId: String(item.productId),
        });
        return eligibility?.isEligible ? { ...eligibility, item } : null;
      }));
      setEligibilities(results.filter(Boolean));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [auth.user?.id, order?.id, reviewableItems]);

  useEffect(() => {
    loadEligibilities();
  }, [loadEligibilities]);

  function updateForm(productId, patch) {
    setForms((current) => ({
      ...current,
      [productId]: {
        rating: 5,
        comment: '',
        ...(current[productId] || {}),
        ...patch,
      },
    }));
  }

  async function handleSubmit(eligibility) {
    const productId = String(eligibility.productId);
    const form = forms[productId] || { rating: 5, comment: '' };
    setBusyProductId(productId);
    setMessage('');
    setError('');
    try {
      await submitReview({
        productId,
        customerId: auth.user.id,
        orderId: order.id,
        fulfillmentId: eligibility.fulfillmentId,
        rating: Number(form.rating),
        comment: form.comment.trim(),
      });
      setMessage('Đã gửi đánh giá sản phẩm.');
      setEligibilities((current) => current.filter((item) => String(item.productId) !== productId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyProductId('');
    }
  }

  if (!order || order.status !== 'COMPLETED') {
    return null;
  }

  if (loading) {
    return <Skeleton className="card" />;
  }

  if (error && !eligibilities.length) {
    return <ErrorState title="Không thể kiểm tra quyền đánh giá" description={error} />;
  }

  return (
    <Card className="ops-stack">
      <div>
        <h3>Đánh giá sau mua</h3>
        <p className="ops-muted">Bạn có thể đánh giá sản phẩm sau khi đơn hàng đã hoàn tất.</p>
      </div>
      {message ? <Toast>{message}</Toast> : null}
      {error ? <Toast variant="error">{error}</Toast> : null}
      {!eligibilities.length ? (
        <p className="ops-muted">Không còn sản phẩm nào đang đủ điều kiện đánh giá trong đơn này.</p>
      ) : null}
      {eligibilities.map((eligibility) => {
        const productId = String(eligibility.productId);
        const form = forms[productId] || { rating: 5, comment: '' };
        return (
          <div className="ops-stack" key={eligibility.id} style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
            <div className="ops-row">
              <div>
                <strong>{eligibility.item?.name || `Sản phẩm ${productId}`}</strong>
                <p className="ops-muted ops-small">Mã sản phẩm: {productId}</p>
              </div>
              <span className="ops-badge success">Đủ điều kiện</span>
            </div>
            <Select
              label="Số sao"
              value={form.rating}
              onChange={(event) => updateForm(productId, { rating: event.target.value })}
            >
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </Select>
            <label className="ds-field">
              Nhận xét
              <textarea
                className="ds-input"
                rows="4"
                value={form.comment}
                onChange={(event) => updateForm(productId, { comment: event.target.value })}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm"
                required
              />
            </label>
            <Button
              type="button"
              disabled={busyProductId === productId || !form.comment.trim()}
              onClick={() => handleSubmit(eligibility)}
            >
              {busyProductId === productId ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </div>
        );
      })}
    </Card>
  );
};

export default OrderReviewPanel;
