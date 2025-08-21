import { apiRequest } from "./queryClient";
import type {
  Lab,
  Study,
  Task,
  Bucket,
  Idea,
  StandupMeeting,
  ActionItem,
  TeamMember,
  User,
  CreateLabRequest,
  UpdateLabRequest,
  CreateStudyRequest,
  UpdateStudyRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
  CreateBucketRequest,
  UpdateBucketRequest,
  CreateIdeaRequest,
  UpdateIdeaRequest,
  CreateStandupRequest,
  UpdateStandupRequest,
  CreateActionItemRequest,
  UpdateActionItemRequest,
  CreateTeamMemberRequest,
  UpdateTeamMemberRequest,
  StudiesQuery,
  TasksQuery,
  BucketsQuery,
  IdeasQuery,
  StandupsQuery,
  ActionItemsQuery,
  LabMembersQuery,
} from "../types/api";

// Helper functions for API calls with proper typing
export const api = {
  // Studies
  studies: {
    getAll: (labId?: string) => 
      fetch(`/api/studies${labId ? `?labId=${labId}` : ''}`, { credentials: "include" }),
    get: (id: string) => 
      fetch(`/api/studies/${id}`, { credentials: "include" }),
    create: (data: CreateStudyRequest): Promise<Response> => 
      apiRequest("POST", "/api/studies", data),
    update: (id: string, data: UpdateStudyRequest): Promise<Response> => 
      apiRequest("PUT", `/api/studies/${id}`, data),
    delete: (id: string, force?: boolean): Promise<Response> => 
      apiRequest("DELETE", `/api/studies/${id}${force ? '?force=true' : ''}`),
  },

  // Labs
  labs: {
    getAll: () => 
      fetch("/api/labs", { credentials: "include" }),
    create: (data: CreateLabRequest): Promise<Response> => 
      apiRequest("POST", "/api/labs", data),
    update: (id: string, data: UpdateLabRequest): Promise<Response> => 
      apiRequest("PUT", `/api/labs/${id}`, data),
    delete: (id: string, force?: boolean): Promise<Response> => 
      apiRequest("DELETE", `/api/labs/${id}${force ? '?force=true' : ''}`),
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
    create: (data: CreateTaskRequest): Promise<Response> => 
      apiRequest("POST", "/api/tasks", data),
    update: (id: string, data: UpdateTaskRequest): Promise<Response> => 
      apiRequest("PUT", `/api/tasks/${id}`, data),
    move: (id: string, data: MoveTaskRequest): Promise<Response> => 
      apiRequest("PATCH", `/api/tasks/${id}/move`, data),
    delete: (id: string): Promise<Response> => 
      apiRequest("DELETE", `/api/tasks/${id}`),
  },

  // Standups
  standups: {
    getAll: (labId: string) => 
      fetch(`/api/standups?labId=${labId}`, { credentials: "include" }),
    create: (data: CreateStandupRequest): Promise<Response> => 
      apiRequest("POST", "/api/standups", data),
    update: (id: string, data: UpdateStandupRequest): Promise<Response> => 
      apiRequest("PUT", `/api/standups/${id}`, data),
    delete: (id: string): Promise<Response> => 
      apiRequest("DELETE", `/api/standups/meetings/${id}`),
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
    create: (data: CreateActionItemRequest): Promise<Response> => 
      apiRequest("POST", "/api/action-items", data),
    update: (id: string, data: UpdateActionItemRequest): Promise<Response> => 
      apiRequest("PUT", `/api/action-items/${id}`, data),
    delete: (id: string): Promise<Response> => 
      apiRequest("DELETE", `/api/action-items/${id}`),
  },

  // Buckets
  buckets: {
    getAll: (labId?: string) => 
      fetch(`/api/buckets${labId ? `?labId=${labId}` : ''}`, { credentials: "include" }),
    create: (data: CreateBucketRequest): Promise<Response> => 
      apiRequest("POST", "/api/buckets", data),
    update: (id: string, data: UpdateBucketRequest): Promise<Response> => 
      apiRequest("PUT", `/api/buckets/${id}`, data),
    delete: (id: string): Promise<Response> => 
      apiRequest("DELETE", `/api/buckets/${id}`),
  },

  // Ideas
  ideas: {
    getAll: (labId?: string) => 
      fetch(`/api/ideas${labId ? `?labId=${labId}` : ''}`, { credentials: "include" }),
    create: (data: CreateIdeaRequest): Promise<Response> => 
      apiRequest("POST", "/api/ideas", data),
    update: (id: string, data: UpdateIdeaRequest): Promise<Response> => 
      apiRequest("PUT", `/api/ideas/${id}`, data),
    delete: (id: string): Promise<Response> => 
      apiRequest("DELETE", `/api/ideas/${id}`),
  },

  // Team Members
  teamMembers: {
    getAll: () => 
      fetch("/api/team-members", { credentials: "include" }),
    create: (data: CreateTeamMemberRequest): Promise<Response> => 
      apiRequest("POST", "/api/team-members", data),
    update: (id: string, data: UpdateTeamMemberRequest): Promise<Response> => 
      apiRequest("PUT", `/api/team-members/${id}`, data),
    delete: (id: string): Promise<Response> => 
      apiRequest("DELETE", `/api/team-members/${id}`),
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
