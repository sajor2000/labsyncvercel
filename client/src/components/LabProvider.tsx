import { useState, useEffect, type ReactNode } from "react";
import { LabContext } from "@/hooks/useLabContext";
import { useQuery } from "@tanstack/react-query";

interface LabProviderProps {
  children: ReactNode;
}

interface Lab {
  id: string;
  name: string;
  shortName?: string;
  primaryColor?: string;
}

export function LabProvider({ children }: LabProviderProps) {
  // Get current user to determine selected lab
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Define available labs
  const allLabs: Lab[] = user ? [
    { id: 'riccc', name: 'RICCC (Rush Institute for Clinical Care and Research)', shortName: 'RICCC', primaryColor: '#4C9A92' },
    { id: 'rhedas', name: 'RHEDAS (Rush Healthcare Data & Analytics)', shortName: 'RHEDAS', primaryColor: '#5DD5E6' }
  ] : [];

  // State for selected lab - initialize with first lab if available
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);

  // Update selected lab when user data changes
  useEffect(() => {
    if (user && allLabs.length > 0 && !selectedLab) {
      setSelectedLab(allLabs[0]);
    }
  }, [user, allLabs.length, selectedLab]);

  const value = {
    selectedLab,
    setSelectedLab,
    setAllLabs: () => {}, // Placeholder implementation
    allLabs,
    isLoading,
  };
  
  return (
    <LabContext.Provider value={value}>
      {children}
    </LabContext.Provider>
  );
}