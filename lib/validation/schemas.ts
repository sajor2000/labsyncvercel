/**
 * Simple validation schemas using Zod
 */

import { z } from 'zod'

// Calendar event schema
export const calendarEventSchema = z.object({
  id: z.string().optional(),
  summary: z.string().min(1, 'Summary is required'),
  description: z.string().optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  google_event_id: z.string().optional(),
  google_meet_link: z.string().url().optional(),
})

// Bulk sync schema
export const bulkSyncSchema = z.object({
  events: z.array(calendarEventSchema),
  syncDirection: z.enum(['toGoogle', 'fromGoogle', 'bidirectional']).optional(),
})

// Lab member schema
export const labMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
  can_create_projects: z.boolean().optional(),
  can_edit_projects: z.boolean().optional(),
  can_delete_projects: z.boolean().optional(),
  can_create_tasks: z.boolean().optional(),
  can_edit_tasks: z.boolean().optional(),
  can_delete_tasks: z.boolean().optional(),
  can_invite_members: z.boolean().optional(),
  can_remove_members: z.boolean().optional(),
})

// Project schema
export const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  bucket_id: z.string().uuid(),
})

// Task schema
export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().datetime().optional(),
  assigned_to: z.string().uuid().optional(),
  project_id: z.string().uuid(),
})

// Bucket schema
export const bucketSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  position: z.number().int().min(0).optional(),
  lab_id: z.string().uuid(),
})