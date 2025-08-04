import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Archive } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SoftDeleteButtonProps {
  id: string;
  type: 'bucket' | 'study' | 'task';
  itemName: string;
  variant?: 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
}

export function SoftDeleteButton({
  id,
  type,
  itemName,
  variant = 'ghost',
  size = 'sm',
  showIcon = true,
  showText = false,
}: SoftDeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const softDeleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/${type}s/${id}/soft-delete`, 'PATCH');
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/${type}s`] });
      queryClient.invalidateQueries({ queryKey: ['/api/buckets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/studies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      toast({
        title: "Item archived",
        description: `${itemName} has been moved to Recently Deleted. You can restore it from there.`,
      });
      
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to archive ${type}`,
        variant: "destructive",
      });
    },
  });

  const handleSoftDelete = () => {
    softDeleteMutation.mutate();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className="text-muted-foreground hover:text-destructive"
          data-testid={`button-soft-delete-${type}-${id}`}
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering parent click events
            setIsOpen(true);
          }}
        >
          {showIcon && <Archive className="h-4 w-4" />}
          {showText && <span className={showIcon ? "ml-2" : ""}>Archive</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {type}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will move "{itemName}" to Recently Deleted. You can restore it later if needed.
            This action does not permanently delete the {type}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSoftDelete}
            disabled={softDeleteMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {softDeleteMutation.isPending ? "Archiving..." : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}