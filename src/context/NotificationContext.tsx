import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient } from '../services/api';
import { Notification } from '../types/api';
import { useAuth } from './AuthContext';

interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiClient.get<Notification[]>('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [user]);

  // Polling every 30 seconds
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => 
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const notif of unread) {
      await markAsRead(notif.id);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
