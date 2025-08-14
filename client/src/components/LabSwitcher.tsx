import { Building2, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLabContext } from "@/hooks/useLabContext";

export function LabSwitcher() {
  const { selectedLab, setSelectedLab, allLabs } = useLabContext();

  // Helper function to get lab abbreviation
  const getLabAbbreviation = (labName: string | undefined) => {
    if (!labName) return "No lab";
    
    // Map full names to abbreviations
    if (labName.toLowerCase().includes('rush healthcare data') || labName.toLowerCase().includes('rhedas')) {
      return 'RHEDAS';
    }
    if (labName.toLowerCase().includes('rush interdisciplinary') || labName.toLowerCase().includes('riccc')) {
      return 'RICCC';
    }
    
    // Fallback: extract from parentheses or use name as-is
    return labName.match(/\(([^)]+)\)$/)?.[1] || labName;
  };

  // Safety check - handle loading state when allLabs is undefined
  if (!allLabs || allLabs.length === 0) {
    return (
      <div className="flex items-center w-[200px] px-3 py-2 rounded-md border bg-muted/50">
        <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
        <span className="truncate text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const toggleLab = () => {
    if (allLabs.length <= 1) return;
    
    const currentIndex = allLabs.findIndex(lab => lab.id === selectedLab?.id);
    const nextIndex = (currentIndex + 1) % allLabs.length;
    setSelectedLab(allLabs[nextIndex]);
  };

  if (allLabs.length <= 1) {
    return (
      <div className="flex items-center w-[200px] px-3 py-2 rounded-md border bg-muted/50">
        <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
        <span className="truncate text-sm text-muted-foreground">
          {getLabAbbreviation(selectedLab?.name)}
        </span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={toggleLab}
      className="w-[200px] justify-between hover:bg-primary/10 transition-colors"
      data-testid="lab-switcher-toggle"
    >
      <div className="flex items-center">
        <div 
          className="w-3 h-3 rounded-full mr-2 border border-white/20" 
          style={{ backgroundColor: selectedLab?.primaryColor || '#3b82f6' }}
        />
        <Building2 className="mr-2 h-4 w-4" />
        <span className="truncate">
          {selectedLab?.name ? getLabAbbreviation(selectedLab.name) : "Select lab..."}
        </span>
      </div>
      <ArrowLeftRight className="ml-2 h-4 w-4 shrink-0 opacity-70" />
    </Button>
  );
}