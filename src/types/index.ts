// MFXAI Chat - Types

export interface ChatModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  type: 'chat' | 'image' | 'multimodal';
  capabilities: string[];
  maxTokens: number;
  isActive: boolean;
  sortOrder: number;
}

export interface ChatModels {
  chatModels: ChatModel[];
  imageModels: ChatModel[];
  multimodalModels: ChatModel[];
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrls?: string[];
  model?: string;
  tokens?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  modelId?: string;
  model?: ChatModel;
  title?: string;
  messages: ChatMessage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessCode {
  id: string;
  code: string;
  name?: string;
  tier: 'basic' | 'pro' | 'enterprise';
  maxRequests: number;
  usedRequests: number;
  expiresAt?: Date;
  isActive: boolean;
}

export interface User {
  id: string;
  accessCode: AccessCode;
  createdAt: Date;
}

export interface ApiProvider {
  id: string;
  name: string;
  apiKey?: string;
  baseUrl?: string;
  isActive: boolean;
}

// API Response types
export interface ChatCompletionResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ImageGenerationResponse {
  id: string;
  data: {
    url?: string;
    base64?: string;
    revised_prompt?: string;
  }[];
}

// Store types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ChatState {
  messages: ChatMessage[];
  currentSession: ChatSession | null;
  isStreaming: boolean;
  isGeneratingImage: boolean;
  error: string | null;
  abortController: AbortController | null;
}

export interface SessionState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
}

export interface ModelState {
  chatModels: ChatModel[];
  imageModels: ChatModel[];
  multimodalModels: ChatModel[];
  isLoading: boolean;
  lastFetched: number | null;
}

// API Request types
export interface ChatRequest {
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    imageUrls?: string[];
  }[];
  model: string;
  sessionId?: string;
  stream?: boolean;
}

export interface ImageRequest {
  prompt: string;
  model: string;
  size?: '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440';
  n?: number;
}

// Admin types
export interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalMessages: number;
  activeCodes: number;
  totalRequests: number;
}

export interface AdminAccessCode extends AccessCode {
  userCount: number;
  totalRequests: number;
}
