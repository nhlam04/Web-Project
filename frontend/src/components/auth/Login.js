import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    // Client-side validation
    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập tên tài khoản');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      setIsLoading(false);
      return;
    }

    if (username.length < 3) {
      setErrorMessage('Tên tài khoản phải có ít nhất 3 ký tự');
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(username, password, rememberMe);
      
      if (result.success) {
        // Redirect to home page or dashboard
        navigate('/');
      } else {
        setErrorMessage(result.error || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Đăng Nhập</h1>
          <p>Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.</p>
        </div>

        {errorMessage && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Tên tài khoản</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên tài khoản..."
              disabled={isLoading}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <Link to="/forgot-password" className="link-text">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Đang xử lý...</span>
              </>
            ) : (
              'Đăng Nhập'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Chưa có tài khoản?{' '}
            <Link to="/register" className="link-primary">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>

      <div className="auth-illustration">
        <img
          src="https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80"
          alt="Login Illustration"
        />
      </div>
    </div>
  );
};

export default Login;
