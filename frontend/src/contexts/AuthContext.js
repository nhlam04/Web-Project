import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASES } from '../utils/constants';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // IAM Service base URL
  const IAM_BASE_URL = import.meta.env.VITE_IAM_URL || API_BASES.auth || 'http://localhost:3001';

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await verifyToken(token);
          setUser(userData);
        } catch (err) {
          console.error('Token verification failed:', err);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  // Verify token with IAM service
  const verifyToken = async (token) => {
    const response = await fetch(`${IAM_BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    const data = await response.json();
    return data.data;
  };

  // Login function
  const login = async (username, password, rememberMe = false) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${IAM_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại');
      }

      // Save tokens
      localStorage.setItem('accessToken', data.accessToken);
      if (rememberMe) {
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('rememberMe', 'true');
      } else {
        sessionStorage.setItem('refreshToken', data.refreshToken);
      }

      // Verify and set user
      const userData = await verifyToken(data.accessToken);
      setUser(userData);
      setLoading(false);

      return { success: true };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Register function
  const register = async (username, password) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${IAM_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng ký thất bại');
      }

      setLoading(false);
      return { success: true, message: data.message };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('refreshToken');
    setUser(null);
  };

  // Refresh token function
  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${IAM_BASE_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      localStorage.setItem('accessToken', data.accessToken);
      return data.accessToken;
    } catch (err) {
      logout();
      throw err;
    }
  };

  // Get access token (with auto-refresh)
  const getAccessToken = async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      return null;
    }

    // Check if token is expired (simple check - decode JWT)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000;
      const now = Date.now();

      // If token expires in less than 1 minute, refresh it
      if (expiresAt - now < 60000) {
        return await refreshAccessToken();
      }

      return token;
    } catch (err) {
      console.error('Token parsing error:', err);
      return token;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    getAccessToken,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
