"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Circle,
  Play
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"

// Simplified status indicator following shadcn/ui patterns
const statusVariants = cva(
  "inline-flex items-center justify-center rounded-full",
  {
    variants: {
      variant: {
        // Task/Project status
        todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        "in-progress": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
        completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
        blocked: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
        
        // Priority levels
        low: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
        medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", 
        high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
        urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      },
      size: {
        sm: "h-5 w-5", 
        md: "h-6 w-6",
        lg: "h-8 w-8",
      }
    },
    defaultVariants: {
      variant: "todo",
      size: "sm",
    }
  }
)

export interface StatusIndicatorProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusVariants> {
  status: string
  showText?: boolean
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ 
    className, 
    variant, 
    size, 
    status,
    showText = false,
    ...props 
  }, ref) => {
    const icon = getStatusIcon(status)
    
    if (showText) {
      return (
        <Badge variant="outline" className={className}>
          {icon}
          <span className="ml-1 capitalize">{status.replace('-', ' ')}</span>
        </Badge>
      )
    }
    
    return (
      <div
        className={cn(statusVariants({ variant, size, className }))}
        ref={ref}
        title={status}
        {...props}
      >
        {icon}
      </div>
    )
  }
)
StatusIndicator.displayName = "StatusIndicator"

// Simple progress bar component
export interface ProgressIndicatorProps {
  value: number
  max?: number
  className?: string
  showValue?: boolean
}

const ProgressIndicator = React.forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  ({ value, max = 100, className, showValue = true, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))
    
    return (
      <div className={cn("space-y-1", className)} ref={ref} {...props}>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showValue && (
          <div className="text-right">
            <span className="text-xs text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    )
  }
)
ProgressIndicator.displayName = "ProgressIndicator"

// Helper function for status icons
function getStatusIcon(status: string): React.ReactNode {
  const iconClass = "h-3 w-3"
  
  switch (status.toLowerCase()) {
    case 'completed':
    case 'done':
      return <CheckCircle2 className={iconClass} />
    case 'in-progress':
    case 'active':
      return <Play className={iconClass} />
    case 'todo':
    case 'pending':
      return <Circle className={iconClass} />
    case 'blocked':
      return <XCircle className={iconClass} />
    default:
      return <Circle className={iconClass} />
  }
}

export { 
  StatusIndicator, 
  ProgressIndicator,
  statusVariants 
}