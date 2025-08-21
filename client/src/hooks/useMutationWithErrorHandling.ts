import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface StandardErrorHandlingOptions {
  /** Success message to show in toast */
  successMessage?: string;
  /** Error message to show in toast (defaults to generic message) */
  errorMessage?: string;
  /** Query keys to invalidate on success */
  invalidateKeys?: string[][];
  /** Whether to redirect to login on 401 errors (default: true) */
  redirectOn401?: boolean;
  /** Custom success handler (runs after standard success handling) */
  onSuccessCustom?: (data: any) => void;
  /** Custom error handler (runs after standard error handling) */
  onErrorCustom?: (error: Error) => void;
}

/**
 * Enhanced mutation hook with standardized error handling and success patterns
 */
export function useMutationWithErrorHandling<TData, TError, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: StandardErrorHandlingOptions & Omit<UseMutationOptions<TData, TError, TVariables>, 'onSuccess' | 'onError'> = {}
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    successMessage,
    errorMessage = "Operation failed",
    invalidateKeys = [],
    redirectOn401 = true,
    onSuccessCustom,
    onErrorCustom,
    ...mutationOptions
  } = options;

  return useMutation({
    mutationFn,
    onSuccess: (data: TData, variables: TVariables, context: any) => {
      // Invalidate specified queries
      invalidateKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });

      // Show success message if provided
      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }

      // Run custom success handler
      if (onSuccessCustom) {
        onSuccessCustom(data);
      }
    },
    onError: (error: TError, variables: TVariables, context: any) => {
      console.error('Mutation error:', error);

      // Handle 401 unauthorized errors
      if (isUnauthorizedError(error as Error) && redirectOn401) {
        toast({
          title: "Session Expired",
          description: "You have been logged out. Redirecting to login...",
          variant: "destructive",
        });
        
        // Delay redirect to allow user to see the message
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }

      // Handle network errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
      
      if (isNetworkError) {
        toast({
          title: "Connection Error",
          description: "Unable to connect to server. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        // Show custom or default error message
        toast({
          title: "Error",
          description: options.errorMessage || errorMessage,
          variant: "destructive",
        });
      }

      // Run custom error handler
      if (onErrorCustom) {
        onErrorCustom(error as Error);
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on 401/403/400 errors
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes('401') || message.includes('403') || message.includes('400')) {
          return false;
        }
      }
      
      // Retry up to 2 times for other errors (like network issues)
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    ...mutationOptions,
  });
}

/**
 * Standardized query error handler for consistent error display
 */
export function handleQueryError(error: Error | null, entityName: string = "data") {
  const { toast } = useToast();

  if (!error) return;

  if (isUnauthorizedError(error)) {
    toast({
      title: "Session Expired", 
      description: "Please log in again to continue.",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 1000);
    return;
  }

  const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
  
  if (isNetworkError) {
    toast({
      title: "Connection Error",
      description: `Unable to load ${entityName}. Please check your connection.`,
      variant: "destructive",
    });
  } else {
    toast({
      title: "Error",
      description: `Failed to load ${entityName}. ${error.message}`,
      variant: "destructive",
    });
  }
}

/**
 * Connection status hook for monitoring API health
 */
export function useConnectionStatus() {
  const { toast } = useToast();
  
  // This could be enhanced with actual connectivity monitoring
  // For now, it's a placeholder for future implementation
  return {
    isOnline: navigator.onLine,
    isConnected: true, // Would be determined by periodic health checks
    lastError: null as Error | null,
  };
}