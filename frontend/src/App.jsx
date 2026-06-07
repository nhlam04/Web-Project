import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ChatWidget from './components/chat/ChatWidget';
import { AuthProvider } from './components/auth/AuthProvider';
import { GuestOnly, RequireAuth, RequireRole } from './components/auth/AuthGates';
import { CartProvider } from './components/cart/CartProvider';
import ToastProvider from './components/ToastProvider';
import CustomerLayout from './layouts/CustomerLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import RoleProfileRedirect from './pages/auth/RoleProfileRedirect';
import RoleNotificationRedirect from './pages/auth/RoleNotificationRedirect';
import RoleHomeRedirect from './pages/auth/RoleHomeRedirect';
import ProductList from './pages/customer/ProductList';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderList from './pages/customer/OrderList';
import OrderDetail from './pages/customer/OrderDetail';
import FulfillmentTracking from './pages/customer/FulfillmentTracking';
import About from './pages/customer/About';
import Help from './pages/customer/Help';
import ReturnPolicy from './pages/customer/ReturnPolicy';
import PrivacyPolicy from './pages/customer/PrivacyPolicy';
import BuyingGuide from './pages/customer/BuyingGuide';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';
import SellerProductsPage from './pages/seller/SellerProductsPage';
import SellerProductForm from './pages/seller/SellerProductForm';
import ShopProfile from './pages/seller/ShopProfile';
import SellerProfilePage from './pages/seller/SellerProfilePage';
import SellerNotificationsPage from './pages/seller/SellerNotificationsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider />
          <Routes>
            <Route element={<CustomerLayout />}>
              <Route index element={<RoleHomeRedirect />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/product-list" element={<ProductList />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/product-detail/:slug" element={<ProductDetail />} />
              <Route path="/catalogs/:catalogId" element={<ProductList />} />
              <Route path="/cart" element={<RequireRole roles={['CUSTOMER']}><Cart /></RequireRole>} />
              <Route path="/checkout" element={<RequireRole roles={['CUSTOMER']}><Checkout /></RequireRole>} />
              <Route path="/orders" element={<RequireRole roles={['CUSTOMER']}><OrderList /></RequireRole>} />
              <Route path="/orders/:orderId" element={<RequireRole roles={['CUSTOMER']}><OrderDetail /></RequireRole>} />
              <Route path="/fulfillment-tracking/:orderId" element={<RequireRole roles={['CUSTOMER']}><FulfillmentTracking /></RequireRole>} />
              <Route path="/profile" element={<RequireAuth><RoleProfileRedirect /></RequireAuth>} />
              <Route path="/notifications" element={<RequireAuth><RoleNotificationRedirect /></RequireAuth>} />
              <Route path="/about" element={<About />} />
              <Route path="/help" element={<Help />} />
              <Route path="/return-policy" element={<ReturnPolicy />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/buying-guide" element={<BuyingGuide />} />
            </Route>

            <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />

            <Route path="/admin" element={<RequireRole roles={['ADMIN']}><DashboardLayout role="admin" /></RequireRole>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
            </Route>

            <Route path="/seller" element={<RequireRole roles={['SELLER']}><DashboardLayout role="seller" /></RequireRole>}>
              <Route index element={<SellerDashboard />} />
              <Route path="orders" element={<SellerOrdersPage />} />
              <Route path="products" element={<SellerProductsPage />} />
              <Route path="products/new" element={<SellerProductForm />} />
              <Route path="products/:productId/edit" element={<SellerProductForm />} />
              <Route path="shop" element={<ShopProfile />} />
              <Route path="profile" element={<SellerProfilePage />} />
              <Route path="notifications" element={<SellerNotificationsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ChatWidget />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
