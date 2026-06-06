import React from 'react';
import { Card } from '../../components/shared/designSystem';
import { useAuth } from '../../components/auth/AuthProvider';

export default function SellerProfilePage() {
  const auth = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 m-0 mb-1">Hồ sơ seller</h1>
          <p className="text-slate-500 m-0">Thông tin tài khoản người bán đang đăng nhập.</p>
        </div>
      </header>
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <strong className="text-sm text-slate-500">Tên đăng nhập:</strong> 
          <span className="text-lg text-slate-900">{auth.user?.username}</span>
        </div>
        <div className="flex flex-col gap-1">
          <strong className="text-sm text-slate-500">Email:</strong> 
          <span className="text-lg text-slate-900">{auth.user?.email || 'Chưa có'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <strong className="text-sm text-slate-500">Vai trò:</strong> 
          <span className="inline-block px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-sm font-semibold self-start">{auth.role}</span>
        </div>
      </Card>
    </div>
  );
}
