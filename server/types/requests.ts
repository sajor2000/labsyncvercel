import { z } from 'zod';

// Common pagination schema
export const PaginationQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? Math.max(1, parseInt(val)) : 1),
  limit: z.string().optional().transform((val) => val ? Math.min(100, Math.max(1, parseInt(val))) : 20),
});

// Lab request schemas
export const CreateLabSchema = z.object({
  name: z.string().min(1, 'Lab name is required'),
  fullName: z.string().optional(),
  description: z.string().optional(),
  institution: z.string().optional(),
  department: z.string().optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateLabSchema = CreateLabSchema.partial();

export const LabQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.string().optional().transform((val) => val === 'true'),
}).merge(PaginationQuerySchema);

// Study request schemas  
export const CreateStudySchema = z.object({
  name: z.string().min(1, 'Study name is required'),
  notes: z.string().optional(),
  status: z.enum(['PLANNING', 'IRB_SUBMISSION', 'IRB_APPROVED', 'DATA_COLLECTION', 'ANALYSIS', 'MANUSCRIPT', 'UNDER_REVIEW', 'PUBLISHED', 'ON_HOLD', 'CANCELLED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  labId: z.string().uuid('Invalid lab ID'),
  bucketId: z.string().uuid('Invalid bucket ID'),
  studyType: z.string().optional(),
  firstAuthor: z.string().optional(),
  lastAuthor: z.string().optional(),
  funding: z.enum(['NIH', 'NSF', 'INDUSTRY_SPONSORED', 'INTERNAL', 'FOUNDATION', 'OTHER']).optional(),
  fundingSource: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateStudySchema = CreateStudySchema.partial();

export const StudyQuerySchema = z.object({
  labId: z.string().optional(),
  bucketId: z.string().optional(),  
  status: z.string().optional(),
  priority: z.string().optional(),
  search: z.string().optional(),
}).merge(PaginationQuerySchema);

// Task request schemas
export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  studyId: z.string().uuid('Invalid study ID'),
  assigneeId: z.string().uuid().optional(),
  parentTaskId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  estimatedHours: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  tags: z.array(z.string()).default([]),
  position: z.string().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const TaskQuerySchema = z.object({
  studyId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  search: z.string().optional(),
  overdue: z.string().optional().transform((val) => val === 'true'),
}).merge(PaginationQuerySchema);

export const MoveTaskSchema = z.object({
  newStatus: z.string().optional(),
  newPosition: z.number().optional(),
  newStudyId: z.string().uuid().optional(),
});

// Standup request schemas
export const CreateStandupSchema = z.object({
  title: z.string().min(1, 'Standup title is required'),
  description: z.string().optional(),
  labId: z.string().uuid('Invalid lab ID'),
  facilitatorId: z.string().uuid().optional(),
  meetingType: z.enum(['DAILY_STANDUP', 'WEEKLY_REVIEW', 'PROJECT_SYNC', 'STUDY_REVIEW']).default('DAILY_STANDUP'),
  scheduledDate: z.string().datetime('Invalid date format'),
  duration: z.number().min(1).max(240).default(30), // 1-240 minutes
  recurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  participantIds: z.array(z.string().uuid()).default([]),
});

export const UpdateStandupSchema = CreateStandupSchema.partial();

export const StandupQuerySchema = z.object({
  labId: z.string().uuid().optional(),
  facilitatorId: z.string().uuid().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
}).merge(PaginationQuerySchema);

// Action Item request schemas
export const CreateActionItemSchema = z.object({
  title: z.string().min(1, 'Action item title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('OPEN'),
  assigneeId: z.string().uuid().optional(),
  meetingId: z.string().uuid('Invalid meeting ID'),
  dueDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});

export const UpdateActionItemSchema = CreateActionItemSchema.partial();

// Delete operation schemas
export const DeleteOptionsSchema = z.object({
  force: z.string().optional().transform((val) => val === 'true'),
});

// Common response types
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

export interface StandardResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  timestamp: string;
}

// Type exports for request validation
export type CreateLabRequest = z.infer<typeof CreateLabSchema>;
export type UpdateLabRequest = z.infer<typeof UpdateLabSchema>;
export type LabQuery = z.infer<typeof LabQuerySchema>;

export type CreateStudyRequest = z.infer<typeof CreateStudySchema>;
export type UpdateStudyRequest = z.infer<typeof UpdateStudySchema>;
export type StudyQuery = z.infer<typeof StudyQuerySchema>;

export type CreateTaskRequest = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskRequest = z.infer<typeof UpdateTaskSchema>;
export type TaskQuery = z.infer<typeof TaskQuerySchema>;
export type MoveTaskRequest = z.infer<typeof MoveTaskSchema>;

export type CreateStandupRequest = z.infer<typeof CreateStandupSchema>;
export type UpdateStandupRequest = z.infer<typeof UpdateStandupSchema>;
export type StandupQuery = z.infer<typeof StandupQuerySchema>;

export type CreateActionItemRequest = z.infer<typeof CreateActionItemSchema>;
export type UpdateActionItemRequest = z.infer<typeof UpdateActionItemSchema>;

export type DeleteOptions = z.infer<typeof DeleteOptionsSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;