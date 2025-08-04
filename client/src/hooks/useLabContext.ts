import { createContext, useContext, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Lab } from "@shared/schema";

interface LabContextType {
  selectedLab: Lab | null;
  setSelectedLab: (lab: Lab | null) => void;
  allLabs: Lab[];
  setAllLabs: (labs: Lab[]) => void;
}

export const LabContext = createContext<LabContextType | undefined>(undefined);

export function useLabContext() {
  const context = useContext(LabContext);
  if (context === undefined) {
    throw new Error('useLabContext must be used within a LabProvider');
  }
  return context;
}

export function useLabContextValue(): LabContextType {
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [allLabs, setAllLabs] = useState<Lab[]>([]);
  const queryClient = useQueryClient();
  
  // Enhanced setSelectedLab that invalidates queries
  const setSelectedLabWithInvalidation = (lab: Lab | null) => {
    setSelectedLab(lab);
    if (lab) {
      // Invalidate queries when lab changes to force refetch with new lab ID
      queryClient.invalidateQueries({ queryKey: ['/api/studies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/buckets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ideas'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deadlines'] });
    }
  };

  // Auto-select first lab when labs are loaded
  useEffect(() => {
    if (allLabs.length > 0 && !selectedLab) {
      setSelectedLab(allLabs[0]);
    }
  }, [allLabs, selectedLab]);

  return {
    selectedLab,
    setSelectedLab: setSelectedLabWithInvalidation,
    allLabs,
    setAllLabs,
  };
}