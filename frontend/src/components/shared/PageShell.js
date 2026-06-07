import React from 'react';
import { ShoppingCart } from 'lucide-react';
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

  if (auth.isAdmin) {
    return [
      { to: '/admin/users', label: 'Người dùng' },
      { to: '/products', label: 'Sản phẩm', match: productMatch },
    ];
  }

  if (auth.isCustomer) {
    return [
      { to: '/', label: 'Trang chủ', match: (pathname) => pathname === '/' },
      categoryLink,
      productLink,
      { to: '/orders', label: 'Đơn hàng' },
      { to: '/profile', label: 'Hồ sơ' },
    ];
  }

  return [
    { to: '/', label: 'Trang chủ', match: (pathname) => pathname === '/' },
    categoryLink,
    productLink,
  ];
}

function routeLabel(pathname) {
  if (pathname === '/') return 'Catalog';
  if (pathname === '/login') return 'Đăng nhập';
  if (pathname === '/register') return 'Đăng ký';
  if (pathname === '/profile') return 'Hồ sơ';
  if (pathname === '/orders') return 'Đơn hàng';
  if (pathname.startsWith('/orders/')) return 'Chi tiết đơn hàng';
  if (pathname.startsWith('/fulfillment-tracking/')) return 'Theo dõi giao hàng';
  if (pathname === '/notifications') return 'Thông báo';
  if (pathname === '/admin/users') return 'Quản trị người dùng';
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
  if (pathname === '/product-list' || pathname === '/products') return [{ to: '/', label: 'Trang chủ' }, { label: 'Sản phẩm' }];
  if (pathname.startsWith('/product-detail/') || pathname.startsWith('/products/')) {
    return [{ to: '/', label: 'Trang chủ' }, { to: '/products', label: 'Sản phẩm' }, { label: pageTitle || 'Chi tiết sản phẩm' }];
  }
  if (pathname.startsWith('/catalogs/')) return [{ to: '/', label: 'Trang chủ' }, { label: pageTitle || 'Danh mục' }];
  if (pathname.startsWith('/orders/')) return [{ to: '/orders', label: 'Đơn hàng' }, { label: 'Chi tiết đơn hàng' }];
  if (pathname.startsWith('/fulfillment-tracking/')) return [{ to: '/orders', label: 'Đơn hàng' }, { label: 'Theo dõi giao hàng' }];
  if (pathname === '/admin/users') return [{ to: '/', label: 'Trang chủ' }, { label: 'Quản trị người dùng' }];
  return [{ to: '/', label: 'Trang chủ' }, { label: routeLabel(pathname) }];
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

  function handleLogout() {
    auth.logout();
    navigate('/login');
  }

  return (
    <>
      <style>{`
        .ops-shell { min-height: 100vh; width: 100%; background: #f8fafc; color: #111827; font-family: "Inter", "Segoe UI", Arial, sans-serif; display: flex; flex-direction: column; }
        .ops-nav { position: sticky; top: 0; z-index: 40; background: rgba(255,255,255,.96); border-bottom: 1px solid #e5e7eb; backdrop-filter: blur(12px); }
        .ops-nav-inner { max-width: var(--app-content-max); margin: 0 auto; padding: 11px var(--app-page-pad); display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 18px; align-items: center; }
        .ops-brand { font-weight: 900; color: #1d4ed8; text-decoration: none; white-space: nowrap; letter-spacing: 0; }
        .ops-links { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; font-size: 14px; }
        .ops-links::-webkit-scrollbar { display: none; }
        .ops-links a { color: #475569; text-decoration: none; font-weight: 800; padding: 8px 10px; border-radius: 6px; white-space: nowrap; border: 1px solid transparent; }
        .ops-links a:hover, .ops-links a.active { color: #1d4ed8; background: #eff6ff; border-color: #bfdbfe; }
        .ops-account { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; font-size: 13px; color: #64748b; }
        .ops-account-main { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
        .ops-user-chip { max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #334155; font-weight: 800; }
        .ops-cart-btn { position: relative; gap: 8px; }
        .ops-icon-btn { position: relative; width: 40px; height: 40px; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
        .ops-icon-btn:hover { color: #1d4ed8; background: #eff6ff; border-color: #bfdbfe; }
        .ops-cart-count { position: absolute; top: -8px; right: -8px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: #dc2626; color: #fff; font-size: 11px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; }
        .ops-main { width: 100%; max-width: ${fullBleed ? 'none' : 'var(--app-content-max)'}; margin: 0 auto; padding: ${fullBleed ? '0' : compact ? '18px var(--app-page-pad) 56px' : '26px var(--app-page-pad) 56px'}; flex: 1; }
        .ops-content { min-width: 0; }
        .ops-header { margin-bottom: 20px; display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
        .ops-header h1 { font-size: 30px; line-height: 1.2; margin: 0 0 8px; color: #0f172a; letter-spacing: 0; }
        .ops-header p { margin: 0; color: #64748b; }
        .ops-breadcrumbs { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; color: #64748b; font-size: 13px; }
        .ops-breadcrumbs a { color: #475569; font-weight: 700; text-decoration: none; }
        .ops-breadcrumbs a:hover { color: #1d4ed8; }
        .ops-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
        .ops-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
        .ops-card h2, .ops-card h3 { margin: 0 0 12px; color: #111827; letter-spacing: 0; }
        .ops-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .ops-stack { display: grid; gap: 14px; }
        .ops-muted { color: #64748b; }
        .ops-small { font-size: 13px; }
        .ops-kpi { display: grid; gap: 4px; }
        .ops-kpi strong { font-size: 24px; color: #0f172a; }
        .ops-badge { display: inline-flex; align-items: center; min-height: 24px; padding: 2px 9px; border-radius: 999px; background: #eef2ff; color: #4338ca; font-weight: 700; font-size: 12px; }
        .ops-badge.neutral { background: #f1f5f9; color: #475569; }
        .ops-badge.warning { background: #fef3c7; color: #92400e; }
        .ops-badge.success { background: #dcfce7; color: #166534; }
        .ops-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .ops-button { border: 0; border-radius: 6px; padding: 10px 14px; background: #4f46e5; color: #ffffff; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; min-height: 40px; }
        .ops-button.secondary { background: #e2e8f0; color: #0f172a; }
        .ops-button.danger { background: #dc2626; color: #ffffff; }
        .ops-button.ghost { background: #ffffff; color: #334155; border: 1px solid #cbd5e1; }
        .ops-button:disabled { opacity: 0.55; cursor: not-allowed; }
        .ops-input, .ops-select { width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; font: inherit; background: #ffffff; min-height: 40px; }
        .ops-label { display: grid; gap: 6px; font-weight: 700; color: #334155; font-size: 14px; }
        .ops-message { margin-bottom: 16px; padding: 10px 12px; border-radius: 8px; background: #ecfeff; border: 1px solid #99f6e4; color: #0f766e; }
        .ops-error { margin-bottom: 16px; padding: 10px 12px; border-radius: 8px; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
        .ops-table-wrap { width: 100%; overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 8px; background: #ffffff; }
        .ops-table { width: 100%; border-collapse: collapse; background: #ffffff; }
        .ops-table th, .ops-table td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        .ops-table th { background: #f1f5f9; color: #334155; font-size: 13px; white-space: nowrap; }
        .ops-table tr:last-child td { border-bottom: 0; }
        .ops-timeline { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
        .ops-timeline li { border-left: 3px solid #c7d2fe; padding-left: 12px; }
        @media (max-width: 720px) {
          .ops-nav-inner { grid-template-columns: 1fr; gap: 10px; }
          .ops-account { justify-content: space-between; width: 100%; }
          .ops-links { width: 100%; padding-bottom: 2px; }
          .ops-header h1 { font-size: 26px; }
        }
      `}</style>
      <div className="ops-shell">
        <nav className="ops-nav" aria-label="Điều hướng chính">
          <div className="ops-nav-inner">
            <Link className="ops-brand" to="/">Project Web nhóm 16</Link>
            <div className="ops-links">
              {primaryLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => (item.match ? item.match(location.pathname) : isActive) ? 'active' : undefined}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="ops-account">
              {showCart ? (
                <button className="ops-button ghost ops-cart-btn" onClick={openCart} type="button" aria-label="Mở giỏ hàng">
                  <ShoppingCart size={18} aria-hidden="true" />
                  Giỏ hàng
                  {cartCount ? <span className="ops-cart-count">{cartCount}</span> : null}
                </button>
              ) : null}
              <NotificationBell />
              <span className="ops-account-main">
                {user ? <span className="ops-user-chip">{user.username}</span> : <span>Khách</span>}
                {user?.role ? <span className="ops-badge neutral">{user.role}</span> : null}
              </span>
              {user ? (
                <button className="ops-button ghost" onClick={handleLogout}>Đăng xuất</button>
              ) : (
                <>
                  <Link className="ops-button ghost" to="/login">Đăng nhập</Link>
                  <Link className="ops-button secondary" to="/register">Đăng ký</Link>
                </>
              )}
            </div>
          </div>
        </nav>
        <main className="ops-main">
          {crumbs.length ? (
            <div className="ops-breadcrumbs" aria-label="Breadcrumb">
              {crumbs.map((item, index) => (
                <React.Fragment key={`${item.label}-${index}`}>
                  {index > 0 ? <span>/</span> : null}
                  {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
                </React.Fragment>
              ))}
            </div>
          ) : null}
          {cartMessage ? <div className="ops-message">{cartMessage}</div> : null}
          {cartError ? <div className="ops-error">{cartError}</div> : null}
          <div className="ops-content">
            {!hideHeader ? (
              <header className="ops-header">
                <div>
                  <h1>{pageTitle}</h1>
                  {subtitle ? <p>{subtitle}</p> : null}
                </div>
                {actions.length ? (
                  <div className="ops-actions">
                    {actions.map((action) => (
                      <Link className={`ops-button ${action.variant || 'secondary'}`} to={action.to} key={`${action.to}-${action.label}`}>
                        {action.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </header>
            ) : null}
            {children}
          </div>
        </main>
        <CartDrawer />
      </div>
    </>
  );
};

export default PageShell;
