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
  color: varchar("color").default("#3b82f6"),
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
  assignee: varchar("assignee"),
  funding: fundingTypeEnum("funding"),
  externalCollaborators: text("external_collaborators"),
  notes: text("notes"),
  priority: priorityEnum("priority").default("MEDIUM"),
  dueDate: timestamp("due_date"),
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
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const standupMeetings = pgTable("standup_meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  labId: varchar("lab_id").notNull().references(() => labs.id),
  meetingDate: timestamp("meeting_date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  meetingType: meetingTypeEnum("meeting_type").default("DAILY_STANDUP"),
  recordingUrl: varchar("recording_url"),
  transcript: text("transcript"),
  aiSummary: json("ai_summary"),
  participants: json("participants"),
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

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  study: one(studies, {
    fields: [tasks.studyId],
    references: [studies.id],
  }),
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
