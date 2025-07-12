import React from 'react';
import { Routes, Route } from 'react-router-dom'; // No BrowserRouter here
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import AdminRoute from './components/AdminRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import SwapRequestsPage from './pages/SwapRequestsPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import SwapMonitoring from './pages/admin/SwapMonitoring';
import BroadcastMessages from './pages/admin/BroadcastMessages';
import ReportsDownload from './pages/admin/ReportsDownload';
import ContentModeration from './pages/admin/ContentModeration';



function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={
              <AdminRoute redirectTo="/admin/dashboard" adminOnly={false}>
                <HomePage />
              </AdminRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<UserProfilePage />} />
            <Route path="/swap-requests" element={<SwapRequestsPage />} />
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            } />
            <Route path="/admin/swaps" element={
              <AdminRoute>
                <SwapMonitoring />
              </AdminRoute>
            } />
            <Route path="/admin/content" element={
              <AdminRoute>
                <ContentModeration />
              </AdminRoute>
            } />
            <Route path="/admin/messages" element={
              <AdminRoute>
                <BroadcastMessages />
              </AdminRoute>
            } />
            <Route path="/admin/reports" element={
              <AdminRoute>
                <ReportsDownload />
              </AdminRoute>
            } />

          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;