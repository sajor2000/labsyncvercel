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

  // Fetch labs from database instead of hardcoding
  const { data: labsData = [] } = useQuery<any[]>({
    queryKey: ['/api/labs'],
    enabled: !!user,
  });

  // Transform database labs to Lab interface
  const allLabs: Lab[] = labsData.map(lab => ({
    id: lab.id,
    name: lab.name,
    shortName: lab.shortName || lab.short_name,
    primaryColor: lab.primaryColor || lab.primary_color || '#4C9A92'
  }));

  // State for selected lab - initialize with first lab if available
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [allLabsState, setAllLabsState] = useState<Lab[]>([]);

  // Update all labs state when data changes
  useEffect(() => {
    if (allLabs.length > 0) {
      setAllLabsState(allLabs);
    }
  }, [JSON.stringify(allLabs)]);

  // Update selected lab when user data changes
  useEffect(() => {
    if (user && allLabsState.length > 0 && !selectedLab) {
      setSelectedLab(allLabsState[0]);
    }
  }, [user, allLabsState.length, selectedLab]);

  const value = {
    selectedLab,
    setSelectedLab,
    setAllLabs: setAllLabsState,
    allLabs: allLabsState,
    isLoading,
  };
  
  return (
    <LabContext.Provider value={value}>
      {children}
    </LabContext.Provider>
  );
}