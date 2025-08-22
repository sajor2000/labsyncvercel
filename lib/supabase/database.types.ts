// TypeScript definitions for Supabase database
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      labs: {
        Row: {
          id: string
          name: string
          department: string | null
          full_name: string | null
          description: string | null
          website_url: string | null
          contact_email: string | null
          phone: string | null
          address: string | null
          is_active: boolean | null
          lab_code: string | null
          funding_sources: string[] | null
          research_areas: string[] | null
          equipment: string[] | null
          certifications: string[] | null
          compliance_info: Json | null
          features: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          department?: string | null
          full_name?: string | null
          description?: string | null
          website_url?: string | null
          contact_email?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean | null
          lab_code?: string | null
          funding_sources?: string[] | null
          research_areas?: string[] | null
          equipment?: string[] | null
          certifications?: string[] | null
          compliance_info?: Json | null
          features?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          department?: string | null
          full_name?: string | null
          description?: string | null
          website_url?: string | null
          contact_email?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean | null
          lab_code?: string | null
          funding_sources?: string[] | null
          research_areas?: string[] | null
          equipment?: string[] | null
          certifications?: string[] | null
          compliance_info?: Json | null
          features?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lab_members: {
        Row: {
          id: string
          user_id: string
          lab_id: string
          lab_role: Database['public']['Enums']['user_role'] | null
          is_admin: boolean | null
          is_super_admin: boolean | null
          can_manage_members: boolean | null
          can_manage_lab_settings: boolean | null
          can_view_audit_logs: boolean | null
          can_manage_permissions: boolean | null
          can_create_projects: boolean | null
          can_edit_all_projects: boolean | null
          can_delete_projects: boolean | null
          can_view_all_projects: boolean | null
          can_archive_projects: boolean | null
          can_restore_projects: boolean | null
          can_assign_tasks: boolean | null
          can_edit_all_tasks: boolean | null
          can_delete_tasks: boolean | null
          can_view_all_tasks: boolean | null
          can_manage_task_templates: boolean | null
          can_set_task_priorities: boolean | null
          can_access_reports: boolean | null
          can_export_data: boolean | null
          can_view_analytics: boolean | null
          can_manage_deadlines: boolean | null
          can_view_financials: boolean | null
          can_schedule_meetings: boolean | null
          can_manage_standups: boolean | null
          can_send_lab_announcements: boolean | null
          can_moderate_discussions: boolean | null
          is_active: boolean | null
          joined_at: string | null
          left_at: string | null
          last_permission_update: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          lab_id: string
          lab_role?: Database['public']['Enums']['user_role'] | null
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          can_manage_members?: boolean | null
          can_manage_lab_settings?: boolean | null
          can_view_audit_logs?: boolean | null
          can_manage_permissions?: boolean | null
          can_create_projects?: boolean | null
          can_edit_all_projects?: boolean | null
          can_delete_projects?: boolean | null
          can_view_all_projects?: boolean | null
          can_archive_projects?: boolean | null
          can_restore_projects?: boolean | null
          can_assign_tasks?: boolean | null
          can_edit_all_tasks?: boolean | null
          can_delete_tasks?: boolean | null
          can_view_all_tasks?: boolean | null
          can_manage_task_templates?: boolean | null
          can_set_task_priorities?: boolean | null
          can_access_reports?: boolean | null
          can_export_data?: boolean | null
          can_view_analytics?: boolean | null
          can_manage_deadlines?: boolean | null
          can_view_financials?: boolean | null
          can_schedule_meetings?: boolean | null
          can_manage_standups?: boolean | null
          can_send_lab_announcements?: boolean | null
          can_moderate_discussions?: boolean | null
          is_active?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          last_permission_update?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          lab_id?: string
          lab_role?: Database['public']['Enums']['user_role'] | null
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          can_manage_members?: boolean | null
          can_manage_lab_settings?: boolean | null
          can_view_audit_logs?: boolean | null
          can_manage_permissions?: boolean | null
          can_create_projects?: boolean | null
          can_edit_all_projects?: boolean | null
          can_delete_projects?: boolean | null
          can_view_all_projects?: boolean | null
          can_archive_projects?: boolean | null
          can_restore_projects?: boolean | null
          can_assign_tasks?: boolean | null
          can_edit_all_tasks?: boolean | null
          can_delete_tasks?: boolean | null
          can_view_all_tasks?: boolean | null
          can_manage_task_templates?: boolean | null
          can_set_task_priorities?: boolean | null
          can_access_reports?: boolean | null
          can_export_data?: boolean | null
          can_view_analytics?: boolean | null
          can_manage_deadlines?: boolean | null
          can_view_financials?: boolean | null
          can_schedule_meetings?: boolean | null
          can_manage_standups?: boolean | null
          can_send_lab_announcements?: boolean | null
          can_moderate_discussions?: boolean | null
          is_active?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          last_permission_update?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'lab_members_lab_id_fkey'
            columns: ['lab_id']
            isOneToOne: false
            referencedRelation: 'labs'
            referencedColumns: ['id']
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          name: string
          email: string
          first_name: string | null
          last_name: string | null
          initials: string | null
          avatar_url: string | null
          phone: string | null
          department: string | null
          title: string | null
          bio: string | null
          research_interests: string[] | null
          publications: Json | null
          education: Json | null
          is_active: boolean | null
          last_login: string | null
          email_verified: boolean | null
          onboarding_completed: boolean | null
          preferences: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          first_name?: string | null
          last_name?: string | null
          initials?: string | null
          avatar_url?: string | null
          phone?: string | null
          department?: string | null
          title?: string | null
          bio?: string | null
          research_interests?: string[] | null
          publications?: Json | null
          education?: Json | null
          is_active?: boolean | null
          last_login?: string | null
          email_verified?: boolean | null
          onboarding_completed?: boolean | null
          preferences?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          initials?: string | null
          avatar_url?: string | null
          phone?: string | null
          department?: string | null
          title?: string | null
          bio?: string | null
          research_interests?: string[] | null
          publications?: Json | null
          education?: Json | null
          is_active?: boolean | null
          last_login?: string | null
          email_verified?: boolean | null
          onboarding_completed?: boolean | null
          preferences?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      studies: {
        Row: {
          id: string
          title: string
          description: string | null
          status: Database['public']['Enums']['study_status'] | null
          priority: Database['public']['Enums']['priority'] | null
          lab_id: string
          principal_investigator_id: string | null
          study_type: string | null
          funding_type: Database['public']['Enums']['funding_type'] | null
          funding_amount: number | null
          start_date: string | null
          end_date: string | null
          estimated_duration_months: number | null
          irb_number: string | null
          irb_approval_date: string | null
          irb_expiration_date: string | null
          protocol_version: string | null
          objectives: string | null
          inclusion_criteria: string | null
          exclusion_criteria: string | null
          primary_endpoints: string | null
          secondary_endpoints: string | null
          study_population_size: number | null
          current_enrollment: number | null
          protocol_file_url: string | null
          consent_form_url: string | null
          data_collection_forms: Json | null
          is_active: boolean | null
          is_deleted: boolean | null
          deleted_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: Database['public']['Enums']['study_status'] | null
          priority?: Database['public']['Enums']['priority'] | null
          lab_id: string
          principal_investigator_id?: string | null
          study_type?: string | null
          funding_type?: Database['public']['Enums']['funding_type'] | null
          funding_amount?: number | null
          start_date?: string | null
          end_date?: string | null
          estimated_duration_months?: number | null
          irb_number?: string | null
          irb_approval_date?: string | null
          irb_expiration_date?: string | null
          protocol_version?: string | null
          objectives?: string | null
          inclusion_criteria?: string | null
          exclusion_criteria?: string | null
          primary_endpoints?: string | null
          secondary_endpoints?: string | null
          study_population_size?: number | null
          current_enrollment?: number | null
          protocol_file_url?: string | null
          consent_form_url?: string | null
          data_collection_forms?: Json | null
          is_active?: boolean | null
          is_deleted?: boolean | null
          deleted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: Database['public']['Enums']['study_status'] | null
          priority?: Database['public']['Enums']['priority'] | null
          lab_id?: string
          principal_investigator_id?: string | null
          study_type?: string | null
          funding_type?: Database['public']['Enums']['funding_type'] | null
          funding_amount?: number | null
          start_date?: string | null
          end_date?: string | null
          estimated_duration_months?: number | null
          irb_number?: string | null
          irb_approval_date?: string | null
          irb_expiration_date?: string | null
          protocol_version?: string | null
          objectives?: string | null
          inclusion_criteria?: string | null
          exclusion_criteria?: string | null
          primary_endpoints?: string | null
          secondary_endpoints?: string | null
          study_population_size?: number | null
          current_enrollment?: number | null
          protocol_file_url?: string | null
          consent_form_url?: string | null
          data_collection_forms?: Json | null
          is_active?: boolean | null
          is_deleted?: boolean | null
          deleted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'studies_lab_id_fkey'
            columns: ['lab_id']
            referencedRelation: 'labs'
            referencedColumns: ['id']
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: Database['public']['Enums']['task_status'] | null
          priority: Database['public']['Enums']['priority'] | null
          study_id: string | null
          assignee_id: string | null
          created_by: string | null
          lab_id: string
          due_date: string | null
          start_date: string | null
          completed_date: string | null
          estimated_hours: number | null
          actual_hours: number | null
          task_type: string | null
          dependencies: string[] | null
          tags: string[] | null
          attachments: Json | null
          reminder_sent: boolean | null
          reminder_date: string | null
          is_active: boolean | null
          is_deleted: boolean | null
          deleted_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: Database['public']['Enums']['task_status'] | null
          priority?: Database['public']['Enums']['priority'] | null
          study_id?: string | null
          assignee_id?: string | null
          created_by?: string | null
          lab_id: string
          due_date?: string | null
          start_date?: string | null
          completed_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          task_type?: string | null
          dependencies?: string[] | null
          tags?: string[] | null
          attachments?: Json | null
          reminder_sent?: boolean | null
          reminder_date?: string | null
          is_active?: boolean | null
          is_deleted?: boolean | null
          deleted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: Database['public']['Enums']['task_status'] | null
          priority?: Database['public']['Enums']['priority'] | null
          study_id?: string | null
          assignee_id?: string | null
          created_by?: string | null
          lab_id?: string
          due_date?: string | null
          start_date?: string | null
          completed_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          task_type?: string | null
          dependencies?: string[] | null
          tags?: string[] | null
          attachments?: Json | null
          reminder_sent?: boolean | null
          reminder_date?: string | null
          is_active?: boolean | null
          is_deleted?: boolean | null
          deleted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_lab_id_fkey'
            columns: ['lab_id']
            referencedRelation: 'labs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_study_id_fkey'
            columns: ['study_id']
            referencedRelation: 'studies'
            referencedColumns: ['id']
          }
        ]
      }
      standup_meetings: {
        Row: {
          id: string
          title: string
          date: string
          lab_id: string
          duration_minutes: number | null
          attendees: string[] | null
          meeting_type: string | null
          location: string | null
          audio_file_url: string | null
          transcript: string | null
          transcript_processed: boolean | null
          ai_summary: Json | null
          ai_processing_status: string | null
          ai_processing_error: string | null
          notes: string | null
          next_meeting_topics: string[] | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          date: string
          lab_id: string
          duration_minutes?: number | null
          attendees?: string[] | null
          meeting_type?: string | null
          location?: string | null
          audio_file_url?: string | null
          transcript?: string | null
          transcript_processed?: boolean | null
          ai_summary?: Json | null
          ai_processing_status?: string | null
          ai_processing_error?: string | null
          notes?: string | null
          next_meeting_topics?: string[] | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          date?: string
          lab_id?: string
          duration_minutes?: number | null
          attendees?: string[] | null
          meeting_type?: string | null
          location?: string | null
          audio_file_url?: string | null
          transcript?: string | null
          transcript_processed?: boolean | null
          ai_summary?: Json | null
          ai_processing_status?: string | null
          ai_processing_error?: string | null
          notes?: string | null
          next_meeting_topics?: string[] | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'standup_meetings_lab_id_fkey'
            columns: ['lab_id']
            referencedRelation: 'labs'
            referencedColumns: ['id']
          }
        ]
      }
      standup_action_items: {
        Row: {
          id: string
          meeting_id: string
          description: string
          assignee_id: string | null
          priority: Database['public']['Enums']['priority'] | null
          due_date: string | null
          status: Database['public']['Enums']['task_status'] | null
          related_study_id: string | null
          mentioned_by: string | null
          extracted_at: string | null
          ai_confidence: number | null
          ai_extraction_method: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          meeting_id: string
          description: string
          assignee_id?: string | null
          priority?: Database['public']['Enums']['priority'] | null
          due_date?: string | null
          status?: Database['public']['Enums']['task_status'] | null
          related_study_id?: string | null
          mentioned_by?: string | null
          extracted_at?: string | null
          ai_confidence?: number | null
          ai_extraction_method?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          meeting_id?: string
          description?: string
          assignee_id?: string | null
          priority?: Database['public']['Enums']['priority'] | null
          due_date?: string | null
          status?: Database['public']['Enums']['task_status'] | null
          related_study_id?: string | null
          mentioned_by?: string | null
          extracted_at?: string | null
          ai_confidence?: number | null
          ai_extraction_method?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'standup_action_items_meeting_id_fkey'
            columns: ['meeting_id']
            referencedRelation: 'standup_meetings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'standup_action_items_related_study_id_fkey'
            columns: ['related_study_id']
            referencedRelation: 'studies'
            referencedColumns: ['id']
          }
        ]
      }
      calendar_events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_type: string
          start_date: string
          end_date: string
          all_day: boolean | null
          duration: number | null
          location: string | null
          participants: number | null
          status: string | null
          lab_id: string
          created_by: string | null
          google_calendar_id: string | null
          google_calendar_url: string | null
          export_title: string | null
          export_description: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_type: string
          start_date: string
          end_date: string
          all_day?: boolean | null
          duration?: number | null
          location?: string | null
          participants?: number | null
          status?: string | null
          lab_id: string
          created_by?: string | null
          google_calendar_id?: string | null
          google_calendar_url?: string | null
          export_title?: string | null
          export_description?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_type?: string
          start_date?: string
          end_date?: string
          all_day?: boolean | null
          duration?: number | null
          location?: string | null
          participants?: number | null
          status?: string | null
          lab_id?: string
          created_by?: string | null
          google_calendar_id?: string | null
          google_calendar_url?: string | null
          export_title?: string | null
          export_description?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'calendar_events_lab_id_fkey'
            columns: ['lab_id']
            referencedRelation: 'labs'
            referencedColumns: ['id']
          }
        ]
      }
      deadlines: {
        Row: {
          id: string
          title: string
          description: string | null
          type: string
          due_date: string
          priority: Database['public']['Enums']['priority'] | null
          status: string | null
          lab_id: string
          study_id: string | null
          assigned_to: string | null
          created_by: string | null
          reminder_days_before: number[] | null
          last_reminder_sent: string | null
          completed_date: string | null
          completion_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type: string
          due_date: string
          priority?: Database['public']['Enums']['priority'] | null
          status?: string | null
          lab_id: string
          study_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          reminder_days_before?: number[] | null
          last_reminder_sent?: string | null
          completed_date?: string | null
          completion_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: string
          due_date?: string
          priority?: Database['public']['Enums']['priority'] | null
          status?: string | null
          lab_id?: string
          study_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          reminder_days_before?: number[] | null
          last_reminder_sent?: string | null
          completed_date?: string | null
          completion_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'deadlines_lab_id_fkey'
            columns: ['lab_id']
            referencedRelation: 'labs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deadlines_study_id_fkey'
            columns: ['study_id']
            referencedRelation: 'studies'
            referencedColumns: ['id']
          }
        ]
      }
      workflow_steps: {
        Row: {
          id: string
          workflow_id: string
          step_type: string
          step_name: string
          status: string | null
          input_data: Json | null
          output_data: Json | null
          error_message: string | null
          processing_time_ms: number | null
          user_id: string | null
          lab_id: string | null
          meeting_id: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          workflow_id: string
          step_type: string
          step_name: string
          status?: string | null
          input_data?: Json | null
          output_data?: Json | null
          error_message?: string | null
          processing_time_ms?: number | null
          user_id?: string | null
          lab_id?: string | null
          meeting_id?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          workflow_id?: string
          step_type?: string
          step_name?: string
          status?: string | null
          input_data?: Json | null
          output_data?: Json | null
          error_message?: string | null
          processing_time_ms?: number | null
          user_id?: string | null
          lab_id?: string | null
          meeting_id?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'workflow_steps_lab_id_fkey'
            columns: ['lab_id']
            referencedRelation: 'labs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workflow_steps_meeting_id_fkey'
            columns: ['meeting_id']
            referencedRelation: 'standup_meetings'
            referencedColumns: ['id']
          }
        ]
      }
      ideas: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string | null
          priority: Database['public']['Enums']['priority'] | null
          status: string | null
          lab_id: string
          created_by: string | null
          implementation_notes: string | null
          estimated_effort: string | null
          potential_impact: string | null
          interested_members: string[] | null
          discussion_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category?: string | null
          priority?: Database['public']['Enums']['priority'] | null
          status?: string | null
          lab_id: string
          created_by?: string | null
          implementation_notes?: string | null
          estimated_effort?: string | null
          potential_impact?: string | null
          interested_members?: string[] | null
          discussion_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string | null
          priority?: Database['public']['Enums']['priority'] | null
          status?: string | null
          lab_id?: string
          created_by?: string | null
          implementation_notes?: string | null
          estimated_effort?: string | null
          potential_impact?: string | null
          interested_members?: string[] | null
          discussion_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ideas_lab_id_fkey'
            columns: ['lab_id']
            referencedRelation: 'labs'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role:
        | 'PRINCIPAL_INVESTIGATOR'
        | 'CO_PRINCIPAL_INVESTIGATOR'
        | 'DATA_SCIENTIST'
        | 'DATA_ANALYST'
        | 'CLINICAL_RESEARCH_COORDINATOR'
        | 'REGULATORY_COORDINATOR'
        | 'STAFF_COORDINATOR'
        | 'LAB_ADMINISTRATOR'
        | 'FELLOW'
        | 'MEDICAL_STUDENT'
        | 'RESEARCH_ASSISTANT'
        | 'VOLUNTEER_RESEARCH_ASSISTANT'
        | 'EXTERNAL_COLLABORATOR'
        | 'PI'
        | 'RESEARCH_COORDINATOR'
        | 'RESEARCHER'
        | 'STUDENT'
        | 'ADMIN'
      study_status:
        | 'PLANNING'
        | 'IRB_SUBMISSION'
        | 'IRB_APPROVED'
        | 'DATA_COLLECTION'
        | 'ANALYSIS'
        | 'MANUSCRIPT'
        | 'UNDER_REVIEW'
        | 'PUBLISHED'
        | 'ON_HOLD'
        | 'CANCELLED'
      task_status:
        | 'TODO'
        | 'IN_PROGRESS'
        | 'REVIEW'
        | 'DONE'
        | 'BLOCKED'
      priority:
        | 'LOW'
        | 'MEDIUM'
        | 'HIGH'
        | 'URGENT'
      funding_type:
        | 'NIH'
        | 'NSF'
        | 'INDUSTRY_SPONSORED'
        | 'INTERNAL'
        | 'FOUNDATION'
        | 'OTHER'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}