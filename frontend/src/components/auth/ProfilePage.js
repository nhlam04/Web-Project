import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../shared/PageShell';
import { getActiveUserId } from '../../utils/appApi';
import { useAuth } from './AuthProvider';
import { Button, Card, Badge } from '../shared/designSystem';

const ProfilePage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth.user;

  function handleLogout() {
    auth.logout();
    navigate('/login');
  }

  return (
    <PageShell
      title="Hồ sơ người dùng"
      subtitle="Thông tin tài khoản đang đăng nhập."
    >
      <div className="flex flex-col md:flex-row gap-6 max-w-3xl mx-auto py-4">
        <Card className="flex flex-col gap-6 w-full flex-1 p-6 md:p-8">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-2xl font-bold uppercase shrink-0">
              {user?.username ? user.username.charAt(0) : 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 m-0 mb-1">{user?.username || 'Chưa đăng nhập'}</h2>
              <Badge variant="neutral">{user?.role || 'Chưa có'}</Badge>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-500">User ID</span>
              <span className="text-slate-900 font-mono text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">{user?.id || getActiveUserId() || 'Không có sẵn'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-6 border-t border-slate-100 mt-2">
            {auth.isCustomer ? <Button as={Link} to="/orders" className="flex-1 min-w-[140px]">Xem đơn hàng</Button> : null}
            <Button as={Link} variant="secondary" to="/notifications" className="flex-1 min-w-[140px]">Xem thông báo</Button>
            {auth.isSeller ? <Button as={Link} variant="secondary" to="/seller/orders" className="flex-1 min-w-[140px]">Đơn người bán</Button> : null}
          </div>
          
          <div className="flex mt-2">
            <Button onClick={handleLogout} className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-transparent hover:border-red-200 transition-all shadow-none">
              Đăng xuất
            </Button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
};

export default ProfilePage;
