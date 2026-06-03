import React from 'react';
import { Link } from 'react-router-dom';
import { formatVnd } from '../../utils/orderingApi';
import { useCart } from './CartProvider';
import './cartDrawer.css';

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
    <div className="cart-drawer-overlay" onClick={closeCart}>
      <aside className="cart-drawer-panel" onClick={(event) => event.stopPropagation()} aria-label="Giỏ hàng">
        <div className="cart-drawer-head">
          <h2>Giỏ hàng</h2>
          <button className="ops-button ghost" type="button" onClick={closeCart}>Đóng</button>
        </div>
        <div className="cart-drawer-body">
          {isBusy ? <p className="ops-muted">Đang tải giỏ hàng...</p> : null}
          {!isBusy && hasItems ? cart.items.map((item) => (
            <div className="cart-drawer-item" key={item.productId}>
              <div className="ops-row">
                <div>
                  <strong>{item.name}</strong>
                  <div className="cart-quantity-control" aria-label="Cập nhật số lượng">
                    <button
                      className="cart-quantity-button"
                      type="button"
                      disabled={isBusy}
                      onClick={() => updateItemQuantity(item.productId, Number(item.quantity) - 1)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="cart-quantity-button"
                      type="button"
                      disabled={isBusy}
                      onClick={() => updateItemQuantity(item.productId, Number(item.quantity) + 1)}
                    >
                      +
                    </button>
                    <button
                      className="cart-remove-button"
                      type="button"
                      disabled={isBusy}
                      onClick={() => removeItem(item.productId)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
                <strong>{formatVnd(item.unitPrice * item.quantity)}</strong>
              </div>
            </div>
          )) : null}
          {!isBusy && !hasItems ? <p className="ops-muted">Giỏ hàng đang trống.</p> : null}
          {hasItems ? (
            <div className="cart-drawer-total">
              Tổng SL: {cart.totals?.totalQuantity || 0} | Tạm tính: {formatVnd(cart.totals?.subtotal || 0)}
            </div>
          ) : null}
        </div>
        <div className="cart-drawer-foot">
          {hasItems ? (
            <Link className="ops-button" to="/checkout" onClick={closeCart}>
              Nhập địa chỉ giao hàng
            </Link>
          ) : (
            <button className="ops-button" type="button" disabled>
              Nhập địa chỉ giao hàng
            </button>
          )}
          <Link className="ops-button secondary" to="/orders" onClick={closeCart}>Xem đơn hàng</Link>
        </div>
      </aside>
    </div>
  );
};

export default CartDrawer;
