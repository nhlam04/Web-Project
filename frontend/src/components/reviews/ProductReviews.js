import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { listProductReviews } from '../../utils/appApi';
import { Card, ErrorState, Skeleton } from '../shared/designSystem';

function renderStars(rating) {
  const score = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return Array.from({ length: 5 }, (_, index) => (
    <span key={index} aria-hidden="true">{index < score ? '★' : '☆'}</span>
  ));
}

function tryDecodeMojibake(text) {
  if (!/[\u00c3\u00c2\u00c4\u00c6\u00d0\u00e2]/.test(text) || typeof TextDecoder === 'undefined') {
    return text;
  }

  try {
    const bytes = Uint8Array.from(Array.from(text), (char) => char.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return decoded.includes('\uFFFD') ? text : decoded;
  } catch (_error) {
    return text;
  }
}

function repairReviewText(value) {
  if (value === null || value === undefined) return '';

  let text = tryDecodeMojibake(String(value));

  const replacements = [
    [new RegExp(`Đ${'\uFFFD'}nh gi${'\uFFFD'}`, 'g'), 'Đánh giá'],
    [new RegExp(`đ${'\uFFFD'}nh gi${'\uFFFD'}`, 'g'), 'đánh giá'],
    [/S\?n ph\?m t\?t, giao h.ng d.ng quy tr.nh/g, 'Sản phẩm tốt, giao hàng đúng quy trình'],
    [/S.n ph.m t.t, giao h.ng d.ng quy tr.nh/g, 'Sản phẩm tốt, giao hàng đúng quy trình'],
  ];

  replacements.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  return text;
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
      const response = await listProductReviews(productId);
      const data = Array.isArray(response) ? response : (response?.data || response?.reviews || []);
      setReviews(Array.isArray(data) ? data : []);
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
        {reviews.length ? <strong className="review-stars" aria-label={`${Math.round(average)} trên 5 sao`}>{renderStars(average)}</strong> : null}
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
            <strong className="review-stars" aria-label={`${Number(review.rating) || 0} trên 5 sao`}>{renderStars(review.rating)}</strong>
            <span className="ops-muted ops-small">{review.createdAt ? new Date(review.createdAt).toLocaleString() : ''}</span>
          </div>
          <p>{repairReviewText(review.comment)}</p>
          <p className="ops-muted ops-small">Khách hàng: {repairReviewText(review.customerId)}</p>
        </article>
      ))}
    </Card>
  );
};

export default ProductReviews;
