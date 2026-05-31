import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addProductToCart,
  checkoutCart,
  getOrCreateCart,
  removeCartItem,
  updateCartItemQuantity,
} from '../../utils/orderingApi';
import { useAuth } from '../auth/AuthProvider';

const CartContext = createContext(null);

const CartProvider = ({ children }) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [cart, setCart] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const cartCount = useMemo(() => cart?.totals?.totalQuantity || 0, [cart]);

  const clearFeedback = useCallback(() => {
    setMessage('');
    setError('');
  }, []);

  const refreshCart = useCallback(async () => {
    if (!auth.isCustomer) {
      setCart(null);
      return null;
    }

    try {
      const nextCart = await getOrCreateCart();
      setCart(nextCart);
      return nextCart;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [auth.isCustomer]);

  const openCart = useCallback(async () => {
    if (!auth.isCustomer) {
      setIsOpen(false);
      setCart(null);
      setMessage('');
      setError(auth.isGuest
        ? 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.'
        : 'Chỉ tài khoản CUSTOMER mới có thể sử dụng giỏ hàng.');
      return;
    }

    setIsOpen(true);
    setIsBusy(true);
    clearFeedback();
    try {
      await refreshCart();
    } finally {
      setIsBusy(false);
    }
  }, [auth.isCustomer, auth.isGuest, clearFeedback, refreshCart]);

  const closeCart = useCallback(() => {
    setIsOpen(false);
  }, []);

  const addProduct = useCallback(async (product, quantity = 1) => {
    if (!auth.isCustomer) {
      const nextMessage = auth.isGuest
        ? 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.'
        : 'Tài khoản SELLER không thể thêm sản phẩm vào giỏ hàng khách hàng.';
      setMessage('');
      setError(nextMessage);
      throw new Error(nextMessage);
    }

    setIsBusy(true);
    clearFeedback();
    try {
      const currentCart = cart || (await getOrCreateCart());
      const nextCart = await addProductToCart(currentCart.id, product, quantity);
      setCart(nextCart);
      setMessage(`Đã thêm ${product.name || 'sản phẩm'} vào giỏ hàng`);
      return nextCart;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [auth.isCustomer, auth.isGuest, cart, clearFeedback]);

  const checkout = useCallback(async () => {
    if (!auth.isCustomer) {
      const nextMessage = auth.isGuest
        ? 'Vui lòng đăng nhập để checkout.'
        : 'Chỉ tài khoản CUSTOMER mới có thể checkout.';
      setError(nextMessage);
      throw new Error(nextMessage);
    }

    if (!cart?.id || !cart?.items?.length) return null;
    setIsBusy(true);
    clearFeedback();
    try {
      const result = await checkoutCart(cart.id);
      setCart(null);
      setIsOpen(false);
      setMessage(`Đã tạo đơn hàng ${result.orderId} với trạng thái ${result.status}`);
      navigate(`/orders/${result.orderId}`);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [auth.isCustomer, auth.isGuest, cart, clearFeedback, navigate]);

  const updateItemQuantity = useCallback(async (productId, quantity) => {
    if (!auth.isCustomer || !cart?.id) return null;
    setIsBusy(true);
    clearFeedback();
    try {
      const nextCart = quantity <= 0
        ? await removeCartItem(cart.id, productId)
        : await updateCartItemQuantity(cart.id, productId, quantity);
      setCart(nextCart);
      setMessage(quantity <= 0 ? 'Đã xóa sản phẩm khỏi giỏ hàng' : 'Đã cập nhật giỏ hàng');
      return nextCart;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [auth.isCustomer, cart?.id, clearFeedback]);

  const removeItem = useCallback(async (productId) => {
    if (!auth.isCustomer || !cart?.id) return null;
    setIsBusy(true);
    clearFeedback();
    try {
      const nextCart = await removeCartItem(cart.id, productId);
      setCart(nextCart);
      setMessage('Đã xóa sản phẩm khỏi giỏ hàng');
      return nextCart;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [auth.isCustomer, cart?.id, clearFeedback]);

  const value = useMemo(() => ({
    addProduct,
    cart,
    cartCount,
    checkout,
    clearFeedback,
    closeCart,
    error,
    isBusy,
    isOpen,
    message,
    openCart,
    refreshCart,
    removeItem,
    updateItemQuantity,
  }), [addProduct, cart, cartCount, checkout, clearFeedback, closeCart, error, isBusy, isOpen, message, openCart, refreshCart, removeItem, updateItemQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được dùng bên trong CartProvider');
  }
  return context;
}

export { CartProvider, useCart };
