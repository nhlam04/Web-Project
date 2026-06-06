import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import CartDrawer from '../cart/CartDrawer';
import { useCart } from '../cart/CartProvider';
import { useAuth } from '../auth/AuthProvider';
import NotificationBell from '../NotificationBell';

const productMatch = (pathname) => pathname === '/product-list'
  || pathname === '/products'
  || pathname.startsWith('/product-detail/')
  || pathname.startsWith('/products/')
  || pathname.startsWith('/catalogs/');

function getPrimaryLinks(auth) {
  const productLink = { to: '/products', label: 'Sản phẩm', match: productMatch };
  const categoryLink = { to: '/#categories', label: 'Danh mục', match: (pathname) => pathname.startsWith('/catalogs/') };

  if (auth.isSeller) {
    return [productLink, categoryLink];
  }

  if (auth.isCustomer) {
    return [
      { to: '/', label: 'Trang chủ', match: (pathname) => pathname === '/' },
      categoryLink,
      productLink,
      { to: '/orders', label: 'Đơn hàng' },
    ];
  }

  return [
    { to: '/', label: 'Trang chủ', match: (pathname) => pathname === '/' },
    categoryLink,
    productLink,
  ];
}

function routeLabel(pathname) {
  if (pathname === '/') return 'Nhóm 16';
  if (pathname === '/login') return 'Đăng nhập';
  if (pathname === '/register') return 'Đăng ký';
  if (pathname === '/profile') return 'Hồ sơ';
  if (pathname === '/orders') return 'Đơn hàng';
  if (pathname.startsWith('/orders/')) return 'Chi tiết đơn hàng';
  if (pathname.startsWith('/fulfillment-tracking/')) return 'Theo dõi giao hàng';
  if (pathname === '/notifications') return 'Thông báo';
  if (pathname === '/product-list' || pathname === '/products') return 'Sản phẩm';
  if (pathname === '/return-policy') return 'Chính sách đổi trả';
  if (pathname === '/privacy-policy') return 'Chính sách bảo mật';
  if (pathname === '/buying-guide') return 'Hướng dẫn mua hàng';
  return 'Trang';
}

function isProductRoute(pathname) {
  return pathname === '/' || productMatch(pathname);
}

function breadcrumbItems(pathname, pageTitle) {
  if (pathname === '/') return [];
  if (pathname === '/product-list' || pathname === '/products') return [{ to: '/', label: 'Nhóm 16' }, { label: 'Sản phẩm' }];
  if (pathname.startsWith('/product-detail/') || pathname.startsWith('/products/')) {
    return [{ to: '/', label: 'Nhóm 16' }, { to: '/products', label: 'Sản phẩm' }, { label: pageTitle || 'Chi tiết sản phẩm' }];
  }
  if (pathname.startsWith('/catalogs/')) return [{ to: '/', label: 'Nhóm 16' }, { label: pageTitle || 'Danh mục' }];
  if (pathname.startsWith('/orders/')) return [{ to: '/orders', label: 'Đơn hàng' }, { label: 'Chi tiết đơn hàng' }];
  if (pathname.startsWith('/fulfillment-tracking/')) return [{ to: '/orders', label: 'Đơn hàng' }, { label: 'Theo dõi giao hàng' }];
  return [{ to: '/', label: 'Nhóm 16' }, { label: routeLabel(pathname) }];
}

