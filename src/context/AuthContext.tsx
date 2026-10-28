import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User, NotificationItem } from '../api/client.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  quickLogin: (role: 'admin' | 'user') => Promise<void>;
  logout: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('imovies_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const refreshNotifications = async () => {
    if (!token) {
      setNotifications([]);
      return;
    }
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      // Ignore background notification fetch error
    }
  };

  useEffect(() => {
    async function loadCurrentUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success) {
          setUser(res.user);
          refreshNotifications();
        } else {
          logout();
        }
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadCurrentUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (res.success) {
      localStorage.setItem('imovies_token', res.token);
      setToken(res.token);
      setUser(res.user);
      refreshNotifications();
    }
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    const res = await api.register(name, email, password, role);
    if (res.success) {
      localStorage.setItem('imovies_token', res.token);
      setToken(res.token);
      setUser(res.user);
      refreshNotifications();
    }
  };

  const quickLogin = async (role: 'admin' | 'user') => {
    const res = await api.quickDemo(role);
    if (res.success) {
      localStorage.setItem('imovies_token', res.token);
      setToken(res.token);
      setUser(res.user);
      refreshNotifications();
    }
  };

  const logout = () => {
    localStorage.removeItem('imovies_token');
    setToken(null);
    setUser(null);
    setNotifications([]);
  };

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        quickLogin,
        logout,
        notifications,
        unreadCount,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
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
