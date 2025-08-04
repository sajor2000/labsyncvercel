import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLabContext } from "@/hooks/useLabContext";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Building2, FlaskConical, FolderOpen } from "lucide-react";

export function LabToggleDemo() {
  const { selectedLab, setSelectedLab, allLabs } = useLabContext();
  const [currentIndex, setCurrentIndex] = useState(0);

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

  if (allLabs.length === 0) return null;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Lab Toggle Test
        </CardTitle>
        <CardDescription>
          Click the arrows to switch between labs and watch the data update automatically
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            data-testid="lab-toggle-prev"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center flex-1 mx-4">
            <div 
              className="w-4 h-4 rounded-full mx-auto mb-2" 
              style={{ backgroundColor: selectedLab?.color || '#3b82f6' }}
            />
            <h3 className="font-semibold text-lg">{selectedLab?.name}</h3>
            <p className="text-sm text-muted-foreground">
              Lab {currentIndex + 1} of {allLabs.length}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            data-testid="lab-toggle-next"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Expected Data:
            </span>
            <Badge variant="outline">
              {selectedLab?.name === "Rush Health Equity Data Analytics Studio" 
                ? "Abbott & Wisconsin R01" 
                : "RICCC Projects"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Studies:
            </span>
            <Badge variant="outline">
              {selectedLab?.name === "Rush Health Equity Data Analytics Studio" 
                ? "COVID-19, Diabetes, etc." 
                : "Cancer, Genomics, etc."}
            </Badge>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> After switching labs, all pages (Dashboard, Studies, Buckets) will show different data specific to each lab.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}