import React from 'react';
import { Button, EmptyState, Skeleton, Toast } from '../shared/designSystem';

export default function CategorySection({ categories, error, loading, onBrowseProducts, onOpenCategory }) {
  return (
    <section className="py-12 md:py-16" id="categories">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Danh mục sản phẩm</h2>
            <p className="text-slate-500">Dữ liệu được tải từ Catalog Service.</p>
          </div>
          <Button variant="ghost" onClick={onBrowseProducts} className="text-brand-600">Xem sản phẩm</Button>
        </div>

        {error ? <Toast variant="error">{error}</Toast> : null}
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton className="h-32 rounded-xl" key={index} />
            ))}
          </div>
        ) : null}

        {!loading && !categories.length ? (
          <EmptyState title="Chưa có danh mục" description="Không tải được danh mục hoặc catalog hiện đang trống." />
        ) : null}

        {!loading && categories.length ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <button
                className="flex flex-col items-start p-5 bg-white rounded-xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-brand-200 hover:-translate-y-1 text-left"
                key={category.id}
                type="button"
                onClick={() => onOpenCategory(category)}
              >
                <strong className="text-base font-semibold text-slate-900 mb-1 line-clamp-1">
                  {category.product_type || category.name || `Danh mục ${category.id}`}
                </strong>
                <span className="text-sm text-brand-600 font-medium">Xem sản phẩm &rarr;</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
