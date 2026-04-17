import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginResponse } from '../types/api';
import { apiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Security-first behavior: never persist auth across app restarts.
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = (data: LoginResponse) => {
    setToken(data.access_token);
    setUser(data.user);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
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
