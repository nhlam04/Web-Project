import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Toast } from '../shared/designSystem';
import { changePassword } from '../../utils/appApi';
import { useAuth } from './AuthProvider';

const initialForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function validateForm(form) {
  if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
    return 'Vui lòng nhập đầy đủ thông tin mật khẩu';
  }

  if (form.newPassword.length < 8) {
    return 'Mật khẩu mới phải có ít nhất 8 ký tự';
  }

  if (!/[a-zA-Z]/.test(form.newPassword)) {
    return 'Mật khẩu mới phải có ít nhất 1 chữ cái';
  }

  if (!/[0-9]/.test(form.newPassword)) {
    return 'Mật khẩu mới phải có ít nhất 1 chữ số';
  }

  if (form.currentPassword === form.newPassword) {
    return 'Mật khẩu mới phải khác mật khẩu hiện tại';
  }

  if (form.newPassword !== form.confirmPassword) {
    return 'Xác nhận mật khẩu mới không khớp';
  }

  return '';
}

export default function ChangePasswordForm() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const result = await changePassword(form);
      setForm(initialForm);
      setMessage(result?.message || 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');

      setTimeout(() => {
        auth.logout();
        navigate('/login', { replace: true });
      }, 900);
    } catch (submitError) {
      setError(submitError.message || 'Không thể đổi mật khẩu');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="ops-stack" onSubmit={handleSubmit}>
      {message ? <Toast>{message}</Toast> : null}
      {error ? <Toast variant="danger">{error}</Toast> : null}

      <Input
        label="Mật khẩu hiện tại"
        type="password"
        value={form.currentPassword}
        onChange={(event) => updateField('currentPassword', event.target.value)}
        autoComplete="current-password"
        disabled={busy}
        required
      />

      <Input
        label="Mật khẩu mới"
        type="password"
        value={form.newPassword}
        onChange={(event) => updateField('newPassword', event.target.value)}
        autoComplete="new-password"
        minLength={8}
        disabled={busy}
        required
      />

      <Input
        label="Xác nhận mật khẩu mới"
        type="password"
        value={form.confirmPassword}
        onChange={(event) => updateField('confirmPassword', event.target.value)}
        autoComplete="new-password"
        minLength={8}
        disabled={busy}
        required
      />

      <div className="ops-actions">
        <Button type="submit" disabled={busy}>
          {busy ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
        </Button>
      </div>
    </form>
  );
}