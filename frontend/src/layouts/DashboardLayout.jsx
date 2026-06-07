import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Boxes, ClipboardList, LayoutDashboard, LogOut, PackagePlus, Settings, User, Users } from 'lucide-react';
import { useAuth } from '../components/auth/AuthProvider';

const linksByRole = {
  admin: [
    { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Người dùng', icon: Users },
  ],
  seller: [
    { to: '/seller', label: 'Tổng quan', icon: LayoutDashboard, end: true },
    { to: '/seller/orders', label: 'Đơn hàng', icon: ClipboardList },
    { to: '/seller/products', label: 'Sản phẩm', icon: Boxes },
    { to: '/seller/products/new', label: 'Tạo sản phẩm', icon: PackagePlus },
    { to: '/seller/shop', label: 'Hồ sơ shop', icon: Settings },
    { to: '/seller/profile', label: 'Hồ sơ', icon: User },
    { to: '/seller/notifications', label: 'Thông báo', icon: Bell },
  ],
};

export default function DashboardLayout({ role = 'seller' }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const links = linksByRole[role] || linksByRole.seller;
  const homePath = role === 'admin' ? '/admin' : '/seller';

  function handleLogout() {
    auth.logout();
    navigate('/login', { replace: true });
  }

  return (
    <>
      <style>{`
        .dash-shell { min-height: 100vh; display: grid; grid-template-columns: 250px minmax(0, 1fr); background: #f8fafc; color: #0f172a; font-family: "Inter", "Segoe UI", Arial, sans-serif; }
        .dash-sidebar { position: sticky; top: 0; height: 100vh; background: #0f172a; color: #e2e8f0; padding: 18px; display: flex; flex-direction: column; gap: 18px; }
        .dash-brand { color: #fff; font-weight: 900; text-decoration: none; font-size: 18px; letter-spacing: 0; }
        .dash-user { border: 1px solid #334155; border-radius: 8px; padding: 12px; display: grid; gap: 4px; }
        .dash-user span { color: #94a3b8; font-size: 13px; }
        .dash-nav { display: grid; gap: 6px; }
        .dash-nav a { color: #cbd5e1; text-decoration: none; border-radius: 6px; padding: 10px 11px; display: flex; align-items: center; gap: 10px; font-weight: 800; }
        .dash-nav a:hover, .dash-nav a.active { background: #1e293b; color: #fff; }
        .dash-spacer { flex: 1; }
        .dash-logout { width: 100%; border: 1px solid #334155; border-radius: 6px; padding: 10px 11px; background: transparent; color: #cbd5e1; display: flex; align-items: center; gap: 10px; font: inherit; font-weight: 800; cursor: pointer; }
        .dash-logout:hover { background: #7f1d1d; border-color: #991b1b; color: #fff; }
        .dash-main { min-width: 0; padding: 26px var(--app-page-pad) 56px; }
        .dash-content { max-width: var(--app-content-max); margin: 0 auto; }
        @media (max-width: 820px) {
          .dash-shell { grid-template-columns: 1fr; }
          .dash-sidebar { position: static; height: auto; }
          .dash-nav { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
        }
      `}</style>
      <div className="dash-shell">
        <aside className="dash-sidebar">
          <Link className="dash-brand" to={homePath}>Project Web nhóm 16</Link>
          <div className="dash-user">
            <strong>{auth.user?.username || 'Tài khoản'}</strong>
            <span>{auth.role || role.toUpperCase()}</span>
          </div>
          <nav className="dash-nav" aria-label="Dashboard">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} end={item.end}>
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="dash-spacer" />
          <button className="dash-logout" type="button" onClick={handleLogout}>
            <LogOut size={18} />
            Đăng xuất
          </button>
        </aside>
        <main className="dash-main">
          <div className="dash-content">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
