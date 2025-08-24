// Auto-generated TypeScript types for Supabase database
// Generated on: 2025-08-23T01:30:22.018Z

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      deadlines: {
        Row: {
          id: string
          title: string
          description: string | null
          type: string
          due_date: string
          priority: any | null
          status: string | null
          lab_id: string
          study_id: string | null
          assigned_to: string | null
          created_by: string | null
          reminder_days_before: any | null
          last_reminder_sent: string | null
          completed_date: string | null
          completion_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string | null
          type: string
          due_date: string
          priority: any | null
          status: string | null
          lab_id: string
          study_id: string | null
          assigned_to: string | null
          created_by: string | null
          reminder_days_before: any | null
          last_reminder_sent: string | null
          completed_date: string | null
          completion_notes: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: string
          due_date?: string
          priority?: any | null
          status?: string | null
          lab_id?: string
          study_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          reminder_days_before?: any | null
          last_reminder_sent?: string | null
          completed_date?: string | null
          completion_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      standup_meetings: {
        Row: {
          id: string
          title: string
          date: string
          lab_id: string
          duration_minutes: number | null
          attendees: any | null
          meeting_type: string | null
          location: string | null
          audio_file_url: string | null
          transcript: string | null
          transcript_processed: boolean | null
          ai_summary: Json | null
          ai_processing_status: string | null
          ai_processing_error: string | null
          notes: string | null
          next_meeting_topics: any | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          date: string
          lab_id: string
          duration_minutes: number | null
          attendees: any | null
          meeting_type: string | null
          location: string | null
          audio_file_url: string | null
          transcript: string | null
          transcript_processed: boolean | null
          ai_summary: Json | null
          ai_processing_status: string | null
          ai_processing_error: string | null
          notes: string | null
          next_meeting_topics: any | null
          created_by: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          date?: string
          lab_id?: string
          duration_minutes?: number | null
          attendees?: any | null
          meeting_type?: string | null
          location?: string | null
          audio_file_url?: string | null
          transcript?: string | null
          transcript_processed?: boolean | null
          ai_summary?: Json | null
          ai_processing_status?: string | null
          ai_processing_error?: string | null
          notes?: string | null
          next_meeting_topics?: any | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          id: string
          lab_id: string
          entity_type: string
          entity_id: string
          action: string
          user_id: string | null
          changes: Json | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          entity_type: string
          entity_id: string
          action: string
          user_id: string | null
          changes: Json | null
          metadata: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          entity_type?: string
          entity_id?: string
          action?: string
          user_id?: string | null
          changes?: Json | null
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      project_buckets: {
        Row: {
          id: string
          name: string
          description: string | null
          lab_id: string
          created_by: string | null
          color: string | null
          icon: string | null
          position: number | null
          is_active: boolean | null
          custom_fields: Json | null
          field_definitions: any | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string | null
          lab_id: string
          created_by: string | null
          color: string | null
          icon: string | null
          position: number | null
          is_active: boolean | null
          custom_fields: Json | null
          field_definitions: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          lab_id?: string
          created_by?: string | null
          color?: string | null
          icon?: string | null
          position?: number | null
          is_active?: boolean | null
          custom_fields?: Json | null
          field_definitions?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      labels: {
        Row: {
          id: string
          lab_id: string
          name: string
          color: string
          description: string | null
          icon: string | null
          is_active: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          name: string
          color: string
          description: string | null
          icon: string | null
          is_active: boolean | null
          created_by: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          name?: string
          color?: string
          description?: string | null
          icon?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      custom_field_definitions: {
        Row: {
          id: string
          lab_id: string
          entity_type: string
          field_name: string
          field_key: string
          field_type: string
          field_config: Json
          default_value: Json | null
          is_required: boolean | null
          is_visible: boolean | null
          is_searchable: boolean | null
          position: number | null
          description: string | null
          help_text: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          entity_type: string
          field_name: string
          field_key: string
          field_type: string
          field_config: Json
          default_value: Json | null
          is_required: boolean | null
          is_visible: boolean | null
          is_searchable: boolean | null
          position: number | null
          description: string | null
          help_text: string | null
          created_by: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          entity_type?: string
          field_name?: string
          field_key?: string
          field_type?: string
          field_config?: Json
          default_value?: Json | null
          is_required?: boolean | null
          is_visible?: boolean | null
          is_searchable?: boolean | null
          position?: number | null
          description?: string | null
          help_text?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      resource_allocations: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          study_id: string | null
          allocation_percentage: number | null
          start_date: string
          end_date: string
          hours_per_day: number | null
          notes: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string | null
          study_id: string | null
          allocation_percentage: number | null
          start_date: string
          end_date: string
          hours_per_day: number | null
          notes: string | null
          created_by: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string | null
          study_id?: string | null
          allocation_percentage?: number | null
          start_date?: string
          end_date?: string
          hours_per_day?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      standup_action_items: {
        Row: {
          id: string
          meeting_id: string
          description: string
          assignee_id: string | null
          priority: any | null
          due_date: string | null
          status: any | null
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
          assignee_id: string | null
          priority: any | null
          due_date: string | null
          status: any | null
          related_study_id: string | null
          mentioned_by: string | null
          extracted_at: string | null
          ai_confidence: number | null
          ai_extraction_method: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          meeting_id?: string
          description?: string
          assignee_id?: string | null
          priority?: any | null
          due_date?: string | null
          status?: any | null
          related_study_id?: string | null
          mentioned_by?: string | null
          extracted_at?: string | null
          ai_confidence?: number | null
          ai_extraction_method?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: any | null
          priority: any | null
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
          dependencies: any | null
          tags: any | null
          attachments: Json | null
          reminder_sent: boolean | null
          reminder_date: string | null
          is_active: boolean | null
          is_deleted: boolean | null
          deleted_at: string | null
          created_at: string | null
          updated_at: string | null
          bucket_id: string | null
          task_group_id: string | null
          parent_task_id: string | null
          task_number: string | null
          position_in_group: number | null
          depth_level: number | null
          has_subtasks: boolean | null
          subtask_count: number | null
          completed_subtask_count: number | null
          checklist_items: Json | null
          checklist_completed_count: number | null
          time_tracking_enabled: boolean | null
          billable: boolean | null
          recurring_config: Json | null
          is_milestone: boolean | null
          blocking_tasks: any | null
          blocked_by_tasks: any | null
          workflow_state_id: string | null
          sprint_id: string | null
          story_points: number | null
          t_shirt_size: string | null
          custom_fields: Json | null
          field_definitions: any | null
        }
        Insert: {
          id?: string
          title: string
          description: string | null
          status: any | null
          priority: any | null
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
          dependencies: any | null
          tags: any | null
          attachments: Json | null
          reminder_sent: boolean | null
          reminder_date: string | null
          is_active: boolean | null
          is_deleted: boolean | null
          deleted_at: string | null
          created_at?: string | null
          updated_at?: string | null
          bucket_id: string | null
          task_group_id: string | null
          parent_task_id: string | null
          task_number: string | null
          position_in_group: number | null
          depth_level: number | null
          has_subtasks: boolean | null
          subtask_count: number | null
          completed_subtask_count: number | null
          checklist_items: Json | null
          checklist_completed_count: number | null
          time_tracking_enabled: boolean | null
          billable: boolean | null
          recurring_config: Json | null
          is_milestone: boolean | null
          blocking_tasks: any | null
          blocked_by_tasks: any | null
          workflow_state_id: string | null
          sprint_id: string | null
          story_points: number | null
          t_shirt_size: string | null
          custom_fields: Json | null
          field_definitions: any | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: any | null
          priority?: any | null
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
          dependencies?: any | null
          tags?: any | null
          attachments?: Json | null
          reminder_sent?: boolean | null
          reminder_date?: string | null
          is_active?: boolean | null
          is_deleted?: boolean | null
          deleted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          bucket_id?: string | null
          task_group_id?: string | null
          parent_task_id?: string | null
          task_number?: string | null
          position_in_group?: number | null
          depth_level?: number | null
          has_subtasks?: boolean | null
          subtask_count?: number | null
          completed_subtask_count?: number | null
          checklist_items?: Json | null
          checklist_completed_count?: number | null
          time_tracking_enabled?: boolean | null
          billable?: boolean | null
          recurring_config?: Json | null
          is_milestone?: boolean | null
          blocking_tasks?: any | null
          blocked_by_tasks?: any | null
          workflow_state_id?: string | null
          sprint_id?: string | null
          story_points?: number | null
          t_shirt_size?: string | null
          custom_fields?: Json | null
          field_definitions?: any | null
        }
        Relationships: []
      }
      daily_statistics: {
        Row: {
          id: string
          lab_id: string
          stat_date: string
          metrics: Json
          created_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          stat_date: string
          metrics: Json
          created_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          stat_date?: string
          metrics?: Json
          created_at?: string | null
        }
        Relationships: []
      }
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
          funding_sources: any | null
          research_areas: any | null
          equipment: any | null
          certifications: any | null
          compliance_info: Json | null
          features: any | null
          created_at: string | null
          updated_at: string | null
          logo_url: string | null
          primary_color: string | null
          status: string | null
          member_count: number | null
          study_count: number | null
          bucket_count: number | null
          short_description: string | null
        }
        Insert: {
          id?: string
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
          funding_sources: any | null
          research_areas: any | null
          equipment: any | null
          certifications: any | null
          compliance_info: Json | null
          features: any | null
          created_at?: string | null
          updated_at?: string | null
          logo_url: string | null
          primary_color: string | null
          status: string | null
          member_count: number | null
          study_count: number | null
          bucket_count: number | null
          short_description: string | null
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
          funding_sources?: any | null
          research_areas?: any | null
          equipment?: any | null
          certifications?: any | null
          compliance_info?: Json | null
          features?: any | null
          created_at?: string | null
          updated_at?: string | null
          logo_url?: string | null
          primary_color?: string | null
          status?: string | null
          member_count?: number | null
          study_count?: number | null
          bucket_count?: number | null
          short_description?: string | null
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          id: string
          task_id: string
          user_id: string
          start_time: string
          end_time: string | null
          duration_minutes: number | null
          description: string | null
          is_billable: boolean | null
          hourly_rate: number | null
          tags: any | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          start_time: string
          end_time: string | null
          duration_minutes: number | null
          description: string | null
          is_billable: boolean | null
          hourly_rate: number | null
          tags: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          start_time?: string
          end_time?: string | null
          duration_minutes?: number | null
          description?: string | null
          is_billable?: boolean | null
          hourly_rate?: number | null
          tags?: any | null
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
          status: any | null
          priority: any | null
          lab_id: string
          principal_investigator_id: string | null
          study_type: string | null
          funding_type: any | null
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
          first_author: string | null
          last_author: string | null
          other_authors: any | null
          corresponding_author: string | null
          author_emails: Json | null
          ora_number: string | null
          ora_submission_date: string | null
          ora_approval_date: string | null
          ora_status: string | null
          irb_protocol_number: string | null
          irb_amendment_number: string | null
          irb_annual_review_date: string | null
          ethics_committee: string | null
          publication_status: string | null
          doi: string | null
          pmid: string | null
          journal_name: string | null
          publication_date: string | null
          citation_count: number | null
          primary_bucket_id: string | null
          parent_study_id: string | null
          template_id: string | null
          study_number: string | null
          health_status: string | null
          completion_method: string | null
          effort_estimate_hours: number | null
          actual_hours: number | null
          position_in_bucket: number | null
          is_template: boolean | null
          template_data: Json | null
          workflow_state_id: string | null
          board_column: string | null
          board_position: number | null
          bucket_id: string | null
          progress_percentage: number | null
          milestone_count: number | null
          completed_milestone_count: number | null
          custom_fields: Json | null
          field_definitions: any | null
        }
        Insert: {
          id?: string
          title: string
          description: string | null
          status: any | null
          priority: any | null
          lab_id: string
          principal_investigator_id: string | null
          study_type: string | null
          funding_type: any | null
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
          created_at?: string | null
          updated_at?: string | null
          first_author: string | null
          last_author: string | null
          other_authors: any | null
          corresponding_author: string | null
          author_emails: Json | null
          ora_number: string | null
          ora_submission_date: string | null
          ora_approval_date: string | null
          ora_status: string | null
          irb_protocol_number: string | null
          irb_amendment_number: string | null
          irb_annual_review_date: string | null
          ethics_committee: string | null
          publication_status: string | null
          doi: string | null
          pmid: string | null
          journal_name: string | null
          publication_date: string | null
          citation_count: number | null
          primary_bucket_id: string | null
          parent_study_id: string | null
          template_id: string | null
          study_number: string | null
          health_status: string | null
          completion_method: string | null
          effort_estimate_hours: number | null
          actual_hours: number | null
          position_in_bucket: number | null
          is_template: boolean | null
          template_data: Json | null
          workflow_state_id: string | null
          board_column: string | null
          board_position: number | null
          bucket_id: string | null
          progress_percentage: number | null
          milestone_count: number | null
          completed_milestone_count: number | null
          custom_fields: Json | null
          field_definitions: any | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: any | null
          priority?: any | null
          lab_id?: string
          principal_investigator_id?: string | null
          study_type?: string | null
          funding_type?: any | null
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
          first_author?: string | null
          last_author?: string | null
          other_authors?: any | null
          corresponding_author?: string | null
          author_emails?: Json | null
          ora_number?: string | null
          ora_submission_date?: string | null
          ora_approval_date?: string | null
          ora_status?: string | null
          irb_protocol_number?: string | null
          irb_amendment_number?: string | null
          irb_annual_review_date?: string | null
          ethics_committee?: string | null
          publication_status?: string | null
          doi?: string | null
          pmid?: string | null
          journal_name?: string | null
          publication_date?: string | null
          citation_count?: number | null
          primary_bucket_id?: string | null
          parent_study_id?: string | null
          template_id?: string | null
          study_number?: string | null
          health_status?: string | null
          completion_method?: string | null
          effort_estimate_hours?: number | null
          actual_hours?: number | null
          position_in_bucket?: number | null
          is_template?: boolean | null
          template_data?: Json | null
          workflow_state_id?: string | null
          board_column?: string | null
          board_position?: number | null
          bucket_id?: string | null
          progress_percentage?: number | null
          milestone_count?: number | null
          completed_milestone_count?: number | null
          custom_fields?: Json | null
          field_definitions?: any | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          id: string
          lab_id: string
          template_type: string
          name: string
          description: string | null
          icon: string | null
          category: string | null
          template_data: Json
          usage_count: number | null
          is_public: boolean | null
          created_by: string | null
          tags: any | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          template_type: string
          name: string
          description: string | null
          icon: string | null
          category: string | null
          template_data: Json
          usage_count: number | null
          is_public: boolean | null
          created_by: string | null
          tags: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          template_type?: string
          name?: string
          description?: string | null
          icon?: string | null
          category?: string | null
          template_data?: Json
          usage_count?: number | null
          is_public?: boolean | null
          created_by?: string | null
          tags?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_views: {
        Row: {
          id: string
          lab_id: string
          user_id: string | null
          entity_type: string
          view_name: string
          view_type: string
          is_default: boolean | null
          is_shared: boolean | null
          view_config: Json
          position: number | null
          icon: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          user_id: string | null
          entity_type: string
          view_name: string
          view_type: string
          is_default: boolean | null
          is_shared: boolean | null
          view_config: Json
          position: number | null
          icon: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          user_id?: string | null
          entity_type?: string
          view_name?: string
          view_type?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          view_config?: Json
          position?: number | null
          icon?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      study_buckets: {
        Row: {
          id: string
          study_id: string
          bucket_id: string
          added_by: string | null
          added_at: string | null
        }
        Insert: {
          id?: string
          study_id: string
          bucket_id: string
          added_by: string | null
          added_at: string | null
        }
        Update: {
          id?: string
          study_id?: string
          bucket_id?: string
          added_by?: string | null
          added_at?: string | null
        }
        Relationships: []
      }
      lab_activity_log: {
        Row: {
          id: string
          lab_id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json | null
          ip_address: any | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json | null
          ip_address: any | null
          user_agent: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          user_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          ip_address?: any | null
          user_agent?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      sprints: {
        Row: {
          id: string
          lab_id: string
          bucket_id: string | null
          name: string
          goal: string | null
          start_date: string
          end_date: string
          is_active: boolean | null
          capacity_points: number | null
          completed_points: number | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          bucket_id: string | null
          name: string
          goal: string | null
          start_date: string
          end_date: string
          is_active: boolean | null
          capacity_points: number | null
          completed_points: number | null
          created_by: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          bucket_id?: string | null
          name?: string
          goal?: string | null
          start_date?: string
          end_date?: string
          is_active?: boolean | null
          capacity_points?: number | null
          completed_points?: number | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      entity_labels: {
        Row: {
          id: string
          label_id: string
          entity_type: string
          entity_id: string
          applied_by: string | null
          applied_at: string | null
        }
        Insert: {
          id?: string
          label_id: string
          entity_type: string
          entity_id: string
          applied_by: string | null
          applied_at: string | null
        }
        Update: {
          id?: string
          label_id?: string
          entity_type?: string
          entity_id?: string
          applied_by?: string | null
          applied_at?: string | null
        }
        Relationships: []
      }
      task_groups: {
        Row: {
          id: string
          study_id: string
          name: string
          description: string | null
          position: number | null
          color: string | null
          icon: string | null
          is_collapsed: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          study_id: string
          name: string
          description: string | null
          position: number | null
          color: string | null
          icon: string | null
          is_collapsed: boolean | null
          created_by: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          study_id?: string
          name?: string
          description?: string | null
          position?: number | null
          color?: string | null
          icon?: string | null
          is_collapsed?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          research_interests: any | null
          publications: Json | null
          education: Json | null
          is_active: boolean | null
          last_login: string | null
          email_verified: boolean | null
          onboarding_completed: boolean | null
          preferences: Json | null
          created_at: string | null
          updated_at: string | null
          last_selected_lab_id: string | null
          ui_preferences: Json | null
          notification_preferences: Json | null
          theme: string | null
        }
        Insert: {
          id?: string
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
          research_interests: any | null
          publications: Json | null
          education: Json | null
          is_active: boolean | null
          last_login: string | null
          email_verified: boolean | null
          onboarding_completed: boolean | null
          preferences: Json | null
          created_at?: string | null
          updated_at?: string | null
          last_selected_lab_id: string | null
          ui_preferences: Json | null
          notification_preferences: Json | null
          theme: string | null
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
          research_interests?: any | null
          publications?: Json | null
          education?: Json | null
          is_active?: boolean | null
          last_login?: string | null
          email_verified?: boolean | null
          onboarding_completed?: boolean | null
          preferences?: Json | null
          created_at?: string | null
          updated_at?: string | null
          last_selected_lab_id?: string | null
          ui_preferences?: Json | null
          notification_preferences?: Json | null
          theme?: string | null
        }
        Relationships: []
      }
      files: {
        Row: {
          id: string
          name: string
          file_path: string | null
          file_url: string | null
          file_size: number | null
          mime_type: string | null
          lab_id: string
          study_id: string | null
          task_id: string | null
          uploaded_by: string | null
          description: string | null
          tags: any | null
          version: number | null
          is_latest: boolean | null
          parent_file_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          file_path: string | null
          file_url: string | null
          file_size: number | null
          mime_type: string | null
          lab_id: string
          study_id: string | null
          task_id: string | null
          uploaded_by: string | null
          description: string | null
          tags: any | null
          version: number | null
          is_latest: boolean | null
          parent_file_id: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          file_path?: string | null
          file_url?: string | null
          file_size?: number | null
          mime_type?: string | null
          lab_id?: string
          study_id?: string | null
          task_id?: string | null
          uploaded_by?: string | null
          description?: string | null
          tags?: any | null
          version?: number | null
          is_latest?: boolean | null
          parent_file_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lab_metrics: {
        Row: {
          id: string
          lab_id: string
          metric_date: string
          active_studies: number | null
          completed_studies: number | null
          active_members: number | null
          tasks_completed: number | null
          tasks_in_progress: number | null
          tasks_urgent: number | null
          meeting_count: number | null
          ideas_submitted: number | null
          files_uploaded: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          metric_date: string
          active_studies: number | null
          completed_studies: number | null
          active_members: number | null
          tasks_completed: number | null
          tasks_in_progress: number | null
          tasks_urgent: number | null
          meeting_count: number | null
          ideas_submitted: number | null
          files_uploaded: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          metric_date?: string
          active_studies?: number | null
          completed_studies?: number | null
          active_members?: number | null
          tasks_completed?: number | null
          tasks_in_progress?: number | null
          tasks_urgent?: number | null
          meeting_count?: number | null
          ideas_submitted?: number | null
          files_uploaded?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      view_configs: {
        Row: {
          id: string
          view_id: string
          filters: Json | null
          filter_logic: string | null
          sort_fields: Json | null
          group_by: string | null
          group_sort: string | null
          collapsed_groups: any | null
          visible_fields: any | null
          field_widths: Json | null
          row_height: string | null
          kanban_settings: Json | null
          calendar_settings: Json | null
          gantt_settings: Json | null
          timeline_settings: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          view_id: string
          filters: Json | null
          filter_logic: string | null
          sort_fields: Json | null
          group_by: string | null
          group_sort: string | null
          collapsed_groups: any | null
          visible_fields: any | null
          field_widths: Json | null
          row_height: string | null
          kanban_settings: Json | null
          calendar_settings: Json | null
          gantt_settings: Json | null
          timeline_settings: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          view_id?: string
          filters?: Json | null
          filter_logic?: string | null
          sort_fields?: Json | null
          group_by?: string | null
          group_sort?: string | null
          collapsed_groups?: any | null
          visible_fields?: any | null
          field_widths?: Json | null
          row_height?: string | null
          kanban_settings?: Json | null
          calendar_settings?: Json | null
          gantt_settings?: Json | null
          timeline_settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_states: {
        Row: {
          id: string
          lab_id: string
          entity_type: string
          name: string
          color: string
          position: number | null
          is_default: boolean | null
          is_completed: boolean | null
          is_archived: boolean | null
          auto_complete_children: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          entity_type: string
          name: string
          color: string
          position: number | null
          is_default: boolean | null
          is_completed: boolean | null
          is_archived: boolean | null
          auto_complete_children: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          entity_type?: string
          name?: string
          color?: string
          position?: number | null
          is_default?: boolean | null
          is_completed?: boolean | null
          is_archived?: boolean | null
          auto_complete_children?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          lab_id: string
          study_id: string | null
          title: string
          content: Json
          document_type: string | null
          version: number | null
          is_published: boolean | null
          created_by: string | null
          last_edited_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lab_id: string
          study_id: string | null
          title: string
          content: Json
          document_type: string | null
          version: number | null
          is_published: boolean | null
          created_by: string | null
          last_edited_by: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lab_id?: string
          study_id?: string | null
          title?: string
          content?: Json
          document_type?: string | null
          version?: number | null
          is_published?: boolean | null
          created_by?: string | null
          last_edited_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          entity_type: string
          entity_id: string
          parent_comment_id: string | null
          user_id: string
          content: string
          mentions: any | null
          attachments: Json | null
          is_edited: boolean | null
          edited_at: string | null
          is_deleted: boolean | null
          deleted_at: string | null
          reactions: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          entity_type: string
          entity_id: string
          parent_comment_id: string | null
          user_id: string
          content: string
          mentions: any | null
          attachments: Json | null
          is_edited: boolean | null
          edited_at: string | null
          is_deleted: boolean | null
          deleted_at: string | null
          reactions: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          entity_type?: string
          entity_id?: string
          parent_comment_id?: string | null
          user_id?: string
          content?: string
          mentions?: any | null
          attachments?: Json | null
          is_edited?: boolean | null
          edited_at?: string | null
          is_deleted?: boolean | null
          deleted_at?: string | null
          reactions?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      task_dependencies: {
        Row: {
          id: string
          predecessor_task_id: string
          successor_task_id: string
          dependency_type: string | null
          lag_days: number | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          predecessor_task_id: string
          successor_task_id: string
          dependency_type: string | null
          lag_days: number | null
          created_by: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          predecessor_task_id?: string
          successor_task_id?: string
          dependency_type?: string | null
          lag_days?: number | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      ideas: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string | null
          priority: any | null
          status: string | null
          lab_id: string
          created_by: string | null
          implementation_notes: string | null
          estimated_effort: string | null
          potential_impact: string | null
          interested_members: any | null
          discussion_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string | null
          category: string | null
          priority: any | null
          status: string | null
          lab_id: string
          created_by: string | null
          implementation_notes: string | null
          estimated_effort: string | null
          potential_impact: string | null
          interested_members: any | null
          discussion_notes: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string | null
          priority?: any | null
          status?: string | null
          lab_id?: string
          created_by?: string | null
          implementation_notes?: string | null
          estimated_effort?: string | null
          potential_impact?: string | null
          interested_members?: any | null
          discussion_notes?: string | null
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
          lab_role: any | null
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
          lab_role: any | null
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
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          lab_id?: string
          lab_role?: any | null
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
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          lab_id: string | null
          type: string
          title: string
          message: string | null
          data: Json | null
          is_read: boolean | null
          read_at: string | null
          action_url: string | null
          priority: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          lab_id: string | null
          type: string
          title: string
          message: string | null
          data: Json | null
          is_read: boolean | null
          read_at: string | null
          action_url: string | null
          priority: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          lab_id?: string | null
          type?: string
          title?: string
          message?: string | null
          data?: Json | null
          is_read?: boolean | null
          read_at?: string | null
          action_url?: string | null
          priority?: string | null
          created_at?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      study_milestones: {
        Row: {
          id: string
          study_id: string
          title: string
          description: string | null
          due_date: string | null
          completed_date: string | null
          is_completed: boolean | null
          position: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          study_id: string
          title: string
          description: string | null
          due_date: string | null
          completed_date: string | null
          is_completed: boolean | null
          position: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          study_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          completed_date?: string | null
          is_completed?: boolean | null
          position?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      user_role: 'ADMIN' | 'COLLABORATOR' | 'VIEWER' | 'LAB_ADMIN' | 'LAB_MEMBER' | 'GUEST'
      study_status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED'
      task_status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED' | 'CANCELLED'
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
      event_type: 'MEETING' | 'DEADLINE' | 'TRAINING' | 'CONFERENCE' | 'HOLIDAY' | 'PTO' | 'CLINICAL_SERVICE' | 'OTHER'
    }
    CompositeTypes: {}
  }
}