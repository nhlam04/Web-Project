import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import { login } from '../../utils/appApi';
import { useAuth } from './AuthProvider';
import { getPostLoginPath } from '../../utils/authRoutes';
import { Button, Card, ErrorState, Input } from '../shared/designSystem';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
      navigate(getPostLoginPath(profile.role, location.state?.from), { replace: true });
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
    >
      <div className="flex justify-center py-8">
        <Card className="w-full max-w-[460px] flex flex-col gap-6 p-6 md:p-8">
          {error ? <ErrorState description={error} /> : null}
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Tên đăng nhập</label>
              <Input 
                value={form.username} 
                onChange={(event) => setForm({ ...form, username: event.target.value })} 
                required 
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
              <Input 
                type="password" 
                value={form.password} 
                onChange={(event) => setForm({ ...form, password: event.target.value })} 
                required 
              />
            </div>
            <div className="mt-2">
              <Button type="submit" disabled={busy} className="w-full h-11 text-base">
                {busy ? 'Đang xử lý...' : 'Đăng nhập'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageShell>
  );
};

export default LoginPage;
