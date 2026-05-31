import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './UserMenu.css';

const UserMenu = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-buttons">
        <button
          className="btn-auth btn-login"
          onClick={() => navigate('/login')}
        >
          Đăng nhập
        </button>
        <button
          className="btn-auth btn-register"
          onClick={() => navigate('/register')}
        >
          Đăng ký
        </button>
      </div>
    );
  }

  return (
    <div className="user-menu">
      <button
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="user-avatar">
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="user-name">{user?.username || 'User'}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="user-menu-overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="user-menu-dropdown">
            <div className="user-menu-header">
              <div className="user-avatar-large">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-info">
                <div className="user-info-name">{user?.username}</div>
                <div className="user-info-role">
                  {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                </div>
              </div>
            </div>

            <div className="user-menu-divider" />

            <div className="user-menu-items">
              <button
                className="user-menu-item"
                onClick={() => {
                  navigate('/profile');
                  setIsOpen(false);
                }}
              >
                <span className="menu-icon">👤</span>
                <span>Tài khoản của tôi</span>
              </button>

              <button
                className="user-menu-item"
                onClick={() => {
                  navigate('/orders');
                  setIsOpen(false);
                }}
              >
                <span className="menu-icon">📦</span>
                <span>Đơn hàng</span>
              </button>

              {user?.role === 'ADMIN' && (
                <button
                  className="user-menu-item"
                  onClick={() => {
                    navigate('/admin');
                    setIsOpen(false);
                  }}
                >
                  <span className="menu-icon">⚙️</span>
                  <span>Quản trị</span>
                </button>
              )}
            </div>

            <div className="user-menu-divider" />

            <button className="user-menu-item logout" onClick={handleLogout}>
              <span className="menu-icon">🚪</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
