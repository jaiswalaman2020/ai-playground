import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  LoginCredentials,
  RegisterCredentials,
  User,
  Session,
  GenerateRequest,
  GeneratedCode,
  PaginationParams,
  APIResponse,
} from "@/types";
import { getStoredToken, removeStoredToken } from "./auth";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response.data;
      },
      (error) => {
        // Handle token expiration
        if (error.response?.status === 401) {
          removeStoredToken();
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }
        }

        // Handle network errors
        if (!error.response) {
          toast.error("Network error. Please check your connection.");
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  private async request<T = any>(
    method: string,
    url: string,
    data?: any,
    config?: any
  ): Promise<T> {
    return await this.client.request({
      method,
      url,
      data,
      ...config,
    });
    // No need to extract .data since response interceptor already does it
  }

  // GET request
  async get<T = any>(url: string, config?: any): Promise<T> {
    return this.request<T>("GET", url, undefined, config);
  }

  // POST request
  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>("POST", url, data, config);
  }

  // PUT request
  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>("PUT", url, data, config);
  }

  // DELETE request
  async delete<T = any>(url: string, config?: any): Promise<T> {
    return this.request<T>("DELETE", url, undefined, config);
  }
}

const apiClient = new APIClient();

// Auth API
export const authAPI = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<{ token: string; user: User }>("/auth/login", credentials),

  register: (credentials: RegisterCredentials) =>
    apiClient.post<{ token: string; user: User }>(
      "/auth/register",
      credentials
    ),

  getMe: () => apiClient.get<{ user: User }>("/auth/me"),

  updateProfile: (data: Partial<User>) =>
    apiClient.put<{ user: User }>("/auth/profile", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post<APIResponse>("/auth/change-password", data),
};

// Sessions API
export const sessionsAPI = {
  getSessions: (params?: PaginationParams) =>
    apiClient.get<{ sessions: Session[]; pagination: any }>("/sessions", {
      params,
    }),

  getSession: (id: string) =>
    apiClient.get<{ session: Session }>(`/sessions/${id}`),

  createSession: (data: Partial<Session>) =>
    apiClient.post<{ session: Session }>("/sessions", data),

  updateSession: (id: string, data: Partial<Session>) =>
    apiClient.put<{ session: Session }>(`/sessions/${id}`, data),

  deleteSession: (id: string) =>
    apiClient.delete<APIResponse>(`/sessions/${id}`),

  addChatMessage: (sessionId: string, message: any) =>
    apiClient.post<{ chatMessage: any }>(
      `/sessions/${sessionId}/chat`,
      message
    ),

  exportSession: (sessionId: string) =>
    apiClient.get(`/sessions/${sessionId}/export`, {
      responseType: "blob",
    }),
};

// AI API
export const aiAPI = {
  generateComponent: (data: GenerateRequest) =>
    apiClient.post<{ generatedCode: GeneratedCode; chatMessage: any }>(
      "/ai/generate",
      data
    ),

  refineComponent: (data: {
    sessionId: string;
    refinementPrompt: string;
    originalCode: { jsx: string; css: string };
  }) =>
    apiClient.post<{ refinedCode: GeneratedCode; chatMessage: any }>(
      "/ai/refine",
      data
    ),

  generateVariations: (data: {
    prompt: string;
    sessionId: string;
    count?: number;
    context?: any;
  }) =>
    apiClient.post<{ variations: GeneratedCode[] }>(
      "/ai/generate-variations",
      data
    ),

  generateWithImage: (formData: FormData) =>
    apiClient.post<{ generatedCode: GeneratedCode; chatMessage: any }>(
      "/ai/generate-with-image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    ),

  getSuggestions: (sessionId: string) =>
    apiClient.get<{ suggestions: string[] }>(`/ai/suggestions/${sessionId}`),
};

export default apiClient;

// Named export for convenience
export const api = apiClient;
