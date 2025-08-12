import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
  pgEnum,
  json,
  index,
  jsonb,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enhanced Enums for Lab Roles
export const userRoleEnum = pgEnum("user_role", [
  // Leadership
  "PRINCIPAL_INVESTIGATOR",      // PI - Lab head, grant holder
  "CO_PRINCIPAL_INVESTIGATOR",   // Co-PI - Shares leadership
  
  // Data & Analytics Team
  "DATA_SCIENTIST",              // Advanced analytics, ML/AI
  "DATA_ANALYST",                // Data processing, statistics
  
  // Coordination & Management
  "CLINICAL_RESEARCH_COORDINATOR", // CRC - Patient-facing, trial management
  "REGULATORY_COORDINATOR",        // IRB, compliance, documentation
  "STAFF_COORDINATOR",            // General lab operations
  "LAB_ADMINISTRATOR",            // System admin, access control
  
  // Training Positions
  "FELLOW",                       // Post-doc or clinical fellow
  "MEDICAL_STUDENT",             // Medical school trainee
  
  // Research Support
  "RESEARCH_ASSISTANT",          // Full/part-time RA
  "VOLUNTEER_RESEARCH_ASSISTANT", // Volunteer RA
  
  // External
  "EXTERNAL_COLLABORATOR",       // Outside institution
  
  // Legacy roles for backward compatibility
  "PI",
  "RESEARCH_COORDINATOR", 
  "RESEARCHER",
  "STUDENT",
  "ADMIN"
]);

export const studyStatusEnum = pgEnum("study_status", [
  "PLANNING",
  "IRB_SUBMISSION",
  "IRB_APPROVED", 
  "DATA_COLLECTION",
  "ANALYSIS",
  "MANUSCRIPT",
  "UNDER_REVIEW",
  "PUBLISHED",
  "ON_HOLD",
  "CANCELLED"
]);

export const fundingTypeEnum = pgEnum("funding_type", [
  "NIH",
  "NSF",
  "INDUSTRY_SPONSORED",
  "INTERNAL", 
  "FOUNDATION",
  "OTHER"
]);

export const priorityEnum = pgEnum("priority", [
  "LOW",
  "MEDIUM", 
  "HIGH",
  "URGENT"
]);

export const taskStatusEnum = pgEnum("task_status", [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE", 
  "BLOCKED"
]);

export const memberRoleEnum = pgEnum("member_role", [
  "OWNER",
  "ADMIN",
  "CONTRIBUTOR",
  "VIEWER",
  "INFORMED"
]);

export const commentableTypeEnum = pgEnum("commentable_type", [
  "PROJECT",
  "TASK",
  "IDEA",
  "STANDUP",
  "BUCKET"
]);

export const attachableTypeEnum = pgEnum("attachable_type", [
  "PROJECT",
  "TASK",
  "COMMENT",
  "IDEA",
  "ACTION_ITEM"
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "TASK_ASSIGNED",
  "TASK_COMPLETED",
  "TASK_DUE_SOON",
  "TASK_OVERDUE",
  "PROJECT_STATUS_CHANGE",
  "COMMENT_MENTION",
  "COMMENT_REPLY",
  "DEADLINE_APPROACHING",
  "REVIEW_REQUESTED",
  "BUCKET_ASSIGNMENT"
]);

export const meetingTypeEnum = pgEnum("meeting_type", [
  "DAILY_STANDUP",
  "WEEKLY_REVIEW",
  "PROJECT_SYNC",
  "STUDY_REVIEW"
]);

export const actionStatusEnum = pgEnum("action_status", [
  "OPEN",
  "IN_PROGRESS", 
  "COMPLETED",
  "BLOCKED"
]);

export const updateTypeEnum = pgEnum("update_type", [
  "PROGRESS",
  "BLOCKER",
  "MILESTONE",
  "STATUS_CHANGE",
  "GENERAL"
]);

export const teamMemberRoleEnum = pgEnum("team_member_role", [
  "PI",
  "CO_PRINCIPAL_INVESTIGATOR",
  "Data Scientist", 
  "Data Analyst",
  "Regulatory Coordinator",
  "Coordinator",
  "Lab Intern",
  "Summer Intern",
  "Principal Investigator",
  "Clinical Research Coordinator",
  "Staff Coordinator",
  "Fellow",
  "Medical Student",
  "Volunteer Research Assistant",
  "Research Assistant"
]);

// PHASE 4: ORGANIZATION ENUMS
export const customFieldTypeEnum = pgEnum("custom_field_type", [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "DATE",
  "DATETIME",
  "SELECT",
  "MULTISELECT",
  "CHECKBOX",
  "URL",
  "EMAIL"
]);

export const recurrencePatternEnum = pgEnum("recurrence_pattern", [
  "DAILY",
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
  "CUSTOM"
]);

export const ideaCategoryEnum = pgEnum("idea_category", [
  "RESEARCH_PROPOSAL",
  "METHODOLOGY",
  "COLLABORATION",
  "FUNDING_OPPORTUNITY",
  "TOOL_OR_PLATFORM",
  "GENERAL"
]);

export const ideaStatusEnum = pgEnum("idea_status", [
  "BRAINSTORMING",
  "UNDER_REVIEW",
  "APPROVED",
  "IN_DEVELOPMENT",
  "COMPLETED",
  "ON_HOLD",
  "REJECTED"
]);

export const effortLevelEnum = pgEnum("effort_level", [
  "Small",
  "Medium",
  "Large"
]);

export const impactLevelEnum = pgEnum("impact_level", [
  "Low",
  "Medium",
  "High"
]);

export const deadlineTypeEnum = pgEnum("deadline_type", [
  "GRANT_APPLICATION",
  "PAPER_SUBMISSION",
  "ABSTRACT_SUBMISSION",
  "IRB_SUBMISSION",
  "CONFERENCE_DEADLINE",
  "MILESTONE",
  "OTHER"
]);

