import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import { register } from '../../utils/appApi';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', role: 'CUSTOMER' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await register(form.username, form.password, form.role);
      setMessage(`Đã tạo tài khoản ${result.userId || ''} với vai trò ${result.role || form.role}. Hãy đăng nhập.`);
      setTimeout(() => navigate('/login'), 600);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      title="Đăng ký"
      subtitle="Chọn Khách hàng để mua hàng hoặc Người bán để quản lý fulfillment."
      actions={[{ label: 'Đăng nhập', to: '/login' }, { label: 'Catalog', to: '/' }]}
    >
      <form className="ops-card ops-stack" onSubmit={handleSubmit} style={{ maxWidth: 460 }}>
        {message ? <div className="ops-message">{message}</div> : null}
        {error ? <div className="ops-error">{error}</div> : null}
        <label className="ops-label">
          Tên đăng nhập
          <input className="ops-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </label>
        <label className="ops-label">
          Mật khẩu
          <input className="ops-input" type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </label>
        <label className="ops-label">
          Loại tài khoản
          <select className="ops-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="CUSTOMER">Khách hàng</option>
            <option value="SELLER">Người bán</option>
          </select>
        </label>
        <div className="ops-actions">
          <button className="ops-button" disabled={busy}>{busy ? 'Đang tạo...' : 'Đăng ký'}</button>
          <Link className="ops-button secondary" to="/login">Đã có tài khoản</Link>
        </div>
      </form>
    </PageShell>
  );
};

export default RegisterPage;
