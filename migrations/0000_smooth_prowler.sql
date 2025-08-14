CREATE TYPE "public"."action_status" AS ENUM('OPEN', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."attachable_type" AS ENUM('PROJECT', 'TASK', 'COMMENT', 'IDEA', 'ACTION_ITEM', 'DEADLINE');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS_DENIED', 'PERMISSION_CHANGE');--> statement-breakpoint
CREATE TYPE "public"."audit_entity" AS ENUM('USER', 'LAB', 'BUCKET', 'STUDY', 'TASK', 'IDEA', 'DEADLINE', 'TEAM_MEMBER', 'LAB_MEMBER');--> statement-breakpoint
CREATE TYPE "public"."automation_action_type" AS ENUM('CREATE_TASK', 'ASSIGN_TASK', 'UPDATE_STATUS', 'SEND_NOTIFICATION', 'CREATE_PROJECT', 'ADD_TAG', 'SET_PRIORITY', 'SCHEDULE_REMINDER', 'WEBHOOK_CALL', 'CUSTOM_SCRIPT');--> statement-breakpoint
CREATE TYPE "public"."automation_trigger_type" AS ENUM('TASK_CREATED', 'TASK_COMPLETED', 'TASK_OVERDUE', 'TASK_ASSIGNED', 'PROJECT_STATUS_CHANGE', 'DEADLINE_APPROACHING', 'RECURRING_SCHEDULE', 'CUSTOM_EVENT', 'TIME_BASED', 'WEBHOOK');--> statement-breakpoint
CREATE TYPE "public"."availability_status" AS ENUM('AVAILABLE', 'CLINICAL_SERVICE', 'PTO', 'SICK_LEAVE', 'CONFERENCE', 'TRAINING', 'UNAVAILABLE');--> statement-breakpoint
CREATE TYPE "public"."calendar_event_type" AS ENUM('CLINICAL_SERVICE', 'PTO', 'HOLIDAY', 'CONFERENCE', 'TRAINING', 'MEETING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."commentable_type" AS ENUM('PROJECT', 'TASK', 'IDEA', 'STANDUP', 'BUCKET');--> statement-breakpoint
CREATE TYPE "public"."custom_field_type" AS ENUM('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'DATETIME', 'SELECT', 'MULTISELECT', 'CHECKBOX', 'URL', 'EMAIL');--> statement-breakpoint
CREATE TYPE "public"."deadline_type" AS ENUM('GRANT_APPLICATION', 'PAPER_SUBMISSION', 'ABSTRACT_SUBMISSION', 'IRB_SUBMISSION', 'CONFERENCE_DEADLINE', 'MILESTONE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."effort_level" AS ENUM('Small', 'Medium', 'Large');--> statement-breakpoint
CREATE TYPE "public"."execution_status" AS ENUM('SUCCESS', 'FAILED', 'PENDING', 'CANCELLED', 'PARTIAL_SUCCESS');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('PDF', 'DOCX', 'DOC', 'XLSX', 'XLS', 'PPTX', 'PPT', 'TXT', 'CSV', 'JSON', 'IMAGE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."funding_type" AS ENUM('NIH', 'NSF', 'INDUSTRY_SPONSORED', 'INTERNAL', 'FOUNDATION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."idea_category" AS ENUM('RESEARCH_PROPOSAL', 'METHODOLOGY', 'COLLABORATION', 'FUNDING_OPPORTUNITY', 'TOOL_OR_PLATFORM', 'GENERAL');--> statement-breakpoint
CREATE TYPE "public"."idea_status" AS ENUM('BRAINSTORMING', 'UNDER_REVIEW', 'APPROVED', 'IN_DEVELOPMENT', 'COMPLETED', 'ON_HOLD', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."impact_level" AS ENUM('Low', 'Medium', 'High');--> statement-breakpoint
CREATE TYPE "public"."meeting_type" AS ENUM('DAILY_STANDUP', 'WEEKLY_REVIEW', 'PROJECT_SYNC', 'STUDY_REVIEW');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('OWNER', 'ADMIN', 'CONTRIBUTOR', 'VIEWER', 'INFORMED');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('TASK_ASSIGNED', 'TASK_COMPLETED', 'TASK_DUE_SOON', 'TASK_OVERDUE', 'PROJECT_STATUS_CHANGE', 'COMMENT_MENTION', 'COMMENT_REPLY', 'DEADLINE_APPROACHING', 'REVIEW_REQUESTED', 'BUCKET_ASSIGNMENT');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."recurrence_pattern" AS ENUM('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."study_status" AS ENUM('PLANNING', 'IRB_SUBMISSION', 'IRB_APPROVED', 'DATA_COLLECTION', 'ANALYSIS', 'MANUSCRIPT', 'UNDER_REVIEW', 'PUBLISHED', 'ON_HOLD', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."team_member_role" AS ENUM('PI', 'CO_PRINCIPAL_INVESTIGATOR', 'Data Scientist', 'Data Analyst', 'Regulatory Coordinator', 'Coordinator', 'Lab Intern', 'Summer Intern', 'Principal Investigator', 'Clinical Research Coordinator', 'Staff Coordinator', 'Fellow', 'Medical Student', 'Volunteer Research Assistant', 'Research Assistant');--> statement-breakpoint
CREATE TYPE "public"."update_type" AS ENUM('PROGRESS', 'BLOCKER', 'MILESTONE', 'STATUS_CHANGE', 'GENERAL');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('PRINCIPAL_INVESTIGATOR', 'CO_PRINCIPAL_INVESTIGATOR', 'DATA_SCIENTIST', 'DATA_ANALYST', 'CLINICAL_RESEARCH_COORDINATOR', 'REGULATORY_COORDINATOR', 'STAFF_COORDINATOR', 'LAB_ADMINISTRATOR', 'FELLOW', 'MEDICAL_STUDENT', 'RESEARCH_ASSISTANT', 'VOLUNTEER_RESEARCH_ASSISTANT', 'EXTERNAL_COLLABORATOR', 'PI', 'RESEARCH_COORDINATOR', 'RESEARCHER', 'STUDENT', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."workflow_status" AS ENUM('ACTIVE', 'PAUSED', 'DISABLED', 'DRAFT');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" varchar NOT NULL,
	"url" varchar NOT NULL,
	"file_size" varchar NOT NULL,
	"mime_type" varchar NOT NULL,
	"entity_type" "attachable_type" NOT NULL,
	"entity_id" varchar NOT NULL,
	"uploaded_by_id" varchar NOT NULL,
	"uploaded_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "automated_schedules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"schedule_type" varchar NOT NULL,
	"cron_expression" varchar,
	"recurring_pattern" json,
	"smart_config" json,
	"trigger_id" varchar,
	"next_run_time" timestamp,
	"last_run_time" timestamp,
	"run_count" varchar DEFAULT '0',
	"max_runs" varchar,
	"is_active" boolean DEFAULT true,
	"created_by_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_id" varchar NOT NULL,
	"trigger_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"action_type" "automation_action_type" NOT NULL,
	"action_config" json NOT NULL,
	"priority" varchar DEFAULT 'MEDIUM',
	"delay_minutes" varchar DEFAULT '0',
	"conditions" json,
	"is_active" boolean DEFAULT true,
	"created_by_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bucket_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bucket_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" "member_role" DEFAULT 'INFORMED',
	"joined_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "buckets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"color" varchar DEFAULT '#3b82f6',
	"icon" varchar DEFAULT 'folder',
	"position" varchar DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"lab_id" varchar NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"event_type" "calendar_event_type" NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"all_day" boolean DEFAULT false,
	"location" varchar,
	"user_id" varchar NOT NULL,
	"lab_id" varchar NOT NULL,
	"is_recurring" boolean DEFAULT false,
	"recurrence_rule" varchar,
	"color" varchar DEFAULT '#4C9A92',
	"is_visible" boolean DEFAULT true,
	"metadata" json,
	"pi_clinical_service" varchar,
	"pto" varchar,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"entity_type" "commentable_type" NOT NULL,
	"entity_id" varchar NOT NULL,
	"parent_id" varchar,
	"author_id" varchar NOT NULL,
	"edited_at" timestamp,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cross_lab_access" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_lab_id" varchar NOT NULL,
	"target_lab_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"access_type" varchar NOT NULL,
	"specific_resources" json,
	"can_view_projects" boolean DEFAULT false,
	"can_edit_shared_projects" boolean DEFAULT false,
	"can_comment_on_projects" boolean DEFAULT false,
	"can_join_meetings" boolean DEFAULT false,
	"can_view_reports" boolean DEFAULT false,
	"requested_by" varchar,
	"approved_by" varchar,
	"approval_date" timestamp,
	"valid_from" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"status" varchar DEFAULT 'PENDING',
	"created_at" timestamp DEFAULT now(),
	"revoked_at" timestamp,
	"revoked_by" varchar
);
--> statement-breakpoint
CREATE TABLE "custom_field_values" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"value" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_fields" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_id" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"field_name" varchar NOT NULL,
	"field_label" varchar NOT NULL,
	"field_type" "custom_field_type" NOT NULL,
	"options" json,
	"validation" json,
	"required" boolean DEFAULT false,
	"position" varchar DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deadlines" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"type" "deadline_type" NOT NULL,
	"due_date" timestamp NOT NULL,
	"priority" "priority" DEFAULT 'MEDIUM',
	"status" varchar DEFAULT 'PENDING',
	"assigned_to" varchar,
	"lab_id" varchar NOT NULL,
	"related_study_id" varchar,
	"submission_url" varchar,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ideas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"category" "idea_category" DEFAULT 'GENERAL',
	"status" "idea_status" DEFAULT 'BRAINSTORMING',
	"priority" "priority" DEFAULT 'MEDIUM',
	"tags" text[],
	"proposed_by" varchar,
	"lab_id" varchar NOT NULL,
	"estimated_effort" "effort_level",
	"potential_impact" "impact_level",
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lab_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"lab_id" varchar NOT NULL,
	"lab_role" "user_role" DEFAULT 'RESEARCH_ASSISTANT',
	"is_admin" boolean DEFAULT false,
	"is_super_admin" boolean DEFAULT false,
	"can_manage_members" boolean DEFAULT false,
	"can_manage_lab_settings" boolean DEFAULT false,
	"can_view_audit_logs" boolean DEFAULT false,
	"can_manage_permissions" boolean DEFAULT false,
	"can_create_projects" boolean DEFAULT false,
	"can_edit_all_projects" boolean DEFAULT false,
	"can_delete_projects" boolean DEFAULT false,
	"can_view_all_projects" boolean DEFAULT false,
	"can_archive_projects" boolean DEFAULT false,
	"can_restore_projects" boolean DEFAULT false,
	"can_assign_tasks" boolean DEFAULT false,
	"can_edit_all_tasks" boolean DEFAULT false,
	"can_delete_tasks" boolean DEFAULT false,
	"can_view_all_tasks" boolean DEFAULT false,
	"can_manage_task_templates" boolean DEFAULT false,
	"can_set_task_priorities" boolean DEFAULT false,
	"can_approve_ideas" boolean DEFAULT false,
	"can_reject_ideas" boolean DEFAULT false,
	"can_edit_all_ideas" boolean DEFAULT false,
	"can_delete_ideas" boolean DEFAULT false,
	"can_implement_ideas" boolean DEFAULT false,
	"can_access_reports" boolean DEFAULT false,
	"can_export_data" boolean DEFAULT false,
	"can_view_analytics" boolean DEFAULT false,
	"can_manage_deadlines" boolean DEFAULT false,
	"can_view_financials" boolean DEFAULT false,
	"can_invite_external_users" boolean DEFAULT false,
	"can_share_across_labs" boolean DEFAULT false,
	"can_access_shared_projects" boolean DEFAULT false,
	"can_create_cross_lab_projects" boolean DEFAULT false,
	"can_schedule_meetings" boolean DEFAULT false,
	"can_manage_standups" boolean DEFAULT false,
	"can_send_lab_announcements" boolean DEFAULT false,
	"can_moderate_discussions" boolean DEFAULT false,
	"can_manage_assets" boolean DEFAULT false,
	"can_allocate_budget" boolean DEFAULT false,
	"can_manage_equipment" boolean DEFAULT false,
	"can_manage_documents" boolean DEFAULT false,
	"access_start_date" timestamp,
	"access_end_date" timestamp,
	"temporary_permissions" json,
	"permission_scope" varchar DEFAULT 'LAB',
	"restricted_entities" json,
	"allowed_entity_types" json,
	"is_active" boolean DEFAULT true,
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp,
	"last_permission_update" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "labs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"full_name" varchar,
	"short_name" varchar,
	"description" text,
	"department" varchar,
	"building" varchar,
	"room" varchar,
	"website" varchar,
	"logo" varchar,
	"primary_color" varchar DEFAULT '#8B5CF6',
	"settings" jsonb,
	"features" text[] DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "labs_short_name_unique" UNIQUE("short_name")
);
--> statement-breakpoint
CREATE TABLE "member_availability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"lab_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"status" "availability_status" NOT NULL,
	"notes" text,
	"event_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mentions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"read" boolean DEFAULT false,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"entity_type" varchar,
	"entity_id" varchar,
	"metadata" json,
	"read" boolean DEFAULT false,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permission_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"lab_id" varchar,
	"permissions" json NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"lab_id" varchar NOT NULL,
	"role" varchar DEFAULT 'contributor',
	"allocation" numeric(5, 2) DEFAULT '20.00',
	"assigned_at" timestamp DEFAULT now(),
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_tags" (
	"project_id" varchar NOT NULL,
	"tag_id" varchar NOT NULL,
	"tagged_at" timestamp DEFAULT now(),
	"tagged_by_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar,
	"template_id" varchar,
	"pattern" "recurrence_pattern" NOT NULL,
	"interval" varchar DEFAULT '1',
	"day_of_week" varchar,
	"day_of_month" varchar,
	"custom_cron" varchar,
	"next_due_date" timestamp NOT NULL,
	"last_created" timestamp,
	"end_date" timestamp,
	"max_occurrences" varchar,
	"occurrence_count" varchar DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "recurring_tasks_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE "resource_permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"lab_id" varchar NOT NULL,
	"resource_type" "audit_entity" NOT NULL,
	"resource_id" varchar NOT NULL,
	"can_view" boolean DEFAULT false,
	"can_edit" boolean DEFAULT false,
	"can_delete" boolean DEFAULT false,
	"can_share" boolean DEFAULT false,
	"can_assign" boolean DEFAULT false,
	"granted_by" varchar,
	"grant_reason" varchar,
	"valid_from" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now(),
	"revoked_at" timestamp,
	"revoked_by" varchar
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "user_role" NOT NULL,
	"permission" varchar NOT NULL,
	"lab_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "security_audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" "audit_action" NOT NULL,
	"entity_type" "audit_entity" NOT NULL,
	"entity_id" varchar,
	"user_id" varchar,
	"user_email" varchar,
	"lab_id" varchar,
	"authorization_method" varchar,
	"required_permission" varchar,
	"was_authorized" boolean NOT NULL,
	"ip_address" varchar,
	"user_agent" varchar,
	"endpoint" varchar,
	"http_method" varchar,
	"details" json,
	"error_message" varchar,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"session_id" varchar
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "standup_action_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" varchar,
	"study_id" varchar,
	"assignee_id" varchar,
	"description" text NOT NULL,
	"due_date" timestamp,
	"priority" "priority" DEFAULT 'MEDIUM',
	"status" "action_status" DEFAULT 'OPEN',
	"created_from_ai" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "standup_meetings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_id" varchar NOT NULL,
	"meeting_date" timestamp NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"meeting_type" "meeting_type" DEFAULT 'DAILY_STANDUP',
	"recording_url" varchar,
	"transcript" text,
	"ai_summary" json,
	"participants" json,
	"is_active" boolean DEFAULT true,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "status_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"from_status" varchar,
	"to_status" varchar NOT NULL,
	"reason" text,
	"changed_by_id" varchar NOT NULL,
	"changed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "studies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"ora_number" varchar,
	"status" "study_status" DEFAULT 'PLANNING',
	"study_type" varchar,
	"project_type" varchar DEFAULT 'study',
	"assignees" text[],
	"funding" "funding_type",
	"funding_source" varchar,
	"external_collaborators" text,
	"first_author" varchar,
	"last_author" varchar,
	"target_journal" varchar,
	"notes" text,
	"priority" "priority" DEFAULT 'MEDIUM',
	"due_date" timestamp,
	"irb_submission_date" timestamp,
	"irb_approval_date" timestamp,
	"irb_status" varchar DEFAULT 'PENDING',
	"protocol_link" varchar,
	"data_link" varchar,
	"position" varchar DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"bucket_id" varchar NOT NULL,
	"lab_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "study_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role_in_study" varchar DEFAULT 'Researcher',
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "study_milestones" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"target_date" timestamp NOT NULL,
	"completed_date" timestamp,
	"status" varchar DEFAULT 'PENDING',
	"priority" "priority" DEFAULT 'MEDIUM',
	"progress" numeric(5, 2) DEFAULT '0.00',
	"assigned_to" varchar,
	"dependencies" text[],
	"deliverables" text[],
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "study_status_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" varchar NOT NULL,
	"old_status" "study_status",
	"new_status" "study_status" NOT NULL,
	"notes" text,
	"changed_by" varchar NOT NULL,
	"changed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "study_status_updates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" varchar NOT NULL,
	"meeting_id" varchar NOT NULL,
	"update_type" "update_type" NOT NULL,
	"content" text NOT NULL,
	"mentioned_by" varchar,
	"extracted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"lab_id" varchar NOT NULL,
	"color" varchar DEFAULT '#6B7280',
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"project_id" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "task_generation_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" varchar NOT NULL,
	"task_id" varchar,
	"template_id" varchar,
	"project_id" varchar,
	"generation_type" varchar NOT NULL,
	"success" boolean NOT NULL,
	"error_message" text,
	"generated_at" timestamp DEFAULT now(),
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "task_tags" (
	"task_id" varchar NOT NULL,
	"tag_id" varchar NOT NULL,
	"tagged_at" timestamp DEFAULT now(),
	"tagged_by_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"estimated_hours" varchar,
	"tags" text[],
	"custom_fields" json,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'TODO',
	"priority" "priority" DEFAULT 'MEDIUM',
	"assignee_id" varchar,
	"study_id" varchar,
	"parent_task_id" varchar,
	"position" varchar DEFAULT '0',
	"tags" text[],
	"estimated_hours" numeric(6, 2),
	"actual_hours" numeric(6, 2),
	"completed_at" timestamp,
	"completed_by_id" varchar,
	"is_active" boolean DEFAULT true,
	"due_date" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_member_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar,
	"study_id" varchar,
	"task_id" varchar,
	"bucket_id" varchar,
	"assignment_type" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"middle_name" varchar,
	"initials" varchar(10),
	"email" varchar,
	"role" "team_member_role" NOT NULL,
	"title" varchar,
	"avatar_url" varchar,
	"lab_id" varchar,
	"position" varchar DEFAULT '0',
	"department" varchar,
	"institution" varchar,
	"phone_number" varchar,
	"capacity" varchar,
	"bio" text,
	"linked_in" varchar,
	"orcid" varchar,
	"expertise" text[],
	"skills" text[],
	"start_date" timestamp,
	"is_active" boolean DEFAULT true,
	"is_external" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"project_id" varchar NOT NULL,
	"hours" numeric(5, 2) NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"billable" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"email_notifications" boolean DEFAULT true,
	"email_digest_frequency" varchar DEFAULT 'daily',
	"push_notifications" boolean DEFAULT true,
	"theme" varchar DEFAULT 'dark',
	"dashboard_layout" json,
	"default_lab_id" varchar,
	"default_view" varchar DEFAULT 'kanban',
	"timezone" varchar DEFAULT 'America/Chicago',
	"date_format" varchar DEFAULT 'MM/DD/YYYY',
	"time_format" varchar DEFAULT '12h',
	"week_starts_on" varchar DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"middle_name" varchar,
	"name" varchar,
	"initials" varchar(10),
	"role" "user_role" DEFAULT 'RESEARCH_ASSISTANT',
	"title" varchar,
	"department" varchar,
	"institution" varchar DEFAULT 'Rush University Medical Center',
	"phone" varchar,
	"profile_image_url" varchar,
	"avatar" varchar,
	"bio" text,
	"linkedin_url" varchar,
	"orcid" varchar,
	"capacity" numeric(5, 2) DEFAULT '40.00',
	"expertise" text[] DEFAULT '{}',
	"skills" text[] DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"is_external" boolean DEFAULT false,
	"last_active" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workflow_executions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" varchar NOT NULL,
	"trigger_id" varchar NOT NULL,
	"status" "execution_status" NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"error" text,
	"execution_log" json,
	"triggered_by" varchar,
	"affected_entities" json
);
--> statement-breakpoint
CREATE TABLE "workflow_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category" varchar,
	"trigger_template" json,
	"rule_templates" json,
	"variables" json,
	"is_public" boolean DEFAULT false,
	"usage_count" varchar DEFAULT '0',
	"rating" varchar,
	"created_by_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow_triggers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"trigger_type" "automation_trigger_type" NOT NULL,
	"conditions" json,
	"is_active" boolean DEFAULT true,
	"created_by_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automated_schedules" ADD CONSTRAINT "automated_schedules_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automated_schedules" ADD CONSTRAINT "automated_schedules_trigger_id_workflow_triggers_id_fk" FOREIGN KEY ("trigger_id") REFERENCES "public"."workflow_triggers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automated_schedules" ADD CONSTRAINT "automated_schedules_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_trigger_id_workflow_triggers_id_fk" FOREIGN KEY ("trigger_id") REFERENCES "public"."workflow_triggers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_members" ADD CONSTRAINT "bucket_members_bucket_id_buckets_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_members" ADD CONSTRAINT "bucket_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buckets" ADD CONSTRAINT "buckets_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buckets" ADD CONSTRAINT "buckets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_lab_access" ADD CONSTRAINT "cross_lab_access_source_lab_id_labs_id_fk" FOREIGN KEY ("source_lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_lab_access" ADD CONSTRAINT "cross_lab_access_target_lab_id_labs_id_fk" FOREIGN KEY ("target_lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_lab_access" ADD CONSTRAINT "cross_lab_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_lab_access" ADD CONSTRAINT "cross_lab_access_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_lab_access" ADD CONSTRAINT "cross_lab_access_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_lab_access" ADD CONSTRAINT "cross_lab_access_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_field_id_custom_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."custom_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_assigned_to_team_members_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_related_study_id_studies_id_fk" FOREIGN KEY ("related_study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_created_by_team_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_proposed_by_team_members_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_members" ADD CONSTRAINT "lab_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_members" ADD CONSTRAINT "lab_members_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_availability" ADD CONSTRAINT "member_availability_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_availability" ADD CONSTRAINT "member_availability_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_availability" ADD CONSTRAINT "member_availability_event_id_calendar_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_templates" ADD CONSTRAINT "permission_templates_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_templates" ADD CONSTRAINT "permission_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_studies_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_project_id_studies_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_tagged_by_id_users_id_fk" FOREIGN KEY ("tagged_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_tasks" ADD CONSTRAINT "recurring_tasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_tasks" ADD CONSTRAINT "recurring_tasks_template_id_task_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."task_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_permissions" ADD CONSTRAINT "resource_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_permissions" ADD CONSTRAINT "resource_permissions_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_permissions" ADD CONSTRAINT "resource_permissions_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_permissions" ADD CONSTRAINT "resource_permissions_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_audit_logs" ADD CONSTRAINT "security_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_audit_logs" ADD CONSTRAINT "security_audit_logs_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standup_action_items" ADD CONSTRAINT "standup_action_items_meeting_id_standup_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."standup_meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standup_action_items" ADD CONSTRAINT "standup_action_items_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standup_action_items" ADD CONSTRAINT "standup_action_items_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standup_meetings" ADD CONSTRAINT "standup_meetings_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standup_meetings" ADD CONSTRAINT "standup_meetings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_changed_by_id_users_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studies" ADD CONSTRAINT "studies_bucket_id_buckets_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studies" ADD CONSTRAINT "studies_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studies" ADD CONSTRAINT "studies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_assignments" ADD CONSTRAINT "study_assignments_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_assignments" ADD CONSTRAINT "study_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_milestones" ADD CONSTRAINT "study_milestones_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_milestones" ADD CONSTRAINT "study_milestones_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_milestones" ADD CONSTRAINT "study_milestones_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_status_history" ADD CONSTRAINT "study_status_history_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_status_history" ADD CONSTRAINT "study_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_status_updates" ADD CONSTRAINT "study_status_updates_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_status_updates" ADD CONSTRAINT "study_status_updates_meeting_id_standup_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."standup_meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_project_id_studies_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_generation_logs" ADD CONSTRAINT "task_generation_logs_execution_id_workflow_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."workflow_executions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_generation_logs" ADD CONSTRAINT "task_generation_logs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_generation_logs" ADD CONSTRAINT "task_generation_logs_template_id_task_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."task_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_generation_logs" ADD CONSTRAINT "task_generation_logs_project_id_studies_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_tagged_by_id_users_id_fk" FOREIGN KEY ("tagged_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_completed_by_id_users_id_fk" FOREIGN KEY ("completed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_assignments" ADD CONSTRAINT "team_member_assignments_member_id_team_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_assignments" ADD CONSTRAINT "team_member_assignments_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_assignments" ADD CONSTRAINT "team_member_assignments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_assignments" ADD CONSTRAINT "team_member_assignments_bucket_id_buckets_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_studies_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_default_lab_id_labs_id_fk" FOREIGN KEY ("default_lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_rule_id_automation_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."automation_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_trigger_id_workflow_triggers_id_fk" FOREIGN KEY ("trigger_id") REFERENCES "public"."workflow_triggers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_triggers" ADD CONSTRAINT "workflow_triggers_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_triggers" ADD CONSTRAINT "workflow_triggers_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachment_entity_idx" ON "attachments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "uploader_idx" ON "attachments" USING btree ("uploaded_by_id","uploaded_at");--> statement-breakpoint
CREATE INDEX "automated_schedules_lab_idx" ON "automated_schedules" USING btree ("lab_id");--> statement-breakpoint
CREATE INDEX "automated_schedules_next_run_idx" ON "automated_schedules" USING btree ("next_run_time");--> statement-breakpoint
CREATE INDEX "automated_schedules_active_idx" ON "automated_schedules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "automated_schedules_type_idx" ON "automated_schedules" USING btree ("schedule_type");--> statement-breakpoint
CREATE INDEX "automation_rules_lab_idx" ON "automation_rules" USING btree ("lab_id");--> statement-breakpoint
CREATE INDEX "automation_rules_trigger_idx" ON "automation_rules" USING btree ("trigger_id");--> statement-breakpoint
CREATE INDEX "automation_rules_active_idx" ON "automation_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "automation_rules_priority_idx" ON "automation_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "unique_bucket_user" ON "bucket_members" USING btree ("bucket_id","user_id");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "bucket_members" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX "calendar_user_date_idx" ON "calendar_events" USING btree ("user_id","start_date");--> statement-breakpoint
CREATE INDEX "calendar_lab_date_idx" ON "calendar_events" USING btree ("lab_id","start_date");--> statement-breakpoint
CREATE INDEX "calendar_type_idx" ON "calendar_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "calendar_date_range_idx" ON "calendar_events" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "entity_idx" ON "comments" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "author_idx" ON "comments" USING btree ("author_id","created_at");--> statement-breakpoint
CREATE INDEX "parent_ref" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "user_labs_idx" ON "cross_lab_access" USING btree ("user_id","source_lab_id","target_lab_id");--> statement-breakpoint
CREATE INDEX "target_lab_idx" ON "cross_lab_access" USING btree ("target_lab_id","status");--> statement-breakpoint
CREATE INDEX "cross_lab_validity_idx" ON "cross_lab_access" USING btree ("valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "cross_lab_status_idx" ON "cross_lab_access" USING btree ("status","valid_until");--> statement-breakpoint
CREATE INDEX "unique_field_entity_values" ON "custom_field_values" USING btree ("field_id","entity_id");--> statement-breakpoint
CREATE INDEX "entity_values_idx" ON "custom_field_values" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "unique_lab_entity_field" ON "custom_fields" USING btree ("lab_id","entity_type","field_name");--> statement-breakpoint
CREATE INDEX "lab_entity_active_idx" ON "custom_fields" USING btree ("lab_id","entity_type","is_active");--> statement-breakpoint
CREATE INDEX "unique_user_lab" ON "lab_members" USING btree ("user_id","lab_id");--> statement-breakpoint
CREATE INDEX "lab_active_idx" ON "lab_members" USING btree ("lab_id","is_active");--> statement-breakpoint
CREATE INDEX "user_active_idx" ON "lab_members" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "permission_scope_idx" ON "lab_members" USING btree ("permission_scope");--> statement-breakpoint
CREATE INDEX "access_date_idx" ON "lab_members" USING btree ("access_start_date","access_end_date");--> statement-breakpoint
CREATE INDEX "labs_short_name_idx" ON "labs" USING btree ("short_name");--> statement-breakpoint
CREATE INDEX "labs_active_idx" ON "labs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "unique_user_lab_date" ON "member_availability" USING btree ("user_id","lab_id","date");--> statement-breakpoint
CREATE INDEX "availability_lab_date_idx" ON "member_availability" USING btree ("lab_id","date");--> statement-breakpoint
CREATE INDEX "availability_status_idx" ON "member_availability" USING btree ("status");--> statement-breakpoint
CREATE INDEX "unique_comment_user" ON "mentions" USING btree ("comment_id","user_id");--> statement-breakpoint
CREATE INDEX "user_read_idx" ON "notifications" USING btree ("user_id","read","created_at");--> statement-breakpoint
CREATE INDEX "notification_entity_idx" ON "notifications" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "template_name_lab_idx" ON "permission_templates" USING btree ("name","lab_id");--> statement-breakpoint
CREATE INDEX "default_template_idx" ON "permission_templates" USING btree ("is_default","is_active");--> statement-breakpoint
CREATE INDEX "unique_project_user" ON "project_members" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE INDEX "lab_user_idx" ON "project_members" USING btree ("lab_id","user_id");--> statement-breakpoint
CREATE INDEX "project_members_bucket_status_idx" ON "project_members" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_tag_pk" ON "project_tags" USING btree ("project_id","tag_id");--> statement-breakpoint
CREATE INDEX "next_due_active_idx" ON "recurring_tasks" USING btree ("next_due_date","is_active");--> statement-breakpoint
CREATE INDEX "user_resource_idx" ON "resource_permissions" USING btree ("user_id","resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "lab_resource_idx" ON "resource_permissions" USING btree ("lab_id","resource_type");--> statement-breakpoint
CREATE INDEX "validity_idx" ON "resource_permissions" USING btree ("valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "active_permission_idx" ON "resource_permissions" USING btree ("user_id","revoked_at");--> statement-breakpoint
CREATE INDEX "unique_role_permission_lab" ON "role_permissions" USING btree ("role","permission","lab_id");--> statement-breakpoint
CREATE INDEX "role_permissions_role_idx" ON "role_permissions" USING btree ("role");--> statement-breakpoint
CREATE INDEX "audit_user_time_idx" ON "security_audit_logs" USING btree ("user_id","timestamp");--> statement-breakpoint
CREATE INDEX "audit_entity_time_idx" ON "security_audit_logs" USING btree ("entity_type","entity_id","timestamp");--> statement-breakpoint
CREATE INDEX "audit_lab_time_idx" ON "security_audit_logs" USING btree ("lab_id","timestamp");--> statement-breakpoint
CREATE INDEX "audit_action_time_idx" ON "security_audit_logs" USING btree ("action","timestamp");--> statement-breakpoint
CREATE INDEX "audit_unauthorized_idx" ON "security_audit_logs" USING btree ("was_authorized","timestamp");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "status_entity_idx" ON "status_history" USING btree ("entity_type","entity_id","changed_at");--> statement-breakpoint
CREATE INDEX "status_changer_idx" ON "status_history" USING btree ("changed_by_id","changed_at");--> statement-breakpoint
CREATE INDEX "study_milestones_study_target_idx" ON "study_milestones" USING btree ("study_id","target_date");--> statement-breakpoint
CREATE INDEX "study_milestones_status_idx" ON "study_milestones" USING btree ("status","target_date");--> statement-breakpoint
CREATE INDEX "tags_unique_lab_name" ON "tags" USING btree ("lab_id","name");--> statement-breakpoint
CREATE INDEX "tags_lab_active_idx" ON "tags" USING btree ("lab_id","is_active");--> statement-breakpoint
CREATE INDEX "unique_task_user" ON "task_assignments" USING btree ("task_id","user_id");--> statement-breakpoint
CREATE INDEX "user_project_idx" ON "task_assignments" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "task_generation_execution_idx" ON "task_generation_logs" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "task_generation_task_idx" ON "task_generation_logs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_generation_type_idx" ON "task_generation_logs" USING btree ("generation_type");--> statement-breakpoint
CREATE INDEX "task_generation_date_idx" ON "task_generation_logs" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "task_tag_pk" ON "task_tags" USING btree ("task_id","tag_id");--> statement-breakpoint
CREATE INDEX "unique_lab_template_name" ON "task_templates" USING btree ("lab_id","name");--> statement-breakpoint
CREATE INDEX "task_project_status_position_idx" ON "tasks" USING btree ("study_id","status","position");--> statement-breakpoint
CREATE INDEX "task_assignee_status_due_idx" ON "tasks" USING btree ("assignee_id","status","due_date");--> statement-breakpoint
CREATE INDEX "unique_email_lab" ON "team_members" USING btree ("email","lab_id");--> statement-breakpoint
CREATE INDEX "time_user_date_idx" ON "time_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "time_project_date_idx" ON "time_entries" USING btree ("project_id","date");--> statement-breakpoint
CREATE INDEX "time_task_user_date_idx" ON "time_entries" USING btree ("task_id","user_id","date");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("is_active","last_active");--> statement-breakpoint
CREATE INDEX "workflow_executions_rule_idx" ON "workflow_executions" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "workflow_executions_status_idx" ON "workflow_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workflow_executions_started_idx" ON "workflow_executions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "workflow_templates_lab_idx" ON "workflow_templates" USING btree ("lab_id");--> statement-breakpoint
CREATE INDEX "workflow_templates_category_idx" ON "workflow_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "workflow_templates_public_idx" ON "workflow_templates" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "workflow_templates_usage_idx" ON "workflow_templates" USING btree ("usage_count");--> statement-breakpoint
CREATE INDEX "workflow_triggers_lab_idx" ON "workflow_triggers" USING btree ("lab_id");--> statement-breakpoint
CREATE INDEX "workflow_triggers_type_idx" ON "workflow_triggers" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "workflow_triggers_active_idx" ON "workflow_triggers" USING btree ("is_active");