// Enhanced User model with comprehensive professional information
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  
  // Name fields
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  middleName: varchar("middle_name"),
  name: varchar("name"), // Full display name
  initials: varchar("initials", { length: 10 }), // Auto-generated from names
  
  // Professional info
  role: userRoleEnum("role").default("RESEARCH_ASSISTANT"),
  title: varchar("title"), // Official job title if different from role
  department: varchar("department"), // e.g., "Rush Medical College"
  institution: varchar("institution").default("Rush University Medical Center"),
  
  // Contact & profile
  phone: varchar("phone"),
  profileImageUrl: varchar("profile_image_url"),
  avatar: varchar("avatar"), // Avatar color or image URL
  bio: text("bio"),
  linkedIn: varchar("linkedin_url"),
  orcid: varchar("orcid"), // ORCID identifier for researchers
  
  // Work management
  capacity: decimal("capacity", { precision: 5, scale: 2 }).default("40.00"), // Hours per week
  expertise: text("expertise").array().default(sql`'{}'`), // Array of expertise areas
  skills: text("skills").array().default(sql`'{}'`), // Technical skills (e.g., Python, R, REDCap)
  
  // System fields
  isActive: boolean("is_active").default(true),
  isExternal: boolean("is_external").default(false), // For external collaborators
  lastActive: timestamp("last_active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIndex: index("users_email_idx").on(table.email),
  roleIndex: index("users_role_idx").on(table.role),
  activeIndex: index("users_active_idx").on(table.isActive, table.lastActive),
}));

// Enhanced Lab model with comprehensive information
export const labs = pgTable("labs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // "RICCC" or "RHEDAS"
  fullName: varchar("full_name"), // "Rush Internal Critical Care Collaborative"
  shortName: varchar("short_name").unique(), // Unique short identifier
  description: text("description"),
  
  // Lab details
  department: varchar("department"), // "Internal Medicine - Critical Care"
  building: varchar("building"), // Physical location
  room: varchar("room"), // Room number
  website: varchar("website"), // Lab website URL
  
  // Branding
  logo: varchar("logo"),
  primaryColor: varchar("primary_color").default("#8B5CF6"),
  
  // Configuration
  settings: jsonb("settings"), // Lab-specific settings
  features: text("features").array().default(sql`'{}'`), // Enabled features for this lab
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  shortNameIndex: index("labs_short_name_idx").on(table.shortName),
  activeIndex: index("labs_active_idx").on(table.isActive),
}));

export const buckets = pgTable("buckets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color").default("#3b82f6"),
  icon: varchar("icon").default("folder"),
  position: varchar("position").default("0"), // For kanban column ordering
  isActive: boolean("is_active").default(true),
  labId: varchar("lab_id").notNull().references(() => labs.id),
  createdBy: varchar("created_by").references(() => users.id), // Add ownership field
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const studies = pgTable("studies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  oraNumber: varchar("ora_number"),
  status: studyStatusEnum("status").default("PLANNING"),
  studyType: varchar("study_type"),
  projectType: varchar("project_type").default("study"), // study, rct, ehr_study, ai_llm
  assignees: text("assignees").array(), // Multiple assignees as array
  funding: fundingTypeEnum("funding"),
  fundingSource: varchar("funding_source"),
  externalCollaborators: text("external_collaborators"),
  notes: text("notes"),
  priority: priorityEnum("priority").default("MEDIUM"),
  dueDate: timestamp("due_date"),
  irbSubmissionDate: timestamp("irb_submission_date"),
  irbApprovalDate: timestamp("irb_approval_date"),
  irbStatus: varchar("irb_status").default("PENDING"), // PENDING, SUBMITTED, APPROVED, NEEDS_REVISION
  protocolLink: varchar("protocol_link"),
  dataLink: varchar("data_link"),
  position: varchar("position").default("0"), // For positioning in kanban
  isActive: boolean("is_active").default(true),
  bucketId: varchar("bucket_id").notNull().references(() => buckets.id),
  labId: varchar("lab_id").notNull().references(() => labs.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const studyAssignments = pgTable("study_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studyId: varchar("study_id").notNull().references(() => studies.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  roleInStudy: varchar("role_in_study").default("Researcher"),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export const studyStatusHistory = pgTable("study_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studyId: varchar("study_id").notNull().references(() => studies.id),
  oldStatus: studyStatusEnum("old_status"),
  newStatus: studyStatusEnum("new_status").notNull(),
  notes: text("notes"),
  changedBy: varchar("changed_by").notNull().references(() => users.id),
  changedAt: timestamp("changed_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").default("TODO"),
  priority: priorityEnum("priority").default("MEDIUM"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  studyId: varchar("study_id").references(() => studies.id),
  parentTaskId: varchar("parent_task_id"), // Self-reference without function to avoid circular reference
  position: varchar("position").default("0"), // Order within project
  tags: text("tags").array(),
  estimatedHours: decimal("estimated_hours", { precision: 6, scale: 2 }), // Use Decimal not Float!
  actualHours: decimal("actual_hours", { precision: 6, scale: 2 }),
  completedAt: timestamp("completed_at"),
  completedById: varchar("completed_by_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  dueDate: timestamp("due_date"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ([
  index("task_project_status_position_idx").on(table.studyId, table.status, table.position), // Kanban board queries
  index("task_assignee_status_due_idx").on(table.assigneeId, table.status, table.dueDate) // "My tasks" dashboard
]));

export const standupMeetings = pgTable("standup_meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  labId: varchar("lab_id").notNull().references(() => labs.id),
  meetingDate: timestamp("meeting_date").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(), // For querying by date
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  meetingType: meetingTypeEnum("meeting_type").default("DAILY_STANDUP"),
  recordingUrl: varchar("recording_url"),
  transcript: text("transcript"),
  aiSummary: json("ai_summary"),
  participants: json("participants"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const standupActionItems = pgTable("standup_action_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").references(() => standupMeetings.id),
  studyId: varchar("study_id").references(() => studies.id),
  assigneeId: varchar("assignee_id").references(() => users.id),
  description: text("description").notNull(),
  dueDate: timestamp("due_date"),
  priority: priorityEnum("priority").default("MEDIUM"),
  status: actionStatusEnum("status").default("OPEN"),
  createdFromAI: boolean("created_from_ai").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const studyStatusUpdates = pgTable("study_status_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studyId: varchar("study_id").notNull().references(() => studies.id),
  meetingId: varchar("meeting_id").notNull().references(() => standupMeetings.id),
  updateType: updateTypeEnum("update_type").notNull(),
  content: text("content").notNull(),
  mentionedBy: varchar("mentioned_by"),
  extractedAt: timestamp("extracted_at").defaultNow(),
});

// Enhanced LabMember with role-specific permissions for multi-lab support
export const labMembers = pgTable("lab_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  labId: varchar("lab_id").notNull().references(() => labs.id, { onDelete: "cascade" }),
  
  // Lab-specific role
  labRole: userRoleEnum("lab_role").default("RESEARCH_ASSISTANT"), // Role specific to this lab
  
  // Permissions based on role
  isAdmin: boolean("is_admin").default(false), // Can manage lab settings
  canCreateProjects: boolean("can_create_projects").default(false),
  canAssignTasks: boolean("can_assign_tasks").default(false),
  canViewAllProjects: boolean("can_view_all_projects").default(false),
  canEditAllProjects: boolean("can_edit_all_projects").default(false),
  canManageMembers: boolean("can_manage_members").default(false),
  canApproveIdeas: boolean("can_approve_ideas").default(false),
  canAccessReports: boolean("can_access_reports").default(false),
  
  // Status and dates
  isActive: boolean("is_active").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserLab: index("unique_user_lab").on(table.userId, table.labId),
  labActiveIndex: index("lab_active_idx").on(table.labId, table.isActive),
  userActiveIndex: index("user_active_idx").on(table.userId, table.isActive),
}));

// Team Members table for lab personnel management (keeping for backward compatibility)
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  middleName: varchar("middle_name"),
  initials: varchar("initials", { length: 10 }),
  email: varchar("email"), // Removed unique constraint to allow members in multiple labs
  role: teamMemberRoleEnum("role").notNull(),
  title: varchar("title"), // Job title
  avatarUrl: varchar("avatar_url"), // PNG avatar image URL
  labId: varchar("lab_id").references(() => labs.id),
  position: varchar("position").default("0"), // For ordering in lists
  department: varchar("department"), // Department or group affiliation
  institution: varchar("institution"),
  phoneNumber: varchar("phone_number"),
  capacity: varchar("capacity"), // Work capacity
  bio: text("bio"), // Biography
  linkedIn: varchar("linked_in"), // LinkedIn profile URL
  orcid: varchar("orcid"), // ORCID identifier
  expertise: text("expertise").array(), // Array of expertise areas
  skills: text("skills").array(), // Array of technical skills
  startDate: timestamp("start_date"),
  isActive: boolean("is_active").default(true),
  isExternal: boolean("is_external").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Composite unique constraint for email + lab to prevent duplicates within the same lab
  uniqueEmailLab: index("unique_email_lab").on(table.email, table.labId),
}));

