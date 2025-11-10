import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import { SearchProvider } from './contexts/SearchContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PostProvider } from './contexts/PostContext';

import BottomNav from './components/common/BottomNav';
import MrTailorSurvey from './components/ai/MrTailorSurvey';
import MrTailorFab from './components/ai/MrTailorFab'; 
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import CreatePostPage from './pages/CreatePostPage';
import NotificationsPage from './pages/NotificationsPage';
import MrTailorDashboard from './pages/MrTailorDashboard';
import SettingsPage from './pages/SettingsPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UserProfilePage from './pages/UserProfilePage'; 

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </Box>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </Box>
    );
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <CssBaseline />
      <Router>
        <Box sx={{ 
          position: 'relative', 
          minHeight: '100vh',
          pb: isAuthenticated ? 7 : 0
        }}>
          <Routes>
            {/* Public/Auth Routes */}
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />
            <Route path="/forgot-password" element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            } />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/profile/:userId" element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            } />
            <Route path="/create" element={
              <ProtectedRoute>
                <CreatePostPage />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            {/* Mr. Tailor Dashboard Route */}
            <Route path="/mr-tailor" element={
              <ProtectedRoute>
                <MrTailorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          
          {/* Only show BottomNav and FAB when authenticated */}
          {isAuthenticated && (
            <>
              <BottomNav />
              <MrTailorFab />
            </>
          )}
        </Box>
      </Router>
    </>
  );
}

function App() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <PostProvider>
          <DataProvider>
            <SearchProvider>
              <NotificationsProvider>
                <AppContent />
              </NotificationsProvider>
            </SearchProvider>
          </DataProvider>
        </PostProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;