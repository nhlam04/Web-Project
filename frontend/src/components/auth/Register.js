import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength indicator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    const labels = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
    const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'];

    return {
      strength: Math.min(strength, 5),
      label: labels[Math.min(strength - 1, 4)] || '',
      color: colors[Math.min(strength - 1, 4)] || '',
    };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    // Client-side validation
    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập tên tài khoản');
      setIsLoading(false);
      return;
    }

    if (username.length < 3) {
      setErrorMessage('Tên tài khoản phải có ít nhất 3 ký tự');
      setIsLoading(false);
      return;
    }

    if (username.length > 30) {
      setErrorMessage('Tên tài khoản không được vượt quá 30 ký tự');
      setIsLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(username)) {
      setErrorMessage('Tên tài khoản chỉ được chứa chữ cái, số, gạch dưới và gạch ngang');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Mật khẩu phải có ít nhất 8 ký tự');
      setIsLoading(false);
      return;
    }

    if (!/[a-zA-Z]/.test(password)) {
      setErrorMessage('Mật khẩu phải có ít nhất 1 chữ cái');
      setIsLoading(false);
      return;
    }

    if (!/[0-9]/.test(password)) {
      setErrorMessage('Mật khẩu phải có ít nhất 1 chữ số');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      setIsLoading(false);
      return;
    }

    try {
      const result = await register(username, password);
      
      if (result.success) {
        setSuccessMessage('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setErrorMessage(result.error || 'Đăng ký thất bại');
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
          <h1>Đăng Ký</h1>
          <p>Tạo tài khoản mới để bắt đầu mua sắm.</p>
        </div>

        {errorMessage && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            <span>{successMessage}</span>
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
            <small className="form-hint">
              3-30 ký tự, chỉ chữ cái, số, gạch dưới và gạch ngang
            </small>
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
                autoComplete="new-password"
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
            {password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${(passwordStrength.strength / 5) * 100}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  ></div>
                </div>
                <small style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </small>
              </div>
            )}
            <small className="form-hint">
              Ít nhất 8 ký tự, có chữ cái và số
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu..."
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
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
              'Đăng Ký'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Đã có tài khoản?{' '}
            <Link to="/login" className="link-primary">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>

      <div className="auth-illustration">
        <img
          src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80"
          alt="Register Illustration"
        />
      </div>
    </div>
  );
};

export default Register;