// Team Member Assignments - linking members to studies, tasks, buckets
export const teamMemberAssignments = pgTable("team_member_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").references(() => teamMembers.id),
  studyId: varchar("study_id").references(() => studies.id),
  taskId: varchar("task_id").references(() => tasks.id),
  bucketId: varchar("bucket_id").references(() => buckets.id),
  assignmentType: varchar("assignment_type").notNull(), // lead, collaborator, reviewer
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// Project Members - for better project team management with lab-level security
export const projectMembers = pgTable("project_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => studies.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  labId: varchar("lab_id").notNull().references(() => labs.id), // CRITICAL: Cross-lab access control
  role: varchar("role").default("contributor"), // lead, contributor, advisor
  allocation: decimal("allocation", { precision: 5, scale: 2 }).default("20.00"), // Percentage
  assignedAt: timestamp("assigned_at").defaultNow(),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  uniqueProjectUser: index("unique_project_user").on(table.projectId, table.userId),
  labUserIndex: index("lab_user_idx").on(table.labId, table.userId),
  projectStatusIndex: index("project_members_bucket_status_idx").on(table.projectId) // "My projects"
}));

// Task Assignments - for multiple assignees per task with validation
export const taskAssignments = pgTable("task_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  projectId: varchar("project_id").notNull().references(() => studies.id), // CRITICAL: For validation
  assignedAt: timestamp("assigned_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  uniqueTaskUser: index("unique_task_user").on(table.taskId, table.userId),
  validationIndex: index("user_project_idx").on(table.userId, table.projectId)
}));

// Ideas Board - for lab brainstorming and innovation tracking
export const ideas = pgTable("ideas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  category: ideaCategoryEnum("category").default("GENERAL"),
  status: ideaStatusEnum("status").default("BRAINSTORMING"),
  priority: priorityEnum("priority").default("MEDIUM"),
  tags: text("tags").array(),
  proposedBy: varchar("proposed_by").references(() => teamMembers.id),
  labId: varchar("lab_id").notNull().references(() => labs.id),
  estimatedEffort: effortLevelEnum("estimated_effort"),
  potentialImpact: impactLevelEnum("potential_impact"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deadlines - for grant, paper, and submission tracking
export const deadlines = pgTable("deadlines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  type: deadlineTypeEnum("type").notNull(),
  dueDate: timestamp("due_date").notNull(),
  priority: priorityEnum("priority").default("MEDIUM"),
  status: varchar("status").default("PENDING"), // PENDING, IN_PROGRESS, COMPLETED, MISSED
  assignedTo: varchar("assigned_to").references(() => teamMembers.id),
  labId: varchar("lab_id").notNull().references(() => labs.id),
  relatedStudyId: varchar("related_study_id").references(() => studies.id),
  submissionUrl: varchar("submission_url"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => teamMembers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Study Milestones - for tracking study progress milestones
export const studyMilestones = pgTable("study_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studyId: varchar("study_id").notNull().references(() => studies.id),
  name: varchar("name").notNull(),
  description: text("description"),
  targetDate: timestamp("target_date").notNull(),
  completedDate: timestamp("completed_date"),
  status: varchar("status").default("PENDING"), // PENDING, IN_PROGRESS, COMPLETED, DELAYED
  priority: priorityEnum("priority").default("MEDIUM"),
  progress: decimal("progress", { precision: 5, scale: 2 }).default("0.00"), // Percentage completed
  assignedTo: varchar("assigned_to").references(() => users.id),
  dependencies: text("dependencies").array(), // Array of milestone IDs this depends on
  deliverables: text("deliverables").array(), // Expected deliverables
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  studyTargetDateIndex: index("study_milestones_study_target_idx").on(table.studyId, table.targetDate),
  statusIndex: index("study_milestones_status_idx").on(table.status, table.targetDate)
}));

// PHASE 1: CRITICAL SECURITY MODELS

// Bucket Members - for bucket-level team membership and permissions
export const bucketMembers = pgTable("bucket_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bucketId: varchar("bucket_id").notNull().references(() => buckets.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: memberRoleEnum("role").default("INFORMED"),
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  uniqueBucketUser: index("unique_bucket_user").on(table.bucketId, table.userId),
  userRoleIndex: index("user_role_idx").on(table.userId, table.role)
}));

