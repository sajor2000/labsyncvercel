import { createContext, useContext, useState, useEffect } from "react";
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

  // Auto-select first lab when labs are loaded
  useEffect(() => {
    if (allLabs.length > 0 && !selectedLab) {
      setSelectedLab(allLabs[0]);
    }
  }, [allLabs, selectedLab]);

  return {
    selectedLab,
    setSelectedLab,
    allLabs,
    setAllLabs,
  };
}