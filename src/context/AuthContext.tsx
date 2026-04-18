import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginResponse } from '../types/api';
import { apiClient } from '../services/api';

const SESSION_TOKEN_KEY = 'trms_token';
const SESSION_USER_KEY = 'trms_user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Keep session across refresh, but clear on browser close.
  useEffect(() => {
    try {
      const storedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
      const storedUser = sessionStorage.getItem(SESSION_USER_KEY);
      if (storedToken) {
        setToken(storedToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
      if (storedUser) {
        setUser(JSON.parse(storedUser) as User);
      }
    } catch {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_USER_KEY);
    }
  }, []);

  const login = (data: LoginResponse) => {
    setToken(data.access_token);
    setUser(data.user);
    sessionStorage.setItem(SESSION_TOKEN_KEY, data.access_token);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(data.user));
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
    delete apiClient.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  };

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return;
    }
    delete apiClient.defaults.headers.common['Authorization'];
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
