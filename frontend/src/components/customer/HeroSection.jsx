import React from 'react';
import { Button } from '../shared/designSystem';
import { formatPrice, getProductImage } from '../../utils/formatters';

export default function HeroSection({ heroProduct, isCartBusy, onBuyNow, onPromotionClick, onBrowseProducts }) {
  return (
    <section className="landing-hero">
      <div className="landing-hero-inner">
        <div className="landing-copy">
          <span className="landing-eyebrow">Marketplace nhóm 16</span>
          <h1>Mua sắm nhanh, rõ trạng thái, giao hàng dễ theo dõi</h1>
          <p>
            Khám phá danh mục sản phẩm đang có trong catalog, thêm vào giỏ hàng,
            checkout COD và theo dõi đơn hàng trong cùng một giao diện.
          </p>
          <div className="landing-actions">
            <Button type="button" onClick={onBuyNow} disabled={isCartBusy}>
              {isCartBusy ? 'Đang xử lý...' : 'Mua ngay'}
            </Button>
            <Button type="button" variant="secondary" onClick={onPromotionClick}>
              Xem khuyến mãi
            </Button>
            <Button type="button" variant="ghost" onClick={onBrowseProducts}>
              Xem tất cả sản phẩm
            </Button>
          </div>
        </div>

        <div className="landing-hero-card">
          <div className="landing-hero-media">
            <img
              src={heroProduct ? getProductImage(heroProduct) : 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&q=80'}
              alt={heroProduct?.name || 'Sản phẩm nổi bật'}
            />
          </div>
          <div className="landing-hero-info">
            <h2>{heroProduct?.name || 'Catalog sản phẩm'}</h2>
            <p className="landing-price">{heroProduct ? formatPrice(heroProduct.price || heroProduct.unitPrice) : 'Đang tải sản phẩm'}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
