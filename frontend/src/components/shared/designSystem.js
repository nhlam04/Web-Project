import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { formatPrice, getProductImage } from '../../utils/formatters';

function joinClass(...parts) {
  return parts.filter(Boolean).join(' ');
}

const Button = ({ as: Component = 'button', variant = 'primary', className = '', ...props }) => {
  const classes = joinClass('ds-button', variant !== 'primary' && variant, className);
  if (Component === Link) {
    return <Link className={classes} {...props} />;
  }
  return <Component className={classes} {...props} />;
};

const Card = ({ className = '', flush = false, ...props }) => (
  <section className={joinClass('ds-card', flush && 'flush', className)} {...props} />
);

const Badge = ({ variant = 'info', className = '', ...props }) => (
  <span className={joinClass('ds-badge', variant, className)} {...props} />
);

const Input = ({ label, className = '', inputClassName = '', ...props }) => (
  <label className={joinClass('ds-field', className)}>
    {label}
    <input className={joinClass('ds-input', inputClassName)} {...props} />
  </label>
);

const Select = ({ label, children, className = '', selectClassName = '', ...props }) => (
  <label className={joinClass('ds-field', className)}>
    {label}
    <select className={joinClass('ds-select', selectClassName)} {...props}>
      {children}
    </select>
  </label>
);

const Skeleton = ({ className = '', ...props }) => (
  <div className={joinClass('ds-skeleton', className)} aria-hidden="true" {...props} />
);

const EmptyState = ({ title = 'Không có dữ liệu', description, action }) => (
  <Card>
    <div className="ds-state">
      <p className="ds-state-title">{title}</p>
      {description ? <p className="ds-state-description">{description}</p> : null}
      {action}
    </div>
  </Card>
);

const ErrorState = ({ title = 'Đã xảy ra lỗi', description, action }) => (
  <Card>
    <div className="ds-state">
      <p className="ds-state-title">{title}</p>
      {description ? <p className="ds-state-description">{description}</p> : null}
      {action}
    </div>
  </Card>
);

const Toast = ({ children, variant = 'success' }) => (
  <div className={joinClass('ds-toast', variant !== 'success' && variant)}>{children}</div>
);

const statusVariants = {
  PLACED: 'info',
  SELLER_CONFIRMED: 'warning',
  IN_DELIVERY: 'warning',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  PENDING: 'warning',
  CONFIRMED: 'info',
  SHIPPED: 'warning',
};

const statusLabels = {
  PLACED: 'Đã đặt hàng',
  SELLER_CONFIRMED: 'Người bán đã xác nhận',
  IN_DELIVERY: 'Đang giao hàng',
  DELIVERED: 'Đã giao hàng',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  PENDING: 'Đang chờ',
  CONFIRMED: 'Đã xác nhận',
  SHIPPED: 'Đã gửi hàng',
};

const OrderStatusBadge = ({ status }) => (
  <Badge variant={statusVariants[status] || 'neutral'}>{statusLabels[status] || status || 'Không rõ'}</Badge>
);

const ProductCard = ({ product, onAddToCart, onOpen, busy = false, actionLabel = 'Thêm vào giỏ' }) => {
  const auth = useAuth();
  const price = product.unitPrice ?? product.price ?? 0;
  const image = getProductImage(product);

  function handleAdd(event) {
    event.stopPropagation();
    if (onAddToCart) onAddToCart(event, product);
  }

  return (
    <Card className="ds-product-card" flush onClick={() => onOpen && onOpen(product)}>
      <div className="ds-product-media">
        <img src={image} alt={product.name || 'Sản phẩm'} />
      </div>
      <div className="ds-product-body">
        {product.brand ? <div className="ds-product-brand">{product.brand}</div> : null}
        <h3 className="ds-product-title">{product.name || 'Sản phẩm không rõ'}</h3>
        <p className="ds-product-price">{formatPrice(price)}</p>
        {typeof product.quantity !== 'undefined' ? (
          <div className="ds-product-meta">Tồn kho: {product.quantity}</div>
        ) : null}
        {auth.isCustomer && onAddToCart ? (
          <div className="ds-product-actions">
            <Button type="button" variant="ghost" onClick={handleAdd} disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Đang xử lý...' : actionLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  OrderStatusBadge,
  ProductCard,
  Select,
  Skeleton,
  Toast,
};
