// Re-export types from shared schema
export type {
  User,
  Lab,
  Study,
  Task,
  Bucket,
  StandupMeeting,
  ActionItem,
  Idea,
  TeamMember,
} from "@shared/schema";

// API Request types for frontend
export interface CreateLabRequest {
  name: string;
  description?: string;
  institution?: string;
  department?: string;
  website?: string;
  isActive?: boolean;
}

export interface UpdateLabRequest extends Partial<CreateLabRequest> {}

export interface CreateStudyRequest {
  name: string;
  description?: string;
  status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate?: string;
  endDate?: string;
  labId: string;
  bucketId?: string;
  piId?: string;
  position?: string;
  isActive?: boolean;
}

export interface UpdateStudyRequest extends Partial<Omit<CreateStudyRequest, 'labId'>> {}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  studyId: string;
  assigneeId?: string;
  parentTaskId?: string;
  position?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface UpdateTaskRequest extends Partial<Omit<CreateTaskRequest, 'studyId'>> {}

export interface MoveTaskRequest {
  newStatus?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  newPosition?: number;
  newStudyId?: string;
}

export interface CreateBucketRequest {
  name: string;
  description?: string;
  color?: string;
  labId: string;
  position?: string;
  isActive?: boolean;
}

export interface UpdateBucketRequest extends Partial<Omit<CreateBucketRequest, 'labId'>> {}

export interface CreateIdeaRequest {
  title: string;
  description?: string;
  status?: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  labId: string;
  tags?: string[];
  isActive?: boolean;
}

export interface UpdateIdeaRequest extends Partial<Omit<CreateIdeaRequest, 'labId'>> {}

export interface CreateStandupRequest {
  title: string;
  description?: string;
  meetingType?: 'DAILY_STANDUP' | 'WEEKLY_REVIEW' | 'SPRINT_PLANNING' | 'RETROSPECTIVE';
  scheduledDate: string;
  startTime: string;
  endTime?: string;
  labId: string;
  attendees?: string[];
  transcript?: string;
  summary?: string;
  actionItems?: string[];
}

export interface UpdateStandupRequest extends Partial<Omit<CreateStandupRequest, 'labId'>> {}

export interface CreateActionItemRequest {
  title: string;
  description?: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  meetingId: string;
  assigneeId?: string;
  isActive?: boolean;
}

export interface UpdateActionItemRequest extends Partial<Omit<CreateActionItemRequest, 'meetingId'>> {}

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

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
  details?: any;
}

// Workflow types
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

// Query parameter types
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