// Comments - Unified comment system for all entities
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  entityType: commentableTypeEnum("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  parentId: varchar("parent_id"),
  authorId: varchar("author_id").notNull().references(() => users.id),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  entityIndex: index("entity_idx").on(table.entityType, table.entityId, table.createdAt),
  authorIndex: index("author_idx").on(table.authorId, table.createdAt),
  parentRef: index("parent_ref").on(table.parentId)
}));

// Attachments - File attachment system for all entities
export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: varchar("filename").notNull(),
  url: varchar("url").notNull(), // Object storage URL
  fileSize: varchar("file_size").notNull(), // in bytes as string for large files
  mimeType: varchar("mime_type").notNull(),
  entityType: attachableTypeEnum("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  uploadedById: varchar("uploaded_by_id").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  isDeleted: boolean("is_deleted").default(false),
}, (table) => ({
  entityIndex: index("attachment_entity_idx").on(table.entityType, table.entityId),
  uploaderIndex: index("uploader_idx").on(table.uploadedById, table.uploadedAt)
}));

// Notifications - Global notification system
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  entityType: varchar("entity_type"),
  entityId: varchar("entity_id"),
  metadata: json("metadata"), // Additional context
  read: boolean("read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userReadIndex: index("user_read_idx").on(table.userId, table.read, table.createdAt),
  entityIndex: index("notification_entity_idx").on(table.entityType, table.entityId)
}));

// Mentions - For @mentions in comments
export const mentions = pgTable("mentions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  read: boolean("read").default(false),
  readAt: timestamp("read_at"),
}, (table) => ({
  uniqueCommentUser: index("unique_comment_user").on(table.commentId, table.userId)
}));

// PHASE 4: ENHANCED ORGANIZATION MODELS

// First-Class Tag System
export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  labId: varchar("lab_id").notNull().references(() => labs.id),
  color: varchar("color").default("#6B7280"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ([
  index("tags_unique_lab_name").on(table.labId, table.name),
  index("tags_lab_active_idx").on(table.labId, table.isActive)
]));

// Task Tags - Many-to-many relationship
export const taskTags = pgTable("task_tags", {
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  taggedAt: timestamp("tagged_at").defaultNow(),
  taggedById: varchar("tagged_by_id").notNull().references(() => users.id),
}, (table) => ([
  index("task_tag_pk").on(table.taskId, table.tagId)
]));

// Project Tags - Many-to-many relationship
export const projectTags = pgTable("project_tags", {
  projectId: varchar("project_id").notNull().references(() => studies.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  taggedAt: timestamp("tagged_at").defaultNow(),
  taggedById: varchar("tagged_by_id").notNull().references(() => users.id),
}, (table) => ([
  index("project_tag_pk").on(table.projectId, table.tagId)
]));

// Custom Fields for Flexibility
export const customFields = pgTable("custom_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  labId: varchar("lab_id").notNull().references(() => labs.id),
  entityType: varchar("entity_type").notNull(), // 'project'|'task'|'idea'
  fieldName: varchar("field_name").notNull(),
  fieldLabel: varchar("field_label").notNull(), // Display name
  fieldType: customFieldTypeEnum("field_type").notNull(),
  options: json("options"), // For select/multiselect
  validation: json("validation"), // Min/max, regex, etc.
  required: boolean("required").default(false),
  position: varchar("position").default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ([
  index("unique_lab_entity_field").on(table.labId, table.entityType, table.fieldName),
  index("lab_entity_active_idx").on(table.labId, table.entityType, table.isActive)
]));

// Custom Field Values
export const customFieldValues = pgTable("custom_field_values", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fieldId: varchar("field_id").notNull().references(() => customFields.id, { onDelete: "cascade" }),
  entityId: varchar("entity_id").notNull(),
  value: json("value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ([
  index("unique_field_entity_values").on(table.fieldId, table.entityId),
  index("entity_values_idx").on(table.entityId)
]));

// Task Templates for Automation
export const taskTemplates = pgTable("task_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  labId: varchar("lab_id").notNull().references(() => labs.id),
  name: varchar("name").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  estimatedHours: varchar("estimated_hours"), // Store as string for decimal precision
  tags: text("tags").array(), // Template tags to apply
  customFields: json("custom_fields"), // Template custom field values
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ([
  index("unique_lab_template_name").on(table.labId, table.name)
]));

// Recurring Tasks
export const recurringTasks = pgTable("recurring_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").unique().references(() => tasks.id, { onDelete: "cascade" }),
  templateId: varchar("template_id").references(() => taskTemplates.id), // Optional link to template
  pattern: recurrencePatternEnum("pattern").notNull(),
  interval: varchar("interval").default("1"), // Every X periods
  dayOfWeek: varchar("day_of_week"), // 0-6 for weekly
  dayOfMonth: varchar("day_of_month"), // 1-31 for monthly
  customCron: varchar("custom_cron"), // For complex patterns
  nextDueDate: timestamp("next_due_date").notNull(),
  lastCreated: timestamp("last_created"),
  endDate: timestamp("end_date"),
  maxOccurrences: varchar("max_occurrences"),
  occurrenceCount: varchar("occurrence_count").default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ([
  index("next_due_active_idx").on(table.nextDueDate, table.isActive)
]));

// User Preferences System
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").unique().notNull().references(() => users.id),
  // Notifications
  emailNotifications: boolean("email_notifications").default(true),
  emailDigestFrequency: varchar("email_digest_frequency").default("daily"), // none|daily|weekly
  pushNotifications: boolean("push_notifications").default(true),
  // UI Preferences
  theme: varchar("theme").default("dark"), // light|dark|auto
  dashboardLayout: json("dashboard_layout"),
  defaultLabId: varchar("default_lab_id").references(() => labs.id),
  defaultView: varchar("default_view").default("kanban"), // kanban|list|calendar|gantt
  // Regional
  timezone: varchar("timezone").default("America/Chicago"),
  dateFormat: varchar("date_format").default("MM/DD/YYYY"),
  timeFormat: varchar("time_format").default("12h"), // 12h|24h
  weekStartsOn: varchar("week_starts_on").default("0"), // 0=Sunday
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// PHASE 3: PROJECT MANAGEMENT MODELS

