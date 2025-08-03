import { apiRequest } from "./queryClient";

// Helper functions for API calls
export const api = {
  // Studies
  studies: {
    getAll: (labId?: string) => 
      fetch(`/api/studies${labId ? `?labId=${labId}` : ''}`, { credentials: "include" }),
    get: (id: string) => 
      fetch(`/api/studies/${id}`, { credentials: "include" }),
    create: (data: any) => 
      apiRequest("POST", "/api/studies", data),
    update: (id: string, data: any) => 
      apiRequest("PUT", `/api/studies/${id}`, data),
  },

  // Labs
  labs: {
    getAll: () => 
      fetch("/api/labs", { credentials: "include" }),
    create: (data: any) => 
      apiRequest("POST", "/api/labs", data),
    getMembers: (id: string) => 
      fetch(`/api/labs/${id}/members`, { credentials: "include" }),
  },

  // Tasks
  tasks: {
    getAll: (studyId?: string, assigneeId?: string) => {
      const params = new URLSearchParams();
      if (studyId) params.append("studyId", studyId);
      if (assigneeId) params.append("assigneeId", assigneeId);
      return fetch(`/api/tasks?${params}`, { credentials: "include" });
    },
    create: (data: any) => 
      apiRequest("POST", "/api/tasks", data),
    update: (id: string, data: any) => 
      apiRequest("PUT", `/api/tasks/${id}`, data),
  },

  // Standups
  standups: {
    getAll: (labId: string) => 
      fetch(`/api/standups?labId=${labId}`, { credentials: "include" }),
    create: (data: any) => 
      apiRequest("POST", "/api/standups", data),
    processRecording: (meetingId: string, formData: FormData) => 
      fetch(`/api/standups/${meetingId}/process-recording`, {
        method: "POST",
        body: formData,
        credentials: "include",
      }),
  },

  // Action Items
  actionItems: {
    getAll: (assigneeId?: string, meetingId?: string) => {
      const params = new URLSearchParams();
      if (assigneeId) params.append("assigneeId", assigneeId);
      if (meetingId) params.append("meetingId", meetingId);
      return fetch(`/api/action-items?${params}`, { credentials: "include" });
    },
    create: (data: any) => 
      apiRequest("POST", "/api/action-items", data),
    update: (id: string, data: any) => 
      apiRequest("PUT", `/api/action-items/${id}`, data),
  },

  // Dashboard
  dashboard: {
    getStats: () => 
      fetch("/api/dashboard/stats", { credentials: "include" }),
  },

  // Auth
  auth: {
    getUser: () => 
      fetch("/api/auth/user", { credentials: "include" }),
    login: () => {
      window.location.href = "/api/login";
    },
    logout: () => {
      window.location.href = "/api/logout";
    },
  },
};
