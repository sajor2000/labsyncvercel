import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface Lab {
  id: string;
  name: string;
  primaryColor?: string;
}

interface LabContextType {
  selectedLab: Lab | null;
  setSelectedLab: (lab: Lab) => void;
  allLabs: Lab[];
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

    const allLabs: Lab[] = user ? [
      { id: 'riccc', name: 'RICCC (Rush Institute for Clinical Care and Research)', primaryColor: '#4C9A92' },
      { id: 'rhedas', name: 'RHEDAS (Rush Healthcare Data & Analytics)', primaryColor: '#5DD5E6' }
    ] : [];

    const [selectedLab, setSelectedLab] = useState<Lab | null>(
      user && allLabs.length > 0 ? allLabs[0] : null
    );

    return {
      selectedLab,
      setSelectedLab,
      allLabs,
      isLoading,
    };
  }
  return context;
}

// This function is no longer needed since we moved the logic to LabProvider
// Keeping it for backward compatibility but it should not be used
export function useLabContextValue(): LabContextType {
  console.warn('useLabContextValue is deprecated - state management moved to LabProvider');
  return {
    selectedLab: null,
    setSelectedLab: () => {},
    allLabs: [],
    isLoading: true,
  };
}