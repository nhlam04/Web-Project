import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, EmptyState, ErrorState, Input, Select, Skeleton } from '../shared/designSystem';
import adminService from '../../services/adminService';

const ROLE_OPTIONS = ['', 'CUSTOMER', 'SELLER', 'ADMIN'];
const LOCK_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'UNLOCKED', label: 'Đang hoạt động' },
  { value: 'LOCKED', label: 'Đang bị khóa' },
];

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function roleVariant(role) {
  if (role === 'ADMIN') return 'danger';
  if (role === 'SELLER') return 'warning';
  return 'info';
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', role: '', lockStatus: '' });
  const [draftFilters, setDraftFilters] = useState({ search: '', role: '', lockStatus: '' });
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState('');
  const [lockHoursByUser, setLockHoursByUser] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const query = useMemo(() => ({
    ...filters,
    page: pagination.page,
    limit: pagination.limit,
  }), [filters, pagination.page, pagination.limit]);

  async function loadUsers() {
    setLoading(true);
    setError('');

    try {
      const result = await adminService.listUsers(query);
      setUsers(result.data || []);
      setPagination((current) => ({
        ...current,
        ...(result.pagination || {}),
        totalPages: Math.max(1, result.pagination?.totalPages || 1),
      }));
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách người dùng');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function updateDraftFilter(key, value) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function applyFilters(event) {
    event.preventDefault();
    setFilters(draftFilters);
    setPagination((current) => ({ ...current, page: 1 }));
  }

  function resetFilters() {
    const empty = { search: '', role: '', lockStatus: '' };
    setDraftFilters(empty);
    setFilters(empty);
    setPagination((current) => ({ ...current, page: 1 }));
  }

  async function runUserAction(userId, action) {
    setBusyUserId(userId);
    setError('');
    setMessage('');

    try {
      await action();
      setMessage('Cập nhật người dùng thành công');
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Không thể cập nhật người dùng');
    } finally {
      setBusyUserId('');
    }
  }

  function handleRoleChange(user, role) {
    if (role === user.role) return;
    runUserAction(user.id, () => adminService.updateUserRole(user.id, role));
  }

  function getLockHours(userId) {
    const value = Number(lockHoursByUser[userId] || 24);
    if (!Number.isFinite(value)) return 24;
    return Math.min(24 * 365, Math.max(1, Math.floor(value)));
  }

  function updateLockHours(userId, value) {
    setLockHoursByUser((current) => ({ ...current, [userId]: value }));
  }

  function handleToggleLock(user) {
    const action = user.isLocked
      ? () => adminService.unlockUser(user.id)
      : () => adminService.lockUser(user.id, getLockHours(user.id));

    runUserAction(user.id, action);
  }

  function goToPage(page) {
    setPagination((current) => ({
      ...current,
      page: Math.min(Math.max(1, page), Math.max(1, current.totalPages || 1)),
    }));
  }

  return (
    <div className="ops-stack">
      <style>{`
        .admin-users-toolbar { display: grid; grid-template-columns: minmax(220px, 1fr) 180px 200px auto auto; gap: 12px; align-items: end; }
        .admin-users-summary { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; justify-content: space-between; }
        .admin-users-id { max-width: 260px; word-break: break-all; color: #64748b; font-size: 12px; }
        .admin-users-pagination { display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 14px; }
        .admin-users-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: end; }
        .admin-users-lock-hours { width: 110px; }
        @media (max-width: 960px) {
          .admin-users-toolbar { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .admin-users-toolbar { grid-template-columns: 1fr; }
          .admin-users-pagination { justify-content: flex-start; }
        }
      `}</style>

      <header className="ops-header">
        <div>
          <h1>Quản lý người dùng</h1>
          <p>Xem danh sách user, lọc theo vai trò/trạng thái, đổi role và khóa/mở khóa tài khoản.</p>
        </div>
      </header>

      <div className="ops-stack">
        <Card>
          <form className="admin-users-toolbar" onSubmit={applyFilters}>
            <Input
              label="Tìm kiếm"
              placeholder="Nhập username hoặc ID"
              value={draftFilters.search}
              onChange={(event) => updateDraftFilter('search', event.target.value)}
            />
            <Select
              label="Vai trò"
              value={draftFilters.role}
              onChange={(event) => updateDraftFilter('role', event.target.value)}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role || 'all'} value={role}>{role || 'Tất cả vai trò'}</option>
              ))}
            </Select>
            <Select
              label="Trạng thái khóa"
              value={draftFilters.lockStatus}
              onChange={(event) => updateDraftFilter('lockStatus', event.target.value)}
            >
              {LOCK_STATUS_OPTIONS.map((item) => (
                <option key={item.value || 'all'} value={item.value}>{item.label}</option>
              ))}
            </Select>
            <Button type="submit">Lọc</Button>
            <Button type="button" variant="ghost" onClick={resetFilters}>Xóa lọc</Button>
          </form>
        </Card>

        {message ? <div className="ops-message">{message}</div> : null}
        {error ? (
          <ErrorState
            title="Không thể tải/cập nhật người dùng"
            description={error}
            action={<Button type="button" onClick={loadUsers}>Tải lại</Button>}
          />
        ) : null}

        {loading ? (
          <Card className="ops-stack">
            <Skeleton className="card" />
            <Skeleton className="card" />
            <Skeleton className="card" />
          </Card>
        ) : !users.length ? (
          <EmptyState
            title="Không có người dùng"
            description="Không tìm thấy user phù hợp với bộ lọc hiện tại."
            action={<Button type="button" onClick={resetFilters}>Xem tất cả</Button>}
          />
        ) : (
          <Card className="ops-stack">
            <div className="admin-users-summary">
              <div>
                <strong>{pagination.total}</strong>
                <span className="ops-muted"> người dùng</span>
              </div>
              <div className="ops-muted ops-small">
                Trang {pagination.page} / {pagination.totalPages || 1}
              </div>
            </div>

            <div className="ops-table-wrap">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Lỗi đăng nhập</th>
                    <th>Khóa đến</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const busy = busyUserId === user.id;
                    return (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.username}</strong>
                          <div className="admin-users-id">{user.id}</div>
                        </td>
                        <td>
                          <Select
                            label=""
                            value={user.role}
                            disabled={busy}
                            onChange={(event) => handleRoleChange(user, event.target.value)}
                          >
                            {ROLE_OPTIONS.filter(Boolean).map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </Select>
                          <div style={{ marginTop: 8 }}>
                            <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
                          </div>
                        </td>
                        <td>
                          <Badge variant={user.isLocked ? 'danger' : 'success'}>
                            {user.isLocked ? 'Đang bị khóa' : 'Đang hoạt động'}
                          </Badge>
                        </td>
                        <td>{user.failedLoginAttempts ?? 0}</td>
                        <td>{formatDateTime(user.lockedUntil)}</td>
                        <td>
                          <div className="admin-users-actions">
                            {!user.isLocked ? (
                              <Input
                                className="admin-users-lock-hours"
                                label="Số giờ"
                                type="number"
                                min="1"
                                max={24 * 365}
                                step="1"
                                value={lockHoursByUser[user.id] ?? 24}
                                disabled={busy}
                                onChange={(event) => updateLockHours(user.id, event.target.value)}
                              />
                            ) : null}
                            <Button
                              type="button"
                              variant={user.isLocked ? 'primary' : 'danger'}
                              disabled={busy}
                              onClick={() => handleToggleLock(user)}
                            >
                              {busy ? 'Đang xử lý...' : user.isLocked ? 'Mở khóa' : `Khóa ${getLockHours(user.id)}h`}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="admin-users-pagination">
              <Button
                type="button"
                variant="ghost"
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
              >
                Trang trước
              </Button>
              <span className="ops-muted ops-small">
                {pagination.page} / {pagination.totalPages || 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                disabled={pagination.page >= (pagination.totalPages || 1)}
                onClick={() => goToPage(pagination.page + 1)}
              >
                Trang sau
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;