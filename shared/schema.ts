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

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "PI",
  "RESEARCH_COORDINATOR", 
  "DATA_ANALYST",
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
  "Data Scientist", 
  "Data Analyst",
  "Regulatory Coordinator",
  "Coordinator",
  "Lab Intern",
  "Summer Intern"
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

export const deadlineTypeEnum = pgEnum("deadline_type", [
  "GRANT_APPLICATION",
  "PAPER_SUBMISSION",
  "ABSTRACT_SUBMISSION",
  "IRB_SUBMISSION",
  "CONFERENCE_DEADLINE",
  "MILESTONE",
  "OTHER"
]);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  name: varchar("name"),
  role: userRoleEnum("role").default("RESEARCHER"),
  phone: varchar("phone"),
  isActive: boolean("is_active").default(true),
  labId: varchar("lab_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const labs = pgTable("labs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  piName: varchar("pi_name"),
  color: varchar("color").default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const buckets = pgTable("buckets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color").default("#3b82f6"),
  icon: varchar("icon").default("folder"),
  position: varchar("position").default("0"), // For kanban column ordering
  isActive: boolean("is_active").default(true),
  labId: varchar("lab_id").notNull().references(() => labs.id),
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
  parentTaskId: varchar("parent_task_id").references(() => tasks.id), // For subtasks
  position: varchar("position").default("0"), // Order within project
  tags: text("tags").array(),
  completedAt: timestamp("completed_at"),
  completedById: varchar("completed_by_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  dueDate: timestamp("due_date"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

// Team Members table for lab personnel management  
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  initials: varchar("initials", { length: 10 }),
  email: varchar("email").unique(),
  role: teamMemberRoleEnum("role").notNull(),
  avatarUrl: varchar("avatar_url"), // PNG avatar image URL
  labId: varchar("lab_id").references(() => labs.id),
  position: varchar("position").default("0"), // For ordering in lists
  department: varchar("department"), // Department or group affiliation
  phoneNumber: varchar("phone_number"),
  startDate: timestamp("start_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

// Project Members - for better project team management
export const projectMembers = pgTable("project_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => studies.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").default("contributor"), // lead, contributor, advisor
  assignedAt: timestamp("assigned_at").defaultNow(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Task Assignments - for multiple assignees per task
export const taskAssignments = pgTable("task_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

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
  estimatedEffort: varchar("estimated_effort"), // Small, Medium, Large
  potentialImpact: varchar("potential_impact"), // Low, Medium, High
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

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  lab: one(labs, {
    fields: [users.labId],
    references: [labs.id],
  }),
  createdStudies: many(studies),
  assignments: many(studyAssignments),
  createdMeetings: many(standupMeetings),
  assignedActionItems: many(standupActionItems),
  statusChanges: many(studyStatusHistory),
  assignedTasks: many(tasks),
}));

export const labsRelations = relations(labs, ({ many }) => ({
  members: many(users),
  buckets: many(buckets),
  studies: many(studies),
  standupMeetings: many(standupMeetings),
  teamMembers: many(teamMembers),
  ideas: many(ideas),
  deadlines: many(deadlines),
}));

export const bucketsRelations = relations(buckets, ({ one, many }) => ({
  lab: one(labs, {
    fields: [buckets.labId],
    references: [labs.id],
  }),
  studies: many(studies),
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
}));

// Insert schemas
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

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Lab = typeof labs.$inferSelect;
export type InsertLab = z.infer<typeof insertLabSchema>;
export type Bucket = typeof buckets.$inferSelect;
export type InsertBucket = z.infer<typeof insertBucketSchema>;
export type Study = typeof studies.$inferSelect;
export type InsertStudy = z.infer<typeof insertStudySchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type StandupMeeting = typeof standupMeetings.$inferSelect;
export type InsertStandupMeeting = z.infer<typeof insertStandupMeetingSchema>;
export type ActionItem = typeof standupActionItems.$inferSelect;
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
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

// Project Members relations
export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(studies, {
    fields: [projectMembers.projectId],
    references: [studies.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

// Task Assignments relations
export const taskAssignmentsRelations = relations(taskAssignments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskAssignments.userId],
    references: [users.id],
  }),
}));
