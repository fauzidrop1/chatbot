'use client';

import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { LoginForm } from '@/components/auth/login-form';
import { ChatInterface } from '@/components/chat/chat-interface';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { useAuthStore, useAdminStore } from '@/store/chat-store';
import { Loader2, Code, Eye, ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [showPanel, setShowPanel] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copiedCode, setCopiedCode] = useState(false);

  // Initialize and seed database
  useEffect(() => {
    const initialize = async () => {
      try {
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

  const copyEmbedCode = () => {
    const embedCode = `<iframe 
  src="https://preview-${process.env.NEXT_PUBLIC_BOT_ID || 'your-bot'}.space.chatglm.site/" 
  width="100%" 
  height="600" 
  frameborder="0"
  allow="clipboard-write"
></iframe>`;
    navigator.clipboard.writeText(embedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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

  // If user is logged in, show chat interface with preview panel
  if (isAuthenticated && user) {
    return (
      <div className="flex h-screen bg-slate-900">
        {/* Main Chat Interface */}
        <div className={`${showPanel ? 'w-1/2' : 'flex-1'} transition-all duration-300 border-r border-slate-700`}>
          <ChatInterface />
        </div>

        {/* Right Panel - Preview & Code */}
        {showPanel && (
          <div className="w-1/2 flex flex-col bg-slate-850 border-l border-slate-700">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'code')}>
                <TabsList className="bg-slate-700">
                  <TabsTrigger value="preview" className="data-[state=active]:bg-violet-600">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="code" className="data-[state=active]:bg-violet-600">
                    <Code className="w-4 h-4 mr-2" />
                    Embed Code
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                  onClick={() => window.open(window.location.href, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                  onClick={() => setShowPanel(false)}
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'preview' ? (
                <div className="h-full bg-white">
                  <iframe
                    src={window.location.href}
                    className="w-full h-full border-0"
                    title="Preview"
                  />
                </div>
              ) : (
                <div className="p-4">
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white text-sm flex items-center justify-between">
                        <span>Embed Code</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyEmbedCode}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedCode ? (
                            <>
                              <Check className="w-4 h-4 mr-1 text-green-400" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-slate-300">
{`<iframe 
  src="${window.location.origin}" 
  width="100%" 
  height="600" 
  frameborder="0"
  allow="clipboard-write"
></iframe>`}
                      </pre>
                      
                      <div className="mt-4 space-y-2">
                        <p className="text-xs text-slate-400">
                          <strong>Usage:</strong> Copy the code above and paste it into your website HTML.
                        </p>
                        <p className="text-xs text-slate-400">
                          <strong>Parameters:</strong>
                        </p>
                        <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
                          <li><code className="text-violet-400">width</code> - Width of the embed (e.g., "100%", "800px")</li>
                          <li><code className="text-violet-400">height</code> - Height of the embed (e.g., "600", "800px")</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* API Endpoint Info */}
                  <Card className="bg-slate-800 border-slate-700 mt-4">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">API Endpoints</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-600">POST</Badge>
                          <code className="text-slate-300">/api/auth</code>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-600">POST</Badge>
                          <code className="text-slate-300">/api/chat</code>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-pink-600">POST</Badge>
                          <code className="text-slate-300">/api/image</code>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-600">GET</Badge>
                          <code className="text-slate-300">/api/models</code>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-600">GET/POST</Badge>
                          <code className="text-slate-300">/api/sessions</code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toggle Panel Button (when hidden) */}
        {!showPanel && (
          <Button
            className="fixed right-4 top-4 z-50 bg-violet-600 hover:bg-violet-700"
            onClick={() => setShowPanel(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Show Preview
          </Button>
        )}
      </div>
    );
  }

  // Show login form
  return <LoginForm onLogin={handleLogin} onAdminLogin={handleAdminLogin} />;
}

// Badge component
function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`px-2 py-0.5 rounded text-white text-xs ${className}`}>
      {children}
    </span>
  );
}
