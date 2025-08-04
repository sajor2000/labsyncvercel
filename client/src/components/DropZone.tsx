import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface DropZoneProps {
  onDrop: (e: React.DragEvent) => void;
  className?: string;
  children?: React.ReactNode;
  showIndicator?: boolean;
  label?: string;
}

export function DropZone({
  onDrop,
  className,
  children,
  showIndicator = true,
  label = "Drop here",
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e);
  };

  return (
    <div
      data-testid="drop-zone"
      className={cn(
        "relative transition-all duration-200",
        isDragOver && showIndicator && "ring-2 ring-primary ring-offset-2 bg-primary/5",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {isDragOver && showIndicator && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
          <div className="flex items-center gap-2 text-primary font-medium">
            <Plus className="h-4 w-4" />
            {label}
          </div>
        </div>
      )}
    </div>
  );
}