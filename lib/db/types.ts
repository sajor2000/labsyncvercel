/**
 * Simple database types matching the 21-table schema
 * No complex abstractions, just direct type definitions
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Core entity types
export interface Lab {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface LabMember {
  id: string
  lab_id: string
  user_id: string
  role: 'member' | 'admin' | 'principal_investigator'
  // 8 simple permission fields
  can_manage_members: boolean
  can_create_projects: boolean
  can_edit_all_projects: boolean
  can_delete_projects: boolean
  can_create_tasks: boolean
  can_edit_all_tasks: boolean
  can_delete_tasks: boolean
  can_view_financials: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Bucket {
  id: string
  lab_id: string
  name: string
  description: string | null
  color: string | null
  position: number | null
  created_by: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  bucket_id: string
  lab_id: string
  title: string
  description: string | null
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  start_date: string | null
  due_date: string | null
  // IRB fields
  irb_status: 'not_required' | 'pending' | 'approved' | 'expired' | null
  irb_number: string | null
  irb_approval_date: string | null
  irb_expiration_date: string | null
  // Manuscript fields
  manuscript_status: 'not_started' | 'drafting' | 'review' | 'submitted' | 'accepted' | 'published' | null
  // Funding fields
  funding_source: string | null
  funding_amount: number | null
  funding_type: 'grant' | 'industry' | 'internal' | 'foundation' | 'government' | 'other' | null
  grant_number: string | null
  // Metadata
  created_by: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string | null
  due_date: string | null
  completed_at: string | null
  parent_task_id: string | null
  position: number | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  lab_id: string
  google_event_id: string | null
  summary: string
  description: string | null
  location: string | null
  start_time: string
  end_time: string
  all_day: boolean | null
  attendees: Json | null
  google_meet_link: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface GoogleCalendarIntegration {
  id: string
  lab_id: string
  google_calendar_id: string
  google_calendar_name: string | null
  access_token: string | null
  refresh_token: string | null
  token_expiry: string | null
  sync_enabled: boolean
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  lab_id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  entity_title: string | null
  metadata: Json | null
  created_at: string
}

// Simple helper types for forms
export interface CreateProjectInput {
  bucket_id: string
  lab_id: string
  title: string
  description?: string
  status?: Project['status']
  priority?: Project['priority']
  start_date?: string
  due_date?: string
  irb_status?: Project['irb_status']
  irb_number?: string
  manuscript_status?: Project['manuscript_status']
  funding_source?: string
  funding_amount?: number
  funding_type?: Project['funding_type']
  grant_number?: string
}

export interface CreateTaskInput {
  project_id: string
  title: string
  description?: string
  status?: Task['status']
  priority?: Task['priority']
  assigned_to?: string
  due_date?: string
  parent_task_id?: string
}

export interface CreateBucketInput {
  lab_id: string
  name: string
  description?: string
  color?: string
  position?: number
}

// Simple response types with relationships
export interface ProjectWithBucket extends Project {
  bucket?: Bucket
}

export interface TaskWithProject extends Task {
  project?: Project
}

export interface BucketWithProjects extends Bucket {
  projects?: Project[]
}

export interface ProjectWithTasks extends Project {
  tasks?: Task[]
}

export interface LabMemberWithProfile extends LabMember {
  user_profiles?: UserProfile
}