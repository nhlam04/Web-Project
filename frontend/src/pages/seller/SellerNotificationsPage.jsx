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
    <div className="ops-stack">
      <header className="ops-header">
        <div>
          <h1>Thông báo seller</h1>
        </div>
        <div className="ops-kpi">
          <span className="ops-muted">Chưa đọc</span>
          <strong>{notifications.filter((item) => !item.readAt).length}</strong>
        </div>
      </header>

      {message ? <Toast>{message}</Toast> : null}
      {error ? <ErrorState title="Không thể tải thông báo" description={error} /> : null}

      <Card className="ops-row">
        <div style={{ width: 180 }}>
          <Select label="Bộ lọc" value={unreadOnly ? 'unread' : 'all'} onChange={(event) => setUnreadOnly(event.target.value === 'unread')}>
            <option value="all">Tất cả</option>
            <option value="unread">Chưa đọc</option>
          </Select>
        </div>
        <Button onClick={loadNotifications} disabled={busy}>{busy ? 'Đang tải...' : 'Tải lại'}</Button>
        <Button variant="secondary" onClick={markAll}>Đánh dấu tất cả đã đọc</Button>
      </Card>

      {!notifications.length ? <EmptyState title="Không có thông báo" description="Thông báo người bán sẽ xuất hiện tại đây." /> : null}

      <div className="ops-stack">
        {notifications.map((item) => (
          <Card className="ops-stack" key={item.id}>
            <div className="ops-row">
              <div>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
                <p className="ops-muted ops-small">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <Badge variant={item.readAt ? 'neutral' : 'warning'}>{item.readAt ? 'Đã đọc' : 'Chưa đọc'}</Badge>
            </div>
            {!item.readAt ? <Button onClick={() => markOne(item.id)}>Đánh dấu đã đọc</Button> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
