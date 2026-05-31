import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { listProductReviews } from '../../utils/appApi';
import { Card, ErrorState, Skeleton } from '../shared/designSystem';

function renderStars(rating) {
  const score = Math.max(0, Math.min(5, Number(rating) || 0));
  return '★'.repeat(score) + '☆'.repeat(5 - score);
}

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [error, setError] = useState('');

  const loadReviews = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError('');
    try {
      setReviews(await listProductReviews(productId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return total / reviews.length;
  }, [reviews]);

  if (loading) {
    return <Skeleton className="card" />;
  }

  if (error) {
    return <ErrorState title="Không thể tải đánh giá" description={error} />;
  }

  return (
    <Card className="ops-stack">
      <div className="ops-row">
        <div>
          <h3>Đánh giá sản phẩm</h3>
          <p className="ops-muted">
            {reviews.length ? `${reviews.length} đánh giá, trung bình ${average.toFixed(1)}/5` : 'Chưa có đánh giá nào.'}
          </p>
        </div>
        {reviews.length ? <strong>{renderStars(Math.round(average))}</strong> : null}
      </div>

      {!reviews.length ? (
        <div className="ds-state">
          <p className="ds-state-title">Chưa có đánh giá</p>
          <p className="ds-state-description">Đánh giá sẽ xuất hiện sau khi khách hàng hoàn tất đơn và gửi nhận xét.</p>
        </div>
      ) : null}

      {reviews.map((review) => (
        <article className="ops-card" key={review.id}>
          <div className="ops-row">
            <strong>{renderStars(review.rating)}</strong>
            <span className="ops-muted ops-small">{review.createdAt ? new Date(review.createdAt).toLocaleString() : ''}</span>
          </div>
          <p>{review.comment}</p>
          <p className="ops-muted ops-small">Khách hàng: {review.customerId}</p>
        </article>
      ))}
    </Card>
  );
};

export default ProductReviews;
