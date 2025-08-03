import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Study, InsertStudy } from "@shared/schema";

export function useStudies(labId?: string) {
  const { toast } = useToast();

  return useQuery<Study[]>({
    queryKey: ["/api/studies", labId].filter(Boolean),
    queryFn: async () => {
      const url = labId ? `/api/studies?labId=${labId}` : "/api/studies";
      const response = await fetch(url, { credentials: "include" });
      
      if (response.status === 401) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return [];
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch studies: ${response.statusText}`);
      }
      
      return await response.json();
    },
  });
}

export function useCreateStudy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertStudy) => {
      const response = await apiRequest("POST", "/api/studies", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Study created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/studies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
        description: "Failed to create study. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateStudy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Study> }) => {
      const response = await apiRequest("PUT", `/api/studies/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Study updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/studies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
        description: "Failed to update study. Please try again.",
        variant: "destructive",
      });
    },
  });
}
