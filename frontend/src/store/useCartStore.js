import { create } from 'zustand';
import { addProductToCart, checkoutCart, getOrCreateCart, removeCartItem, updateCartItemQuantity } from '../services/cartService';

export const useCartStore = create((set, get) => ({
  cart: null,
  isOpen: false,
  isBusy: false,
  error: '',
  message: '',
  get items() {
    return get().cart?.items || [];
  },
  get totalPrice() {
    return get().cart?.totals?.totalAmount || 0;
  },
  get cartCount() {
    return get().cart?.totals?.totalQuantity || 0;
  },
  async refreshCart() {
    set({ isBusy: true, error: '' });
    try {
      const cart = await getOrCreateCart();
      set({ cart, isBusy: false });
      return cart;
    } catch (error) {
      set({ error: error.message, isBusy: false });
      throw error;
    }
  },
  async addItem(product, quantity = 1) {
    set({ isBusy: true, error: '', message: '' });
    try {
      const currentCart = get().cart || (await getOrCreateCart());
      const cart = await addProductToCart(currentCart.id, product, quantity);
      set({ cart, isBusy: false, message: 'Đã thêm sản phẩm vào giỏ hàng' });
      return cart;
    } catch (error) {
      set({ error: error.message, isBusy: false });
      throw error;
    }
  },
  async updateQuantity(productId, quantity) {
    const cartId = get().cart?.id;
    if (!cartId) return null;
    const cart = quantity <= 0
      ? await removeCartItem(cartId, productId)
      : await updateCartItemQuantity(cartId, productId, quantity);
    set({ cart });
    return cart;
  },
  async removeItem(productId) {
    const cartId = get().cart?.id;
    if (!cartId) return null;
    const cart = await removeCartItem(cartId, productId);
    set({ cart });
    return cart;
  },
  async clearCart() {
    set({ cart: null, message: '', error: '' });
  },
  async checkout() {
    const cartId = get().cart?.id;
    if (!cartId) return null;
    const result = await checkoutCart(cartId);
    set({ cart: null, isOpen: false });
    return result;
  },
  openCart() {
    set({ isOpen: true });
  },
  closeCart() {
    set({ isOpen: false });
  },
}));
