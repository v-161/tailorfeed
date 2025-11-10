import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';

// --- 1. Define User Interface (MongoDB) ---
interface User {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string; // ADD THIS
  website?: string; // ADD THIS
  createdAt: string;
  stats?: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    followers: number;
    following: number;
  };
  aiPreferences?: {
    interests: string[];
    surveyHistory: any[];
    contentPreferences: string[];
    engagementScore: number;
    lastSurveyDate?: string;
    personalizedFeed: boolean;
    aiSuggestions: boolean;
  };
  settings?: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    profilePublic: boolean;
    showOnlineStatus: boolean;
  };
}
// --- 2. Define Context Type ---
interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>; // ADDED
}

// --- 3. Create Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- 4. Define Provider Component ---
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // API base URL from environment
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Check for existing token on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      validateToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data.user);
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setCurrentUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setCurrentUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const forgotPassword = async (email: string) => {
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset request failed');
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, newPassword });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  };

  // ADDED: Update profile function
  const updateProfile = async (profileData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/users/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local user state with new profile data
      setCurrentUser(prev => prev ? { ...prev, ...response.data.user } : null);
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  };

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile // ADDED
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg font-medium text-gray-700 p-4 rounded-lg shadow-lg bg-white">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// --- 5. Custom Hook for Consumption ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};