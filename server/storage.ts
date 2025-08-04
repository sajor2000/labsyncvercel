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
  projectMembers,
  taskAssignments,
  ideas,
  deadlines,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

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
          piName: "Dr. Sarah Johnson",
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
    return await db.select().from(users).where(eq(users.labId, labId));
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

  async deleteStudy(id: string): Promise<void> {
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
    await db.delete(buckets).where(eq(buckets.id, id));
  }

  // Team member operations
  async getTeamMembers(): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).orderBy(asc(teamMembers.name));
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
    let query = db.select().from(tasks);
    
    const conditions = [eq(tasks.isActive, false)];
    
    if (labId) {
      // Join with studies to filter by lab
      return await db
        .select()
        .from(tasks)
        .leftJoin(studies, eq(tasks.studyId, studies.id))
        .where(and(eq(tasks.isActive, false), eq(studies.labId, labId)))
        .orderBy(desc(tasks.updatedAt));
    }
    
    return await query.where(and(...conditions)).orderBy(desc(tasks.updatedAt));
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
}

export const storage = new DatabaseStorage();
