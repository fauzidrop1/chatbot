'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage, LoadingMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ModelSelector } from './model-selector';
import { SessionSidebar } from './session-sidebar';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { useAuthStore, useChatStore, useSessionStore, useModelsStore, useAdminStore } from '@/store/chat-store';
import { Menu, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ChatMessage as ChatMessageType, ChatModel } from '@/types';

export function ChatInterface() {
  // Auth state
  const { user, logout } = useAuthStore(
    useShallow((state) => ({ user: state.user, logout: state.logout }))
  );

  // Admin state
  const { isAdmin, adminUser, logout: adminLogout } = useAdminStore(
    useShallow((state) => ({ 
      isAdmin: state.isAdmin, 
      adminUser: state.adminUser,
      logout: state.logout 
    }))
  );

  // Chat state
  const {
    messages,
    isStreaming,
    isGeneratingImage,
    error,
    selectedModel,
    selectedImageModel,
    setMessages,
    addMessage,
    updateMessage,
    setStreaming,
    setGeneratingImage,
    setError,
    setSelectedModel,
    setSelectedImageModel,
    setAbortController,
    cancelRequest,
  } = useChatStore(
    useShallow((state) => ({
      messages: state.messages,
      isStreaming: state.isStreaming,
      isGeneratingImage: state.isGeneratingImage,
      error: state.error,
      selectedModel: state.selectedModel,
      selectedImageModel: state.selectedImageModel,
      setMessages: state.setMessages,
      addMessage: state.addMessage,
      updateMessage: state.updateMessage,
      setStreaming: state.setStreaming,
      setGeneratingImage: state.setGeneratingImage,
      setError: state.setError,
      setSelectedModel: state.setSelectedModel,
      setSelectedImageModel: state.setSelectedImageModel,
      setAbortController: state.setAbortController,
      cancelRequest: state.cancelRequest,
    }))
  );

  // Session state
  const {
    sessions,
    currentSessionId,
    currentSession,
    setSessions,
    addSession,
    setCurrentSessionId,
    setCurrentSession,
    deleteSession,
  } = useSessionStore(
    useShallow((state) => ({
      sessions: state.sessions,
      currentSessionId: state.currentSessionId,
      currentSession: state.currentSession,
      setSessions: state.setSessions,
      addSession: state.addSession,
      setCurrentSessionId: state.setCurrentSessionId,
      setCurrentSession: state.setCurrentSession,
      deleteSession: state.deleteSession,
    }))
  );

  // Models state
  const {
    chatModels,
    imageModels,
    multimodalModels,
    isLoading: modelsLoading,
    setChatModels,
    setImageModels,
    setMultimodalModels,
    setLoading: setModelsLoading,
  } = useModelsStore(
    useShallow((state) => ({
      chatModels: state.chatModels,
      imageModels: state.imageModels,
      multimodalModels: state.multimodalModels,
      isLoading: state.isLoading,
      setChatModels: state.setChatModels,
      setImageModels: state.setImageModels,
      setMultimodalModels: state.setMultimodalModels,
      setLoading: state.setLoading,
    }))
  );

  const [mode, setMode] = useState<'chat' | 'image'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Memoized models object
  const models = useMemo(
    () => ({ chatModels, imageModels, multimodalModels }),
    [chatModels, imageModels, multimodalModels]
  );

  // Fetch models on mount
  useEffect(() => {
    const fetchModels = async () => {
      setModelsLoading(true);
      try {
        const response = await fetch('/api/models');
        const data = await response.json();
        if (data.success) {
          setChatModels(data.models.chatModels);
          setImageModels(data.models.imageModels);
          setMultimodalModels(data.models.multimodalModels);

          // Set default models
          if (!selectedModel && data.models.chatModels.length > 0) {
            const defaultModel = data.models.multimodalModels[0] || data.models.chatModels[0];
            setSelectedModel(defaultModel.id);
          }
          if (!selectedImageModel && data.models.imageModels.length > 0) {
            setSelectedImageModel(data.models.imageModels[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Fetch sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(`/api/sessions?userId=${user.id}`);
        const data = await response.json();
        if (data.success) {
          setSessions(data.sessions);
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      }
    };

    fetchSessions();
  }, [user?.id, setSessions]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Select session
  const handleSelectSession = useCallback(async (sessionId: string) => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/sessions/${sessionId}?userId=${user.id}`);
      const data = await response.json();
      if (data.success) {
        setCurrentSession(data.session);
        setMessages(data.session.messages);
        if (data.session.model) {
          setSelectedModel(data.session.model.id);
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }, [user?.id, setCurrentSession, setMessages, setSelectedModel]);

  // New session
  const handleNewSession = useCallback(() => {
    setCurrentSessionId(null);
    setCurrentSession(null);
    setMessages([]);
  }, [setCurrentSessionId, setCurrentSession, setMessages]);

  // Delete session
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (!user?.id) return;
    try {
      await fetch(`/api/sessions/${sessionId}?userId=${user.id}`, {
        method: 'DELETE',
      });
      deleteSession(sessionId);
      if (currentSessionId === sessionId) {
        handleNewSession();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }, [user?.id, currentSessionId, deleteSession, handleNewSession]);

  // Send message
  const handleSendMessage = useCallback(async (content: string, imageUrls?: string[]) => {
    if (!user?.id || (!selectedModel && mode === 'chat') || (!selectedImageModel && mode === 'image')) {
      setError('Please select a model');
      return;
    }

    setError('');

    // Add user message
    const userMessage: ChatMessageType = {
      id: `temp-${Date.now()}`,
      sessionId: currentSessionId || '',
      role: 'user',
      content,
      imageUrls,
      createdAt: new Date(),
    };
    addMessage(userMessage);

    if (mode === 'image') {
      // Image generation
      setGeneratingImage(true);
      try {
        const response = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: content,
            modelId: selectedImageModel,
            sessionId: currentSessionId,
            userId: user.id,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Image generation failed');
        }

        // Add assistant message with image
        addMessage({
          id: data.message.id,
          sessionId: data.sessionId,
          role: 'assistant',
          content: data.message.content,
          model: data.message.model,
          metadata: data.message.metadata,
          createdAt: new Date(data.message.createdAt),
        });

        // Update session if new
        if (!currentSessionId) {
          setCurrentSessionId(data.sessionId);
          // Refresh sessions
          const sessionsRes = await fetch(`/api/sessions?userId=${user.id}`);
          const sessionsData = await sessionsRes.json();
          if (sessionsData.success) {
            setSessions(sessionsData.sessions);
          }
        }
      } catch (error: any) {
        setError(error.message);
      } finally {
        setGeneratingImage(false);
      }
    } else {
      // Chat
      setStreaming(true);
      const controller = new AbortController();
      setAbortController(controller);

      // Prepare messages for API
      const allMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
        imageUrls: m.imageUrls,
      }));
      allMessages.push({ role: 'user', content, imageUrls });

      // Add placeholder for assistant
      const assistantId = `assistant-${Date.now()}`;
      addMessage({
        id: assistantId,
        sessionId: currentSessionId || '',
        role: 'assistant',
        content: '',
        model: chatModels.find((m) => m.id === selectedModel)?.name || multimodalModels.find((m) => m.id === selectedModel)?.name,
        createdAt: new Date(),
        isStreaming: true,
      });

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: allMessages,
            modelId: selectedModel,
            sessionId: currentSessionId,
            userId: user.id,
            stream: true,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Chat failed');
        }

        // Handle streaming
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

          for (const line of lines) {
            const data = line.replace('data: ', '');
            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'token') {
                fullContent += parsed.text;
                updateMessage(assistantId, { content: fullContent });
              } else if (parsed.type === 'done') {
                updateMessage(assistantId, {
                  id: parsed.messageId,
                  isStreaming: false,
                });

                // Update session if new
                if (!currentSessionId && parsed.sessionId) {
                  setCurrentSessionId(parsed.sessionId);
                  // Refresh sessions
                  const sessionsRes = await fetch(`/api/sessions?userId=${user.id}`);
                  const sessionsData = await sessionsRes.json();
                  if (sessionsData.success) {
                    setSessions(sessionsData.sessions);
                  }
                }
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setError(error.message);
        }
        // Remove the placeholder if error
        updateMessage(assistantId, { content: 'Request cancelled or failed.', isStreaming: false });
      } finally {
        setStreaming(false);
        setAbortController(null);
      }
    }
  }, [
    user?.id,
    selectedModel,
    selectedImageModel,
    currentSessionId,
    messages,
    mode,
    chatModels,
    multimodalModels,
    addMessage,
    updateMessage,
    setError,
    setStreaming,
    setGeneratingImage,
    setAbortController,
    setCurrentSessionId,
    setSessions,
  ]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    cancelRequest();
    setError('Request cancelled');
  }, [cancelRequest, setError]);

  // Handle logout
  const handleLogout = useCallback(() => {
    logout();
    setMessages([]);
    setSessions([]);
    setCurrentSessionId(null);
    setCurrentSession(null);
  }, [logout, setMessages, setSessions, setCurrentSessionId, setCurrentSession]);

  // Handle admin logout
  const handleAdminLogout = useCallback(() => {
    adminLogout();
    setShowAdmin(false);
  }, [adminLogout]);

  // If admin is logged in and showing admin dashboard
  if (isAdmin && showAdmin) {
    return <AdminDashboard admin={adminUser} onLogout={handleAdminLogout} />;
  }

  const isLoading = isStreaming || isGeneratingImage;

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <SessionSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        user={user}
        onLogout={handleLogout}
        onOpenAdmin={() => setShowAdmin(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-slate-400"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="hidden lg:flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-white">MFXAI Chat</span>
              </div>
            </div>

            <ModelSelector
              models={models}
              selectedModel={selectedModel}
              selectedImageModel={selectedImageModel}
              onSelectModel={setSelectedModel}
              onSelectImageModel={setSelectedImageModel}
              mode={mode}
              onModeChange={setMode}
            />
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Start a conversation
                </h2>
                <p className="text-slate-400">
                  Select a model and type your message to begin
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={message.isStreaming && isStreaming}
                />
              ))
            )}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <LoadingMessage />
            )}
          </div>
        </ScrollArea>

        {/* Error */}
        {error && (
          <div className="px-4">
            <Alert className="max-w-3xl mx-auto bg-red-500/10 border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Input */}
        <ChatInput
          onSend={handleSendMessage}
          onCancel={handleCancel}
          isLoading={isLoading}
          mode={mode}
        />
      </div>
    </div>
  );
}
