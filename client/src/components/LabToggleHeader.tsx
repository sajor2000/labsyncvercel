import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLabContext } from "@/hooks/useLabContext";
import { ArrowLeft, ArrowRight, Building2, Users, Calendar } from "lucide-react";

export function LabToggleHeader() {
  const { selectedLab, setSelectedLab, allLabs } = useLabContext();
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!selectedLab || allLabs.length === 0) return 0;
    return allLabs.findIndex(lab => lab.id === selectedLab.id) || 0;
  });

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % allLabs.length;
    setCurrentIndex(nextIndex);
    setSelectedLab(allLabs[nextIndex]);
  };

  const handlePrev = () => {
    const prevIndex = currentIndex === 0 ? allLabs.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setSelectedLab(allLabs[prevIndex]);
  };

  if (allLabs.length <= 1) return null;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            data-testid="lab-toggle-prev-header"
            className="h-12 w-12"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="text-center flex-1 mx-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
                style={{ backgroundColor: selectedLab?.color || '#3b82f6' }}
              />
              <h2 className="text-2xl font-bold text-foreground">{selectedLab?.name}</h2>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span>Lab {currentIndex + 1} of {allLabs.length}</span>
              </div>
              <Badge variant="outline" className="bg-background/50">
                {selectedLab?.name?.includes("RHEDAS") 
                  ? "Health Equity Research" 
                  : "Critical Care Research"}
              </Badge>
            </div>

            <div className="flex justify-center gap-2 mt-3">
              {allLabs.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            data-testid="lab-toggle-next-header"
            className="h-12 w-12"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Switch labs to see different projects</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>All data is lab-specific</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}