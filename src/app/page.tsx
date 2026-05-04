'use client';

import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { LoginForm } from '@/components/auth/login-form';
import { ChatInterface } from '@/components/chat/chat-interface';
import { useAuthStore } from '@/store/chat-store';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated, setUser } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      setUser: state.setUser,
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
    if (isAuthenticated && user) {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser);
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

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <ChatInterface />;
}
