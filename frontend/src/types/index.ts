export interface User {
  id: string;
  name: string;
  email: string;
  preferences: {
    theme: "light" | "dark";
    defaultFramework: "react" | "vue" | "angular";
  };
  lastLogin?: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface Session {
  _id: string;
  userId: string;
  title: string; // Backend uses title
  description: string;
  chatHistory: ChatMessage[];
  currentCode?: string; // Added for current component code
  currentComponent: ComponentState;
  componentVersions: ComponentState[];
  isActive: boolean;
  tags: string[];
  lastAccessed: string;
  createdAt: string;
  updatedAt: string;
  settings: SessionSettings;
  stats: {
    messagesCount: number;
    generationsCount: number;
    exportsCount: number;
  };
}

// Add Message type alias for compatibility
export type Message = ChatMessage;

export interface ChatMessage {
  _id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: {
    hasImage?: boolean;
    imageUrl?: string;
    generatedCode?: {
      jsx: string;
      css: string;
      typescript: boolean;
    };
    isRefinement?: boolean;
  };
}

export interface ComponentState {
  jsx: string;
  css: string;
  typescript: boolean;
  preview?: string;
}

export interface SessionSettings {
  autoSave: boolean;
  framework: "react" | "vue" | "angular";
  styleFramework: "css" | "tailwind" | "styled-components" | "emotion";
}

export interface GenerateRequest {
  prompt: string;
  sessionId: string;
  context?: {
    framework?: string;
    styleFramework?: string;
    typescript?: boolean;
    existingCode?: {
      jsx: string;
      css: string;
    };
    isIteration?: boolean;
  };
}

export interface GeneratedCode {
  jsx: string;
  css: string;
  explanation: string;
  features: string[];
  props: Record<string, string>;
}

export interface APIResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
  details?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Theme {
  mode: "light" | "dark";
}

export interface ComponentVariation {
  id: number;
  jsx: string;
  css: string;
  explanation: string;
  features: string[];
  props: Record<string, string>;
}