// Status History - Complete audit trail for all status changes
export const statusHistory = pgTable("status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull(), // 'project' | 'task'
  entityId: varchar("entity_id").notNull(),
  fromStatus: varchar("from_status"), // null for initial status
  toStatus: varchar("to_status").notNull(),
  reason: text("reason"), // Optional change reason
  changedById: varchar("changed_by_id").notNull().references(() => users.id),
  changedAt: timestamp("changed_at").defaultNow(),
}, (table) => ({
  entityIndex: index("status_entity_idx").on(table.entityType, table.entityId, table.changedAt),
  changerIndex: index("status_changer_idx").on(table.changedById, table.changedAt)
}));

// Time Entries - Precise time tracking for grant reporting
export const timeEntries = pgTable("time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  projectId: varchar("project_id").notNull().references(() => studies.id), // Denormalized for queries
  hours: decimal("hours", { precision: 5, scale: 2 }).notNull(), // Use Decimal not string!
  description: text("description"),
  date: timestamp("date").notNull(),
  billable: boolean("billable").default(true), // For grant reporting
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userDateIndex: index("time_user_date_idx").on(table.userId, table.date),
  projectDateIndex: index("time_project_date_idx").on(table.projectId, table.date),
  taskUserDateIndex: index("time_task_user_date_idx").on(table.taskId, table.userId, table.date)
}));

// Role-based permission matrix helper for comprehensive access control
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: userRoleEnum("role").notNull(),
  permission: varchar("permission").notNull(), // e.g., "create_project", "approve_irb", "manage_budget"
  labId: varchar("lab_id").references(() => labs.id), // Optional: lab-specific permissions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueRolePermissionLab: index("unique_role_permission_lab").on(table.role, table.permission, table.labId),
  roleIndex: index("role_permissions_role_idx").on(table.role),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  // Multi-lab support via labMembers instead of direct lab reference
  labMemberships: many(labMembers),
  createdStudies: many(studies),
  assignments: many(studyAssignments),
  createdMeetings: many(standupMeetings),
  assignedActionItems: many(standupActionItems),
  statusChanges: many(studyStatusHistory),
  assignedTasks: many(tasks),
  // Phase 1 relations
  bucketMembers: many(bucketMembers),
  comments: many(comments),
  mentions: many(mentions),
  notifications: many(notifications),
  attachments: many(attachments),
  taskAssignments: many(taskAssignments),
  projectMemberships: many(projectMembers),
  // Phase 3 relations
  auditHistory: many(statusHistory),
  timeEntries: many(timeEntries),
  // Phase 4 relations
  taggedTasks: many(taskTags),
  taggedProjects: many(projectTags),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
}));

// LabMember relations for multi-lab support
export const labMembersRelations = relations(labMembers, ({ one }) => ({
  user: one(users, {
    fields: [labMembers.userId],
    references: [users.id],
  }),
  lab: one(labs, {
    fields: [labMembers.labId],
    references: [labs.id],
  }),
}));

export const labsRelations = relations(labs, ({ many }) => ({
  // Multi-lab support via labMembers instead of direct user reference
  labMemberships: many(labMembers),
  buckets: many(buckets),
  studies: many(studies),
  standupMeetings: many(standupMeetings),
  teamMembers: many(teamMembers),
  ideas: many(ideas),
  deadlines: many(deadlines),
  // Phase 4 relations
  tags: many(tags),
  customFields: many(customFields),
  taskTemplates: many(taskTemplates),
}));

export const bucketsRelations = relations(buckets, ({ one, many }) => ({
  lab: one(labs, {
    fields: [buckets.labId],
    references: [labs.id],
  }),
  studies: many(studies),
  members: many(bucketMembers),
}));

export const studiesRelations = relations(studies, ({ one, many }) => ({
  bucket: one(buckets, {
    fields: [studies.bucketId],
    references: [buckets.id],
  }),
  lab: one(labs, {
    fields: [studies.labId],
    references: [labs.id],
  }),
  creator: one(users, {
    fields: [studies.createdBy],
    references: [users.id],
  }),
  assignments: many(studyAssignments),
  statusHistory: many(studyStatusHistory),
  actionItems: many(standupActionItems),
  statusUpdates: many(studyStatusUpdates),
  tasks: many(tasks),
  members: many(projectMembers),
  // Phase 4 relations
  projectTags: many(projectTags),
}));

export const studyAssignmentsRelations = relations(studyAssignments, ({ one }) => ({
  study: one(studies, {
    fields: [studyAssignments.studyId],
    references: [studies.id],
  }),
  user: one(users, {
    fields: [studyAssignments.userId],
    references: [users.id],
  }),
}));

export const standupMeetingsRelations = relations(standupMeetings, ({ one, many }) => ({
  lab: one(labs, {
    fields: [standupMeetings.labId],
    references: [labs.id],
  }),
  creator: one(users, {
    fields: [standupMeetings.createdBy],
    references: [users.id],
  }),
  actionItems: many(standupActionItems),
  studyUpdates: many(studyStatusUpdates),
}));