const PageShell = ({ children, title, subtitle, actions = [], compact = false, hideHeader = false, fullBleed = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth.user;
  const pageTitle = title || routeLabel(location.pathname);
  const showCart = auth.isCustomer && isProductRoute(location.pathname);
  const crumbs = breadcrumbItems(location.pathname, pageTitle);
  const { cartCount, error: cartError, message: cartMessage, openCart } = useCart();
  const primaryLinks = getPrimaryLinks(auth);

  const [searchQuery, setSearchQuery] = useState('');

  function handleLogout() {
    auth.logout();
    navigate('/login');
  }

  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 font-sans">
      <header className="bg-brand-600 text-white w-full sticky top-0 z-50 shadow-md">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex justify-between items-center h-8 text-xs font-light opacity-90">
            <div className="flex items-center gap-3"></div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              {user ? (
                <div className="flex items-center gap-3">
                  <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-5 h-5 rounded-full bg-white text-brand-600 flex items-center justify-center font-bold text-[10px]">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{user.username}</span>
                  </Link>
                  <div className="w-px h-3 bg-white/30" />
                  <button onClick={handleLogout} className="hover:opacity-80 transition-opacity">Đăng xuất</button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/register" className="hover:opacity-80 transition-opacity">Đăng ký</Link>
                  <div className="w-px h-3 bg-white/30" />
                  <Link to="/login" className="hover:opacity-80 transition-opacity">Đăng nhập</Link>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center py-4 md:py-5 gap-4 md:gap-8 h-auto md:h-[85px]">
            <Link to="/" className="flex items-center gap-2 text-2xl font-semibold tracking-tight shrink-0 hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 bg-white text-brand-600 rounded-xl flex items-center justify-center font-black text-2xl shadow-sm">
                W
              </div>
              Project Web Nhóm 16
            </Link>

            <div className="flex-1 w-full flex flex-col order-3 md:order-none">
              <form className="flex bg-white rounded-lg h-10 shadow-sm overflow-hidden border border-brand-500/30" onSubmit={handleSearch}>
                <input
                  type="text"
                  className="flex-1 border-none outline-none px-4 text-sm bg-transparent text-slate-800 placeholder-slate-400"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="w-16 bg-brand-700 hover:bg-brand-800 text-white transition-colors flex items-center justify-center focus:outline-none" aria-label="Tìm kiếm">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 19 19"><g fillRule="evenodd"><path d="M17.022 16.59l-3.364-3.363a7.52 7.52 0 10-.432.433l3.363 3.363a.305.305 0 00.433 0 .305.305 0 000-.433zM3.486 8.52A5.034 5.034 0 118.52 13.55 5.034 5.034 0 013.486 8.52z"></path></g></svg>
                </button>
              </form>
              <div className="mt-2 flex gap-4 text-[13px]">
                {primaryLinks.map((item, idx) => (
                  <Link key={idx} to={item.to} className="text-white/90 hover:text-white transition-colors">{item.label}</Link>
                ))}
              </div>
            </div>

            <div className="shrink-0 flex justify-center w-auto md:w-20">
              {showCart && (
                <button className="relative p-2 text-white hover:opacity-80 transition-opacity" onClick={openCart} aria-label="Giỏ hàng">
                  <svg viewBox="0 0 26.6 25.6" fill="currentColor" className="w-7 h-7"><polyline fill="none" points="2 1.7 5.5 1.7 9.6 18.3 21.2 18.3 24.6 6.1 7 6.1" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2.5" stroke="currentColor"></polyline><circle cx="10.7" cy="23" r="2.2" stroke="none"></circle><circle cx="19.7" cy="23" r="2.2" stroke="none"></circle></svg>
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-white text-brand-600 border border-brand-600 text-[11px] font-bold h-5 min-w-[20px] rounded-full flex items-center justify-center px-1">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={`w-full mx-auto flex-1 flex flex-col ${fullBleed ? 'max-w-none p-0' : 'max-w-[1200px] px-4 py-6 md:py-8'}`}>
        {crumbs.length > 0 && !fullBleed && (
          <div className="flex flex-wrap items-center gap-2 mb-6 text-sm text-slate-500" aria-label="Breadcrumb">
            {crumbs.map((item, index) => (
              <React.Fragment key={`${item.label}-${index}`}>
                {index > 0 && <span className="text-slate-400 text-xs">{'>'}</span>}
                {item.to ? (
                  <Link to={item.to} className="text-brand-600 hover:text-brand-800 transition-colors">{item.label}</Link>
                ) : (
                  <span className="text-slate-700">{item.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        
        {cartMessage && <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">{cartMessage}</div>}
        {cartError && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{cartError}</div>}

        <div className="flex-1 min-w-0">
          {!hideHeader && title && (
            <header className="flex flex-wrap justify-between items-end gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight m-0 mb-1">{pageTitle}</h1>
                {subtitle && <p className="text-slate-500 m-0">{subtitle}</p>}
              </div>
              {actions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <Link 
                      key={`${action.to}-${action.label}`}
                      to={action.to} 
                      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        action.variant === 'primary' 
                          ? 'bg-brand-600 text-white hover:bg-brand-700' 
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              )}
            </header>
          )}
          {children}
        </div>
      </main>
      <CartDrawer />
    </div>
  );
};

export default PageShell;
