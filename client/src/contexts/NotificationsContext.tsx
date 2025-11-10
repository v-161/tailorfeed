import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext'; // Import auth context

export interface Notification {
  _id: string;
  type: 'like' | 'comment' | 'follow' | 'ai_suggestion' | 'survey_reminder' | 'trending';
  userId: string;
  username: string;
  profilePicture?: string;
  message: string;
  postId?: string;
  timestamp: string; // ISO string for MongoDB
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  metadata?: {
    postImage?: string;
    commentText?: string;
    surveyId?: string;
  };
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  addNotification: (notification: Omit<Notification, '_id' | 'timestamp' | 'read'>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  generateAISuggestions: (userPreferences: string[]) => Promise<void>;
  generateSurveyReminder: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // API base URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch notifications on component mount and when user changes
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      // Set up polling for real-time updates (every 30 seconds)
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setLoading(false);
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = async (notificationData: Omit<Notification, '_id' | 'timestamp' | 'read'>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });
      
      if (response.ok) {
        const newNotification = await response.json();
        setNotifications(prev => [newNotification, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add notification:', error);
      // Fallback to local state if API fails
      const fallbackNotification: Notification = {
        ...notificationData,
        _id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [fallbackNotification, ...prev]);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Fallback to local state update
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      // Fallback to local state update
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    }
  };

  const removeNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notification => notification._id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Failed to remove notification:', error);
      // Fallback to local state update
      setNotifications(prev => 
        prev.filter(notification => notification._id !== notificationId)
      );
    }
  };

  const clearAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notifications`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      // Fallback to local state update
      setNotifications([]);
    }
  };

  const generateAISuggestions = async (userPreferences: string[]) => {
    if (userPreferences.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notifications/ai-suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences: userPreferences })
      });
      
      if (response.ok) {
        const aiNotification = await response.json();
        setNotifications(prev => [aiNotification, ...prev]);
      }
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      // Fallback to local generation
      const suggestions = [
        `People are talking about #${userPreferences[0]} right now`,
        `New ${userPreferences[0]} content you might like`,
        `Trending in ${userPreferences.slice(0, 2).join(' and ')}`
      ];

      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
      
      const fallbackNotification: Notification = {
        _id: Date.now().toString(),
        type: 'ai_suggestion',
        userId: 'system',
        username: 'Mr. Tailor',
        message: randomSuggestion,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'medium'
      };
      
      setNotifications(prev => [fallbackNotification, ...prev]);
    }
  };

  const generateSurveyReminder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notifications/survey-reminder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const surveyNotification = await response.json();
        setNotifications(prev => [surveyNotification, ...prev]);
      }
    } catch (error) {
      console.error('Failed to generate survey reminder:', error);
      // Fallback to local generation
      const fallbackNotification: Notification = {
        _id: Date.now().toString(),
        type: 'survey_reminder',
        userId: 'system',
        username: 'Mr. Tailor',
        message: 'Help me improve your feed! Take a quick survey',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'high'
      };
      
      setNotifications(prev => [fallbackNotification, ...prev]);
    }
  };

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    generateAISuggestions,
    generateSurveyReminder,
    fetchNotifications
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg font-medium text-gray-700 p-4 rounded-lg shadow-lg bg-white">
          Loading notifications...
        </div>
      </div>
    );
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};