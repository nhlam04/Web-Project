import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import { register } from '../../utils/appApi';
import { Button, Card, ErrorState, Input, Select, Toast } from '../shared/designSystem';

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
    >
      <div className="flex justify-center py-8">
        <Card className="w-full max-w-[460px] flex flex-col gap-6 p-6 md:p-8">
          {message ? <Toast>{message}</Toast> : null}
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
                minLength={8} 
                value={form.password} 
                onChange={(event) => setForm({ ...form, password: event.target.value })} 
                required 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Loại tài khoản</label>
              <Select 
                value={form.role} 
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              >
                <option value="CUSTOMER">Khách hàng</option>
                <option value="SELLER">Người bán</option>
              </Select>
            </div>
            <div className="mt-2">
              <Button type="submit" disabled={busy} className="w-full h-11 text-base">
                {busy ? 'Đang tạo...' : 'Đăng ký'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageShell>
  );
};

export default RegisterPage;
