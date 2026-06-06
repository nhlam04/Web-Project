import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { formatPrice, getProductImage } from '../../utils/formatters';

function joinClass(...parts) {
  return parts.filter(Boolean).join(' ');
}

const Button = ({ as: Component = 'button', variant = 'primary', className = '', ...props }) => {
  const baseClasses = "inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm",
    secondary: "bg-brand-50 text-brand-600 border border-brand-200 hover:bg-brand-100",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  };
  
  const classes = joinClass(baseClasses, variants[variant] || variants.primary, className);
  
  if (Component === Link) {
    return <Link className={classes} {...props} />;
  }
  return <Component className={classes} {...props} />;
};

const Card = ({ className = '', flush = false, ...props }) => (
  <section className={joinClass('bg-white rounded-xl shadow-sm border border-slate-100 transition-shadow duration-200 ease-in-out hover:shadow-md', flush ? '' : 'p-5', className)} {...props} />
);

const Badge = ({ variant = 'info', className = '', ...props }) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border";
  const variants = {
    info: "bg-brand-50 text-brand-700 border-brand-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    danger: "bg-red-50 text-red-700 border-red-200",
  };
  return <span className={joinClass(baseClasses, variants[variant] || variants.neutral, className)} {...props} />;
};

const Input = ({ label, className = '', inputClassName = '', ...props }) => (
  <label className={joinClass('flex flex-col gap-1.5 text-sm font-medium text-slate-700', className)}>
    {label}
    <input className={joinClass('w-full min-h-[40px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 transition-colors duration-200 ease-in-out focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 hover:border-slate-400', inputClassName)} {...props} />
  </label>
);

const Select = ({ label, children, className = '', selectClassName = '', ...props }) => (
  <label className={joinClass('flex flex-col gap-1.5 text-sm font-medium text-slate-700', className)}>
    {label}
    <select className={joinClass('w-full min-h-[40px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 transition-colors duration-200 ease-in-out focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 hover:border-slate-400', selectClassName)} {...props}>
      {children}
    </select>
  </label>
);

const Skeleton = ({ className = '', ...props }) => (
  <div className={joinClass('animate-pulse bg-slate-200 rounded-lg', className)} aria-hidden="true" {...props} />
);

const EmptyState = ({ title = 'Không có dữ liệu', description, action }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-100 rounded-xl shadow-sm">
    <p className="text-lg font-medium text-slate-900 mb-2">{title}</p>
    {description && <p className="text-sm text-slate-500 mb-6 max-w-md">{description}</p>}
    {action}
  </div>
);

const ErrorState = ({ title = 'Đã xảy ra lỗi', description, action }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 border border-red-100 rounded-xl shadow-sm">
    <p className="text-lg font-medium text-red-900 mb-2">{title}</p>
    {description && <p className="text-sm text-red-700 mb-6 max-w-md">{description}</p>}
    {action}
  </div>
);

const Toast = ({ children, variant = 'success' }) => {
  const variants = {
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    error: "bg-red-50 text-red-800 border-red-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    info: "bg-brand-50 text-brand-800 border-brand-200",
  };
  return (
    <div className={joinClass('px-4 py-3 rounded-lg border text-sm mb-4', variants[variant] || variants.success)}>
      {children}
    </div>
  );
};

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

const ProductCard = ({ product, onAddToCart, onOpen, busy = false }) => {
  const price = product.unitPrice ?? product.price ?? 0;
  const image = getProductImage(product);
  const soldCount = product.sold ?? 0;

  return (
    <div 
      className="group flex flex-col bg-white rounded-xl border border-slate-100 overflow-hidden cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 hover:border-brand-200 h-full"
      onClick={() => onOpen && onOpen(product)}
    >
      <div className="relative w-full pt-[100%] bg-slate-50 overflow-hidden">
        <img 
          src={image} 
          alt={product.name || 'Sản phẩm'} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col flex-1 p-3">
        <h3 className="text-sm text-slate-800 mb-2 line-clamp-2 leading-tight">
          {product.name || 'Sản phẩm không rõ'}
        </h3>
        <div className="flex justify-between items-end mt-auto pt-2">
          <div className="text-brand-600 font-semibold text-base">
            <span className="text-xs mr-0.5">₫</span>
            {price.toLocaleString('vi-VN')}
          </div>
          <div className="text-xs text-slate-500">
            Đã bán {soldCount >= 1000 ? (soldCount / 1000).toFixed(1) + 'k' : soldCount}
          </div>
        </div>
      </div>
    </div>
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
