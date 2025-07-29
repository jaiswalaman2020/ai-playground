"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import {
  User,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
} from "@/types";
import { authAPI } from "@/utils/api";
import {
  getStoredToken,
  setStoredToken,
  removeStoredToken,
} from "@/utils/auth";
import toast from "react-hot-toast";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: User }
  | { type: "SET_TOKEN"; payload: string }
  | { type: "CLEAR_AUTH" }
  | { type: "UPDATE_USER"; payload: Partial<User> };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case "SET_TOKEN":
      return {
        ...state,
        token: action.payload,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case "CLEAR_AUTH":
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getStoredToken();

      if (token) {
        try {
          dispatch({ type: "SET_TOKEN", payload: token });
          const response = await authAPI.getMe();
          dispatch({ type: "SET_USER", payload: response.user });
        } catch (error) {
          console.error("Failed to initialize auth:", error);
          removeStoredToken();
          dispatch({ type: "CLEAR_AUTH" });
        }
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.login(credentials);

      const { token, user } = response;
      setStoredToken(token);
      dispatch({ type: "SET_TOKEN", payload: token });
      dispatch({ type: "SET_USER", payload: user });

      toast.success("Successfully logged in!");
    } catch (error: any) {
      dispatch({ type: "SET_LOADING", payload: false });
      const message = error.response?.data?.error || "Login failed";
      toast.error(message);
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.register(credentials);

      const { token, user } = response;
      setStoredToken(token);
      dispatch({ type: "SET_TOKEN", payload: token });
      dispatch({ type: "SET_USER", payload: user });

      toast.success("Account created successfully!");
    } catch (error: any) {
      dispatch({ type: "SET_LOADING", payload: false });
      const message =
        error.response?.data?.error || error.message || "Registration failed";
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    removeStoredToken();
    dispatch({ type: "CLEAR_AUTH" });
    toast.success("Logged out successfully");
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await authAPI.updateProfile(data);
      dispatch({ type: "UPDATE_USER", payload: response.user });
      toast.success("Profile updated successfully");
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to update profile";
      toast.error(message);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      dispatch({ type: "SET_USER", payload: response.user });
    } catch (error) {
      console.error("Failed to refresh user:", error);
      logout();
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
