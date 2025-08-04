import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

interface DraggableCardProps {
  children: React.ReactNode;
  item: any;
  type: 'bucket' | 'study' | 'task';
  onDragStart: (e: React.DragEvent, item: any, type: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  className?: string;
  isDragging?: boolean;
  showGrip?: boolean;
}

export function DraggableCard({
  children,
  item,
  type,
  onDragStart,
  onDragOver,
  onDrop,
  className,
  isDragging = false,
  showGrip = true,
}: DraggableCardProps) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <Card
      draggable
      data-testid={`draggable-card-${type}-${item.id}`}
      className={cn(
        "group relative cursor-move transition-all duration-200",
        isDragging && "opacity-50 rotate-2 scale-105 shadow-lg",
        isHovering && "shadow-md ring-2 ring-primary/20",
        className
      )}
      onDragStart={(e) => onDragStart(e, item, type)}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {showGrip && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical 
            className="h-4 w-4 text-muted-foreground" 
            data-testid={`grip-${type}-${item.id}`}
          />
        </div>
      )}
      {children}
    </Card>
  );
}