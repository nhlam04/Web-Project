import React from 'react';
import { Button, EmptyState, Skeleton, Toast } from '../shared/designSystem';

export default function CategorySection({ categories, error, loading, onBrowseProducts, onOpenCategory }) {
  return (
    <section className="landing-section" id="categories">
      <div className="landing-section-head">
        <div>
          <h2>Danh mục sản phẩm</h2>
          <p>Dữ liệu được tải từ Catalog Service.</p>
        </div>
        <Button variant="ghost" onClick={onBrowseProducts}>Xem sản phẩm</Button>
      </div>

      {error ? <Toast variant="error">{error}</Toast> : null}
      {loading ? (
        <div className="landing-category-grid">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton className="card" key={index} />)}
        </div>
      ) : null}
      {!loading && !categories.length ? (
        <EmptyState title="Chưa có danh mục" description="Không tải được danh mục hoặc catalog hiện đang trống." />
      ) : null}
      {!loading && categories.length ? (
        <div className="landing-category-grid">
          {categories.map((category) => (
            <button
              className="landing-category-card"
              key={category.id}
              type="button"
              onClick={() => onOpenCategory(category)}
            >
              <strong>{category.product_type || category.name || `Danh mục ${category.id}`}</strong>
              <span>Xem sản phẩm trong danh mục</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
