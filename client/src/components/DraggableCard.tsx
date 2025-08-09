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
  style?: React.CSSProperties;
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
  style,
}: DraggableCardProps) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <Card
      draggable
      data-testid={`draggable-card-${type}-${item.id}`}
      className={cn(
        "group relative cursor-move transition-all duration-200",
        isDragging && "opacity-50 rotate-2 scale-105 shadow-lg ring-2 ring-primary/30",
        isHovering && "shadow-md ring-2 ring-primary/20 transform scale-[1.02]",
        "hover:shadow-lg active:cursor-grabbing",
        className
      )}
      style={style}
      onDragStart={(e) => onDragStart(e, item, type)}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {showGrip && (
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <GripVertical 
            className="h-4 w-4 text-muted-foreground hover:text-primary cursor-grab active:cursor-grabbing" 
            data-testid={`grip-${type}-${item.id}`}
          />
        </div>
      )}
      {children}
    </Card>
  );
}