export function getRoleHomePath(role) {
  const normalizedRole = String(role || '').toUpperCase();
  if (normalizedRole === 'ADMIN') return '/admin';
  if (normalizedRole === 'SELLER') return '/seller';
  return '/';
}

export function isRoleAllowedPath(role, path) {
  const normalizedRole = String(role || '').toUpperCase();
  const pathname = String(path || '/');

  if (normalizedRole === 'ADMIN') return pathname.startsWith('/admin');
  if (normalizedRole === 'SELLER') return pathname.startsWith('/seller');
  return true;
}

export function getPostLoginPath(role, requestedPath) {
  if (requestedPath && isRoleAllowedPath(role, requestedPath)) {
    return requestedPath;
  }
  return getRoleHomePath(role);
}
