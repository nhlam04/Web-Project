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
    <section className="py-12 md:py-16 bg-slate-50" id="featured" ref={featuredRef}>
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sản phẩm nổi bật</h2>
            <p className="text-slate-500">Tải từ endpoint sản phẩm đầu tiên của Catalog Service.</p>
          </div>
        </div>

        {error ? <Toast variant="error">{error}</Toast> : null}
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-[300px] rounded-xl" key={index} />)}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <article className="group flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand-200" key={product.id}>
                <div className="relative aspect-square bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onOpenProduct(product)}>
                  <img 
                    src={getProductImage(product)} 
                    alt={product.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col flex-1 p-4">
                  <h3 className="text-sm font-medium text-slate-900 mb-2 line-clamp-2 cursor-pointer hover:text-brand-600 transition-colors" onClick={() => onOpenProduct(product)}>
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold text-brand-600 mb-4 mt-auto">
                    {formatPrice(product.price || product.unitPrice)}
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" className="flex-1 px-0" onClick={() => onOpenProduct(product)}>
                      Chi tiết
                    </Button>
                    {auth.isCustomer ? (
                      <Button type="button" className="flex-1 px-0" onClick={() => onAddToCart(product)} disabled={isCartBusy}>
                        {isCartBusy ? '...' : 'Thêm'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
