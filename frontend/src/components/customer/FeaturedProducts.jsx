import React from 'react';
import { Button, EmptyState, Skeleton, Toast } from '../shared/designSystem';
import { formatPrice, getProductImage } from '../../utils/formatters';

export default function FeaturedProducts({
  auth,
  error,
  featuredRef,
  isCartBusy,
  loading,
  products,
  onAddToCart,
  onBrowseProducts,
  onOpenProduct,
}) {
  return (
    <section className="landing-section" id="featured" ref={featuredRef}>
      <div className="landing-section-head">
        <div>
          <h2>Sản phẩm nổi bật</h2>
        </div>
      </div>

      {error ? <Toast variant="error">{error}</Toast> : null}
      {loading ? (
        <div className="landing-product-grid">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton className="card" key={index} />)}
        </div>
      ) : null}
      {!loading && !products.length ? (
        <EmptyState
          title="Chưa có sản phẩm nổi bật"
          description="Bạn vẫn có thể mở trang tất cả sản phẩm để kiểm tra dữ liệu catalog."
          action={<Button onClick={onBrowseProducts}>Mở danh sách sản phẩm</Button>}
        />
      ) : null}
      {!loading && products.length ? (
        <div className="landing-product-grid">
          {products.map((product) => (
            <article className="landing-product-card" key={product.id}>
              <div className="landing-product-media">
                <img src={getProductImage(product)} alt={product.name} />
              </div>
              <div className="landing-product-body">
                <h3>{product.name}</h3>
                <p className="landing-price">{formatPrice(product.price || product.unitPrice)}</p>
                <div className="landing-product-actions">
                  <Button type="button" variant="ghost" onClick={() => onOpenProduct(product)}>
                    Xem chi tiết
                  </Button>
                  {auth.isCustomer ? (
                    <Button type="button" onClick={() => onAddToCart(product)} disabled={isCartBusy}>
                      {isCartBusy ? 'Đang thêm...' : 'Thêm vào giỏ'}
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
