import React from "react";
import { LabContext, useLabContextValue } from "@/hooks/useLabContext";

interface LabProviderProps {
  children: React.ReactNode;
}

export function LabProvider({ children }: LabProviderProps) {
  const value = useLabContextValue();
  
  return (
    <LabContext.Provider value={value}>
      {children}
    </LabContext.Provider>
  );
}