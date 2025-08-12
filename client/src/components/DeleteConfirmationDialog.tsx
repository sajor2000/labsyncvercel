import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface DeleteConfirmationDialogProps {
  id: string;
  type: 'bucket' | 'study' | 'task' | 'team-member' | 'deadline' | 'idea';
  itemName: string;
  variant?: 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  customEndpoint?: string; // For custom API endpoints
  children?: React.ReactNode; // For custom trigger content
}

export function DeleteConfirmationDialog({
  id,
  type,
  itemName,
  variant = 'destructive',
  size = 'sm',
  showIcon = true,
  showText = false,
  className = "",
  onSuccess,
  onError,
  customEndpoint,
  children,
}: DeleteConfirmationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const endpoint = customEndpoint || `/api/${type}s/${id}`;
      return apiRequest(endpoint, 'DELETE');
    },
    onSuccess: () => {
      // Invalidate all relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/${type}s`] });
      queryClient.invalidateQueries({ queryKey: ['/api/buckets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/studies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deadlines'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ideas'] });
      
      toast({
        title: "Success",
        description: `${itemName} has been permanently deleted.`,
      });
      
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: (error as Error).message || `Failed to delete ${type}`,
        variant: "destructive",
      });
      
      onError?.(error as Error);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const TriggerButton = children ? (
    <div onClick={() => setIsOpen(true)}>{children}</div>
  ) : (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${variant === 'destructive' ? '' : 'border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground'}`}
      data-testid={`button-delete-${type}-${id}`}
      onClick={(e) => {
        e.stopPropagation(); // Prevent triggering parent click events
        setIsOpen(true);
      }}
    >
      {showIcon && <Trash2 className="h-4 w-4" />}
      {showText && <span className={showIcon ? "ml-2" : ""}>Delete</span>}
    </Button>
  );

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {TriggerButton}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {type}?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete "{itemName}"? 
            This action cannot be undone and will permanently remove the {type} and all its associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}