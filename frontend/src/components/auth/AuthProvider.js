import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ACCESS_TOKEN_KEY, getProfile, getStoredUser, logout as appLogout } from '../../utils/appApi';

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)));

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    try {
      const profile = await getProfile();
      setUser(profile);
      return profile;
    } catch (_error) {
      appLogout();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(() => {
    appLogout();
    setUser(null);
  }, []);

  const role = user?.role || '';
  const value = useMemo(() => ({
    isAuthenticated: Boolean(user),
    isCustomer: role === 'CUSTOMER',
    isGuest: !user,
    isSeller: role === 'SELLER',
    loading,
    logout,
    refreshUser,
    role,
    setUser,
    user,
  }), [loading, logout, refreshUser, role, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth };
