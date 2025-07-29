"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      // Still checking authentication status
      return;
    }

    if (isAuthenticated && user) {
      // User is logged in, redirect to dashboard
      router.replace("/dashboard");
    } else {
      // User is not logged in, redirect to signup (for first-time users)
      router.replace("/auth/register");
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading spinner while determining auth status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
