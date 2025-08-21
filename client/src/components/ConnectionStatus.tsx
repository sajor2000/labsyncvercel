import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from "lucide-react";

interface ConnectionStatusProps {
  /** Whether to show the status indicator even when connected */
  alwaysShow?: boolean;
  /** Position of the status indicator */
  position?: "top" | "bottom";
}

export function ConnectionStatus({ alwaysShow = false, position = "top" }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const queryClient = useQueryClient();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Health check query
  const { 
    data: healthData, 
    error: healthError, 
    isError,
    isLoading,
    refetch: refetchHealth
  } = useQuery({
    queryKey: ['/api/health'],
    queryFn: async () => {
      const response = await fetch('/api/health', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return response.json();
    },
    retry: false,
    refetchInterval: isError ? 10000 : 30000, // Check every 10s when down, 30s when up
    refetchIntervalInBackground: true,
    enabled: isOnline, // Only check when browser is online
  });

  const isConnected = isOnline && !isError && healthData;
  const showIndicator = alwaysShow || !isConnected || isError;

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    
    // Retry health check
    await refetchHealth();
    
    // Retry failed queries
    queryClient.refetchQueries({
      predicate: (query) => query.state.status === 'error',
    });
  };

  if (!showIndicator) {
    return null;
  }

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: "bg-red-500",
        text: "You're offline",
        description: "Check your internet connection",
        variant: "destructive" as const,
      };
    }

    if (isError || !healthData) {
      return {
        icon: AlertTriangle,
        color: "bg-yellow-500",
        text: isLoading ? "Checking connection..." : "Connection issues",
        description: healthError?.message || "Unable to reach server",
        variant: "default" as const,
      };
    }

    return {
      icon: Wifi,
      color: "bg-green-500",
      text: "Connected",
      description: `Server: ${healthData.status}`,
      variant: "default" as const,
    };
  };

  const { icon: Icon, color, text, description, variant } = getStatusConfig();

  const positionClasses = {
    top: "top-4 left-1/2 transform -translate-x-1/2",
    bottom: "bottom-4 right-4"
  };

  return (
    <div className={`fixed z-50 ${positionClasses[position]} max-w-sm`}>
      <Alert variant={variant} className="shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon className="h-4 w-4" />
            <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{text}</p>
            <AlertDescription className="text-xs text-muted-foreground">
              {description}
            </AlertDescription>
          </div>

          {(isError || !isOnline) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isLoading}
              className="ml-2"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              Retry {retryCount > 0 && `(${retryCount})`}
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
}

/**
 * Global connection status hook for use in other components
 */
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { data: healthData, isError } = useQuery({
    queryKey: ['/api/health'],
    enabled: isOnline,
    retry: false,
    refetchInterval: 30000,
  });

  return {
    isOnline,
    isConnected: isOnline && !isError && healthData,
    hasError: isError,
    serverStatus: healthData?.status,
  };
}