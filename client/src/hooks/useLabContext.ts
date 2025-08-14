import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";

interface Lab {
  id: string;
  name: string;
}

interface LabContextType {
  selectedLab: Lab | null;
  isLoading: boolean;
}

export const LabContext = createContext<LabContextType | null>(null);

export function useLabContext() {
  const context = useContext(LabContext);
  if (!context) {
    // Fallback for when used outside provider
    const { data: user, isLoading } = useQuery({
      queryKey: ['/api/auth/user'],
      retry: false,
    });

    const selectedLab: Lab | null = user ? {
      id: 'default-lab',
      name: 'RICCC Labs'
    } : null;

    return {
      selectedLab,
      isLoading,
    };
  }
  return context;
}

export function useLabContextValue(): LabContextType {
  // Get current user to determine selected lab
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // For now, use a default lab structure - this would be enhanced with proper lab selection
  const selectedLab: Lab | null = user ? {
    id: 'default-lab',
    name: 'RICCC Labs'
  } : null;

  return {
    selectedLab,
    isLoading,
  };
}