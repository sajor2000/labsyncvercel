import {
  users,
  labs,
  studies,
  tasks,
  buckets,
  standupMeetings,
  standupActionItems,
  teamMembers,
  teamMemberAssignments,
  labMembers,
  projectMembers,
  taskAssignments,
  ideas,
  deadlines,
  bucketMembers,
  comments,
  attachments,
  notifications,
  mentions,
  type User,
  type UpsertUser,
  type Lab,
  type InsertLab,
  type Study,
  type InsertStudy,
  type Task,
  type InsertTask,
  type Bucket,
  type InsertBucket,
  type StandupMeeting,
  type InsertStandupMeeting,
  type ActionItem,
  type InsertActionItem,
  type TeamMember,
  type InsertTeamMember,
  type LabMember,
  type InsertLabMember,
  type TeamMemberAssignment,
  type InsertTeamMemberAssignment,
  type ProjectMember,
  type InsertProjectMember,
  type TaskAssignment,
  type InsertTaskAssignment,
  type Idea,
  type InsertIdea,
  type Deadline,
  type InsertDeadline,
  type BucketMember,
  type InsertBucketMember,
  type Comment,
  type InsertComment,
  type Attachment,
  type InsertAttachment,
  type Notification,
  type InsertNotification,
  type StatusHistory,
  type InsertStatusHistory,
  type TimeEntry,
  type InsertTimeEntry,
  statusHistory,
  timeEntries,
  type Tag,
  type InsertTag,
  type TaskTag,
  type InsertTaskTag,
  type ProjectTag,
  type InsertProjectTag,
  type CustomField,
  type InsertCustomField,
  type CustomFieldValue,
  type InsertCustomFieldValue,
  type TaskTemplate,
  type InsertTaskTemplate,
  type RecurringTask,
  type InsertRecurringTask,
  type UserPreferences,
  type InsertUserPreferences,
  tags,
  taskTags,
  projectTags,
  customFields,
  customFieldValues,
  taskTemplates,
  recurringTasks,
  userPreferences,
  // Phase 5: Automation imports
  workflowTriggers,
  automationRules,
  workflowExecutions,
  taskGenerationLogs,
  automatedSchedules,
  workflowTemplates,
  type WorkflowTrigger,
  type InsertWorkflowTrigger,
  type AutomationRule,
  type InsertAutomationRule,
  type WorkflowExecution,
  type InsertWorkflowExecution,
  type TaskGenerationLog,
  type InsertTaskGenerationLog,
  type AutomatedSchedule,
  type InsertAutomatedSchedule,
  type WorkflowTemplate,
  type InsertWorkflowTemplate,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserAvatar(id: string, avatarUrl: string): Promise<User>;
  
  // Lab operations
  getLabs(): Promise<Lab[]>;
  createLab(lab: InsertLab): Promise<Lab>;
  getLabMembers(labId: string): Promise<User[]>;
  
  // Study operations
  getStudies(labId?: string): Promise<Study[]>;
  getStudy(id: string): Promise<Study | undefined>;
  createStudy(study: InsertStudy): Promise<Study>;
  updateStudy(id: string, study: Partial<Study>): Promise<Study>;
  deleteStudy(id: string): Promise<void>;
  
  // Task operations
  getTasks(studyId?: string, assigneeId?: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<Task>): Promise<Task>;
  
  // Standup operations
  getStandupMeetings(labId: string): Promise<StandupMeeting[]>;
  createStandupMeeting(meeting: InsertStandupMeeting): Promise<StandupMeeting>;
  updateStandupMeeting(id: string, meeting: Partial<StandupMeeting>): Promise<StandupMeeting>;
  
  // Action item operations
  getActionItems(assigneeId?: string, meetingId?: string): Promise<ActionItem[]>;
  createActionItem(item: InsertActionItem): Promise<ActionItem>;
  
  // Team member operations
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMembersByLab(labId: string): Promise<TeamMember[]>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, updates: Partial<InsertTeamMember>): Promise<TeamMember>;
  deleteTeamMember(id: string): Promise<void>;
  
  // Enhanced CRUD operations
  softDeleteStudy(id: string): Promise<Study>;
  softDeleteTask(id: string): Promise<Task>;
  softDeleteBucket(id: string): Promise<Bucket>;
  
  // Restore operations
  restoreStudy(id: string): Promise<Study>;
  restoreTask(id: string): Promise<Task>;
  restoreBucket(id: string): Promise<Bucket>;
  
  // Get deleted items
  getDeletedStudies(labId?: string): Promise<Study[]>;
  getDeletedTasks(labId?: string): Promise<Task[]>;
  getDeletedBuckets(labId?: string): Promise<Bucket[]>;
  updateItemPosition(type: 'bucket' | 'study' | 'task', id: string, position: string): Promise<void>;
  
  // Project member operations
  getProjectMembers(projectId: string): Promise<ProjectMember[]>;
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  removeProjectMember(projectId: string, userId: string): Promise<void>;
  
  // Task assignment operations
  getTaskAssignments(taskId: string): Promise<TaskAssignment[]>;
  assignUserToTask(assignment: InsertTaskAssignment): Promise<TaskAssignment>;
  removeTaskAssignment(taskId: string, userId: string): Promise<void>;
  
  // Team member assignment operations
  getTeamMemberAssignments(): Promise<TeamMemberAssignment[]>;
  createTeamMemberAssignment(assignment: InsertTeamMemberAssignment): Promise<TeamMemberAssignment>;
  deleteTeamMemberAssignment(id: string): Promise<void>;
  updateActionItem(id: string, item: Partial<ActionItem>): Promise<ActionItem>;
  
  // Bucket operations
  getBuckets(labId?: string): Promise<Bucket[]>;
  createBucket(bucket: InsertBucket): Promise<Bucket>;
  deleteBucket(id: string): Promise<void>;
  
  // Ideas operations
  getIdeas(labId?: string): Promise<Idea[]>;
  createIdea(idea: InsertIdea): Promise<Idea>;
  updateIdea(id: string, updates: Partial<InsertIdea>): Promise<Idea>;
  deleteIdea(id: string): Promise<void>;
  
  // Deadlines operations
  getDeadlines(labId?: string): Promise<Deadline[]>;
  createDeadline(deadline: InsertDeadline): Promise<Deadline>;
  updateDeadline(id: string, updates: Partial<InsertDeadline>): Promise<Deadline>;
  deleteDeadline(id: string): Promise<void>;

  // Standups operations (for new endpoint compatibility)
  getStandups(labId?: string): Promise<StandupMeeting[]>;
  createStandup(standup: InsertStandupMeeting): Promise<StandupMeeting>;
  updateStandup(id: string, updates: Partial<StandupMeeting>): Promise<StandupMeeting>;
  deleteStandup(id: string): Promise<void>;

  // User profile and settings operations
  updateUserProfile(id: string, profile: Partial<User>): Promise<User>;
  getUserSettings(id: string): Promise<any>;
  updateUserSettings(id: string, settings: any): Promise<any>;
  deleteUser(id: string): Promise<void>;

  // PHASE 1: CRITICAL SECURITY OPERATIONS
  validateUserLabAccess(userId: string, labId: string): Promise<boolean>;
  validateProjectMembership(userId: string, projectId: string): Promise<boolean>;
  getBucketMembers(bucketId: string): Promise<BucketMember[]>;
  addBucketMember(member: InsertBucketMember): Promise<BucketMember>;
  removeBucketMember(bucketId: string, userId: string): Promise<void>;
  assignTaskWithValidation(assignment: InsertTaskAssignment): Promise<TaskAssignment>;
  getComments(entityType: string, entityId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(notificationId: string): Promise<void>;
  getAttachments(entityType: string, entityId: string): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(attachmentId: string): Promise<void>;

  // PHASE 3: PROJECT MANAGEMENT OPERATIONS
  createStatusHistory(history: InsertStatusHistory): Promise<StatusHistory>;
  getStatusHistory(entityType: string, entityId: string): Promise<StatusHistory[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  getTimeEntries(taskId?: string, userId?: string, projectId?: string): Promise<TimeEntry[]>;
  updateTimeEntry(id: string, entry: Partial<TimeEntry>): Promise<TimeEntry>;
  deleteTimeEntry(id: string): Promise<void>;
  getProjectTimeEntries(projectId: string, startDate?: Date, endDate?: Date): Promise<TimeEntry[]>;
  getUserTimeEntries(userId: string, startDate?: Date, endDate?: Date): Promise<TimeEntry[]>;

  // PHASE 4: ENHANCED ORGANIZATION OPERATIONS
  // Tags
  getTags(labId?: string): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: string, tag: Partial<Tag>): Promise<Tag>;
  deleteTag(id: string): Promise<void>;
  // Task Tags
  getTaskTags(taskId: string): Promise<TaskTag[]>;
  addTaskTag(taskTag: InsertTaskTag): Promise<TaskTag>;
  removeTaskTag(taskId: string, tagId: string): Promise<void>;
  // Project Tags
  getProjectTags(projectId: string): Promise<ProjectTag[]>;
  addProjectTag(projectTag: InsertProjectTag): Promise<ProjectTag>;
  removeProjectTag(projectId: string, tagId: string): Promise<void>;
  // Custom Fields
  getCustomFields(labId: string, entityType?: string): Promise<CustomField[]>;
  createCustomField(field: InsertCustomField): Promise<CustomField>;
  updateCustomField(id: string, field: Partial<CustomField>): Promise<CustomField>;
  deleteCustomField(id: string): Promise<void>;
  getCustomFieldValues(entityId: string): Promise<CustomFieldValue[]>;
  setCustomFieldValue(value: InsertCustomFieldValue): Promise<CustomFieldValue>;
  // Task Templates
  getTaskTemplates(labId?: string): Promise<TaskTemplate[]>;
  createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate>;
  updateTaskTemplate(id: string, template: Partial<TaskTemplate>): Promise<TaskTemplate>;
  deleteTaskTemplate(id: string): Promise<void>;
  // Recurring Tasks
  getRecurringTasks(labId?: string): Promise<RecurringTask[]>;
  createRecurringTask(task: InsertRecurringTask): Promise<RecurringTask>;
  updateRecurringTask(id: string, task: Partial<RecurringTask>): Promise<RecurringTask>;
  deleteRecurringTask(id: string): Promise<void>;
  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  
  // Phase 5: Automation Operations
  // Workflow Triggers
  getWorkflowTriggers(labId?: string): Promise<WorkflowTrigger[]>;
  getWorkflowTrigger(id: string): Promise<WorkflowTrigger | undefined>;
  createWorkflowTrigger(trigger: InsertWorkflowTrigger): Promise<WorkflowTrigger>;
  updateWorkflowTrigger(id: string, trigger: Partial<InsertWorkflowTrigger>): Promise<WorkflowTrigger>;
  deleteWorkflowTrigger(id: string): Promise<void>;
  
  // Automation Rules
  getAutomationRules(labId?: string, triggerId?: string): Promise<AutomationRule[]>;
  getAutomationRule(id: string): Promise<AutomationRule | undefined>;
  createAutomationRule(rule: InsertAutomationRule): Promise<AutomationRule>;
  updateAutomationRule(id: string, rule: Partial<InsertAutomationRule>): Promise<AutomationRule>;
  deleteAutomationRule(id: string): Promise<void>;
  
  // Workflow Executions
  getWorkflowExecutions(ruleId?: string, status?: string): Promise<WorkflowExecution[]>;
  getWorkflowExecution(id: string): Promise<WorkflowExecution | undefined>;
  createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution>;
  updateWorkflowExecution(id: string, execution: Partial<InsertWorkflowExecution>): Promise<WorkflowExecution>;
  
  // Task Generation Logs
  getTaskGenerationLogs(executionId?: string): Promise<TaskGenerationLog[]>;
  createTaskGenerationLog(log: InsertTaskGenerationLog): Promise<TaskGenerationLog>;
  
  // Automated Schedules
  getAutomatedSchedules(labId?: string): Promise<AutomatedSchedule[]>;
  getAutomatedSchedule(id: string): Promise<AutomatedSchedule | undefined>;
  createAutomatedSchedule(schedule: InsertAutomatedSchedule): Promise<AutomatedSchedule>;
  updateAutomatedSchedule(id: string, schedule: Partial<InsertAutomatedSchedule>): Promise<AutomatedSchedule>;
  deleteAutomatedSchedule(id: string): Promise<void>;
  getSchedulesDue(): Promise<AutomatedSchedule[]>;
  
  // Workflow Templates
  getWorkflowTemplates(labId?: string, isPublic?: boolean): Promise<WorkflowTemplate[]>;
  getWorkflowTemplate(id: string): Promise<WorkflowTemplate | undefined>;
  createWorkflowTemplate(template: InsertWorkflowTemplate): Promise<WorkflowTemplate>;
  updateWorkflowTemplate(id: string, template: Partial<InsertWorkflowTemplate>): Promise<WorkflowTemplate>;
  deleteWorkflowTemplate(id: string): Promise<void>;
  
  // Automation Engine Methods
  executeAutomationRule(ruleId: string, triggeredBy?: string): Promise<WorkflowExecution>;
  generateTaskFromTemplate(templateId: string, executionId: string, projectId?: string): Promise<TaskGenerationLog>;
  processRecurringTasks(): Promise<void>;
  checkTriggerConditions(triggerType: string, entityData: any): Promise<WorkflowTrigger[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserAvatar(id: string, avatarUrl: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        profileImageUrl: avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Lab operations
  async getLabs(): Promise<Lab[]> {
    const allLabs = await db.select().from(labs).orderBy(asc(labs.name));
    
    // If no labs exist, create sample labs
    if (allLabs.length === 0) {
      const sampleLabs = [
        {
          name: "Rush Interdisciplinary Consortium for Critical Care Trials and Data Science (RICCC)",
          description: "Focused on cancer research and clinical trials",
          piName: "Dr. Kevin Buell & Dr. Juan Carlos Rojas (Co-PIs)",
          color: "#3b82f6",
        },
        {
          name: "Rush Health Equity Data Analytics Studio (RHEDAS)", 
          description: "Studying health disparities and social determinants",
          piName: "Dr. Michael Chen",
          color: "#10b981",
        }
      ];
      
      for (const labData of sampleLabs) {
        await this.createLab(labData);
      }
      
      return await db.select().from(labs).orderBy(asc(labs.name));
    }
    
    return allLabs;
  }

  async createLab(lab: InsertLab): Promise<Lab> {
    const [newLab] = await db.insert(labs).values(lab).returning();
    return newLab;
  }

  async getLabById(id: string): Promise<Lab | undefined> {
    const [lab] = await db.select().from(labs).where(eq(labs.id, id));
    return lab;
  }

  async getLabMembers(labId: string): Promise<User[]> {
    // Get team members directly from team_members table which has lab_id
    const members = await db.select({
      id: teamMembers.id,
      email: teamMembers.email,
      firstName: sql<string>`SPLIT_PART(${teamMembers.name}, ' ', 1)`,
      lastName: sql<string>`CASE 
        WHEN array_length(string_to_array(${teamMembers.name}, ' '), 1) > 1 
        THEN substring(${teamMembers.name} from position(' ' in ${teamMembers.name}) + 1) 
        ELSE '' 
      END`,
      name: teamMembers.name,
      middleName: sql<string>`''`,
      initials: teamMembers.initials,
      role: teamMembers.role,
      title: teamMembers.position,
      department: teamMembers.department,
      capacity: sql<string>`'40.00'`,
      profileImageUrl: teamMembers.avatarUrl,
      avatar: teamMembers.avatarUrl,
      expertise: sql<string[]>`ARRAY[]::text[]`,
      skills: sql<string[]>`ARRAY[]::text[]`,
      institution: sql<string>`'Rush University Medical Center'`,
      isExternal: sql<boolean>`false`,
      bio: sql<string>`''`,
      phone: teamMembers.phoneNumber,
      linkedIn: sql<string>`''`,
      orcid: sql<string>`''`,
      lastActive: sql<string>`''`,
      isActive: teamMembers.isActive,
      createdAt: teamMembers.createdAt,
      updatedAt: teamMembers.updatedAt,
    })
    .from(teamMembers)
    .where(and(
      eq(teamMembers.labId, labId), 
      eq(teamMembers.isActive, true)
    ))
    .orderBy(teamMembers.name);

    // Convert roles from database format to User type format
    const roleMapping: Record<string, string> = {
      'Principal Investigator': 'PRINCIPAL_INVESTIGATOR',
      'Co-Principal Investigator': 'CO_PRINCIPAL_INVESTIGATOR',
      'Data Scientist': 'DATA_SCIENTIST',
      'Data Analyst': 'DATA_ANALYST',
      'Fellow': 'FELLOW',
      'Medical Student': 'MEDICAL_STUDENT',
      'Regulatory Coordinator': 'REGULATORY_COORDINATOR',
    };

    return members.map(member => ({
      ...member,
      role: (roleMapping[member.role] || member.role) as any
    }));
  }

  async getLabMemberAssignments(labId?: string): Promise<any[]> {
    let query = db.select({
      id: labMembers.id,
      userId: labMembers.userId,
      labId: labMembers.labId,
      labRole: labMembers.labRole,
      isAdmin: labMembers.isAdmin,
      canCreateProjects: labMembers.canCreateProjects,
      canAssignTasks: labMembers.canAssignTasks,
      canViewAllProjects: labMembers.canViewAllProjects,
      canEditAllProjects: labMembers.canEditAllProjects,
      canManageMembers: labMembers.canManageMembers,
      canApproveIdeas: labMembers.canApproveIdeas,
      canAccessReports: labMembers.canAccessReports,
      isActive: labMembers.isActive,
      joinedAt: labMembers.joinedAt,
      leftAt: labMembers.leftAt,
      // User details
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userName: users.name,
      userInitials: users.initials,
      userProfileImageUrl: users.profileImageUrl,
      userAvatar: users.avatar,
      userRole: users.role,
      userTitle: users.title,
      userDepartment: users.department,
      // Lab details
      labName: labs.name,
      labFullName: labs.fullName,
    })
    .from(labMembers)
    .innerJoin(users, eq(labMembers.userId, users.id))
    .innerJoin(labs, eq(labMembers.labId, labs.id))
    .where(labId ? eq(labMembers.labId, labId) : eq(labMembers.isActive, true))
    .orderBy(users.name);

    return await query;
  }

  async assignUserToLab(assignment: InsertLabMember): Promise<LabMember> {
    const [newAssignment] = await db.insert(labMembers).values(assignment).returning();
    return newAssignment;
  }

  async updateLabMemberAssignment(id: string, updates: Partial<InsertLabMember>): Promise<LabMember> {
    const [updatedAssignment] = await db
      .update(labMembers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(labMembers.id, id))
      .returning();
    return updatedAssignment;
  }

  async removeUserFromLab(userId: string, labId: string): Promise<void> {
    await db.delete(labMembers).where(and(eq(labMembers.userId, userId), eq(labMembers.labId, labId)));
  }

  // Study operations
  async getStudies(labId?: string): Promise<Study[]> {
    let query = db.select().from(studies);
    
    const conditions = [eq(studies.isActive, true)];
    if (labId) conditions.push(eq(studies.labId, labId));
    
    return await query.where(and(...conditions)).orderBy(asc(studies.position), desc(studies.updatedAt));
  }

  async getStudy(id: string): Promise<Study | undefined> {
    const [study] = await db.select().from(studies).where(eq(studies.id, id));
    return study;
  }

  async createStudy(study: InsertStudy): Promise<Study> {
    const [newStudy] = await db.insert(studies).values(study).returning();
    return newStudy;
  }

  async updateStudy(id: string, study: Partial<Study>): Promise<Study> {
    const [updatedStudy] = await db
      .update(studies)
      .set({ ...study, updatedAt: new Date() })
      .where(eq(studies.id, id))
      .returning();
    return updatedStudy;
  }

  async deleteStudy(id: string, cascade: boolean = false): Promise<void> {
    // Check for associated tasks
    const associatedTasks = await db.select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.studyId, id));
    
    if (associatedTasks.length > 0 && !cascade) {
      throw new Error(`Cannot delete study. It contains ${associatedTasks.length} task(s). Please delete the tasks first.`);
    }
    
    // If cascade is true, delete associated tasks first
    if (cascade && associatedTasks.length > 0) {
      await db.delete(tasks).where(eq(tasks.studyId, id));
    }
    
    await db.delete(studies).where(eq(studies.id, id));
  }

  // Task operations
  async getTasks(studyId?: string, assigneeId?: string): Promise<Task[]> {
    let query = db.select().from(tasks);
    
    const conditions = [eq(tasks.isActive, true)];
    if (studyId) conditions.push(eq(tasks.studyId, studyId));
    if (assigneeId) conditions.push(eq(tasks.assigneeId, assigneeId));
    
    return await query.where(and(...conditions)).orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async moveTask(id: string, updates: { status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED'; position?: string; studyId?: string }): Promise<Task> {
    return this.updateTask(id, updates);
  }

  // Standup operations
  async getStandupMeetings(labId: string): Promise<StandupMeeting[]> {
    return await db
      .select()
      .from(standupMeetings)
      .where(eq(standupMeetings.labId, labId))
      .orderBy(desc(standupMeetings.meetingDate));
  }

  async createStandupMeeting(meeting: InsertStandupMeeting): Promise<StandupMeeting> {
    const [newMeeting] = await db.insert(standupMeetings).values(meeting).returning();
    return newMeeting;
  }

  async updateStandupMeeting(id: string, meeting: Partial<StandupMeeting>): Promise<StandupMeeting> {
    const [updatedMeeting] = await db
      .update(standupMeetings)
      .set({ ...meeting, updatedAt: new Date() })
      .where(eq(standupMeetings.id, id))
      .returning();
    return updatedMeeting;
  }

  // Action item operations
  async getActionItems(assigneeId?: string, meetingId?: string): Promise<ActionItem[]> {
    let query = db.select().from(standupActionItems);
    
    const conditions = [];
    if (assigneeId) conditions.push(eq(standupActionItems.assigneeId, assigneeId));
    if (meetingId) conditions.push(eq(standupActionItems.meetingId, meetingId));
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(standupActionItems.createdAt));
    }
    
    return await query.orderBy(desc(standupActionItems.createdAt));
  }

  async createActionItem(item: InsertActionItem): Promise<ActionItem> {
    const [newItem] = await db.insert(standupActionItems).values(item).returning();
    return newItem;
  }

  async updateActionItem(id: string, item: Partial<ActionItem>): Promise<ActionItem> {
    const [updatedItem] = await db
      .update(standupActionItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(standupActionItems.id, id))
      .returning();
    return updatedItem;
  }

  // Bucket operations
  async getBuckets(labId?: string): Promise<Bucket[]> {
    let query = db.select().from(buckets);
    
    const conditions = [eq(buckets.isActive, true)];
    if (labId) conditions.push(eq(buckets.labId, labId));
    
    return await query.where(and(...conditions)).orderBy(asc(buckets.position), asc(buckets.name));
  }

  async createBucket(bucket: InsertBucket): Promise<Bucket> {
    const [newBucket] = await db.insert(buckets).values(bucket).returning();
    return newBucket;
  }

  async deleteBucket(id: string): Promise<void> {
    // Check if bucket has associated studies
    const associatedStudies = await db.select({ id: studies.id })
      .from(studies)
      .where(eq(studies.bucketId, id));
    
    if (associatedStudies.length > 0) {
      throw new Error(`Cannot delete bucket. It contains ${associatedStudies.length} study(ies). Please move or delete the studies first.`);
    }
    
    await db.delete(buckets).where(eq(buckets.id, id));
  }

  // Team member operations
  async getTeamMembers(): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).orderBy(asc(teamMembers.name));
  }

  async getTeamMembersByLab(labId: string): Promise<TeamMember[]> {
    return await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.labId, labId))
      .orderBy(asc(teamMembers.name));
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db.insert(teamMembers).values(member).returning();
    return newMember;
  }

  async updateTeamMember(id: string, updates: Partial<InsertTeamMember>): Promise<TeamMember> {
    const [updatedMember] = await db
      .update(teamMembers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(teamMembers.id, id))
      .returning();
    return updatedMember;
  }

  async deleteTeamMember(id: string): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  // Team member assignment operations
  async getTeamMemberAssignments(): Promise<TeamMemberAssignment[]> {
    return await db.select().from(teamMemberAssignments).orderBy(desc(teamMemberAssignments.assignedAt));
  }

  async createTeamMemberAssignment(assignment: InsertTeamMemberAssignment): Promise<TeamMemberAssignment> {
    const [newAssignment] = await db.insert(teamMemberAssignments).values(assignment).returning();
    return newAssignment;
  }

  async deleteTeamMemberAssignment(id: string): Promise<void> {
    await db.delete(teamMemberAssignments).where(eq(teamMemberAssignments.id, id));
  }

  // Ideas operations
  async getIdeas(labId?: string): Promise<Idea[]> {
    if (labId) {
      return await db
        .select()
        .from(ideas)
        .where(eq(ideas.labId, labId))
        .orderBy(desc(ideas.createdAt));
    }
    return await db.select().from(ideas).orderBy(desc(ideas.createdAt));
  }

  async createIdea(idea: InsertIdea): Promise<Idea> {
    const [newIdea] = await db.insert(ideas).values(idea).returning();
    return newIdea;
  }

  async updateIdea(id: string, updates: Partial<InsertIdea>): Promise<Idea> {
    const [updatedIdea] = await db
      .update(ideas)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ideas.id, id))
      .returning();
    return updatedIdea;
  }

  async deleteIdea(id: string): Promise<void> {
    await db.delete(ideas).where(eq(ideas.id, id));
  }

  // Deadlines operations
  async getDeadlines(labId?: string): Promise<Deadline[]> {
    if (labId) {
      return await db
        .select()
        .from(deadlines)
        .where(eq(deadlines.labId, labId))
        .orderBy(asc(deadlines.dueDate));
    }
    return await db.select().from(deadlines).orderBy(asc(deadlines.dueDate));
  }

  async createDeadline(deadline: InsertDeadline): Promise<Deadline> {
    const [newDeadline] = await db.insert(deadlines).values(deadline).returning();
    return newDeadline;
  }

  async updateDeadline(id: string, updates: Partial<InsertDeadline>): Promise<Deadline> {
    const [updatedDeadline] = await db
      .update(deadlines)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deadlines.id, id))
      .returning();
    return updatedDeadline;
  }

  async deleteDeadline(id: string): Promise<void> {
    await db.delete(deadlines).where(eq(deadlines.id, id));
  }

  // Standups operations (for new endpoint compatibility)
  async getStandups(labId?: string): Promise<StandupMeeting[]> {
    if (labId) {
      return await db
        .select()
        .from(standupMeetings)
        .where(eq(standupMeetings.labId, labId))
        .orderBy(desc(standupMeetings.scheduledDate));
    }
    return await db.select().from(standupMeetings).orderBy(desc(standupMeetings.scheduledDate));
  }

  // Meeting preview operations

  async getStandupMeeting(id: string): Promise<StandupMeeting | undefined> {
    const [meeting] = await db
      .select()
      .from(standupMeetings)
      .where(eq(standupMeetings.id, id));
    return meeting;
  }

  async getActionItemsByMeetingId(meetingId: string): Promise<ActionItem[]> {
    return await db
      .select()
      .from(standupActionItems)
      .where(eq(standupActionItems.meetingId, meetingId))
      .orderBy(standupActionItems.createdAt);
  }

  async getStandupMeetingsByLab(labId: string): Promise<StandupMeeting[]> {
    return await db
      .select()
      .from(standupMeetings)
      .where(eq(standupMeetings.labId, labId))
      .orderBy(desc(standupMeetings.createdAt));
  }

  async getTeamMembersByIds(ids: string[]): Promise<TeamMember[]> {
    if (ids.length === 0) return [];
    
    return await db
      .select()
      .from(teamMembers)
      .where(inArray(teamMembers.id, ids));
  }

  async createStandup(standup: InsertStandupMeeting): Promise<StandupMeeting> {
    const [newStandup] = await db.insert(standupMeetings).values(standup).returning();
    return newStandup;
  }

  async updateStandup(id: string, updates: Partial<StandupMeeting>): Promise<StandupMeeting> {
    const [updatedStandup] = await db
      .update(standupMeetings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(standupMeetings.id, id))
      .returning();
    return updatedStandup;
  }

  async deleteStandup(id: string): Promise<void> {
    await db.delete(standupMeetings).where(eq(standupMeetings.id, id));
  }

  // User profile and settings operations
  async updateUserProfile(id: string, profile: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getUserSettings(id: string): Promise<any> {
    // Mock implementation - in real app would have separate settings table
    return {
      notifications: {
        email: true,
        inApp: true,
        deadlines: true,
        standups: true,
        taskAssignments: true,
      },
      preferences: {
        theme: "dark",
        language: "en",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        defaultLabView: "overview",
      },
      privacy: {
        profileVisibility: "team",
        activityTracking: true,
        dataExport: true,
      },
    };
  }

  async updateUserSettings(id: string, settings: any): Promise<any> {
    // Mock implementation - in real app would update settings table
    return settings;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Enhanced CRUD operations
  async softDeleteStudy(id: string): Promise<Study> {
    const [deletedStudy] = await db
      .update(studies)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(studies.id, id))
      .returning();
    return deletedStudy;
  }

  async softDeleteTask(id: string): Promise<Task> {
    const [deletedTask] = await db
      .update(tasks)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return deletedTask;
  }

  async softDeleteBucket(id: string): Promise<Bucket> {
    const [deletedBucket] = await db
      .update(buckets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(buckets.id, id))
      .returning();
    return deletedBucket;
  }

  // Restore operations
  async restoreStudy(id: string): Promise<Study> {
    const [restoredStudy] = await db
      .update(studies)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(studies.id, id))
      .returning();
    return restoredStudy;
  }

  async restoreTask(id: string): Promise<Task> {
    const [restoredTask] = await db
      .update(tasks)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return restoredTask;
  }

  async restoreBucket(id: string): Promise<Bucket> {
    const [restoredBucket] = await db
      .update(buckets)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(buckets.id, id))
      .returning();
    return restoredBucket;
  }

  // Get deleted items
  async getDeletedStudies(labId?: string): Promise<Study[]> {
    let query = db.select().from(studies);
    
    const conditions = [eq(studies.isActive, false)];
    if (labId) conditions.push(eq(studies.labId, labId));
    
    return await query.where(and(...conditions)).orderBy(desc(studies.updatedAt));
  }

  async getDeletedTasks(labId?: string): Promise<Task[]> {
    if (labId) {
      // Join with studies to filter by lab
      const results = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          priority: tasks.priority,
          assigneeId: tasks.assigneeId,
          studyId: tasks.studyId,
          parentTaskId: tasks.parentTaskId,
          position: tasks.position,
          isActive: tasks.isActive,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
          dueDate: tasks.dueDate,
          estimatedHours: tasks.estimatedHours,
          actualHours: tasks.actualHours,
          tags: tasks.tags,
          completedAt: tasks.completedAt,
          completedById: tasks.completedById,
          createdBy: tasks.createdBy,
        })
        .from(tasks)
        .leftJoin(studies, eq(tasks.studyId, studies.id))
        .where(and(eq(tasks.isActive, false), eq(studies.labId, labId)))
        .orderBy(desc(tasks.updatedAt));
      return results;
    }
    
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.isActive, false))
      .orderBy(desc(tasks.updatedAt));
  }

  async getDeletedBuckets(labId?: string): Promise<Bucket[]> {
    let query = db.select().from(buckets);
    
    const conditions = [eq(buckets.isActive, false)];
    if (labId) conditions.push(eq(buckets.labId, labId));
    
    return await query.where(and(...conditions)).orderBy(desc(buckets.updatedAt));
  }

  async updateItemPosition(type: 'bucket' | 'study' | 'task', id: string, position: string): Promise<void> {
    switch (type) {
      case 'bucket':
        await db.update(buckets).set({ position, updatedAt: new Date() }).where(eq(buckets.id, id));
        break;
      case 'study':
        await db.update(studies).set({ position, updatedAt: new Date() }).where(eq(studies.id, id));
        break;
      case 'task':
        await db.update(tasks).set({ position, updatedAt: new Date() }).where(eq(tasks.id, id));
        break;
    }
  }

  // Project member operations
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    return await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId));
  }

  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    const [newMember] = await db
      .insert(projectMembers)
      .values(member)
      .returning();
    return newMember;
  }

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await db
      .delete(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
  }

  // Task assignment operations
  async getTaskAssignments(taskId: string): Promise<TaskAssignment[]> {
    return await db
      .select()
      .from(taskAssignments)
      .where(eq(taskAssignments.taskId, taskId));
  }

  async assignUserToTask(assignment: InsertTaskAssignment): Promise<TaskAssignment> {
    const [newAssignment] = await db
      .insert(taskAssignments)
      .values(assignment)
      .returning();
    return newAssignment;
  }

  async removeTaskAssignment(taskId: string, userId: string): Promise<void> {
    await db
      .delete(taskAssignments)
      .where(and(eq(taskAssignments.taskId, taskId), eq(taskAssignments.userId, userId)));
  }

  // PHASE 1: CRITICAL SECURITY IMPLEMENTATIONS
  
  async validateUserLabAccess(userId: string, labId: string): Promise<boolean> {
    try {
      const [membership] = await db
        .select({ labId: labMembers.labId })
        .from(labMembers)
        .where(and(eq(labMembers.userId, userId), eq(labMembers.labId, labId), eq(labMembers.isActive, true)))
        .limit(1);
      
      return !!membership;
    } catch {
      return false;
    }
  }
  
  async validateProjectMembership(userId: string, projectId: string): Promise<boolean> {
    try {
      const [membership] = await db
        .select({ id: projectMembers.id })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.userId, userId),
            eq(projectMembers.projectId, projectId)
          )
        )
        .limit(1);
      
      return !!membership;
    } catch {
      return false;
    }
  }
  
  async getBucketMembers(bucketId: string): Promise<BucketMember[]> {
    return await db
      .select()
      .from(bucketMembers)
      .where(eq(bucketMembers.bucketId, bucketId));
  }
  
  async addBucketMember(member: InsertBucketMember): Promise<BucketMember> {
    const [newMember] = await db
      .insert(bucketMembers)
      .values(member)
      .returning();
    return newMember;
  }
  
  async removeBucketMember(bucketId: string, userId: string): Promise<void> {
    await db
      .delete(bucketMembers)
      .where(
        and(
          eq(bucketMembers.bucketId, bucketId),
          eq(bucketMembers.userId, userId)
        )
      );
  }
  
  // CRITICAL: Validated task assignment - ensures only project members can be assigned
  async assignTaskWithValidation(assignment: InsertTaskAssignment): Promise<TaskAssignment> {
    // Step 1: Validate that user is a member of the project
    const isProjectMember = await this.validateProjectMembership(
      assignment.userId,
      assignment.projectId
    );
    
    if (!isProjectMember) {
      throw new Error("Cannot assign task: User is not a member of this project");
    }
    
    // Step 2: Validate cross-lab access (get project's lab and check user's lab)
    const [project] = await db
      .select({ labId: studies.labId })
      .from(studies)
      .where(eq(studies.id, assignment.projectId))
      .limit(1);
    
    if (!project) {
      throw new Error("Project not found");
    }
    
    const hasLabAccess = await this.validateUserLabAccess(assignment.userId, project.labId);
    if (!hasLabAccess) {
      throw new Error("Cannot assign task: Cross-lab access denied");
    }
    
    // Step 3: Create the assignment
    const [newAssignment] = await db
      .insert(taskAssignments)
      .values(assignment)
      .returning();
    
    return newAssignment;
  }
  
  async getComments(entityType: string, entityId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.entityType, entityType as any),
          eq(comments.entityId, entityId),
          eq(comments.isDeleted, false)
        )
      )
      .orderBy(asc(comments.createdAt));
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    return newComment;
  }
  
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }
  
  async markNotificationRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(eq(notifications.id, notificationId));
  }
  
  // PHASE 2: ATTACHMENT OPERATIONS
  
  async getAttachments(entityType: string, entityId: string): Promise<Attachment[]> {
    return await db
      .select()
      .from(attachments)
      .where(
        and(
          eq(attachments.entityType, entityType as any),
          eq(attachments.entityId, entityId),
          eq(attachments.isDeleted, false)
        )
      )
      .orderBy(desc(attachments.uploadedAt));
  }
  
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const [newAttachment] = await db
      .insert(attachments)
      .values(attachment)
      .returning();
    return newAttachment;
  }
  
  async deleteAttachment(attachmentId: string): Promise<void> {
    await db
      .update(attachments)
      .set({ isDeleted: true })
      .where(eq(attachments.id, attachmentId));
  }

  // PHASE 3: PROJECT MANAGEMENT OPERATIONS
  async createStatusHistory(history: InsertStatusHistory): Promise<StatusHistory> {
    const [newHistory] = await db.insert(statusHistory).values(history).returning();
    return newHistory;
  }

  async getStatusHistory(entityType: string, entityId: string): Promise<StatusHistory[]> {
    return await db
      .select()
      .from(statusHistory)
      .where(and(
        eq(statusHistory.entityType, entityType),
        eq(statusHistory.entityId, entityId)
      ))
      .orderBy(desc(statusHistory.changedAt));
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const [newEntry] = await db.insert(timeEntries).values(entry).returning();
    return newEntry;
  }

  async getTimeEntries(taskId?: string, userId?: string, projectId?: string): Promise<TimeEntry[]> {
    let query = db.select().from(timeEntries);
    
    const conditions = [];
    if (taskId) conditions.push(eq(timeEntries.taskId, taskId));
    if (userId) conditions.push(eq(timeEntries.userId, userId));
    if (projectId) conditions.push(eq(timeEntries.projectId, projectId));
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(timeEntries.date));
    }
    
    return await query.orderBy(desc(timeEntries.date));
  }

  async updateTimeEntry(id: string, entry: Partial<TimeEntry>): Promise<TimeEntry> {
    const [updatedEntry] = await db
      .update(timeEntries)
      .set({ ...entry, updatedAt: new Date() })
      .where(eq(timeEntries.id, id))
      .returning();
    return updatedEntry;
  }

  async deleteTimeEntry(id: string): Promise<void> {
    await db.delete(timeEntries).where(eq(timeEntries.id, id));
  }

  async getProjectTimeEntries(projectId: string, startDate?: Date, endDate?: Date): Promise<TimeEntry[]> {
    const conditions = [eq(timeEntries.projectId, projectId)];
    if (startDate) conditions.push(sql`${timeEntries.date} >= ${startDate}`);
    if (endDate) conditions.push(sql`${timeEntries.date} <= ${endDate}`);
    
    return await db.select().from(timeEntries).where(and(...conditions)).orderBy(desc(timeEntries.date));
  }

  async getUserTimeEntries(userId: string, startDate?: Date, endDate?: Date): Promise<TimeEntry[]> {
    const conditions = [eq(timeEntries.userId, userId)];
    if (startDate) conditions.push(sql`${timeEntries.date} >= ${startDate}`);
    if (endDate) conditions.push(sql`${timeEntries.date} <= ${endDate}`);
    
    return await db.select().from(timeEntries).where(and(...conditions)).orderBy(desc(timeEntries.date));
  }

  // PHASE 4: ENHANCED ORGANIZATION OPERATIONS
  
  // Tags
  async getTags(labId?: string): Promise<Tag[]> {
    if (labId) {
      return await db
        .select()
        .from(tags)
        .where(and(eq(tags.labId, labId), eq(tags.isActive, true)))
        .orderBy(asc(tags.name));
    }
    return await db.select().from(tags).where(eq(tags.isActive, true)).orderBy(asc(tags.name));
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const [newTag] = await db.insert(tags).values(tag).returning();
    return newTag;
  }

  async updateTag(id: string, tag: Partial<Tag>): Promise<Tag> {
    const [updatedTag] = await db
      .update(tags)
      .set({ ...tag, updatedAt: new Date() })
      .where(eq(tags.id, id))
      .returning();
    return updatedTag;
  }

  async deleteTag(id: string): Promise<void> {
    await db.update(tags).set({ isActive: false }).where(eq(tags.id, id));
  }

  // Task Tags
  async getTaskTags(taskId: string): Promise<TaskTag[]> {
    return await db.select().from(taskTags).where(eq(taskTags.taskId, taskId));
  }

  async addTaskTag(taskTag: InsertTaskTag): Promise<TaskTag> {
    const [newTaskTag] = await db.insert(taskTags).values(taskTag).returning();
    return newTaskTag;
  }

  async removeTaskTag(taskId: string, tagId: string): Promise<void> {
    await db.delete(taskTags).where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, tagId)));
  }

  // Project Tags
  async getProjectTags(projectId: string): Promise<ProjectTag[]> {
    return await db.select().from(projectTags).where(eq(projectTags.projectId, projectId));
  }

  async addProjectTag(projectTag: InsertProjectTag): Promise<ProjectTag> {
    const [newProjectTag] = await db.insert(projectTags).values(projectTag).returning();
    return newProjectTag;
  }

  async removeProjectTag(projectId: string, tagId: string): Promise<void> {
    await db.delete(projectTags).where(and(eq(projectTags.projectId, projectId), eq(projectTags.tagId, tagId)));
  }

  // Custom Fields
  async getCustomFields(labId: string, entityType?: string): Promise<CustomField[]> {
    const conditions = [eq(customFields.labId, labId), eq(customFields.isActive, true)];
    
    if (entityType) {
      conditions.push(eq(customFields.entityType, entityType));
    }
    
    return await db.select().from(customFields).where(and(...conditions)).orderBy(asc(customFields.position), asc(customFields.fieldLabel));
  }

  async createCustomField(field: InsertCustomField): Promise<CustomField> {
    const [newField] = await db.insert(customFields).values(field).returning();
    return newField;
  }

  async updateCustomField(id: string, field: Partial<CustomField>): Promise<CustomField> {
    const [updatedField] = await db
      .update(customFields)
      .set({ ...field, updatedAt: new Date() })
      .where(eq(customFields.id, id))
      .returning();
    return updatedField;
  }

  async deleteCustomField(id: string): Promise<void> {
    await db.update(customFields).set({ isActive: false }).where(eq(customFields.id, id));
  }

  async getCustomFieldValues(entityId: string): Promise<CustomFieldValue[]> {
    return await db.select().from(customFieldValues).where(eq(customFieldValues.entityId, entityId));
  }

  async setCustomFieldValue(value: InsertCustomFieldValue): Promise<CustomFieldValue> {
    const [newValue] = await db
      .insert(customFieldValues)
      .values(value)
      .onConflictDoUpdate({
        target: [customFieldValues.fieldId, customFieldValues.entityId],
        set: {
          value: value.value,
          updatedAt: new Date(),
        },
      })
      .returning();
    return newValue;
  }

  // Task Templates
  async getTaskTemplates(labId?: string): Promise<TaskTemplate[]> {
    if (labId) {
      return await db
        .select()
        .from(taskTemplates)
        .where(and(eq(taskTemplates.labId, labId), eq(taskTemplates.isActive, true)))
        .orderBy(asc(taskTemplates.name));
    }
    return await db.select().from(taskTemplates).where(eq(taskTemplates.isActive, true)).orderBy(asc(taskTemplates.name));
  }

  async createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate> {
    const [newTemplate] = await db.insert(taskTemplates).values(template).returning();
    return newTemplate;
  }

  async updateTaskTemplate(id: string, template: Partial<TaskTemplate>): Promise<TaskTemplate> {
    const [updatedTemplate] = await db
      .update(taskTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(taskTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteTaskTemplate(id: string): Promise<void> {
    await db.update(taskTemplates).set({ isActive: false }).where(eq(taskTemplates.id, id));
  }

  // Recurring Tasks
  async getRecurringTasks(labId?: string): Promise<RecurringTask[]> {
    if (labId) {
      // Join with tasks to filter by lab through study relationship
      const results = await db
        .select({
          id: recurringTasks.id,
          taskId: recurringTasks.taskId,
          templateId: recurringTasks.templateId,
          pattern: recurringTasks.pattern,
          interval: recurringTasks.interval,
          dayOfWeek: recurringTasks.dayOfWeek,
          dayOfMonth: recurringTasks.dayOfMonth,
          customCron: recurringTasks.customCron,
          nextDueDate: recurringTasks.nextDueDate,
          lastCreated: recurringTasks.lastCreated,
          endDate: recurringTasks.endDate,
          maxOccurrences: recurringTasks.maxOccurrences,
          occurrenceCount: recurringTasks.occurrenceCount,
          isActive: recurringTasks.isActive,
          createdAt: recurringTasks.createdAt,
          updatedAt: recurringTasks.updatedAt,
        })
        .from(recurringTasks)
        .leftJoin(tasks, eq(recurringTasks.taskId, tasks.id))
        .leftJoin(studies, eq(tasks.studyId, studies.id))
        .where(and(eq(studies.labId, labId), eq(recurringTasks.isActive, true)))
        .orderBy(asc(recurringTasks.nextDueDate));
      return results;
    }
    return await db.select().from(recurringTasks).where(eq(recurringTasks.isActive, true)).orderBy(asc(recurringTasks.nextDueDate));
  }

  async createRecurringTask(task: InsertRecurringTask): Promise<RecurringTask> {
    const [newRecurringTask] = await db.insert(recurringTasks).values(task).returning();
    return newRecurringTask;
  }

  async updateRecurringTask(id: string, task: Partial<RecurringTask>): Promise<RecurringTask> {
    const [updatedTask] = await db
      .update(recurringTasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(recurringTasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteRecurringTask(id: string): Promise<void> {
    await db.update(recurringTasks).set({ isActive: false }).where(eq(recurringTasks.id, id));
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return preferences;
  }

  async upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [newPreferences] = await db
      .insert(userPreferences)
      .values(preferences)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return newPreferences;
  }

  // =============================================================================
  // PHASE 5: AUTOMATION IMPLEMENTATION
  // =============================================================================

  // Workflow Triggers Implementation
  async getWorkflowTriggers(labId?: string): Promise<WorkflowTrigger[]> {
    if (labId) {
      return await db.select().from(workflowTriggers)
        .where(and(eq(workflowTriggers.labId, labId), eq(workflowTriggers.isActive, true)))
        .orderBy(desc(workflowTriggers.createdAt));
    }
    return await db.select().from(workflowTriggers)
      .where(eq(workflowTriggers.isActive, true))
      .orderBy(desc(workflowTriggers.createdAt));
  }

  async getWorkflowTrigger(id: string): Promise<WorkflowTrigger | undefined> {
    const [trigger] = await db.select().from(workflowTriggers).where(eq(workflowTriggers.id, id));
    return trigger;
  }

  async createWorkflowTrigger(trigger: InsertWorkflowTrigger): Promise<WorkflowTrigger> {
    const [newTrigger] = await db.insert(workflowTriggers).values(trigger).returning();
    return newTrigger;
  }

  async updateWorkflowTrigger(id: string, trigger: Partial<InsertWorkflowTrigger>): Promise<WorkflowTrigger> {
    const [updatedTrigger] = await db
      .update(workflowTriggers)
      .set({ ...trigger, updatedAt: new Date() })
      .where(eq(workflowTriggers.id, id))
      .returning();
    return updatedTrigger;
  }

  async deleteWorkflowTrigger(id: string): Promise<void> {
    await db.update(workflowTriggers).set({ isActive: false }).where(eq(workflowTriggers.id, id));
  }

  // Automation Rules Implementation
  async getAutomationRules(labId?: string, triggerId?: string): Promise<AutomationRule[]> {
    let query = db.select().from(automationRules);
    
    const conditions = [eq(automationRules.isActive, true)];
    if (labId) conditions.push(eq(automationRules.labId, labId));
    if (triggerId) conditions.push(eq(automationRules.triggerId, triggerId));
    
    return await query.where(and(...conditions)).orderBy(asc(automationRules.priority), desc(automationRules.createdAt));
  }

  async getAutomationRule(id: string): Promise<AutomationRule | undefined> {
    const [rule] = await db.select().from(automationRules).where(eq(automationRules.id, id));
    return rule;
  }

  async createAutomationRule(rule: InsertAutomationRule): Promise<AutomationRule> {
    const [newRule] = await db.insert(automationRules).values(rule).returning();
    return newRule;
  }

  async updateAutomationRule(id: string, rule: Partial<InsertAutomationRule>): Promise<AutomationRule> {
    const [updatedRule] = await db
      .update(automationRules)
      .set({ ...rule, updatedAt: new Date() })
      .where(eq(automationRules.id, id))
      .returning();
    return updatedRule;
  }

  async deleteAutomationRule(id: string): Promise<void> {
    await db.update(automationRules).set({ isActive: false }).where(eq(automationRules.id, id));
  }

  // Workflow Executions Implementation
  async getWorkflowExecutions(ruleId?: string, status?: string): Promise<WorkflowExecution[]> {
    const conditions = [];
    if (ruleId) conditions.push(eq(workflowExecutions.ruleId, ruleId));
    if (status) conditions.push(eq(workflowExecutions.status, status as any));
    
    if (conditions.length > 0) {
      return await db.select().from(workflowExecutions)
        .where(and(...conditions))
        .orderBy(desc(workflowExecutions.startedAt));
    }
    
    return await db.select().from(workflowExecutions).orderBy(desc(workflowExecutions.startedAt));
  }

  async getWorkflowExecution(id: string): Promise<WorkflowExecution | undefined> {
    const [execution] = await db.select().from(workflowExecutions).where(eq(workflowExecutions.id, id));
    return execution;
  }

  async createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution> {
    const [newExecution] = await db.insert(workflowExecutions).values(execution).returning();
    return newExecution;
  }

  async updateWorkflowExecution(id: string, execution: Partial<InsertWorkflowExecution>): Promise<WorkflowExecution> {
    const [updatedExecution] = await db
      .update(workflowExecutions)
      .set(execution)
      .where(eq(workflowExecutions.id, id))
      .returning();
    return updatedExecution;
  }

  // Task Generation Logs Implementation
  async getTaskGenerationLogs(executionId?: string): Promise<TaskGenerationLog[]> {
    if (executionId) {
      return await db.select().from(taskGenerationLogs)
        .where(eq(taskGenerationLogs.executionId, executionId))
        .orderBy(desc(taskGenerationLogs.generatedAt));
    }
    return await db.select().from(taskGenerationLogs).orderBy(desc(taskGenerationLogs.generatedAt));
  }

  async createTaskGenerationLog(log: InsertTaskGenerationLog): Promise<TaskGenerationLog> {
    const [newLog] = await db.insert(taskGenerationLogs).values(log).returning();
    return newLog;
  }

  // Automated Schedules Implementation
  async getAutomatedSchedules(labId?: string): Promise<AutomatedSchedule[]> {
    if (labId) {
      return await db.select().from(automatedSchedules)
        .where(and(eq(automatedSchedules.labId, labId), eq(automatedSchedules.isActive, true)))
        .orderBy(asc(automatedSchedules.nextRunTime));
    }
    return await db.select().from(automatedSchedules)
      .where(eq(automatedSchedules.isActive, true))
      .orderBy(asc(automatedSchedules.nextRunTime));
  }

  async getAutomatedSchedule(id: string): Promise<AutomatedSchedule | undefined> {
    const [schedule] = await db.select().from(automatedSchedules).where(eq(automatedSchedules.id, id));
    return schedule;
  }

  async createAutomatedSchedule(schedule: InsertAutomatedSchedule): Promise<AutomatedSchedule> {
    const [newSchedule] = await db.insert(automatedSchedules).values(schedule).returning();
    return newSchedule;
  }

  async updateAutomatedSchedule(id: string, schedule: Partial<InsertAutomatedSchedule>): Promise<AutomatedSchedule> {
    const [updatedSchedule] = await db
      .update(automatedSchedules)
      .set({ ...schedule, updatedAt: new Date() })
      .where(eq(automatedSchedules.id, id))
      .returning();
    return updatedSchedule;
  }

  async deleteAutomatedSchedule(id: string): Promise<void> {
    await db.update(automatedSchedules).set({ isActive: false }).where(eq(automatedSchedules.id, id));
  }

  async getSchedulesDue(): Promise<AutomatedSchedule[]> {
    const now = new Date();
    return await db.select().from(automatedSchedules)
      .where(and(
        eq(automatedSchedules.isActive, true),
        sql`${automatedSchedules.nextRunTime} <= ${now}`
      ))
      .orderBy(asc(automatedSchedules.nextRunTime));
  }

  // Workflow Templates Implementation
  async getWorkflowTemplates(labId?: string, isPublic?: boolean): Promise<WorkflowTemplate[]> {
    const conditions = [];
    if (labId) conditions.push(eq(workflowTemplates.labId, labId));
    if (isPublic !== undefined) conditions.push(eq(workflowTemplates.isPublic, isPublic));
    
    if (conditions.length > 0) {
      return await db.select().from(workflowTemplates)
        .where(and(...conditions))
        .orderBy(desc(workflowTemplates.usageCount), desc(workflowTemplates.createdAt));
    }
    
    return await db.select().from(workflowTemplates).orderBy(desc(workflowTemplates.usageCount), desc(workflowTemplates.createdAt));
  }

  async getWorkflowTemplate(id: string): Promise<WorkflowTemplate | undefined> {
    const [template] = await db.select().from(workflowTemplates).where(eq(workflowTemplates.id, id));
    return template;
  }

  async createWorkflowTemplate(template: InsertWorkflowTemplate): Promise<WorkflowTemplate> {
    const [newTemplate] = await db.insert(workflowTemplates).values(template).returning();
    return newTemplate;
  }

  async updateWorkflowTemplate(id: string, template: Partial<InsertWorkflowTemplate>): Promise<WorkflowTemplate> {
    const [updatedTemplate] = await db
      .update(workflowTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(workflowTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteWorkflowTemplate(id: string): Promise<void> {
    await db.delete(workflowTemplates).where(eq(workflowTemplates.id, id));
  }

  // =============================================================================
  // AUTOMATION ENGINE IMPLEMENTATION
  // =============================================================================

  async executeAutomationRule(ruleId: string, triggeredBy?: string): Promise<WorkflowExecution> {
    const rule = await this.getAutomationRule(ruleId);
    if (!rule) {
      throw new Error(`Automation rule ${ruleId} not found`);
    }

    // Create execution record
    const execution = await this.createWorkflowExecution({
      ruleId,
      triggerId: rule.triggerId,
      status: "PENDING",
      triggeredBy,
      executionLog: { startTime: new Date().toISOString(), rule: rule.name },
    });

    try {
      // Execute the automation action based on type
      await this.performAutomationAction(rule, execution.id);
      
      // Mark as successful
      return await this.updateWorkflowExecution(execution.id, {
        status: "SUCCESS",
        completedAt: new Date(),
        executionLog: {
          ...(execution.executionLog as object || {}),
          endTime: new Date().toISOString(),
          status: "completed"
        }
      });
    } catch (error) {
      // Mark as failed
      return await this.updateWorkflowExecution(execution.id, {
        status: "FAILED",
        completedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
        executionLog: {
          ...(execution.executionLog as object || {}),
          endTime: new Date().toISOString(),
          status: "failed",
          error: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }

  private async performAutomationAction(rule: AutomationRule, executionId: string): Promise<void> {
    const config = rule.actionConfig as any;
    
    switch (rule.actionType) {
      case "CREATE_TASK":
        if (config.templateId) {
          await this.generateTaskFromTemplate(config.templateId, executionId, config.projectId);
        } else {
          // Create task directly from config
          const newTask = await this.createTask({
            title: config.title || "Automated Task",
            description: config.description,
            studyId: config.projectId,
            priority: config.priority || "MEDIUM",
            status: "TODO",
            isActive: true,
          });
          
          // Log the task generation
          await this.createTaskGenerationLog({
            executionId,
            taskId: newTask.id,
            projectId: config.projectId,
            generationType: "WORKFLOW",
            success: true,
            metadata: { actionType: rule.actionType, config }
          });
        }
        break;
        
      case "SEND_NOTIFICATION":
        if (config.userId && config.message) {
          await this.createNotification({
            userId: config.userId,
            type: config.notificationType || "CUSTOM_EVENT",
            title: config.title || "Automated Notification",
            message: config.message,
            entityType: config.entityType,
            entityId: config.entityId,
          });
        }
        break;
        
      case "UPDATE_STATUS":
        if (config.entityType === "task" && config.entityId) {
          await this.updateTask(config.entityId, { status: config.status });
        } else if (config.entityType === "study" && config.entityId) {
          await this.updateStudy(config.entityId, { status: config.status });
        }
        break;
        
      // Add more action types as needed
      default:
        console.warn(`Unknown automation action type: ${rule.actionType}`);
    }
  }

  async generateTaskFromTemplate(templateId: string, executionId: string, projectId?: string): Promise<TaskGenerationLog> {
    const templates = await this.getTaskTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      const errorLog = await this.createTaskGenerationLog({
        executionId,
        templateId,
        projectId: projectId || null,
        generationType: "TEMPLATE",
        success: false,
        errorMessage: `Template ${templateId} not found`,
      });
      return errorLog;
    }

    try {
      // Create task from template
      const newTask = await this.createTask({
        title: template.title,
        description: template.description,
        studyId: projectId || "", // This should be validated
        priority: "MEDIUM",
        status: "TODO",
        isActive: true,
        // Apply template tags and custom fields as needed
      });

      // Apply template tags if any
      if (template.tags && template.tags.length > 0) {
        for (const tagName of template.tags) {
          // Find or create tag and apply to task
          const existingTags = await this.getTags(template.labId);
          const tag = existingTags.find(t => t.name === tagName);
          if (tag) {
            await this.addTaskTag({
              taskId: newTask.id,
              tagId: tag.id,
              taggedById: "", // Should be the automation user
            });
          }
        }
      }

      return await this.createTaskGenerationLog({
        executionId,
        taskId: newTask.id,
        templateId,
        projectId,
        generationType: "TEMPLATE",
        success: true,
        metadata: { templateName: template.name, taskTitle: newTask.title }
      });
    } catch (error) {
      return await this.createTaskGenerationLog({
        executionId,
        templateId,
        projectId,
        generationType: "TEMPLATE",
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async processRecurringTasks(): Promise<void> {
    const dueRecurringTasks = await db.select().from(recurringTasks)
      .where(and(
        eq(recurringTasks.isActive, true),
        sql`${recurringTasks.nextDueDate} <= ${new Date()}`
      ));

    for (const recurringTask of dueRecurringTasks) {
      try {
        // Get the template if linked
        let template = null;
        if (recurringTask.templateId) {
          const templates = await this.getTaskTemplates();
          const templateMatches = templates.filter(t => t.id === recurringTask.templateId);
          template = templateMatches[0] || null;
        }

        // Generate new task instance
        const newTask = await this.createTask({
          title: template?.title || `Recurring Task ${new Date().toLocaleDateString()}`,
          description: template?.description || "Recurring task",
          studyId: "", // This needs to be fixed in the recurring task schema
          priority: "MEDIUM",
          status: "TODO",
          isActive: true,
        });

        // Update recurring task for next execution
        const nextDate = this.calculateNextDueDate(recurringTask);
        await this.updateRecurringTask(recurringTask.id, {
          lastCreated: new Date(),
          nextDueDate: nextDate,
          occurrenceCount: (parseInt(recurringTask.occurrenceCount || "0") + 1).toString()
        });

        console.log(`Generated recurring task: ${newTask.title}`);
      } catch (error) {
        console.error(`Failed to process recurring task ${recurringTask.id}:`, error);
      }
    }
  }

  private calculateNextDueDate(recurringTask: RecurringTask): Date {
    const current = new Date(recurringTask.nextDueDate);
    const interval = parseInt(recurringTask.interval || "1");

    switch (recurringTask.pattern) {
      case "DAILY":
        return new Date(current.getTime() + interval * 24 * 60 * 60 * 1000);
      case "WEEKLY":
        return new Date(current.getTime() + interval * 7 * 24 * 60 * 60 * 1000);
      case "MONTHLY":
        const nextMonth = new Date(current);
        nextMonth.setMonth(current.getMonth() + interval);
        return nextMonth;
      case "QUARTERLY":
        const nextQuarter = new Date(current);
        nextQuarter.setMonth(current.getMonth() + interval * 3);
        return nextQuarter;
      default:
        return new Date(current.getTime() + 24 * 60 * 60 * 1000); // Default to daily
    }
  }

  async checkTriggerConditions(triggerType: string, entityData: any): Promise<WorkflowTrigger[]> {
    const triggers = await db.select().from(workflowTriggers)
      .where(and(
        eq(workflowTriggers.triggerType, triggerType as any),
        eq(workflowTriggers.isActive, true)
      ));

    const matchingTriggers: WorkflowTrigger[] = [];

    for (const trigger of triggers) {
      if (await this.evaluateTriggerConditions(trigger, entityData)) {
        matchingTriggers.push(trigger);
      }
    }

    return matchingTriggers;
  }

  private async evaluateTriggerConditions(trigger: WorkflowTrigger, entityData: any): Promise<boolean> {
    if (!trigger.conditions) return true; // No conditions means always match

    const conditions = trigger.conditions as any;
    
    // Simple condition evaluation - can be extended for complex logic
    for (const [field, expectedValue] of Object.entries(conditions)) {
      if (entityData[field] !== expectedValue) {
        return false;
      }
    }

    return true;
  }
}

export const storage = new DatabaseStorage();
