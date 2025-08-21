import { z } from "zod";

// Base validation schemas
export const mongoIdSchema = z.string().min(1, "ID is required");
export const emailSchema = z.string().email("Invalid email format");
export const urlSchema = z.string().url("Invalid URL format").optional();

// Lab schemas
export const createLabSchema = z.object({
  name: z.string().min(1, "Lab name is required"),
  description: z.string().optional(),
  institution: z.string().optional(),
  department: z.string().optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export const updateLabSchema = createLabSchema.partial();

// Study schemas
export const createStudySchema = z.object({
  name: z.string().min(1, "Study name is required"),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  labId: mongoIdSchema,
  bucketId: mongoIdSchema.optional(),
  piId: mongoIdSchema.optional(),
  position: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateStudySchema = createStudySchema.partial().omit({ labId: true });

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  studyId: mongoIdSchema,
  assigneeId: mongoIdSchema.optional(),
  parentTaskId: mongoIdSchema.optional(),
  position: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const updateTaskSchema = createTaskSchema.partial().omit({ studyId: true });

export const moveTaskSchema = z.object({
  newStatus: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']).optional(),
  newPosition: z.number().optional(),
  newStudyId: mongoIdSchema.optional(),
});

// Bucket schemas
export const createBucketSchema = z.object({
  name: z.string().min(1, "Bucket name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  labId: mongoIdSchema,
  position: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateBucketSchema = createBucketSchema.partial().omit({ labId: true });

// Idea schemas
export const createIdeaSchema = z.object({
  title: z.string().min(1, "Idea title is required"),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTED']).default('DRAFT'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  labId: mongoIdSchema,
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const updateIdeaSchema = createIdeaSchema.partial().omit({ labId: true });

// Standup Meeting schemas
export const createStandupSchema = z.object({
  title: z.string().min(1, "Meeting title is required"),
  description: z.string().optional(),
  meetingType: z.enum(['DAILY_STANDUP', 'WEEKLY_REVIEW', 'SPRINT_PLANNING', 'RETROSPECTIVE']).default('DAILY_STANDUP'),
  scheduledDate: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  labId: mongoIdSchema,
  attendees: z.array(z.string()).default([]),
  transcript: z.string().optional(),
  summary: z.string().optional(),
  actionItems: z.array(z.string()).default([]),
});

export const updateStandupSchema = createStandupSchema.partial().omit({ labId: true });

// Action Item schemas
export const createActionItemSchema = z.object({
  title: z.string().min(1, "Action item title is required"),
  description: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('OPEN'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  meetingId: mongoIdSchema,
  assigneeId: mongoIdSchema.optional(),
  isActive: z.boolean().default(true),
});

export const updateActionItemSchema = createActionItemSchema.partial().omit({ meetingId: true });

// Team Member schemas
export const createTeamMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  email: emailSchema,
  role: z.string().min(1, "Role is required"),
  title: z.string().optional(),
  department: z.string().optional(),
  institution: z.string().optional(),
  phone: z.string().optional(),
  capacity: z.string().default("40.00"),
  bio: z.string().optional(),
  linkedIn: urlSchema,
  orcid: z.string().optional(),
  expertise: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  isExternal: z.boolean().default(false),
  labId: mongoIdSchema.optional(),
});

export const updateTeamMemberSchema = createTeamMemberSchema.partial();

// Workflow schemas
export const workflowCompleteSchema = z.object({
  recipients: z.array(emailSchema).min(1, "At least one recipient is required"),
  labName: z.string().min(1, "Lab name is required"),
  labId: mongoIdSchema.optional(),
  meetingType: z.enum(['DAILY_STANDUP', 'WEEKLY_REVIEW', 'SPRINT_PLANNING', 'RETROSPECTIVE']).default('DAILY_STANDUP'),
  attendees: z.array(z.string()).default([]),
});

export const sendEmailSchema = z.object({
  recipients: z.array(emailSchema).min(1, "At least one recipient is required"),
  testMessage: z.string().optional(),
});

// Query parameter schemas
export const studiesQuerySchema = z.object({
  labId: mongoIdSchema.optional(),
});

export const tasksQuerySchema = z.object({
  labId: mongoIdSchema.optional(),
  studyId: mongoIdSchema.optional(),
  assigneeId: mongoIdSchema.optional(),
});

export const bucketsQuerySchema = z.object({
  labId: mongoIdSchema.optional(),
});

export const ideasQuerySchema = z.object({
  labId: mongoIdSchema.optional(),
});

export const standupsQuerySchema = z.object({
  labId: mongoIdSchema,
});

export const actionItemsQuerySchema = z.object({
  assigneeId: mongoIdSchema.optional(),
  meetingId: mongoIdSchema.optional(),
});

export const labMembersQuerySchema = z.object({
  labId: mongoIdSchema.optional(),
});

export const deleteOptionsSchema = z.object({
  force: z.string().transform(val => val === 'true').optional(),
});