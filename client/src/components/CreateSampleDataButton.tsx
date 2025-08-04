import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useLabContext } from "@/hooks/useLabContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Database } from "lucide-react";

export function CreateSampleDataButton() {
  const { contextLab } = useLabContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSampleDataMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/create-sample-data', 'POST', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/buckets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Sample data created successfully! You now have Abbott and Wisconsin R01 buckets with example studies.",
      });
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
        description: "Failed to create sample data",
        variant: "destructive",
      });
    },
  });

  if (!contextLab) {
    return null;
  }

  return (
    <Button
      onClick={() => createSampleDataMutation.mutate()}
      disabled={createSampleDataMutation.isPending}
      variant="outline"
      size="sm"
      data-testid="button-create-sample-data"
    >
      <Database className="h-4 w-4 mr-2" />
      {createSampleDataMutation.isPending ? "Creating..." : "Add Sample Data"}
    </Button>
  );
}