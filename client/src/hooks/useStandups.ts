import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { StandupMeeting, InsertStandupMeeting } from "@shared/schema";

export function useStandups(labId?: string) {
  const { toast } = useToast();

  return useQuery<StandupMeeting[]>({
    queryKey: ["/api/standups", labId].filter(Boolean),
    queryFn: async () => {
      const url = labId ? `/api/standups?labId=${labId}` : "/api/standups";
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
        throw new Error(`Failed to fetch standups: ${response.statusText}`);
      }
      
      return await response.json();
    },
  });
}

export function useCreateStandup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertStandupMeeting) => {
      const response = await apiRequest("POST", "/api/standups", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Standup meeting created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/standups"] });
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
        description: "Failed to create standup meeting. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useProcessRecording() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ meetingId, audioFile, participants }: {
      meetingId: string;
      audioFile: File;
      participants: string[];
    }) => {
      const formData = new FormData();
      formData.append("recording", audioFile);
      formData.append("participants", JSON.stringify(participants));

      const response = await fetch(`/api/standups/${meetingId}/process-recording`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to process recording: ${response.statusText}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Recording processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/standups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/action-items"] });
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
        description: "Failed to process recording. Please try again.",
        variant: "destructive",
      });
    },
  });
}
