import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  title?: string;
  department?: string;
  institution?: string;
  profileImageUrl?: string;
  emailVerified: boolean;
  requiresPasswordChange: boolean;
  sessionValid: boolean;
}

interface AuthError {
  error: string;
  requiresPasswordChange?: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { 
    data: user, 
    isLoading, 
    error,
    refetch 
  } = useQuery<User, AuthError>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Invalidate and refetch user data
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error || 'Login failed' };
    }
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all cached data
      queryClient.clear();
    }
  }, [queryClient]);

  const checkAuth = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  }, [refetch]);

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  }, [queryClient]);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user && !error,
    requiresPasswordChange: user?.requiresPasswordChange || false,
    login,
    logout,
    checkAuth,
    refreshUser,
  };
}
