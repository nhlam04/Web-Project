import React from 'react';
import { Link } from 'react-router-dom';
import { formatVnd } from '../../utils/orderingApi';
import { useCart } from './CartProvider';
import { getProductImage } from '../../utils/formatters';

const CartDrawer = () => {
  const {
    cart,
    closeCart,
    isBusy,
    isOpen,
    removeItem,
    updateItemQuantity,
  } = useCart();

  if (!isOpen) return null;

  const hasItems = Boolean(cart?.items?.length);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={closeCart}>
      <aside className="w-full max-w-[400px] h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300" onClick={(event) => event.stopPropagation()} aria-label="Giỏ hàng">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-900 m-0">Giỏ hàng</h2>
          <button className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-2 -mr-2" type="button" onClick={closeCart}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {isBusy ? <p className="text-slate-500 text-sm">Đang tải giỏ hàng...</p> : null}
          
          {!isBusy && hasItems && Array.isArray(cart?.items) ? cart.items.map((item) => (
            <div className="flex gap-4 py-4 border-b border-slate-100 last:border-0" key={item.productId}>
              <div className="w-20 h-20 shrink-0 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
                <img 
                  src={getProductImage(item)} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between gap-2 mb-2">
                  <strong className="text-sm font-medium text-slate-900 line-clamp-2">{item.name}</strong>
                  <strong className="text-sm font-bold text-brand-600 shrink-0">{formatVnd(item.unitPrice * item.quantity)}</strong>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-white" aria-label="Cập nhật số lượng">
                    <button
                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
                      type="button"
                      disabled={isBusy}
                      onClick={() => updateItemQuantity(item.productId, Number(item.quantity) - 1)}
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-slate-900">{item.quantity}</span>
                    <button
                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
                      type="button"
                      disabled={isBusy}
                      onClick={() => updateItemQuantity(item.productId, Number(item.quantity) + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors p-2 -mr-2"
                    type="button"
                    disabled={isBusy}
                    onClick={() => removeItem(item.productId)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          )) : null}
          
          {!isBusy && !hasItems ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 py-12">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <p className="text-sm">Giỏ hàng đang trống.</p>
            </div>
          ) : null}
        </div>
        
        {hasItems ? (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0 flex flex-col gap-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Tổng SL: <strong className="text-slate-900">{cart.totals?.totalQuantity || 0}</strong></span>
              <span className="text-slate-600">Tạm tính: <strong className="text-lg text-brand-600">{formatVnd(cart.totals?.subtotal || 0)}</strong></span>
            </div>
            <div className="flex flex-col gap-2">
              <Link className="flex items-center justify-center w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors" to="/checkout" onClick={closeCart}>
                Nhập địa chỉ giao hàng
              </Link>
              <Link className="flex items-center justify-center w-full h-11 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg transition-colors" to="/orders" onClick={closeCart}>
                Xem đơn hàng
              </Link>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
            <button className="flex items-center justify-center w-full h-11 bg-slate-200 text-slate-400 font-medium rounded-lg cursor-not-allowed" type="button" disabled>
              Nhập địa chỉ giao hàng
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};

export default CartDrawer;
