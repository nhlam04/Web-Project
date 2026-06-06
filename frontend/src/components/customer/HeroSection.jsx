import React from 'react';
import { Button } from '../shared/designSystem';
import { formatPrice, getProductImage } from '../../utils/formatters';

export default function HeroSection({ heroProduct, isCartBusy, onBuyNow, onPromotionClick, onBrowseProducts }) {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 flex flex-col items-start text-left">
          <span className="inline-block py-1 px-3 rounded-full bg-brand-50 text-brand-600 font-semibold text-sm mb-6 uppercase tracking-wider">
            Marketplace Nhóm 16
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
            Mua sắm nhanh, rõ trạng thái, <span className="text-brand-600">giao hàng dễ theo dõi</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
            Khám phá danh mục sản phẩm đang có trong catalog, thêm vào giỏ hàng,
            checkout COD và theo dõi đơn hàng trong cùng một giao diện.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="button" onClick={onBuyNow} disabled={isCartBusy} className="h-12 px-8 text-base">
              {isCartBusy ? 'Đang xử lý...' : 'Mua ngay'}
            </Button>
            <Button type="button" variant="secondary" onClick={onPromotionClick} className="h-12 px-8 text-base">
              Xem khuyến mãi
            </Button>
            <Button type="button" variant="ghost" onClick={onBrowseProducts} className="h-12 px-6 text-base text-brand-600">
              Xem tất cả sản phẩm
            </Button>
          </div>
        </div>

        <div className="flex-1 w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
            <div className="relative aspect-square bg-slate-50 overflow-hidden">
              <img
                src={heroProduct ? getProductImage(heroProduct) : 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&q=80'}
                alt={heroProduct?.name || 'Sản phẩm nổi bật'}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2 truncate">
                {heroProduct?.name || 'Catalog sản phẩm'}
              </h2>
              <p className="text-2xl font-bold text-brand-600">
                {heroProduct ? formatPrice(heroProduct.price || heroProduct.unitPrice) : 'Đang tải sản phẩm'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
