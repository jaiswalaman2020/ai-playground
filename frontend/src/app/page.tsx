"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredToken } from "@/utils/auth";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Quick check for stored token first
    const token = getStoredToken();

    if (!token) {
      // No token found, redirect to register immediately - no loading spinner
      router.replace("/auth/register");
      return;
    }

    // If there's a token, wait for auth context to complete
    if (!isLoading) {
      if (isAuthenticated && user) {
        // User is logged in, redirect to dashboard
        router.replace("/dashboard");
      } else {
        // Token exists but auth failed, redirect to login
        router.replace("/auth/login");
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  // For users with tokens, show minimal loading only if auth is still loading
  const token = getStoredToken();

  if (!token) {
    // No token - redirect immediately, no loading screen
    router.replace("/auth/register");
    return null;
  }

  if (isLoading) {
    // Only show loading for users with tokens while auth is processing
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Fallback redirect
  router.replace("/auth/register");
  return null;
}
