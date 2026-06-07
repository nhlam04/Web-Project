import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from '../components/LandingPage';
import ProductList from '../components/catalog/ProductList';
import ProductDetail from '../components/catalog/ProductDetail';
import CatalogProductList from '../components/catalog/CatalogProductList';
import ChatWidget from '../components/chat/ChatWidget';
import LoginPage from '../components/auth/LoginPage';
import RegisterPage from '../components/auth/RegisterPage';
import ProfilePage from '../components/auth/ProfilePage';
import OrderListPage from '../components/orders/OrderListPage';
import OrderDetailPage from '../components/orders/OrderDetailPage';
import FulfillmentTrackingPage from '../components/orders/FulfillmentTrackingPage';
import SellerOrdersPage from '../components/seller/SellerOrdersPage';
import NotificationListPage from '../components/notifications/NotificationListPage';
import AdminUsersPage from '../components/admin/AdminUsersPage';
import { CartProvider } from '../components/cart/CartProvider';
import { AuthProvider } from '../components/auth/AuthProvider';
import { GuestOnly, RequireAuth, RequireRole } from '../components/auth/AuthGates';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Root */}
            <Route path="/" element={<LandingPage />} />

            {/* Product */}
            <Route path="/product-list" element={<ProductList />} />
            <Route path="/product-detail/:slug" element={<ProductDetail />} />

            {/* Catalog */}
            <Route path="/catalogs/:catalogId" element={<CatalogProductList />} />

            {/* IAM */}
            <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
            <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />

            {/* Ordering */}
            <Route path="/orders" element={<RequireRole roles={['CUSTOMER']}><OrderListPage /></RequireRole>} />
            <Route path="/orders/:orderId" element={<RequireRole roles={['CUSTOMER']}><OrderDetailPage /></RequireRole>} />

            {/* Fulfillment */}
            <Route path="/fulfillment-tracking/:orderId" element={<RequireRole roles={['CUSTOMER']}><FulfillmentTrackingPage /></RequireRole>} />


            {/* Notification */}
            <Route path="/notifications" element={<RequireAuth><NotificationListPage /></RequireAuth>} />

            {/* Seller */}
            <Route path="/seller/orders" element={<RequireRole roles={['SELLER']}><SellerOrdersPage /></RequireRole>} />

            {/* Admin */}
            <Route path="/admin/users" element={<RequireRole roles={['ADMIN']}><AdminUsersPage /></RequireRole>} />
          </Routes>
          <ChatWidget />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
