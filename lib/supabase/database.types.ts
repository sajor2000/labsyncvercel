// Auto-generated TypeScript types for Supabase database
// Generated to match ULTIMATE_LAB_SYNC_PRODUCTION.sql schema exactly
// This ensures perfect compatibility with the frontend

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Enum types matching the ULTIMATE database exactly
export type UserRole = 
  | 'principal_investigator'
  | 'co_investigator' 
  | 'lab_manager'
  | 'data_analyst'
  | 'data_scientist'
  | 'regulatory_coordinator'
  | 'lab_assistant'
  | 'research_volunteer'
  | 'external_collaborator'

export type LabStatus = 'active' | 'inactive' | 'archived'
export type BucketStatus = 'active' | 'archived' | 'deleted'
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type IrbStatus = 'not_required' | 'planning' | 'submitted' | 'under_review' | 'approved' | 'expired' | 'suspended' | 'withdrawn' | 'exempt'
export type PublicationStatus = 'planning' | 'writing' | 'draft_complete' | 'under_review' | 'revision_requested' | 'accepted' | 'published' | 'rejected'
export type GrantStatus = 'planning' | 'submitted' | 'awarded' | 'active' | 'completed' | 'closed' | 'rejected'
export type ConferenceStatus = 'planning' | 'abstract_submitted' | 'accepted' | 'rejected' | 'presented'
export type MeetingType = 'standup' | 'planning' | 'review' | 'presentation' | 'training' | 'social' | 'other'
export type NotificationType = 'task_assigned' | 'task_completed' | 'task_overdue' | 'deadline_reminder' | 'mention' | 'lab_invite' | 'member_joined' | 'meeting_scheduled' | 'file_shared' | 'comment_added'
export type ActivityType = 'created' | 'updated' | 'deleted' | 'completed' | 'assigned' | 'commented' | 'uploaded' | 'shared' | 'archived' | 'restored'
export type CommentType = 'task' | 'project' | 'idea' | 'file' | 'meeting' | 'deadline' | 'general'
export type IdeaStatus = 'draft' | 'proposed' | 'under_review' | 'approved' | 'in_progress' | 'implemented' | 'rejected' | 'archived'
export type IdeaCategory = 'research' | 'process_improvement' | 'technology' | 'collaboration' | 'training' | 'equipment' | 'other'
export type EffortLevel = 'low' | 'medium' | 'high'
export type ImpactLevel = 'low' | 'medium' | 'high'
export type DeadlineType = 'grant_deadline' | 'paper_submission' | 'conference_abstract' | 'irb_submission' | 'ethics_review' | 'data_collection' | 'analysis_completion' | 'milestone' | 'presentation' | 'meeting' | 'other'
export type FileType = 'document' | 'spreadsheet' | 'presentation' | 'image' | 'video' | 'audio' | 'code' | 'data' | 'archive' | 'other'
export type StorageProvider = 'supabase' | 'google_drive' | 'dropbox' | 'onedrive' | 'local'
export type SharePermission = 'view' | 'comment' | 'edit' | 'admin'
export type EventType = 'meeting' | 'deadline' | 'conference' | 'training' | 'holiday' | 'pto' | 'clinic' | 'other'
export type CalendarProvider = 'google' | 'outlook' | 'apple' | 'internal'
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'syncing'

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          full_name: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          phone: string | null
          title: string | null
          department: string | null
          institution: string | null
          website: string | null
          orcid: string | null
          google_scholar: string | null
          linkedin: string | null
          twitter: string | null
          timezone: string | null
          locale: string | null
          theme: string | null
          is_active: boolean | null
          is_verified: boolean | null
          last_selected_lab_id: string | null
          notification_preferences: Json | null
          privacy_settings: Json | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          last_login_at: string | null
          last_activity_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          title?: string | null
          department?: string | null
          institution?: string | null
          website?: string | null
          orcid?: string | null
          google_scholar?: string | null
          linkedin?: string | null
          twitter?: string | null
          timezone?: string | null
          locale?: string | null
          theme?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          last_selected_lab_id?: string | null
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          last_login_at?: string | null
          last_activity_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          title?: string | null
          department?: string | null
          institution?: string | null
          website?: string | null
          orcid?: string | null
          google_scholar?: string | null
          linkedin?: string | null
          twitter?: string | null
          timezone?: string | null
          locale?: string | null
          theme?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          last_selected_lab_id?: string | null
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          last_login_at?: string | null
          last_activity_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          category: string
          preferences: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          preferences?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          preferences?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      labs: {
        Row: {
          id: string
          name: string
          slug: string | null
          description: string | null
          short_description: string | null
          logo_url: string | null
          banner_url: string | null
          website: string | null
          contact_email: string | null
          phone: string | null
          address: string | null
          timezone: string | null
          primary_color: string | null
          secondary_color: string | null
          status: LabStatus | null
          is_public: boolean | null
          allow_join_requests: boolean | null
          default_meeting_duration: number | null
          standup_day: string | null
          standup_time: string | null
          standup_timezone: string | null
          tags: string[] | null
          research_areas: string[] | null
          funding_sources: string[] | null
          settings: Json | null
          created_by: string | null
          archived_at: string | null
          archived_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          description?: string | null
          short_description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          website?: string | null
          contact_email?: string | null
          phone?: string | null
          address?: string | null
          timezone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          status?: LabStatus | null
          is_public?: boolean | null
          allow_join_requests?: boolean | null
          default_meeting_duration?: number | null
          standup_day?: string | null
          standup_time?: string | null
          standup_timezone?: string | null
          tags?: string[] | null
          research_areas?: string[] | null
          funding_sources?: string[] | null
          settings?: Json | null
          created_by?: string | null
          archived_at?: string | null
          archived_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          description?: string | null
          short_description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          website?: string | null
          contact_email?: string | null
          phone?: string | null
          address?: string | null
          timezone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          status?: LabStatus | null
          is_public?: boolean | null
          allow_join_requests?: boolean | null
          default_meeting_duration?: number | null
          standup_day?: string | null
          standup_time?: string | null
          standup_timezone?: string | null
          tags?: string[] | null
          research_areas?: string[] | null
          funding_sources?: string[] | null
          settings?: Json | null
          created_by?: string | null
          archived_at?: string | null
          archived_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "labs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      lab_members: {
        Row: {
          id: string
          user_id: string
          lab_id: string
          role: UserRole | null
          is_admin: boolean | null
          is_super_admin: boolean | null
          can_manage_lab_settings: boolean | null
          can_manage_members: boolean | null
          can_manage_permissions: boolean | null
          can_view_audit_logs: boolean | null
          can_manage_integrations: boolean | null
          can_manage_billing: boolean | null
          can_create_projects: boolean | null
          can_edit_all_projects: boolean | null
          can_delete_projects: boolean | null
          can_view_all_projects: boolean | null
          can_archive_projects: boolean | null
          can_restore_projects: boolean | null
          can_manage_project_templates: boolean | null
          can_create_tasks: boolean | null
          can_assign_tasks: boolean | null
          can_edit_all_tasks: boolean | null
          can_delete_tasks: boolean | null
          can_view_all_tasks: boolean | null
          can_manage_task_templates: boolean | null
          can_set_task_priorities: boolean | null
          can_manage_deadlines: boolean | null
          can_access_reports: boolean | null
          can_export_data: boolean | null
          can_view_analytics: boolean | null
          can_view_financials: boolean | null
          can_manage_data_sources: boolean | null
          can_schedule_meetings: boolean | null
          can_manage_standups: boolean | null
          can_send_announcements: boolean | null
          can_moderate_discussions: boolean | null
          can_manage_calendar: boolean | null
          can_upload_files: boolean | null
          can_share_files: boolean | null
          can_delete_files: boolean | null
          can_manage_file_permissions: boolean | null
          can_create_ideas: boolean | null
          can_moderate_ideas: boolean | null
          is_active: boolean | null
          is_favorite_lab: boolean | null
          custom_title: string | null
          bio: string | null
          expertise_areas: string[] | null
          joined_at: string | null
          invited_at: string | null
          invited_by: string | null
          left_at: string | null
          removed_at: string | null
          removed_by: string | null
          last_permission_update: string | null
          last_activity_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          lab_id: string
          role?: UserRole | null
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          can_manage_lab_settings?: boolean | null
          can_manage_members?: boolean | null
          can_manage_permissions?: boolean | null
          can_view_audit_logs?: boolean | null
          can_manage_integrations?: boolean | null
          can_manage_billing?: boolean | null
          can_create_projects?: boolean | null
          can_edit_all_projects?: boolean | null
          can_delete_projects?: boolean | null
          can_view_all_projects?: boolean | null
          can_archive_projects?: boolean | null
          can_restore_projects?: boolean | null
          can_manage_project_templates?: boolean | null
          can_create_tasks?: boolean | null
          can_assign_tasks?: boolean | null
          can_edit_all_tasks?: boolean | null
          can_delete_tasks?: boolean | null
          can_view_all_tasks?: boolean | null
          can_manage_task_templates?: boolean | null
          can_set_task_priorities?: boolean | null
          can_manage_deadlines?: boolean | null
          can_access_reports?: boolean | null
          can_export_data?: boolean | null
          can_view_analytics?: boolean | null
          can_view_financials?: boolean | null
          can_manage_data_sources?: boolean | null
          can_schedule_meetings?: boolean | null
          can_manage_standups?: boolean | null
          can_send_announcements?: boolean | null
          can_moderate_discussions?: boolean | null
          can_manage_calendar?: boolean | null
          can_upload_files?: boolean | null
          can_share_files?: boolean | null
          can_delete_files?: boolean | null
          can_manage_file_permissions?: boolean | null
          can_create_ideas?: boolean | null
          can_moderate_ideas?: boolean | null
          is_active?: boolean | null
          is_favorite_lab?: boolean | null
          custom_title?: string | null
          bio?: string | null
          expertise_areas?: string[] | null
          joined_at?: string | null
          invited_at?: string | null
          invited_by?: string | null
          left_at?: string | null
          removed_at?: string | null
          removed_by?: string | null
          last_permission_update?: string | null
          last_activity_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          lab_id?: string
          role?: UserRole | null
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          can_manage_lab_settings?: boolean | null
          can_manage_members?: boolean | null
          can_manage_permissions?: boolean | null
          can_view_audit_logs?: boolean | null
          can_manage_integrations?: boolean | null
          can_manage_billing?: boolean | null
          can_create_projects?: boolean | null
          can_edit_all_projects?: boolean | null
          can_delete_projects?: boolean | null
          can_view_all_projects?: boolean | null
          can_archive_projects?: boolean | null
          can_restore_projects?: boolean | null
          can_manage_project_templates?: boolean | null
          can_create_tasks?: boolean | null
          can_assign_tasks?: boolean | null
          can_edit_all_tasks?: boolean | null
          can_delete_tasks?: boolean | null
          can_view_all_tasks?: boolean | null
          can_manage_task_templates?: boolean | null
          can_set_task_priorities?: boolean | null
          can_manage_deadlines?: boolean | null
          can_access_reports?: boolean | null
          can_export_data?: boolean | null
          can_view_analytics?: boolean | null
          can_view_financials?: boolean | null
          can_manage_data_sources?: boolean | null
          can_schedule_meetings?: boolean | null
          can_manage_standups?: boolean | null
          can_send_announcements?: boolean | null
          can_moderate_discussions?: boolean | null
          can_manage_calendar?: boolean | null
          can_upload_files?: boolean | null
          can_share_files?: boolean | null
          can_delete_files?: boolean | null
          can_manage_file_permissions?: boolean | null
          can_create_ideas?: boolean | null
          can_moderate_ideas?: boolean | null
          is_active?: boolean | null
          is_favorite_lab?: boolean | null
          custom_title?: string | null
          bio?: string | null
          expertise_areas?: string[] | null
          joined_at?: string | null
          invited_at?: string | null
          invited_by?: string | null
          left_at?: string | null
          removed_at?: string | null
          removed_by?: string | null
          last_permission_update?: string | null
          last_activity_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_members_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          }
        ]
      }
      lab_invitations: {
        Row: {
          id: string
          lab_id: string
          email: string
          role: UserRole | null
          invited_by: string
          message: string | null
          token: string | null
          status: string | null
          expires_at: string | null
          accepted_at: string | null
          declined_at: string | null
          reminder_sent_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          email: string
          role?: UserRole | null
          invited_by: string
          message?: string | null
          token?: string | null
          status?: string | null
          expires_at?: string | null
          accepted_at?: string | null
          declined_at?: string | null
          reminder_sent_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          email?: string
          role?: UserRole | null
          invited_by?: string
          message?: string | null
          token?: string | null
          status?: string | null
          expires_at?: string | null
          accepted_at?: string | null
          declined_at?: string | null
          reminder_sent_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_invitations_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      lab_invite_codes: {
        Row: {
          id: string
          lab_id: string
          code: string
          description: string | null
          default_role: UserRole | null
          created_by: string | null
          max_uses: number | null
          current_uses: number | null
          expires_at: string | null
          is_active: boolean | null
          allowed_email_domains: string[] | null
          require_approval: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          code: string
          description?: string | null
          default_role?: UserRole | null
          created_by?: string | null
          max_uses?: number | null
          current_uses?: number | null
          expires_at?: string | null
          is_active?: boolean | null
          allowed_email_domains?: string[] | null
          require_approval?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          code?: string
          description?: string | null
          default_role?: UserRole | null
          created_by?: string | null
          max_uses?: number | null
          current_uses?: number | null
          expires_at?: string | null
          is_active?: boolean | null
          allowed_email_domains?: string[] | null
          require_approval?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_invite_codes_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      buckets: {
        Row: {
          id: string
          lab_id: string
          name: string
          description: string | null
          color: string | null
          icon: string | null
          status: BucketStatus | null
          position: number | null
          parent_bucket_id: string | null
          is_private: boolean | null
          owner_id: string | null
          tags: string[] | null
          metadata: Json | null
          archived_at: string | null
          archived_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          name: string
          description?: string | null
          color?: string | null
          icon?: string | null
          status?: BucketStatus | null
          position?: number | null
          parent_bucket_id?: string | null
          is_private?: boolean | null
          owner_id?: string | null
          tags?: string[] | null
          metadata?: Json | null
          archived_at?: string | null
          archived_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          name?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          status?: BucketStatus | null
          position?: number | null
          parent_bucket_id?: string | null
          is_private?: boolean | null
          owner_id?: string | null
          tags?: string[] | null
          metadata?: Json | null
          archived_at?: string | null
          archived_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buckets_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buckets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buckets_parent_bucket_id_fkey"
            columns: ["parent_bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          bucket_id: string
          name: string
          description: string | null
          status: ProjectStatus | null
          priority: Priority | null
          progress_percentage: number | null
          completion_criteria: string | null
          start_date: string | null
          due_date: string | null
          completed_date: string | null
          estimated_hours: number | null
          actual_hours: number | null
          owner_id: string | null
          team_members: string[] | null
          // Publication authorship fields
          first_author_id: string | null
          last_author_id: string | null
          corresponding_author_id: string | null
          author_order: string[] | null
          publication_title: string | null
          target_journal: string | null
          manuscript_status: PublicationStatus | null
          submission_deadline: string | null
          submission_date: string | null
          revision_deadline: string | null
          acceptance_date: string | null
          publication_date: string | null
          doi: string | null
          pmid: string | null
          publication_url: string | null
          // Financial tracking
          budget: number | null
          spent: number | null
          currency: string | null
          // Grant association
          associated_grant_number: string | null
          associated_grant_title: string | null
          funding_source: string | null
          // IRB and ethics tracking
          irb_number: string | null
          irb_status: IrbStatus | null
          irb_approval_date: string | null
          irb_expiration_date: string | null
          ethics_committee: string | null
          irb_documents: string[] | null
          human_subjects_research: boolean | null
          exempt_research: boolean | null
          minimal_risk: boolean | null
          irb_notes: string | null
          position: number | null
          color: string | null
          tags: string[] | null
          research_areas: string[] | null
          methodology: string | null
          expected_outcomes: string | null
          success_metrics: string[] | null
          risks: string[] | null
          dependencies: string[] | null
          external_links: Json | null
          custom_fields: Json | null
          is_template: boolean | null
          template_name: string | null
          is_archived: boolean | null
          archived_at: string | null
          archived_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          bucket_id: string
          name: string
          description?: string | null
          status?: ProjectStatus | null
          priority?: Priority | null
          progress_percentage?: number | null
          completion_criteria?: string | null
          start_date?: string | null
          due_date?: string | null
          completed_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          owner_id?: string | null
          team_members?: string[] | null
          // Publication authorship fields
          first_author_id?: string | null
          last_author_id?: string | null
          corresponding_author_id?: string | null
          author_order?: string[] | null
          publication_title?: string | null
          target_journal?: string | null
          manuscript_status?: PublicationStatus | null
          submission_deadline?: string | null
          submission_date?: string | null
          revision_deadline?: string | null
          acceptance_date?: string | null
          publication_date?: string | null
          doi?: string | null
          pmid?: string | null
          publication_url?: string | null
          // Financial tracking
          budget?: number | null
          spent?: number | null
          currency?: string | null
          // Grant association
          associated_grant_number?: string | null
          associated_grant_title?: string | null
          funding_source?: string | null
          // IRB and ethics tracking
          irb_number?: string | null
          irb_status?: IrbStatus | null
          irb_approval_date?: string | null
          irb_expiration_date?: string | null
          ethics_committee?: string | null
          irb_documents?: string[] | null
          human_subjects_research?: boolean | null
          exempt_research?: boolean | null
          minimal_risk?: boolean | null
          irb_notes?: string | null
          position?: number | null
          color?: string | null
          tags?: string[] | null
          research_areas?: string[] | null
          methodology?: string | null
          expected_outcomes?: string | null
          success_metrics?: string[] | null
          risks?: string[] | null
          dependencies?: string[] | null
          external_links?: Json | null
          custom_fields?: Json | null
          is_template?: boolean | null
          template_name?: string | null
          is_archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          bucket_id?: string
          name?: string
          description?: string | null
          status?: ProjectStatus | null
          priority?: Priority | null
          progress_percentage?: number | null
          completion_criteria?: string | null
          start_date?: string | null
          due_date?: string | null
          completed_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          owner_id?: string | null
          team_members?: string[] | null
          budget?: number | null
          spent?: number | null
          currency?: string | null
          position?: number | null
          color?: string | null
          tags?: string[] | null
          research_areas?: string[] | null
          methodology?: string | null
          expected_outcomes?: string | null
          success_metrics?: string[] | null
          risks?: string[] | null
          dependencies?: string[] | null
          external_links?: Json | null
          custom_fields?: Json | null
          is_template?: boolean | null
          template_name?: string | null
          is_archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          parent_task_id: string | null
          title: string
          description: string | null
          status: TaskStatus | null
          priority: Priority | null
          assigned_to: string | null
          assigned_by: string | null
          assignee_comments: string | null
          due_date: string | null
          start_date: string | null
          completed_date: string | null
          estimated_hours: number | null
          actual_hours: number | null
          position: number | null
          kanban_column: string | null
          acceptance_criteria: string | null
          completion_notes: string | null
          blocking_reason: string | null
          tags: string[] | null
          labels: string[] | null
          complexity: number | null
          story_points: number | null
          custom_fields: Json | null
          is_recurring: boolean | null
          recurrence_rule: string | null
          recurrence_parent_id: string | null
          source: string | null
          source_reference: string | null
          deleted_at: string | null
          deleted_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          parent_task_id?: string | null
          title: string
          description?: string | null
          status?: TaskStatus | null
          priority?: Priority | null
          assigned_to?: string | null
          assigned_by?: string | null
          assignee_comments?: string | null
          due_date?: string | null
          start_date?: string | null
          completed_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          position?: number | null
          kanban_column?: string | null
          acceptance_criteria?: string | null
          completion_notes?: string | null
          blocking_reason?: string | null
          tags?: string[] | null
          labels?: string[] | null
          complexity?: number | null
          story_points?: number | null
          custom_fields?: Json | null
          is_recurring?: boolean | null
          recurrence_rule?: string | null
          recurrence_parent_id?: string | null
          source?: string | null
          source_reference?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          parent_task_id?: string | null
          title?: string
          description?: string | null
          status?: TaskStatus | null
          priority?: Priority | null
          assigned_to?: string | null
          assigned_by?: string | null
          assignee_comments?: string | null
          due_date?: string | null
          start_date?: string | null
          completed_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          position?: number | null
          kanban_column?: string | null
          acceptance_criteria?: string | null
          completion_notes?: string | null
          blocking_reason?: string | null
          tags?: string[] | null
          labels?: string[] | null
          complexity?: number | null
          story_points?: number | null
          custom_fields?: Json | null
          is_recurring?: boolean | null
          recurrence_rule?: string | null
          recurrence_parent_id?: string | null
          source?: string | null
          source_reference?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      task_dependencies: {
        Row: {
          id: string
          task_id: string
          depends_on_task_id: string
          dependency_type: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          task_id: string
          depends_on_task_id: string
          dependency_type?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          depends_on_task_id?: string
          dependency_type?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          entity_type: CommentType
          entity_id: string
          user_id: string
          parent_comment_id: string | null
          content: string
          mentions: string[] | null
          is_edited: boolean | null
          edited_at: string | null
          edit_history: Json | null
          is_pinned: boolean | null
          is_resolved: boolean | null
          resolved_by: string | null
          resolved_at: string | null
          reactions: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          entity_type: CommentType
          entity_id: string
          user_id: string
          parent_comment_id?: string | null
          content: string
          mentions?: string[] | null
          is_edited?: boolean | null
          edited_at?: string | null
          edit_history?: Json | null
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          resolved_by?: string | null
          resolved_at?: string | null
          reactions?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          entity_type?: CommentType
          entity_id?: string
          user_id?: string
          parent_comment_id?: string | null
          content?: string
          mentions?: string[] | null
          is_edited?: boolean | null
          edited_at?: string | null
          edit_history?: Json | null
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          resolved_by?: string | null
          resolved_at?: string | null
          reactions?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      }
      ideas: {
        Row: {
          id: string
          lab_id: string
          title: string
          description: string | null
          category: IdeaCategory | null
          status: IdeaStatus | null
          priority: Priority | null
          estimated_effort: EffortLevel | null
          potential_impact: ImpactLevel | null
          business_value: string | null
          technical_feasibility: string | null
          created_by: string
          assigned_to: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          implementation_notes: string | null
          related_project_id: string | null
          expected_completion_date: string | null
          actual_completion_date: string | null
          vote_score: number | null
          view_count: number | null
          tags: string[] | null
          external_links: Json | null
          attachments: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          title: string
          description?: string | null
          category?: IdeaCategory | null
          status?: IdeaStatus | null
          priority?: Priority | null
          estimated_effort?: EffortLevel | null
          potential_impact?: ImpactLevel | null
          business_value?: string | null
          technical_feasibility?: string | null
          created_by: string
          assigned_to?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          implementation_notes?: string | null
          related_project_id?: string | null
          expected_completion_date?: string | null
          actual_completion_date?: string | null
          vote_score?: number | null
          view_count?: number | null
          tags?: string[] | null
          external_links?: Json | null
          attachments?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          title?: string
          description?: string | null
          category?: IdeaCategory | null
          status?: IdeaStatus | null
          priority?: Priority | null
          estimated_effort?: EffortLevel | null
          potential_impact?: ImpactLevel | null
          business_value?: string | null
          technical_feasibility?: string | null
          created_by?: string
          assigned_to?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          implementation_notes?: string | null
          related_project_id?: string | null
          expected_completion_date?: string | null
          actual_completion_date?: string | null
          vote_score?: number | null
          view_count?: number | null
          tags?: string[] | null
          external_links?: Json | null
          attachments?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ideas_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      idea_votes: {
        Row: {
          id: string
          idea_id: string
          user_id: string
          vote_type: string
          created_at: string | null
        }
        Insert: {
          id?: string
          idea_id: string
          user_id: string
          vote_type: string
          created_at?: string | null
        }
        Update: {
          id?: string
          idea_id?: string
          user_id?: string
          vote_type?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_votes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      meetings: {
        Row: {
          id: string
          lab_id: string
          title: string
          type: MeetingType | null
          description: string | null
          scheduled_start: string | null
          scheduled_end: string | null
          actual_start: string | null
          actual_end: string | null
          timezone: string | null
          location: string | null
          meeting_url: string | null
          dial_in_info: string | null
          organizer_id: string
          participants: string[] | null
          invited_participants: string[] | null
          required_participants: string[] | null
          recording_url: string | null
          recording_status: string | null
          transcript: string | null
          transcript_status: string | null
          ai_summary: string | null
          ai_key_points: string[] | null
          ai_action_items: string[] | null
          ai_decisions: string[] | null
          ai_blockers: string[] | null
          ai_sentiment_analysis: Json | null
          ai_processing_status: string | null
          ai_processing_error: string | null
          agenda: string | null
          notes: string | null
          outcomes: string | null
          next_steps: string | null
          is_recurring: boolean | null
          recurrence_rule: string | null
          recurrence_parent_id: string | null
          status: string | null
          metadata: Json | null
          external_calendar_id: string | null
          external_meeting_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          title: string
          type?: MeetingType | null
          description?: string | null
          scheduled_start?: string | null
          scheduled_end?: string | null
          actual_start?: string | null
          actual_end?: string | null
          timezone?: string | null
          location?: string | null
          meeting_url?: string | null
          dial_in_info?: string | null
          organizer_id: string
          participants?: string[] | null
          invited_participants?: string[] | null
          required_participants?: string[] | null
          recording_url?: string | null
          recording_status?: string | null
          transcript?: string | null
          transcript_status?: string | null
          ai_summary?: string | null
          ai_key_points?: string[] | null
          ai_action_items?: string[] | null
          ai_decisions?: string[] | null
          ai_blockers?: string[] | null
          ai_sentiment_analysis?: Json | null
          ai_processing_status?: string | null
          ai_processing_error?: string | null
          agenda?: string | null
          notes?: string | null
          outcomes?: string | null
          next_steps?: string | null
          is_recurring?: boolean | null
          recurrence_rule?: string | null
          recurrence_parent_id?: string | null
          status?: string | null
          metadata?: Json | null
          external_calendar_id?: string | null
          external_meeting_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          title?: string
          type?: MeetingType | null
          description?: string | null
          scheduled_start?: string | null
          scheduled_end?: string | null
          actual_start?: string | null
          actual_end?: string | null
          timezone?: string | null
          location?: string | null
          meeting_url?: string | null
          dial_in_info?: string | null
          organizer_id?: string
          participants?: string[] | null
          invited_participants?: string[] | null
          required_participants?: string[] | null
          recording_url?: string | null
          recording_status?: string | null
          transcript?: string | null
          transcript_status?: string | null
          ai_summary?: string | null
          ai_key_points?: string[] | null
          ai_action_items?: string[] | null
          ai_decisions?: string[] | null
          ai_blockers?: string[] | null
          ai_sentiment_analysis?: Json | null
          ai_processing_status?: string | null
          ai_processing_error?: string | null
          agenda?: string | null
          notes?: string | null
          outcomes?: string | null
          next_steps?: string | null
          is_recurring?: boolean | null
          recurrence_rule?: string | null
          recurrence_parent_id?: string | null
          status?: string | null
          metadata?: Json | null
          external_calendar_id?: string | null
          external_meeting_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      meeting_attendance: {
        Row: {
          id: string
          meeting_id: string
          user_id: string
          status: string | null
          response_time: string | null
          join_time: string | null
          leave_time: string | null
          duration_minutes: number | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          meeting_id: string
          user_id: string
          status?: string | null
          response_time?: string | null
          join_time?: string | null
          leave_time?: string | null
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          meeting_id?: string
          user_id?: string
          status?: string | null
          response_time?: string | null
          join_time?: string | null
          leave_time?: string | null
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      action_items: {
        Row: {
          id: string
          meeting_id: string | null
          task_id: string | null
          title: string
          description: string | null
          assigned_to: string | null
          due_date: string | null
          priority: Priority | null
          is_ai_generated: boolean | null
          ai_confidence_score: number | null
          is_completed: boolean | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          meeting_id?: string | null
          task_id?: string | null
          title: string
          description?: string | null
          assigned_to?: string | null
          due_date?: string | null
          priority?: Priority | null
          is_ai_generated?: boolean | null
          ai_confidence_score?: number | null
          is_completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          meeting_id?: string | null
          task_id?: string | null
          title?: string
          description?: string | null
          assigned_to?: string | null
          due_date?: string | null
          priority?: Priority | null
          is_ai_generated?: boolean | null
          ai_confidence_score?: number | null
          is_completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      deadlines: {
        Row: {
          id: string
          lab_id: string
          title: string
          description: string | null
          type: DeadlineType
          due_date: string
          submission_url: string | null
          submission_requirements: string | null
          contact_person: string | null
          contact_email: string | null
          assigned_to: string | null
          created_by: string | null
          is_completed: boolean | null
          completed_by: string | null
          completed_at: string | null
          completion_notes: string | null
          submission_confirmation: string | null
          reminder_schedule: number[] | null
          last_reminder_sent_at: string | null
          reminder_recipients: string[] | null
          related_project_id: string | null
          related_tasks: string[] | null
          priority: Priority | null
          is_critical: boolean | null
          tags: string[] | null
          external_links: Json | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          title: string
          description?: string | null
          type: DeadlineType
          due_date: string
          submission_url?: string | null
          submission_requirements?: string | null
          contact_person?: string | null
          contact_email?: string | null
          assigned_to?: string | null
          created_by?: string | null
          is_completed?: boolean | null
          completed_by?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          submission_confirmation?: string | null
          reminder_schedule?: number[] | null
          last_reminder_sent_at?: string | null
          reminder_recipients?: string[] | null
          related_project_id?: string | null
          related_tasks?: string[] | null
          priority?: Priority | null
          is_critical?: boolean | null
          tags?: string[] | null
          external_links?: Json | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          title?: string
          description?: string | null
          type?: DeadlineType
          due_date?: string
          submission_url?: string | null
          submission_requirements?: string | null
          contact_person?: string | null
          contact_email?: string | null
          assigned_to?: string | null
          created_by?: string | null
          is_completed?: boolean | null
          completed_by?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          submission_confirmation?: string | null
          reminder_schedule?: number[] | null
          last_reminder_sent_at?: string | null
          reminder_recipients?: string[] | null
          related_project_id?: string | null
          related_tasks?: string[] | null
          priority?: Priority | null
          is_critical?: boolean | null
          tags?: string[] | null
          external_links?: Json | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      deadline_reminders: {
        Row: {
          id: string
          deadline_id: string
          user_id: string
          days_before: number
          sent_at: string | null
          delivery_method: string | null
          delivered: boolean | null
          opened: boolean | null
        }
        Insert: {
          id?: string
          deadline_id: string
          user_id: string
          days_before: number
          sent_at?: string | null
          delivery_method?: string | null
          delivered?: boolean | null
          opened?: boolean | null
        }
        Update: {
          id?: string
          deadline_id?: string
          user_id?: string
          days_before?: number
          sent_at?: string | null
          delivery_method?: string | null
          delivered?: boolean | null
          opened?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "deadline_reminders_deadline_id_fkey"
            columns: ["deadline_id"]
            isOneToOne: false
            referencedRelation: "deadlines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadline_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      files: {
        Row: {
          id: string
          lab_id: string
          parent_folder_id: string | null
          name: string
          display_name: string | null
          file_type: FileType
          mime_type: string | null
          file_extension: string | null
          storage_provider: StorageProvider | null
          storage_path: string | null
          storage_bucket: string | null
          file_url: string | null
          file_size: number | null
          checksum: string | null
          version: number | null
          description: string | null
          content_summary: string | null
          extracted_text: string | null
          tags: string[] | null
          folder_path: string | null
          position: number | null
          owner_id: string
          is_public: boolean | null
          sharing_settings: Json | null
          related_project_id: string | null
          related_task_id: string | null
          related_meeting_id: string | null
          metadata: Json | null
          external_links: Json | null
          is_deleted: boolean | null
          deleted_at: string | null
          deleted_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          parent_folder_id?: string | null
          name: string
          display_name?: string | null
          file_type: FileType
          mime_type?: string | null
          file_extension?: string | null
          storage_provider?: StorageProvider | null
          storage_path?: string | null
          storage_bucket?: string | null
          file_url?: string | null
          file_size?: number | null
          checksum?: string | null
          version?: number | null
          description?: string | null
          content_summary?: string | null
          extracted_text?: string | null
          tags?: string[] | null
          folder_path?: string | null
          position?: number | null
          owner_id: string
          is_public?: boolean | null
          sharing_settings?: Json | null
          related_project_id?: string | null
          related_task_id?: string | null
          related_meeting_id?: string | null
          metadata?: Json | null
          external_links?: Json | null
          is_deleted?: boolean | null
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          parent_folder_id?: string | null
          name?: string
          display_name?: string | null
          file_type?: FileType
          mime_type?: string | null
          file_extension?: string | null
          storage_provider?: StorageProvider | null
          storage_path?: string | null
          storage_bucket?: string | null
          file_url?: string | null
          file_size?: number | null
          checksum?: string | null
          version?: number | null
          description?: string | null
          content_summary?: string | null
          extracted_text?: string | null
          tags?: string[] | null
          folder_path?: string | null
          position?: number | null
          owner_id?: string
          is_public?: boolean | null
          sharing_settings?: Json | null
          related_project_id?: string | null
          related_task_id?: string | null
          related_meeting_id?: string | null
          metadata?: Json | null
          external_links?: Json | null
          is_deleted?: boolean | null
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          }
        ]
      }
      file_versions: {
        Row: {
          id: string
          file_id: string
          version_number: number
          file_size: number | null
          checksum: string | null
          storage_path: string | null
          file_url: string | null
          change_description: string | null
          changed_by: string
          change_type: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          file_id: string
          version_number: number
          file_size?: number | null
          checksum?: string | null
          storage_path?: string | null
          file_url?: string | null
          change_description?: string | null
          changed_by: string
          change_type?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          file_id?: string
          version_number?: number
          file_size?: number | null
          checksum?: string | null
          storage_path?: string | null
          file_url?: string | null
          change_description?: string | null
          changed_by?: string
          change_type?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_versions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      file_permissions: {
        Row: {
          id: string
          file_id: string
          user_id: string | null
          permission: SharePermission
          granted_by: string
          granted_at: string | null
          expires_at: string | null
          last_accessed_at: string | null
          access_count: number | null
        }
        Insert: {
          id?: string
          file_id: string
          user_id?: string | null
          permission: SharePermission
          granted_by: string
          granted_at?: string | null
          expires_at?: string | null
          last_accessed_at?: string | null
          access_count?: number | null
        }
        Update: {
          id?: string
          file_id?: string
          user_id?: string | null
          permission?: SharePermission
          granted_by?: string
          granted_at?: string | null
          expires_at?: string | null
          last_accessed_at?: string | null
          access_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "file_permissions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      calendar_events: {
        Row: {
          id: string
          lab_id: string
          title: string
          description: string | null
          location: string | null
          event_type: EventType | null
          start_date: string
          end_date: string
          all_day: boolean | null
          timezone: string | null
          is_recurring: boolean | null
          recurrence_rule: string | null
          recurrence_parent_id: string | null
          organizer_id: string
          attendees: string[] | null
          external_calendar_id: string | null
          external_event_id: string | null
          external_provider: CalendarProvider | null
          sync_status: IntegrationStatus | null
          last_synced_at: string | null
          related_meeting_id: string | null
          related_project_id: string | null
          related_deadline_id: string | null
          export_title: string | null
          export_description: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          title: string
          description?: string | null
          location?: string | null
          event_type?: EventType | null
          start_date: string
          end_date: string
          all_day?: boolean | null
          timezone?: string | null
          is_recurring?: boolean | null
          recurrence_rule?: string | null
          recurrence_parent_id?: string | null
          organizer_id: string
          attendees?: string[] | null
          external_calendar_id?: string | null
          external_event_id?: string | null
          external_provider?: CalendarProvider | null
          sync_status?: IntegrationStatus | null
          last_synced_at?: string | null
          related_meeting_id?: string | null
          related_project_id?: string | null
          related_deadline_id?: string | null
          export_title?: string | null
          export_description?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          title?: string
          description?: string | null
          location?: string | null
          event_type?: EventType | null
          start_date?: string
          end_date?: string
          all_day?: boolean | null
          timezone?: string | null
          is_recurring?: boolean | null
          recurrence_rule?: string | null
          recurrence_parent_id?: string | null
          organizer_id?: string
          attendees?: string[] | null
          external_calendar_id?: string | null
          external_event_id?: string | null
          external_provider?: CalendarProvider | null
          sync_status?: IntegrationStatus | null
          last_synced_at?: string | null
          related_meeting_id?: string | null
          related_project_id?: string | null
          related_deadline_id?: string | null
          export_title?: string | null
          export_description?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      calendar_integrations: {
        Row: {
          id: string
          user_id: string
          lab_id: string | null
          provider: CalendarProvider
          name: string
          external_calendar_id: string | null
          access_token_encrypted: string | null
          refresh_token_encrypted: string | null
          expires_at: string | null
          sync_settings: Json | null
          is_primary: boolean | null
          sync_enabled: boolean | null
          status: IntegrationStatus | null
          last_sync_at: string | null
          last_error: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          lab_id?: string | null
          provider: CalendarProvider
          name: string
          external_calendar_id?: string | null
          access_token_encrypted?: string | null
          refresh_token_encrypted?: string | null
          expires_at?: string | null
          sync_settings?: Json | null
          is_primary?: boolean | null
          sync_enabled?: boolean | null
          status?: IntegrationStatus | null
          last_sync_at?: string | null
          last_error?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          lab_id?: string | null
          provider?: CalendarProvider
          name?: string
          external_calendar_id?: string | null
          access_token_encrypted?: string | null
          refresh_token_encrypted?: string | null
          expires_at?: string | null
          sync_settings?: Json | null
          is_primary?: boolean | null
          sync_enabled?: boolean | null
          status?: IntegrationStatus | null
          last_sync_at?: string | null
          last_error?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_integrations_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          lab_id: string | null
          type: NotificationType
          title: string
          message: string | null
          icon: string | null
          reference_type: string | null
          reference_id: string | null
          sender_id: string | null
          channels: Json | null
          priority: string | null
          is_read: boolean | null
          read_at: string | null
          is_clicked: boolean | null
          clicked_at: string | null
          action_url: string | null
          action_text: string | null
          data: Json | null
          email_sent_at: string | null
          push_sent_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          lab_id?: string | null
          type: NotificationType
          title: string
          message?: string | null
          icon?: string | null
          reference_type?: string | null
          reference_id?: string | null
          sender_id?: string | null
          channels?: Json | null
          priority?: string | null
          is_read?: boolean | null
          read_at?: string | null
          is_clicked?: boolean | null
          clicked_at?: string | null
          action_url?: string | null
          action_text?: string | null
          data?: Json | null
          email_sent_at?: string | null
          push_sent_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          lab_id?: string | null
          type?: NotificationType
          title?: string
          message?: string | null
          icon?: string | null
          reference_type?: string | null
          reference_id?: string | null
          sender_id?: string | null
          channels?: Json | null
          priority?: string | null
          is_read?: boolean | null
          read_at?: string | null
          is_clicked?: boolean | null
          clicked_at?: string | null
          action_url?: string | null
          action_text?: string | null
          data?: Json | null
          email_sent_at?: string | null
          push_sent_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          lab_id: string | null
          action: ActivityType
          entity_type: string
          entity_id: string
          entity_name: string | null
          description: string | null
          changes: Json | null
          metadata: Json | null
          ip_address: string | null
          user_agent: string | null
          request_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          lab_id?: string | null
          action: ActivityType
          entity_type: string
          entity_id: string
          entity_name?: string | null
          description?: string | null
          changes?: Json | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          request_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          lab_id?: string | null
          action?: ActivityType
          entity_type?: string
          entity_id?: string
          entity_name?: string | null
          description?: string | null
          changes?: Json | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          request_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          }
        ]
      }
      // Academic & IP Management tables
      publications: {
        Row: {
          id: string
          lab_id: string
          related_project_id: string | null
          title: string
          authors: string
          journal: string | null
          journal_impact_factor: number | null
          publication_date: string | null
          volume: string | null
          issue: string | null
          pages: string | null
          doi: string | null
          pmid: string | null
          pmcid: string | null
          url: string | null
          citation_count: number | null
          last_citation_update: string | null
          h_index_contribution: boolean | null
          type: 'journal' | 'conference' | 'book' | 'patent' | 'preprint' | 'thesis' | 'other' | null
          is_open_access: boolean | null
          internal_notes: string | null
          added_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          related_project_id?: string | null
          title: string
          authors: string
          journal?: string | null
          journal_impact_factor?: number | null
          publication_date?: string | null
          volume?: string | null
          issue?: string | null
          pages?: string | null
          doi?: string | null
          pmid?: string | null
          pmcid?: string | null
          url?: string | null
          citation_count?: number | null
          last_citation_update?: string | null
          h_index_contribution?: boolean | null
          type?: 'journal' | 'conference' | 'book' | 'patent' | 'preprint' | 'thesis' | 'other' | null
          is_open_access?: boolean | null
          internal_notes?: string | null
          added_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          related_project_id?: string | null
          title?: string
          authors?: string
          journal?: string | null
          journal_impact_factor?: number | null
          publication_date?: string | null
          volume?: string | null
          issue?: string | null
          pages?: string | null
          doi?: string | null
          pmid?: string | null
          pmcid?: string | null
          url?: string | null
          citation_count?: number | null
          last_citation_update?: string | null
          h_index_contribution?: boolean | null
          type?: 'journal' | 'conference' | 'book' | 'patent' | 'preprint' | 'thesis' | 'other' | null
          is_open_access?: boolean | null
          internal_notes?: string | null
          added_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      grants: {
        Row: {
          id: string
          lab_id: string
          title: string
          grant_number: string | null
          funding_agency: string
          program_name: string | null
          total_amount: number
          direct_costs: number | null
          indirect_costs: number | null
          currency: string | null
          application_deadline: string | null
          submission_date: string | null
          award_date: string | null
          start_date: string
          end_date: string
          status: GrantStatus | null
          principal_investigator_id: string
          co_investigators: string[] | null
          effort_reporting_required: boolean | null
          progress_reports_required: boolean | null
          next_report_due: string | null
          spent_to_date: number | null
          committed_funds: number | null
          burn_rate: number | null
          program_officer: string | null
          institutional_contact: string | null
          grant_admin_contact: string | null
          related_projects: string[] | null
          keywords: string[] | null
          research_areas: string[] | null
          notes: string | null
          internal_reference: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          title: string
          grant_number?: string | null
          funding_agency: string
          program_name?: string | null
          total_amount: number
          direct_costs?: number | null
          indirect_costs?: number | null
          currency?: string | null
          application_deadline?: string | null
          submission_date?: string | null
          award_date?: string | null
          start_date: string
          end_date: string
          status?: GrantStatus | null
          principal_investigator_id: string
          co_investigators?: string[] | null
          effort_reporting_required?: boolean | null
          progress_reports_required?: boolean | null
          next_report_due?: string | null
          spent_to_date?: number | null
          committed_funds?: number | null
          burn_rate?: number | null
          program_officer?: string | null
          institutional_contact?: string | null
          grant_admin_contact?: string | null
          related_projects?: string[] | null
          keywords?: string[] | null
          research_areas?: string[] | null
          notes?: string | null
          internal_reference?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          title?: string
          grant_number?: string | null
          funding_agency?: string
          program_name?: string | null
          total_amount?: number
          direct_costs?: number | null
          indirect_costs?: number | null
          currency?: string | null
          application_deadline?: string | null
          submission_date?: string | null
          award_date?: string | null
          start_date?: string
          end_date?: string
          status?: GrantStatus | null
          principal_investigator_id?: string
          co_investigators?: string[] | null
          effort_reporting_required?: boolean | null
          progress_reports_required?: boolean | null
          next_report_due?: string | null
          spent_to_date?: number | null
          committed_funds?: number | null
          burn_rate?: number | null
          program_officer?: string | null
          institutional_contact?: string | null
          grant_admin_contact?: string | null
          related_projects?: string[] | null
          keywords?: string[] | null
          research_areas?: string[] | null
          notes?: string | null
          internal_reference?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_analytics: {
        Row: {
          id: string
          user_id: string | null
          lab_id: string | null
          event_type: string
          event_data: Json | null
          page_url: string | null
          referrer: string | null
          session_id: string | null
          ip_address: string | null
          user_agent: string | null
          screen_resolution: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          lab_id?: string | null
          event_type: string
          event_data?: Json | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          screen_resolution?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          lab_id?: string | null
          event_type?: string
          event_data?: Json | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          screen_resolution?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_analytics_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_lab_member: {
        Args: {
          lab_id: string
          user_id?: string
        }
        Returns: boolean
      }
      has_lab_permission: {
        Args: {
          lab_id: string
          permission_name: string
          user_id?: string
        }
        Returns: boolean
      }
      generate_lab_slug: {
        Args: {
          lab_name: string
        }
        Returns: string
      }
    }
    Enums: {
      user_role: UserRole
      lab_status: LabStatus
      bucket_status: BucketStatus
      project_status: ProjectStatus
      task_status: TaskStatus
      priority: Priority
      meeting_type: MeetingType
      notification_type: NotificationType
      activity_type: ActivityType
      comment_type: CommentType
      idea_status: IdeaStatus
      idea_category: IdeaCategory
      effort_level: EffortLevel
      impact_level: ImpactLevel
      deadline_type: DeadlineType
      file_type: FileType
      storage_provider: StorageProvider
      share_permission: SharePermission
      event_type: EventType
      calendar_provider: CalendarProvider
      integration_status: IntegrationStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type helpers for easier usage
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof Database["public"]["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof Database["public"]["CompositeTypes"]
    ? Database["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never