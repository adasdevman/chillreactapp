import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextData {
  unreadCount: number;
  updateUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextData>({} as NotificationContextData);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const updateUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await api.get('/api/notifications/unread-count/');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
    }
  };

  useEffect(() => {
    updateUnreadCount();
    
    // Update count every 5 minutes
    const interval = setInterval(updateUnreadCount, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  return (
    <NotificationContext.Provider value={{ unreadCount, updateUnreadCount }}>
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