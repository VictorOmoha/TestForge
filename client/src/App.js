import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from './contexts/AuthContext';

// Layout Components
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';

// Page Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Dashboard Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import TestConfigurationPage from './pages/tests/TestConfigurationPage';
import TestTakingPage from './pages/tests/TestTakingPage';
import TestResultsPage from './pages/tests/TestResultsPage';
import TestHistoryPage from './pages/tests/TestHistoryPage';

// Profile Pages
import ProfilePage from './pages/profile/ProfilePage';
import SettingsPage from './pages/profile/SettingsPage';

// Analytics Pages
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import ProgressPage from './pages/analytics/ProgressPage';

// Error Pages
import NotFoundPage from './pages/errors/NotFoundPage';
import ErrorPage from './pages/errors/ErrorPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <>
      <Helmet>
        <title>TestForge - AI-Powered Testing Platform</title>
        <meta name="description" content="Create, configure, and take unlimited AI-generated tests with instant scoring and detailed analytics." />
        <meta name="keywords" content="test, ai, platform, education, assessment, learning" />
        <link rel="canonical" href="https://testforge.com" />
      </Helmet>

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <PublicRoute>
            <HomePage />
          </PublicRoute>
        } />
        
        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />
          <Route path="forgot-password" element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          } />
          <Route path="reset-password" element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          } />
        </Route>

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          
          {/* Test Routes */}
          <Route path="tests">
            <Route path="configure" element={<TestConfigurationPage />} />
            <Route path="take/:attemptId" element={<TestTakingPage />} />
            <Route path="results/:attemptId" element={<TestResultsPage />} />
            <Route path="history" element={<TestHistoryPage />} />
          </Route>
          
          {/* Profile Routes */}
          <Route path="profile">
            <Route index element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          
          {/* Analytics Routes */}
          <Route path="analytics">
            <Route index element={<AnalyticsPage />} />
            <Route path="progress" element={<ProgressPage />} />
          </Route>
        </Route>

        {/* Error Routes */}
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;


