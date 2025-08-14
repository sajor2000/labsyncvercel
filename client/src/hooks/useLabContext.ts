import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface Lab {
  id: string;
  name: string;
  shortName?: string;
  primaryColor?: string;
}

interface LabContextType {
  selectedLab: Lab | null;
  setSelectedLab: (lab: Lab) => void;
  setAllLabs: (labs: Lab[]) => void;
  allLabs: Lab[];
  isLoading: boolean;
}

export const LabContext = createContext<LabContextType | null>(null);

export function useLabContext() {
  const context = useContext(LabContext);
  if (!context) {
    // Fallback for when used outside provider - use empty state
    const { data: user, isLoading } = useQuery({
      queryKey: ['/api/auth/user'],
      retry: false,
    });

    const [selectedLab, setSelectedLab] = useState<Lab | null>(null);

    return {
      selectedLab,
      setSelectedLab,
      setAllLabs: () => {}, // Fallback implementation
      allLabs: [],
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
    setAllLabs: () => {},
    allLabs: [],
    isLoading: true,
  };
}