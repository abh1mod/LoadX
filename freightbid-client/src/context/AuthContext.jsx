import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('freightbid_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('freightbid_token') || null);
  const [loading, setLoading] = useState(true);

  // Synchronize authenticated user profile on app load
  const loadUser = useCallback(async () => {
    const currentToken = localStorage.getItem('freightbid_token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('freightbid_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      // Handled by axios interceptor
      setUser(null);
      setToken(null);
      localStorage.removeItem('freightbid_token');
      localStorage.removeItem('freightbid_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('freightbid_token', receivedToken);
        localStorage.setItem('freightbid_user', JSON.stringify(receivedUser));
        toast.success(`Welcome back, ${receivedUser.name}!`);
        return { success: true, user: receivedUser };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      return { success: false, message: msg };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('freightbid_token');
      localStorage.removeItem('freightbid_user');
      toast.success('Logged out successfully');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        loading,
        login,
        register,
        logout,
        refreshProfile: loadUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
