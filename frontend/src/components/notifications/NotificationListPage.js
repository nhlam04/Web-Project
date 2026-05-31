import React, { useCallback, useEffect, useState } from 'react';
import PageShell from '../shared/PageShell';
import { getActiveUserId, listNotifications, markAllNotificationsRead, markNotificationRead } from '../../utils/appApi';
import { Badge, Button, Card, EmptyState, ErrorState, Input, Select, Toast } from '../shared/designSystem';

const NotificationListPage = () => {
  const [userId, setUserId] = useState(getActiveUserId());
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadNotifications = useCallback(async () => {
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
    try {
      await markNotificationRead(id);
      await loadNotifications();
    } catch (err) {
      setError(err.message);
    }
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
    <PageShell
      title="Thông báo"
      subtitle={`User ID: ${userId}`}
      actions={[{ label: 'Đơn hàng', to: '/orders' }, { label: 'Hồ sơ', to: '/profile' }]}
      context={(
        <div className="ops-grid">
          <div className="ops-kpi">
            <span className="ops-muted">Tổng</span>
            <strong>{notifications.length}</strong>
          </div>
          <div className="ops-kpi">
            <span className="ops-muted">Chưa đọc</span>
            <strong>{notifications.filter((item) => !item.readAt).length}</strong>
          </div>
        </div>
      )}
    >
      {message ? <Toast>{message}</Toast> : null}
      {error ? <ErrorState title="Không thể tải thông báo" description={error} /> : null}
      <Card className="ops-row" style={{ marginBottom: 16 }}>
        <div style={{ flex: '1 1 260px' }}>
          <Input label="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
        </div>
        <div style={{ width: 180 }}>
          <Select label="Bộ lọc" value={unreadOnly ? 'unread' : 'all'} onChange={(e) => setUnreadOnly(e.target.value === 'unread')}>
            <option value="all">Tất cả</option>
            <option value="unread">Chưa đọc</option>
          </Select>
        </div>
        <Button onClick={loadNotifications} disabled={busy}>{busy ? 'Đang tải...' : 'Tải lại'}</Button>
        <Button variant="secondary" onClick={markAll}>Đánh dấu tất cả đã đọc</Button>
      </Card>
      {!notifications.length ? <EmptyState title="Không có thông báo" description="Thông báo mới sẽ xuất hiện sau checkout và cập nhật fulfillment." /> : null}
      <div className="ops-stack">
        {notifications.map((item) => (
          <Card className="ops-stack" key={item.id}>
            <div className="ops-row">
              <div>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
                <p className="ops-muted ops-small">{item.eventName} | {new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <Badge variant={item.readAt ? 'neutral' : 'warning'}>{item.readAt ? 'Đã đọc' : 'Chưa đọc'}</Badge>
            </div>
            <div className="ops-actions">
              {!item.readAt ? <Button onClick={() => markOne(item.id)}>Đánh dấu đã đọc</Button> : null}
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
};

export default NotificationListPage;
