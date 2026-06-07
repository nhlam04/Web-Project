import React from 'react';
import {
  Baby,
  Camera,
  HeartPulse,
  Home,
  Laptop,
  Monitor,
  Shirt,
  Smartphone,
  Sparkles,
  Venus,
} from 'lucide-react';
import { Button, EmptyState, Skeleton, Toast } from '../shared/designSystem';

const categoryStyles = [
  { keywords: ['thời trang nam', 'nam'], icon: Shirt, tone: 'blue', label: 'Phong cách nam' },
  { keywords: ['thời trang nữ', 'nữ'], icon: Venus, tone: 'pink', label: 'Thời trang nữ' },
  { keywords: ['điện thoại', 'phụ kiện'], icon: Smartphone, tone: 'cyan', label: 'Mobile & phụ kiện' },
  { keywords: ['mẹ', 'bé'], icon: Baby, tone: 'amber', label: 'Gia đình & bé yêu' },
  { keywords: ['thiết bị điện tử'], icon: Monitor, tone: 'indigo', label: 'Thiết bị thông minh' },
  { keywords: ['nhà cửa', 'đời sống'], icon: Home, tone: 'emerald', label: 'Không gian sống' },
  { keywords: ['máy tính', 'laptop'], icon: Laptop, tone: 'violet', label: 'Work & gaming' },
  { keywords: ['sắc đẹp'], icon: Sparkles, tone: 'rose', label: 'Làm đẹp mỗi ngày' },
  { keywords: ['máy ảnh', 'quay phim'], icon: Camera, tone: 'slate', label: 'Hình ảnh & video' },
  { keywords: ['sức khỏe'], icon: HeartPulse, tone: 'red', label: 'Chăm sóc sức khỏe' },
];

function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

function getCategoryName(category) {
  return category.product_type || category.name || `Danh mục ${category.id}`;
}

function getCategoryStyle(category) {
  const name = normalizeText(getCategoryName(category));
  return categoryStyles.find((style) => style.keywords.some((keyword) => name.includes(keyword))) || {
    icon: Sparkles,
    tone: 'blue',
    label: 'Khám phá sản phẩm',
  };
}

export default function CategorySection({ categories, error, loading, onBrowseProducts, onOpenCategory }) {
  return (
    <section className="landing-section" id="categories">
      <div className="landing-section-head">
        <div>
          <h2>Danh mục sản phẩm</h2>
        </div>
        <Button variant="ghost" onClick={onBrowseProducts}>Xem sản phẩm</Button>
      </div>

      {error ? <Toast variant="error">{error}</Toast> : null}
      {loading ? (
        <div className="landing-category-grid">
          {Array.from({ length: 10 }).map((_, index) => <Skeleton className="card landing-category-skeleton" key={index} />)}
        </div>
      ) : null}
      {!loading && !categories.length ? (
        <EmptyState title="Chưa có danh mục" description="Không tải được danh mục hoặc catalog hiện đang trống." />
      ) : null}
      {!loading && categories.length ? (
        <div className="landing-category-grid">
          {categories.map((category) => {
            const name = getCategoryName(category);
            const style = getCategoryStyle(category);
            const Icon = style.icon;

            return (
              <button
                className={`landing-category-card tone-${style.tone}`}
                key={category.id}
                type="button"
                onClick={() => onOpenCategory(category)}
              >
                <span className="landing-category-icon" aria-hidden="true">
                  <Icon size={26} strokeWidth={2.2} />
                </span>
                <span className="landing-category-content">
                  <strong>{name}</strong>
                  <small>{style.label}</small>
                </span>
                <span className="landing-category-arrow" aria-hidden="true">→</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