export const standupActionItemsRelations = relations(standupActionItems, ({ one }) => ({
  meeting: one(standupMeetings, {
    fields: [standupActionItems.meetingId],
    references: [standupMeetings.id],
  }),
  study: one(studies, {
    fields: [standupActionItems.studyId],
    references: [studies.id],
  }),
  assignee: one(users, {
    fields: [standupActionItems.assigneeId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  study: one(studies, {
    fields: [tasks.studyId],
    references: [studies.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: "TaskSubtasks",
  }),
  subtasks: many(tasks, {
    relationName: "TaskSubtasks",
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
  }),
  completedBy: one(users, {
    fields: [tasks.completedById],
    references: [users.id],
  }),
  assignments: many(taskAssignments),
  // Phase 4 relations
  taskTags: many(taskTags),
  recurringTask: one(recurringTasks, {
    fields: [tasks.id],
    references: [recurringTasks.taskId],
  }),
}));

// Insert schemas (removing duplicates to avoid conflicts)

export const insertStudySchema = createInsertSchema(studies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStandupMeetingSchema = createInsertSchema(standupMeetings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBucketSchema = createInsertSchema(buckets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActionItemSchema = createInsertSchema(standupActionItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Moved to consolidated schema section below

export const insertTeamMemberAssignmentSchema = createInsertSchema(teamMemberAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertIdeaSchema = createInsertSchema(ideas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeadlineSchema = createInsertSchema(deadlines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectMemberSchema = createInsertSchema(projectMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertTaskAssignmentSchema = createInsertSchema(taskAssignments).omit({
  id: true,
  assignedAt: true,
});

// PHASE 1: NEW INSERT SCHEMAS

export const insertBucketMemberSchema = createInsertSchema(bucketMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  uploadedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertMentionSchema = createInsertSchema(mentions).omit({
  id: true,
});

// PHASE 3: PROJECT MANAGEMENT INSERT SCHEMAS

export const insertStatusHistorySchema = createInsertSchema(statusHistory).omit({
  id: true,
  changedAt: true,
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// PHASE 4: ENHANCED ORGANIZATION INSERT SCHEMAS
export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskTagSchema = createInsertSchema(taskTags);

export const insertProjectTagSchema = createInsertSchema(projectTags);

export const insertCustomFieldSchema = createInsertSchema(customFields).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomFieldValueSchema = createInsertSchema(customFieldValues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecurringTaskSchema = createInsertSchema(recurringTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Team member relations
export const teamMembersRelations = relations(teamMembers, ({ one, many }) => ({
  lab: one(labs, {
    fields: [teamMembers.labId],
    references: [labs.id],
  }),
  assignments: many(teamMemberAssignments),
}));

export const teamMemberAssignmentsRelations = relations(teamMemberAssignments, ({ one }) => ({
  member: one(teamMembers, {
    fields: [teamMemberAssignments.memberId],
    references: [teamMembers.id],
  }),
  study: one(studies, {
    fields: [teamMemberAssignments.studyId],
    references: [studies.id],
  }),
  task: one(tasks, {
    fields: [teamMemberAssignments.taskId],
    references: [tasks.id],
  }),
  bucket: one(buckets, {
    fields: [teamMemberAssignments.bucketId],
    references: [buckets.id],
  }),
}));

// Ideas relations
export const ideasRelations = relations(ideas, ({ one }) => ({
  lab: one(labs, {
    fields: [ideas.labId],
    references: [labs.id],
  }),
  proposer: one(teamMembers, {
    fields: [ideas.proposedBy],
    references: [teamMembers.id],
  }),
}));

// Deadlines relations
export const deadlinesRelations = relations(deadlines, ({ one }) => ({
  lab: one(labs, {
    fields: [deadlines.labId],
    references: [labs.id],
  }),
  assignee: one(teamMembers, {
    fields: [deadlines.assignedTo],
    references: [teamMembers.id],
  }),
  relatedStudy: one(studies, {
    fields: [deadlines.relatedStudyId],
    references: [studies.id],
  }),
  creator: one(teamMembers, {
    fields: [deadlines.createdBy],
    references: [teamMembers.id],
  }),
}));

// Types
// Enhanced Type Definitions for World-Class CRUD System
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Lab types
export type InsertLab = typeof labs.$inferInsert;
export type Lab = typeof labs.$inferSelect;

// LabMember types for multi-lab support
export type InsertLabMember = typeof labMembers.$inferInsert;
export type LabMember = typeof labMembers.$inferSelect;

// Team member types (backward compatibility)
export type InsertTeamMember = typeof teamMembers.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;

// Role permission types
export type InsertRolePermission = typeof rolePermissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;

// Enhanced insert schemas with Zod validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLabSchema = createInsertSchema(labs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLabMemberSchema = createInsertSchema(labMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true, 
  updatedAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Additional core types
export type Bucket = typeof buckets.$inferSelect;
export type Study = typeof studies.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type StandupMeeting = typeof standupMeetings.$inferSelect;
export type ActionItem = typeof standupActionItems.$inferSelect;
export type TeamMemberAssignment = typeof teamMemberAssignments.$inferSelect;
export type InsertTeamMemberAssignment = z.infer<typeof insertTeamMemberAssignmentSchema>;
export type Idea = typeof ideas.$inferSelect;
export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type Deadline = typeof deadlines.$inferSelect;
export type InsertDeadline = z.infer<typeof insertDeadlineSchema>;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;
export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = z.infer<typeof insertTaskAssignmentSchema>;

// Additional insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudy = z.infer<typeof insertStudySchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertBucket = z.infer<typeof insertBucketSchema>;
export type InsertStandupMeeting = z.infer<typeof insertStandupMeetingSchema>;
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;

// PHASE 1: NEW TYPES
export type BucketMember = typeof bucketMembers.$inferSelect;
export type InsertBucketMember = z.infer<typeof insertBucketMemberSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Mention = typeof mentions.$inferSelect;
export type InsertMention = z.infer<typeof insertMentionSchema>;

// PHASE 3: PROJECT MANAGEMENT TYPES
export type StatusHistory = typeof statusHistory.$inferSelect;
export type InsertStatusHistory = z.infer<typeof insertStatusHistorySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

// PHASE 4: ENHANCED ORGANIZATION TYPES
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type TaskTag = typeof taskTags.$inferSelect;
export type InsertTaskTag = z.infer<typeof insertTaskTagSchema>;
export type ProjectTag = typeof projectTags.$inferSelect;
export type InsertProjectTag = z.infer<typeof insertProjectTagSchema>;
export type CustomField = typeof customFields.$inferSelect;
export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;
export type CustomFieldValue = typeof customFieldValues.$inferSelect;
export type InsertCustomFieldValue = z.infer<typeof insertCustomFieldValueSchema>;
export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;
export type RecurringTask = typeof recurringTasks.$inferSelect;
export type InsertRecurringTask = z.infer<typeof insertRecurringTaskSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

// Project Members relations - Enhanced with lab security
export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(studies, {
    fields: [projectMembers.projectId],
    references: [studies.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
  lab: one(labs, {
    fields: [projectMembers.labId],
    references: [labs.id],
  }),
}));

// Task Assignments relations - Enhanced with project validation
export const taskAssignmentsRelations = relations(taskAssignments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskAssignments.userId],
    references: [users.id],
  }),
  project: one(studies, {
    fields: [taskAssignments.projectId],
    references: [studies.id],
  }),
}));

// PHASE 1: NEW RELATIONS

// Bucket Members relations
export const bucketMembersRelations = relations(bucketMembers, ({ one }) => ({
  bucket: one(buckets, {
    fields: [bucketMembers.bucketId],
    references: [buckets.id],
  }),
  user: one(users, {
    fields: [bucketMembers.userId],
    references: [users.id],
  }),
}));

// Comments relations
export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "CommentThread",
  }),
  replies: many(comments, {
    relationName: "CommentThread",
  }),
  mentions: many(mentions),
  attachments: many(attachments),
}));

// Attachments relations
export const attachmentsRelations = relations(attachments, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [attachments.uploadedById],
    references: [users.id],
  }),
}));

// Notifications relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Mentions relations
export const mentionsRelations = relations(mentions, ({ one }) => ({
  comment: one(comments, {
    fields: [mentions.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [mentions.userId],
    references: [users.id],
  }),
}));

// PHASE 3: PROJECT MANAGEMENT RELATIONS

// Status History relations
export const statusHistoryRelations = relations(statusHistory, ({ one }) => ({
  changedBy: one(users, {
    fields: [statusHistory.changedById],
    references: [users.id],
  }),
}));

// Time Entry relations
export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  task: one(tasks, {
    fields: [timeEntries.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
  project: one(studies, {
    fields: [timeEntries.projectId],
    references: [studies.id],
  }),
}));

// =============================================================================
// PHASE 5: ADVANCED AUTOMATION FEATURES
// =============================================================================

// Automation trigger types
export const automationTriggerTypeEnum = pgEnum("automation_trigger_type", [
  "TASK_CREATED",
  "TASK_COMPLETED", 
  "TASK_OVERDUE",
  "TASK_ASSIGNED",
  "PROJECT_STATUS_CHANGE",
  "DEADLINE_APPROACHING",
  "RECURRING_SCHEDULE",
  "CUSTOM_EVENT",
  "TIME_BASED",
  "WEBHOOK"
]);

// Automation action types
export const automationActionTypeEnum = pgEnum("automation_action_type", [
  "CREATE_TASK",
  "ASSIGN_TASK",
  "UPDATE_STATUS",
  "SEND_NOTIFICATION",
  "CREATE_PROJECT",
  "ADD_TAG",
  "SET_PRIORITY",
  "SCHEDULE_REMINDER",
  "WEBHOOK_CALL",
  "CUSTOM_SCRIPT"
]);

// Workflow execution status
export const workflowStatusEnum = pgEnum("workflow_status", [
  "ACTIVE",
  "PAUSED",
  "DISABLED",
  "DRAFT"
]);

// Execution status
export const executionStatusEnum = pgEnum("execution_status", [
  "SUCCESS",
  "FAILED",
  "PENDING",
  "CANCELLED",
  "PARTIAL_SUCCESS"
]);

// Workflow Triggers - Define when automation should run
export const workflowTriggers = pgTable(
  "workflow_triggers",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    labId: varchar("lab_id").notNull().references(() => labs.id),
    name: varchar("name").notNull(),
    description: text("description"),
    triggerType: automationTriggerTypeEnum("trigger_type").notNull(),
    conditions: json("conditions"), // JSON conditions for trigger matching
    isActive: boolean("is_active").default(true),
    createdById: varchar("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("workflow_triggers_lab_idx").on(table.labId),
    index("workflow_triggers_type_idx").on(table.triggerType),
    index("workflow_triggers_active_idx").on(table.isActive),
  ]
);

// Automation Rules - Define what actions to take when triggers fire
export const automationRules = pgTable(
  "automation_rules",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    labId: varchar("lab_id").notNull().references(() => labs.id),
    triggerId: varchar("trigger_id").notNull().references(() => workflowTriggers.id, { onDelete: "cascade" }),
    name: varchar("name").notNull(),
    description: text("description"),
    actionType: automationActionTypeEnum("action_type").notNull(),
    actionConfig: json("action_config").notNull(), // Configuration for the action
    priority: varchar("priority").default("MEDIUM"), // HIGH, MEDIUM, LOW
    delayMinutes: varchar("delay_minutes").default("0"), // Delay before execution
    conditions: json("conditions"), // Additional conditions for rule execution
    isActive: boolean("is_active").default(true),
    createdById: varchar("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("automation_rules_lab_idx").on(table.labId),
    index("automation_rules_trigger_idx").on(table.triggerId),
    index("automation_rules_active_idx").on(table.isActive),
    index("automation_rules_priority_idx").on(table.priority),
  ]
);

// Workflow Executions - History of automation rule executions
export const workflowExecutions = pgTable(
  "workflow_executions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ruleId: varchar("rule_id").notNull().references(() => automationRules.id),
    triggerId: varchar("trigger_id").notNull().references(() => workflowTriggers.id),
    status: executionStatusEnum("status").notNull(),
    startedAt: timestamp("started_at").defaultNow(),
    completedAt: timestamp("completed_at"),
    error: text("error"), // Error message if execution failed
    executionLog: json("execution_log"), // Detailed execution information
    triggeredBy: varchar("triggered_by"), // What caused the trigger (user ID, system event, etc.)
    affectedEntities: json("affected_entities"), // List of entities created/modified
  },
  (table) => [
    index("workflow_executions_rule_idx").on(table.ruleId),
    index("workflow_executions_status_idx").on(table.status),
    index("workflow_executions_started_idx").on(table.startedAt),
  ]
);

// Task Generation Logs - Track automated task creation
export const taskGenerationLogs = pgTable(
  "task_generation_logs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    executionId: varchar("execution_id").notNull().references(() => workflowExecutions.id),
    taskId: varchar("task_id").references(() => tasks.id), // Null if task creation failed
    templateId: varchar("template_id").references(() => taskTemplates.id),
    projectId: varchar("project_id").references(() => studies.id),
    generationType: varchar("generation_type").notNull(), // TEMPLATE, RECURRING, WORKFLOW
    success: boolean("success").notNull(),
    errorMessage: text("error_message"),
    generatedAt: timestamp("generated_at").defaultNow(),
    metadata: json("metadata"), // Additional generation context
  },
  (table) => [
    index("task_generation_execution_idx").on(table.executionId),
    index("task_generation_task_idx").on(table.taskId),
    index("task_generation_type_idx").on(table.generationType),
    index("task_generation_date_idx").on(table.generatedAt),
  ]
);

// Automated Schedules - Manage recurring workflows and intelligent scheduling
export const automatedSchedules = pgTable(
  "automated_schedules",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    labId: varchar("lab_id").notNull().references(() => labs.id),
    name: varchar("name").notNull(),
    description: text("description"),
    scheduleType: varchar("schedule_type").notNull(), // CRON, RECURRING, SMART
    cronExpression: varchar("cron_expression"), // Standard cron expression
    recurringPattern: json("recurring_pattern"), // For recurring schedules
    smartConfig: json("smart_config"), // For intelligent scheduling
    triggerId: varchar("trigger_id").references(() => workflowTriggers.id),
    nextRunTime: timestamp("next_run_time"),
    lastRunTime: timestamp("last_run_time"),
    runCount: varchar("run_count").default("0"),
    maxRuns: varchar("max_runs"), // Optional limit on executions
    isActive: boolean("is_active").default(true),
    createdById: varchar("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("automated_schedules_lab_idx").on(table.labId),
    index("automated_schedules_next_run_idx").on(table.nextRunTime),
    index("automated_schedules_active_idx").on(table.isActive),
    index("automated_schedules_type_idx").on(table.scheduleType),
  ]
);

// Workflow Templates - Reusable workflow configurations
export const workflowTemplates = pgTable(
  "workflow_templates",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    labId: varchar("lab_id").notNull().references(() => labs.id),
    name: varchar("name").notNull(),
    description: text("description"),
    category: varchar("category"), // PROJECT_MANAGEMENT, COMPLIANCE, NOTIFICATIONS, etc.
    triggerTemplate: json("trigger_template"), // Template for trigger configuration
    ruleTemplates: json("rule_templates"), // Templates for automation rules
    variables: json("variables"), // Template variables for customization
    isPublic: boolean("is_public").default(false), // Can be used by other labs
    usageCount: varchar("usage_count").default("0"),
    rating: varchar("rating"), // Average user rating
    createdById: varchar("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("workflow_templates_lab_idx").on(table.labId),
    index("workflow_templates_category_idx").on(table.category),
    index("workflow_templates_public_idx").on(table.isPublic),
    index("workflow_templates_usage_idx").on(table.usageCount),
  ]
);

// Type exports for Phase 5
export type WorkflowTrigger = typeof workflowTriggers.$inferSelect;
export type InsertWorkflowTrigger = typeof workflowTriggers.$inferInsert;
export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = typeof automationRules.$inferInsert;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = typeof workflowExecutions.$inferInsert;
export type TaskGenerationLog = typeof taskGenerationLogs.$inferSelect;
export type InsertTaskGenerationLog = typeof taskGenerationLogs.$inferInsert;
export type AutomatedSchedule = typeof automatedSchedules.$inferSelect;
export type InsertAutomatedSchedule = typeof automatedSchedules.$inferInsert;
export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type InsertWorkflowTemplate = typeof workflowTemplates.$inferInsert;

// Zod schemas for Phase 5
export const insertWorkflowTriggerSchema = createInsertSchema(workflowTriggers);
export const insertAutomationRuleSchema = createInsertSchema(automationRules);
export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions);
export const insertTaskGenerationLogSchema = createInsertSchema(taskGenerationLogs);
export const insertAutomatedScheduleSchema = createInsertSchema(automatedSchedules);
export const insertWorkflowTemplateSchema = createInsertSchema(workflowTemplates);

// =============================================================================
// PHASE 5: AUTOMATION RELATIONS
// =============================================================================

// Workflow Trigger relations
export const workflowTriggersRelations = relations(workflowTriggers, ({ one, many }) => ({
  lab: one(labs, {
    fields: [workflowTriggers.labId],
    references: [labs.id],
  }),
  createdBy: one(users, {
    fields: [workflowTriggers.createdById],
    references: [users.id],
  }),
  rules: many(automationRules),
  executions: many(workflowExecutions),
  schedules: many(automatedSchedules),
}));

// Automation Rule relations
export const automationRulesRelations = relations(automationRules, ({ one, many }) => ({
  lab: one(labs, {
    fields: [automationRules.labId],
    references: [labs.id],
  }),
  trigger: one(workflowTriggers, {
    fields: [automationRules.triggerId],
    references: [workflowTriggers.id],
  }),
  createdBy: one(users, {
    fields: [automationRules.createdById],
    references: [users.id],
  }),
  executions: many(workflowExecutions),
}));

// Workflow Execution relations
export const workflowExecutionsRelations = relations(workflowExecutions, ({ one, many }) => ({
  rule: one(automationRules, {
    fields: [workflowExecutions.ruleId],
    references: [automationRules.id],
  }),
  trigger: one(workflowTriggers, {
    fields: [workflowExecutions.triggerId],
    references: [workflowTriggers.id],
  }),
  taskGenerations: many(taskGenerationLogs),
}));

// Task Generation Log relations
export const taskGenerationLogsRelations = relations(taskGenerationLogs, ({ one }) => ({
  execution: one(workflowExecutions, {
    fields: [taskGenerationLogs.executionId],
    references: [workflowExecutions.id],
  }),
  task: one(tasks, {
    fields: [taskGenerationLogs.taskId],
    references: [tasks.id],
  }),
  template: one(taskTemplates, {
    fields: [taskGenerationLogs.templateId],
    references: [taskTemplates.id],
  }),
  project: one(studies, {
    fields: [taskGenerationLogs.projectId],
    references: [studies.id],
  }),
}));

// Automated Schedule relations
export const automatedSchedulesRelations = relations(automatedSchedules, ({ one }) => ({
  lab: one(labs, {
    fields: [automatedSchedules.labId],
    references: [labs.id],
  }),
  trigger: one(workflowTriggers, {
    fields: [automatedSchedules.triggerId],
    references: [workflowTriggers.id],
  }),
  createdBy: one(users, {
    fields: [automatedSchedules.createdById],
    references: [users.id],
  }),
}));

// Workflow Template relations
export const workflowTemplatesRelations = relations(workflowTemplates, ({ one }) => ({
  lab: one(labs, {
    fields: [workflowTemplates.labId],
    references: [labs.id],
  }),
  createdBy: one(users, {
    fields: [workflowTemplates.createdById],
    references: [users.id],
  }),
}));
