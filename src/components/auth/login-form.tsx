'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Key, Sparkles, Shield, User } from 'lucide-react';

interface LoginFormProps {
  onLogin: (user: any) => void;
  onAdminLogin: (admin: any) => void;
}

export function LoginForm({ onLogin, onAdminLogin }: LoginFormProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Admin login state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Authentication failed');
        return;
      }

      onLogin(data.user);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim()) return;

    setIsAdminLoading(true);
    setAdminError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: adminUsername.trim(), 
          password: adminPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAdminError(data.error || 'Authentication failed');
        return;
      }

      onAdminLogin(data.admin);
    } catch (err) {
      setAdminError('Network error. Please try again.');
    } finally {
      setIsAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">MFXAI Chat</h1>
          <p className="text-slate-400">Multi-Model AI Assistant</p>
        </div>

        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border-slate-700">
            <TabsTrigger 
              value="user" 
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <User className="w-4 h-4 mr-2" />
              User Login
            </TabsTrigger>
            <TabsTrigger 
              value="admin"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              Admin
            </TabsTrigger>
          </TabsList>

          {/* User Login Tab */}
          <TabsContent value="user">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mt-4">
              <CardHeader>
                <CardTitle className="text-white">Welcome</CardTitle>
                <CardDescription className="text-slate-400">
                  Enter your access code to continue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUserLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-slate-300">
                      Access Code
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="code"
                        type="text"
                        placeholder="Enter your access code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-violet-500"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                    disabled={isLoading || !code.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-700">
                  <p className="text-xs text-slate-500 text-center">
                    Demo codes: <span className="text-slate-400">DEMO2024</span> (Pro),{' '}
                    <span className="text-slate-400">TEST123</span> (Basic)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Login Tab */}
          <TabsContent value="admin">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mt-4">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-violet-400" />
                  Admin Dashboard
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Sign in to access admin panel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-username" className="text-slate-300">
                      Username
                    </Label>
                    <Input
                      id="admin-username"
                      type="text"
                      placeholder="Admin username"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-violet-500"
                      disabled={isAdminLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="text-slate-300">
                      Password
                    </Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Admin password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-violet-500"
                      disabled={isAdminLoading}
                    />
                  </div>

                  {adminError && (
                    <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
                      {adminError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                    disabled={isAdminLoading || !adminUsername.trim() || !adminPassword.trim()}
                  >
                    {isAdminLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In to Admin'
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-700">
                  <p className="text-xs text-slate-500 text-center">
                    Default: <span className="text-slate-400">admin</span> / <span className="text-slate-400">admin123</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
