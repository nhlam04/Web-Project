import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatVnd } from '../../utils/orderingApi';
import { useCart } from '../cart/CartProvider';
import PageShell from '../shared/PageShell';
import { Button, Card } from '../shared/designSystem';
import { useAuth } from '../auth/AuthProvider';
import ProductReviews from '../reviews/ProductReviews';
import { API_BASES } from '../../utils/constants';

const CATALOG_BASE_URL = API_BASES.catalog || 'http://127.0.0.1:8000';

const ProductDetail = () => {
  const { slug } = useParams();
  const productId = slug ? slug.replace('id=', '') : null;
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const { addProduct, isBusy: isCartBusy } = useCart();
  const auth = useAuth();

  useEffect(() => {
    if (productId) {
      fetchProductDetail();
    }
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CATALOG_BASE_URL}/api/v1/products/${productId}`);
      if (!response.ok) throw new Error('Product not found');
      const data = await response.json();
      setProduct(data);

      let parsedImages = [];
      if (Array.isArray(data.images)) {
        parsedImages = data.images;
      } else if (typeof data.images === 'string') {
        try {
          parsedImages = JSON.parse(data.images);
        } catch (_err) {
          parsedImages = [data.images];
        }
      }

      if (parsedImages && parsedImages.length > 0) {
        setMainImage(parsedImages[0]);
        data.images = parsedImages;
      } else {
        setMainImage('https://via.placeholder.com/500?text=No+Image');
      }

      let parsedDesc = data.detailDesc;
      if (typeof parsedDesc === 'string') {
        try {
          parsedDesc = JSON.parse(parsedDesc);
        } catch (_err) {
          // ignore parse error and keep string
        }
      }
      data.detailDesc = parsedDesc;
    } catch (_error) {
      setStatusMessage('Không thể tải chi tiết sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }

    try {
      await addProduct(product, quantity);
      setStatusMessage('');
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  if (loading) {
    return (
      <PageShell title="Chi ti?t s?n ph?m">
        <div className="ops-card ops-muted">?ang t?i th?ng tin s?n ph?m...</div>
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell title="Chi ti?t s?n ph?m">
        <div className="ops-card ops-muted">Kh?ng t?m th?y s?n ph?m.</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={product.name}
      subtitle={`Giá: ${formatVnd(Number(product.price))}`}
    >
      <style>{`
        .detail-container { width: 100%; margin: 0 auto; padding: 18px 0 40px; font-family: 'Segoe UI', Tahoma, sans-serif; color: #333; }
        .back-btn { background: none; border: none; color: #4b5563; font-size: 16px; cursor: pointer; display: inline-flex; align-items: center; margin-bottom: 30px; padding: 0; transition: color 0.2s; }
        .back-btn:hover { color: #4f46e5; }
        .back-btn span { margin-right: 8px; font-size: 20px; }
        .status-message { margin: 0 0 20px; padding: 10px 14px; border-radius: 8px; background-color: #ecfeff; color: #0f766e; border: 1px solid #99f6e4; }

        .product-wrapper { display: flex; flex-wrap: wrap; gap: clamp(24px, 4vw, 50px); background: white; padding: clamp(20px, 4vw, 40px); border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); }
        .images-section { flex: 1; min-width: 300px; }
        .main-img-container { width: 100%; height: 450px; border-radius: 12px; overflow: hidden; margin-bottom: 20px; border: 1px solid #f3f4f6; background-color: #f9fafb; display: flex; align-items: center; justify-content: center; }
        .main-img-container img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .thumbnails { display: flex; gap: 15px; overflow-x: auto; padding-bottom: 10px; }
        .thumbnail { width: 80px; height: 80px; border-radius: 8px; cursor: pointer; border: 2px solid transparent; overflow: hidden; background-color: #f9fafb; }
        .thumbnail.active { border-color: #4f46e5; }
        .thumbnail img { width: 100%; height: 100%; object-fit: cover; }

        .info-section { flex: 1; min-width: 300px; display: flex; flex-direction: column; }
        .product-title { font-size: 32px; font-weight: 700; color: #111827; margin-bottom: 15px; line-height: 1.2; }
        .stats { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; color: #6b7280; font-size: 14px; }
        .stars { color: #fbbf24; font-size: 18px; }
        .product-price { font-size: 36px; font-weight: bold; color: #4f46e5; margin-bottom: 20px; }
        .short-desc { font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 30px; }

        .actions-box { padding: 30px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; margin-bottom: 30px; }
        .quantity-selector { display: inline-flex; align-items: center; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; margin-right: 20px; background: white; }
        .quantity-btn { background: #f9fafb; border: none; padding: 10px 15px; font-size: 18px; cursor: pointer; transition: background 0.2s; }
        .quantity-btn:hover { background: #e5e7eb; }
        .quantity-input { width: 50px; text-align: center; border: none; border-left: 1px solid #d1d5db; border-right: 1px solid #d1d5db; outline: none; font-weight: 500; font-size: 16px; }

        .add-cart-btn { padding: 14px 30px; background-color: #4f46e5; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.3s; display: inline-flex; align-items: center; gap: 8px; }
        .add-cart-btn:hover { background-color: #4338ca; }
        .add-cart-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .stock-info { font-size: 14px; color: #6b7280; margin-top: 15px; }

        .details-tab { margin-top: 32px; background: white; padding: clamp(20px, 4vw, 40px); border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .details-tab h3 { font-size: 24px; margin-bottom: 20px; color: #111827; border-bottom: 2px solid #eef2ff; padding-bottom: 10px; display: inline-block; }
        .desc-content { line-height: 1.8; color: #4b5563; }

        .spec-table { width: 100%; border-collapse: collapse; margin-top: 15px; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
        .spec-row { display: flex; border-bottom: 1px solid #e5e7eb; }
        .spec-row:last-child { border-bottom: none; }
        .spec-name { padding: 15px 20px; background-color: #f9fafb; font-weight: 600; width: 35%; color: #4b5563; border-right: 1px solid #e5e7eb; text-transform: capitalize; }
        .spec-value { padding: 15px 20px; width: 65%; color: #111827; }
        @media (max-width: 600px) {
          .spec-row { flex-direction: column; }
          .spec-name { width: 100%; border-right: none; border-bottom: 1px solid #e5e7eb; }
          .spec-value { width: 100%; }
        }

        @media (max-width: 768px) {
          .product-wrapper { padding: 20px; }
          .product-title { font-size: 24px; }
          .product-price { font-size: 28px; }
          .actions-box { display: flex; flex-direction: column; gap: 20px; }
          .quantity-selector { margin-right: 0; width: fit-content; }
          .add-cart-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="detail-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <span>&larr;</span> Quay lại danh sách
        </button>

        {statusMessage ? <div className="status-message">{statusMessage}</div> : null}

        <div className="product-wrapper">
          <div className="images-section">
            <div className="main-img-container">
              <img src={mainImage} alt={product.name} />
            </div>
            {product.images && product.images.length > 0 && (
              <div className="thumbnails">
                {product.images.map((img, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${mainImage === img ? 'active' : ''}`}
                    onClick={() => setMainImage(img)}
                  >
                    <img src={img} alt={`${product.name} anh ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="info-section">
            <h1 className="product-title">{product.name}</h1>

            <div className="stats">
              <span className="stars">
                {'★'.repeat(product.StarCount || 5)}{'☆'.repeat(5 - (product.StarCount || 5))}
              </span>
              <span>•</span>
              <span>{product.totalRates} Đánh giá</span>
              <span>•</span>
              <span>Đã bán {product.sold}</span>
            </div>

            <div className="product-price">{formatVnd(Number(product.price))}</div>

            <p className="short-desc">{product.shortDesc}</p>

            {auth.isCustomer ? (
              <div className="actions-box">
                <div className="quantity-selector">
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  >-</button>
                  <input
                    type="number"
                    className="quantity-input"
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, parseInt(event.target.value, 10) || 1))}
                    min="1"
                    max={product.quantity}
                  />
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity((value) => Math.min(product.quantity, value + 1))}
                  >+</button>
                </div>

                <button className="add-cart-btn" onClick={handleAddToCart} disabled={isCartBusy}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  {isCartBusy ? 'Đang xử lý...' : 'Thêm vào giỏ hàng'}
                </button>
                <div className="stock-info">Sản phẩm có sẵn: {product.quantity}</div>
              </div>
            ) : null}
            {auth.isGuest ? (
              <Card className="ops-stack">
                <h3>Đăng nhập để mua hàng</h3>
                <p className="ops-muted">Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.</p>
                <div className="ops-actions">
                  <Button as={Link} to="/login">Đăng nhập</Button>
                  <Button as={Link} variant="secondary" to="/register">Đăng ký</Button>
                </div>
              </Card>
            ) : null}
            {auth.isSeller ? (
              <Card><p className="ops-muted">Tài khoản SELLER có thể xem catalog nhưng không có thao tác mua hàng.</p></Card>
            ) : null}
          </div>
        </div>

        <div className="details-tab">
          <h3>Thông số kỹ thuật và mô tả chi tiết</h3>
          <div className="desc-content">
            {typeof product.detailDesc === 'string'
              ? <div dangerouslySetInnerHTML={{ __html: product.detailDesc.replace(/\n/g, '<br/>') }} />
              : (
                <div className="spec-table">
                  {product.detailDesc && Object.entries(product.detailDesc).map(([key, value], idx) => {
                    let renderValue;
                    if (value !== null && typeof value === 'object') {
                      if (Array.isArray(value)) {
                        renderValue = value.map((item, i) => <div key={i}>{item}</div>);
                      } else {
                        renderValue = JSON.stringify(value);
                      }
                    } else {
                      renderValue = String(value).split('\n').map((line, i) => <div key={i}>{line}</div>);
                    }
                    return (
                      <div className="spec-row" key={idx}>
                        <div className="spec-name">{key}</div>
                        <div className="spec-value">{renderValue}</div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        </div>
        <ProductReviews productId={productId} />
      </div>
    </PageShell>
  );
};

export default ProductDetail;

