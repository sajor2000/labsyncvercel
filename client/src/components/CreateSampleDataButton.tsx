import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Plus } from "lucide-react";

export function CreateSampleDataButton() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSampleDataMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/create-sample-data', 'POST', {});
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/studies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/buckets'] });
      toast({
        title: "Success",
        description: `Created ${result.bucketsCreated} buckets and ${result.studiesCreated} studies matching your Airtable examples`,
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

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => createSampleDataMutation.mutate()}
      disabled={createSampleDataMutation.isPending}
      data-testid="button-create-sample-data"
    >
      <FlaskConical className="h-4 w-4 mr-2" />
      {createSampleDataMutation.isPending ? "Creating..." : "Add Sample Data"}
      <Badge variant="secondary" className="ml-2 text-xs">
        Demo
      </Badge>
    </Button>
  );
}