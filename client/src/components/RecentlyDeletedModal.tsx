import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, RotateCcw, Archive } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Study, type Bucket, type Task } from "@shared/schema";

interface RecentlyDeletedModalProps {
  children: React.ReactNode;
}

export function RecentlyDeletedModal({ children }: RecentlyDeletedModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch deleted items with lab context
  const { data: deletedStudies = [], isLoading: studiesLoading } = useQuery<Study[]>({
    queryKey: ['/api/studies/deleted'],
    enabled: isOpen,
  });

  const { data: deletedBuckets = [], isLoading: bucketsLoading } = useQuery<Bucket[]>({
    queryKey: ['/api/buckets/deleted'],
    enabled: isOpen,
  });

  const { data: deletedTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks/deleted'],
    enabled: isOpen,
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'bucket' | 'study' | 'task'; id: string }) => {
      await apiRequest(`/api/${type}s/${id}/restore`, 'PATCH');
    },
    onSuccess: (_, { type }) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/buckets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/studies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: [`/api/${type}s/deleted`] });
      
      toast({
        title: "Item restored",
        description: "The item has been successfully restored.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore item",
        variant: "destructive",
      });
    },
  });

  const handleRestore = (type: 'bucket' | 'study' | 'task', id: string) => {
    restoreMutation.mutate({ type, id });
  };

  const isLoading = studiesLoading || bucketsLoading || tasksLoading;
  const hasDeletedItems = deletedStudies.length > 0 || deletedBuckets.length > 0 || deletedTasks.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Recently Deleted
          </DialogTitle>
          <DialogDescription>
            Items moved to Recently Deleted can be restored or will be permanently deleted after 30 days.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {!isLoading && !hasDeletedItems && (
          <div className="text-center py-8">
            <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No deleted items</h3>
            <p className="text-muted-foreground">Items you archive will appear here for 30 days.</p>
          </div>
        )}

        {!isLoading && hasDeletedItems && (
          <div className="space-y-6">
            {/* Deleted Studies */}
            {deletedStudies.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Studies</h3>
                <div className="space-y-2">
                  {deletedStudies.map((study) => (
                    <Card key={study.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{study.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Deleted: {new Date(study.updatedAt || '').toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore('study', study.id)}
                          disabled={restoreMutation.isPending}
                          data-testid={`button-restore-study-${study.id}`}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Deleted Buckets */}
            {deletedBuckets.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Buckets</h3>
                <div className="space-y-2">
                  {deletedBuckets.map((bucket) => (
                    <Card key={bucket.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{bucket.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Deleted: {new Date(bucket.updatedAt || '').toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore('bucket', bucket.id)}
                          disabled={restoreMutation.isPending}
                          data-testid={`button-restore-bucket-${bucket.id}`}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Deleted Tasks */}
            {deletedTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Tasks</h3>
                <div className="space-y-2">
                  {deletedTasks.map((task) => (
                    <Card key={task.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Deleted: {new Date(task.updatedAt || '').toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore('task', task.id)}
                          disabled={restoreMutation.isPending}
                          data-testid={`button-restore-task-${task.id}`}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}