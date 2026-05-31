import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import { login } from '../../utils/appApi';
import { useAuth } from './AuthProvider';

const LoginPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const profile = await login(form.username, form.password);
      auth.setUser(profile);
      await auth.refreshUser();
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      title="Đăng nhập"
      subtitle="Tài khoản kết nối hồ sơ, đơn hàng, thông báo và khu vực người bán."
      actions={[{ label: 'Tạo tài khoản', to: '/register' }, { label: 'Về catalog', to: '/' }]}
    >
      <form className="ops-card ops-stack" onSubmit={handleSubmit} style={{ maxWidth: 460 }}>
        {error ? <div className="ops-error">{error}</div> : null}
        <label className="ops-label">
          Tên đăng nhập
          <input className="ops-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </label>
        <label className="ops-label">
          Mật khẩu
          <input className="ops-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </label>
        <div className="ops-actions">
          <button className="ops-button" disabled={busy}>{busy ? 'Đang xử lý...' : 'Đăng nhập'}</button>
          <Link className="ops-button secondary" to="/register">Tạo tài khoản</Link>
        </div>
      </form>
    </PageShell>
  );
};

export default LoginPage;
