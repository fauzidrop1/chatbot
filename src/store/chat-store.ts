// MFXAI Chat - Zustand Store
// Using useShallow for selectors to prevent infinite loops

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  ChatMessage, 
  ChatSession, 
  ChatModel, 
  User, 
  AccessCode 
} from '@/types';

// Auth Store
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        error: null 
      }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        error: null 
      }),
    }),
    {
      name: 'mfxai-auth',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// Models Store
interface ModelsStore {
  chatModels: ChatModel[];
  imageModels: ChatModel[];
  multimodalModels: ChatModel[];
  isLoading: boolean;
  lastFetched: number | null;
  
  // Actions
  setChatModels: (models: ChatModel[]) => void;
  setImageModels: (models: ChatModel[]) => void;
  setMultimodalModels: (models: ChatModel[]) => void;
  setLoading: (loading: boolean) => void;
  setLastFetched: (timestamp: number) => void;
  reset: () => void;
}

export const useModelsStore = create<ModelsStore>()((set) => ({
  chatModels: [],
  imageModels: [],
  multimodalModels: [],
  isLoading: false,
  lastFetched: null,
  
  setChatModels: (chatModels) => set({ chatModels }),
  setImageModels: (imageModels) => set({ imageModels }),
  setMultimodalModels: (multimodalModels) => set({ multimodalModels }),
  setLoading: (isLoading) => set({ isLoading }),
  setLastFetched: (lastFetched) => set({ lastFetched }),
  reset: () => set({
    chatModels: [],
    imageModels: [],
    multimodalModels: [],
    isLoading: false,
    lastFetched: null,
  }),
}));

// Session Store
interface SessionStore {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentSession: ChatSession | null;
  isLoading: boolean;
  
  // Actions
  setSessions: (sessions: ChatSession[]) => void;
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, data: Partial<ChatSession>) => void;
  deleteSession: (id: string) => void;
  setCurrentSessionId: (id: string | null) => void;
  setCurrentSession: (session: ChatSession | null) => void;
  setLoading: (loading: boolean) => void;
  clearCurrentSession: () => void;
}

export const useSessionStore = create<SessionStore>()((set, get) => ({
  sessions: [],
  currentSessionId: null,
  currentSession: null,
  isLoading: false,
  
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((state) => ({
    sessions: [session, ...state.sessions]
  })),
  updateSession: (id, data) => set((state) => ({
    sessions: state.sessions.map((s) => 
      s.id === id ? { ...s, ...data } : s
    ),
    currentSession: state.currentSessionId === id 
      ? { ...state.currentSession, ...data } as ChatSession
      : state.currentSession
  })),
  deleteSession: (id) => set((state) => ({
    sessions: state.sessions.filter((s) => s.id !== id),
    currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
    currentSession: state.currentSessionId === id ? null : state.currentSession
  })),
  setCurrentSessionId: (currentSessionId) => set({ 
    currentSessionId,
    currentSession: currentSessionId 
      ? get().sessions.find(s => s.id === currentSessionId) || null
      : null
  }),
  setCurrentSession: (currentSession) => set({ 
    currentSession,
    currentSessionId: currentSession?.id || null
  }),
  setLoading: (isLoading) => set({ isLoading }),
  clearCurrentSession: () => set({
    currentSessionId: null,
    currentSession: null
  }),
}));

// Chat Store (for current chat messages and streaming state)
interface ChatStore {
  messages: ChatMessage[];
  isStreaming: boolean;
  isGeneratingImage: boolean;
  error: string | null;
  abortController: AbortController | null;
  selectedModel: string | null;
  selectedImageModel: string | null;
  
  // Actions
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, data: Partial<ChatMessage>) => void;
  deleteMessage: (id: string) => void;
  setStreaming: (streaming: boolean) => void;
  setGeneratingImage: (generating: boolean) => void;
  setError: (error: string | null) => void;
  setAbortController: (controller: AbortController | null) => void;
  setSelectedModel: (model: string | null) => void;
  setSelectedImageModel: (model: string | null) => void;
  clearMessages: () => void;
  cancelRequest: () => void;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  messages: [],
  isStreaming: false,
  isGeneratingImage: false,
  error: null,
  abortController: null,
  selectedModel: null,
  selectedImageModel: null,
  
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  updateMessage: (id, data) => set((state) => ({
    messages: state.messages.map((m) => 
      m.id === id ? { ...m, ...data } : m
    )
  })),
  deleteMessage: (id) => set((state) => ({
    messages: state.messages.filter((m) => m.id !== id)
  })),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setGeneratingImage: (isGeneratingImage) => set({ isGeneratingImage }),
  setError: (error) => set({ error }),
  setAbortController: (abortController) => set({ abortController }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setSelectedImageModel: (selectedImageModel) => set({ selectedImageModel }),
  clearMessages: () => set({ messages: [], error: null }),
  cancelRequest: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ 
      isStreaming: false, 
      isGeneratingImage: false,
      abortController: null 
    });
  },
}));

// Admin Store
interface AdminStore {
  isAdmin: boolean;
  adminUser: any | null;
  adminToken: string | null;
  
  // Actions
  setAdmin: (isAdmin: boolean, adminUser?: any, token?: string) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      isAdmin: false,
      adminUser: null,
      adminToken: null,
      
      setAdmin: (isAdmin, adminUser = null, adminToken = null) => set({ 
        isAdmin, 
        adminUser,
        adminToken 
      }),
      logout: () => set({ 
        isAdmin: false, 
        adminUser: null,
        adminToken: null 
      }),
    }),
    {
      name: 'mfxai-admin',
      partialize: (state) => ({ 
        isAdmin: state.isAdmin, 
        adminUser: state.adminUser 
      }),
    }
  )
);
