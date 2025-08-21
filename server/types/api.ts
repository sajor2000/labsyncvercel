import { Request } from "express";
import type { 
  User, 
  Lab, 
  Study, 
  Task, 
  Bucket, 
  StandupMeeting, 
  ActionItem, 
  Idea,
  InsertLab,
  InsertStudy,
  InsertTask,
  InsertBucket,
  InsertStandupMeeting,
  InsertActionItem,
  InsertIdea
} from "@shared/schema";

// Extend Express Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user: {
    claims: {
      sub: string;
      email: string;
      name: string;
    };
    expires_at: number;
  };
}

// API Request Types
export interface CreateLabRequest extends InsertLab {}
export interface UpdateLabRequest extends Partial<InsertLab> {}

export interface CreateStudyRequest extends InsertStudy {}
export interface UpdateStudyRequest extends Partial<InsertStudy> {}

export interface CreateTaskRequest extends InsertTask {}
export interface UpdateTaskRequest extends Partial<InsertTask> {}

export interface CreateBucketRequest extends InsertBucket {}
export interface UpdateBucketRequest extends Partial<InsertBucket> {}

export interface CreateStandupRequest extends InsertStandupMeeting {}
export interface UpdateStandupRequest extends Partial<InsertStandupMeeting> {}

export interface CreateActionItemRequest extends InsertActionItem {}
export interface UpdateActionItemRequest extends Partial<InsertActionItem> {}

export interface CreateIdeaRequest extends InsertIdea {}
export interface UpdateIdeaRequest extends Partial<InsertIdea> {}

export interface MoveTaskRequest {
  newStatus?: string;
  newPosition?: number;
  newStudyId?: string;
}

export interface DeleteOptions {
  force?: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
  details?: any;
}

// Workflow API Types
export interface WorkflowCompleteRequest {
  recipients: string[];
  labName: string;
  labId?: string;
  meetingType?: string;
  attendees?: string[];
}

export interface WorkflowStepResult {
  success: boolean;
  processingTime: number;
  error?: string;
}

export interface WorkflowResponse {
  success: boolean;
  workflowId: string;
  meetingId?: string;
  steps: {
    transcription: WorkflowStepResult;
    aiAnalysis: WorkflowStepResult;
    emailGeneration: WorkflowStepResult;
    emailDelivery: WorkflowStepResult;
  };
}

// Email API Types
export interface SendEmailRequest {
  recipients: string[];
  testMessage?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  message: string;
  resendResponse?: any;
}

// Team Member API Types
export interface CreateTeamMemberRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  role: string;
  title?: string;
  department?: string;
  institution?: string;
  phone?: string;
  capacity?: string;
  bio?: string;
  linkedIn?: string;
  orcid?: string;
  expertise?: string[];
  skills?: string[];
  isExternal?: boolean;
  labId?: string;
}

export interface UpdateTeamMemberRequest extends Partial<CreateTeamMemberRequest> {
  labRole?: string;
}

// Query Parameter Types
export interface StudiesQuery {
  labId?: string;
}

export interface TasksQuery {
  labId?: string;
  studyId?: string;
  assigneeId?: string;
}

export interface BucketsQuery {
  labId?: string;
}

export interface IdeasQuery {
  labId?: string;
}

export interface StandupsQuery {
  labId: string;
}

export interface ActionItemsQuery {
  assigneeId?: string;
  meetingId?: string;
}

export interface LabMembersQuery {
  labId?: string;
}