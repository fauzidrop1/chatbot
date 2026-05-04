'use client';

import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { LoginForm } from '@/components/auth/login-form';
import { ChatInterface } from '@/components/chat/chat-interface';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { useAuthStore, useAdminStore } from '@/store/chat-store';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated, setUser } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      setUser: state.setUser,
    }))
  );

  const { isAdmin, adminUser, setAdmin } = useAdminStore(
    useShallow((state) => ({
      isAdmin: state.isAdmin,
      adminUser: state.adminUser,
      setAdmin: state.setAdmin,
    }))
  );

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and seed database
  useEffect(() => {
    const initialize = async () => {
      try {
        // Seed database with default models and access codes
        await fetch('/api/seed');
      } catch (error) {
        console.error('Failed to seed database:', error);
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Check for existing session
  useEffect(() => {
    if ((isAuthenticated && user) || (isAdmin && adminUser)) {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, isAdmin, adminUser]);

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser);
  };

  const handleAdminLogin = (admin: any) => {
    setAdmin(true, admin);
  };

  const handleAdminLogout = () => {
    setAdmin(false, null);
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-slate-400">Initializing MFXAI Chat...</p>
        </div>
      </div>
    );
  }

  // If admin is logged in, show admin dashboard
  if (isAdmin && adminUser) {
    return <AdminDashboard admin={adminUser} onLogout={handleAdminLogout} />;
  }

  // If user is logged in, show chat interface
  if (isAuthenticated && user) {
    return <ChatInterface />;
  }

  // Show login form
  return <LoginForm onLogin={handleLogin} onAdminLogin={handleAdminLogin} />;
}
