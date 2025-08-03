import {
  users,
  labs,
  studies,
  tasks,
  buckets,
  standupMeetings,
  standupActionItems,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Lab operations
  getLabs(): Promise<Lab[]>;
  createLab(lab: InsertLab): Promise<Lab>;
  getLabMembers(labId: string): Promise<User[]>;
  
  // Study operations
  getStudies(labId?: string): Promise<Study[]>;
  getStudy(id: string): Promise<Study | undefined>;
  createStudy(study: InsertStudy): Promise<Study>;
  updateStudy(id: string, study: Partial<Study>): Promise<Study>;
  
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
  updateActionItem(id: string, item: Partial<ActionItem>): Promise<ActionItem>;
  
  // Bucket operations
  getBuckets(labId?: string): Promise<Bucket[]>;
  createBucket(bucket: InsertBucket): Promise<Bucket>;
  deleteBucket(id: string): Promise<void>;
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

  // Lab operations
  async getLabs(): Promise<Lab[]> {
    return await db.select().from(labs).orderBy(asc(labs.name));
  }

  async createLab(lab: InsertLab): Promise<Lab> {
    const [newLab] = await db.insert(labs).values(lab).returning();
    return newLab;
  }

  async getLabMembers(labId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.labId, labId));
  }

  // Study operations
  async getStudies(labId?: string): Promise<Study[]> {
    const query = db.select().from(studies);
    if (labId) {
      return await query.where(eq(studies.labId, labId)).orderBy(desc(studies.updatedAt));
    }
    return await query.orderBy(desc(studies.updatedAt));
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

  // Task operations
  async getTasks(studyId?: string, assigneeId?: string): Promise<Task[]> {
    let query = db.select().from(tasks);
    
    const conditions = [];
    if (studyId) conditions.push(eq(tasks.studyId, studyId));
    if (assigneeId) conditions.push(eq(tasks.assigneeId, assigneeId));
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(tasks.createdAt));
    }
    
    return await query.orderBy(desc(tasks.createdAt));
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
    if (labId) {
      return await db
        .select()
        .from(buckets)
        .where(eq(buckets.labId, labId))
        .orderBy(asc(buckets.name));
    }
    return await db.select().from(buckets).orderBy(asc(buckets.name));
  }

  async createBucket(bucket: InsertBucket): Promise<Bucket> {
    const [newBucket] = await db.insert(buckets).values(bucket).returning();
    return newBucket;
  }

  async deleteBucket(id: string): Promise<void> {
    await db.delete(buckets).where(eq(buckets.id, id));
  }
}

export const storage = new DatabaseStorage();
