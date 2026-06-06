import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../../utils/appApi';
import { Badge, Button, Card, EmptyState, ErrorState, Select, Toast } from '../../components/shared/designSystem';

export default function SellerNotificationsPage() {
  const auth = useAuth();
  const userId = auth.user?.id || '';
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    setBusy(true);
    setError('');
    try {
      setNotifications(await listNotifications(userId, unreadOnly));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [userId, unreadOnly]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function markOne(id) {
    setError('');
    await markNotificationRead(id);
    await loadNotifications();
  }

  async function markAll() {
    setError('');
    setMessage('');
    try {
      const result = await markAllNotificationsRead(userId);
      setMessage(`Đã đánh dấu ${result.marked || 0} thông báo.`);
      await loadNotifications();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 m-0 mb-1">Thông báo seller</h1>
          <p className="text-slate-500 m-0">User ID: {userId}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Chưa đọc</span>
          <strong className="text-2xl font-bold text-brand-600">{notifications.filter((item) => !item.readAt).length}</strong>
        </div>
      </header>

      {message ? <Toast>{message}</Toast> : null}
      {error ? <ErrorState title="Không thể tải thông báo" description={error} /> : null}

      <Card className="flex flex-wrap items-end gap-4">
        <div className="w-[180px]">
          <Select label="Bộ lọc" value={unreadOnly ? 'unread' : 'all'} onChange={(event) => setUnreadOnly(event.target.value === 'unread')}>
            <option value="all">Tất cả</option>
            <option value="unread">Chưa đọc</option>
          </Select>
        </div>
        <Button onClick={loadNotifications} disabled={busy}>{busy ? 'Đang tải...' : 'Tải lại'}</Button>
        <Button variant="secondary" onClick={markAll}>Đánh dấu tất cả đã đọc</Button>
      </Card>

      {!notifications.length ? <EmptyState title="Không có thông báo" description="Thông báo seller sẽ xuất hiện tại đây." /> : null}

      <div className="flex flex-col gap-4">
        {notifications.map((item) => (
          <Card className="flex flex-col gap-4" key={item.id}>
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-slate-900 m-0">{item.title}</h2>
                <p className="text-slate-700 m-0">{item.body}</p>
                <p className="text-xs text-slate-500 mt-1">{item.eventName} | {new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <Badge variant={item.readAt ? 'neutral' : 'warning'}>{item.readAt ? 'Đã đọc' : 'Chưa đọc'}</Badge>
            </div>
            {!item.readAt ? (
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button onClick={() => markOne(item.id)} variant="ghost" className="text-brand-600">Đánh dấu đã đọc</Button>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
