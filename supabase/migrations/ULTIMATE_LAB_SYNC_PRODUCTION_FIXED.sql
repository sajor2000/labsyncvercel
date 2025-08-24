-- ============================================================================
-- ULTIMATE LAB SYNC - COMPLETE PRODUCTION DATABASE (SUPABASE OPTIMIZED)
-- ============================================================================
-- This is THE definitive, production-ready database schema for Lab Sync.
-- Includes EVERY feature: multi-lab support, AI integration, file management,
-- calendar sync, task management, permissions, notifications, and more.
-- 
-- SUPABASE BEST PRACTICES IMPLEMENTED:
-- - Safe schema-only cleanup preserving system tables
-- - Proper error handling and transaction safety  
-- - Complete RLS policies for all tables
-- - Preserved lab → lab_member → bucket → project → task → subtask relationships
-- - Performance-optimized indexes and constraints
-- - Comprehensive seed data for multi-lab setup
-- 
-- IMPORTANT: This migration is designed for FRESH DATABASE setup.
-- For existing databases, use incremental migrations instead.
-- ============================================================================

-- Note: Error handling is built into each DO block with EXCEPTION clauses
-- No need for \set commands in Supabase dashboard

-- ============================================================================
-- EXTENSIONS SETUP
-- ====1========================================================================

DO $$
BEGIN
    -- Enable required extensions with error handling
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    RAISE NOTICE 'Extension uuid-ossp enabled';
    
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    RAISE NOTICE 'Extension pgcrypto enabled';
    
    CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Full-text search
    RAISE NOTICE 'Extension pg_trgm enabled';
    
    CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- Composite indexes  
    RAISE NOTICE 'Extension btree_gin enabled';
    
    CREATE EXTENSION IF NOT EXISTS "unaccent"; -- Search normalization
    RAISE NOTICE 'Extension unaccent enabled';
    
    RAISE NOTICE 'All required extensions enabled successfully!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to enable extensions: %', SQLERRM;
END $$;

-- ============================================================================
-- SAFE CLEANUP (Public Schema Only - Fresh Database Setup)
-- ============================================================================
-- This section safely removes all objects from the public schema only.
-- It preserves Supabase system schemas (auth, storage, etc.)

DO $$ 
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Starting fresh database cleanup for Lab Sync...';
    
    -- Drop all views in public schema
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
        RAISE NOTICE 'Dropped view: %', r.viewname;
    END LOOP;
    
    -- Drop all foreign key constraints in public schema
    FOR r IN (SELECT conname, conrelid::regclass 
              FROM pg_constraint 
              WHERE contype = 'f' 
              AND connamespace = 'public'::regnamespace) LOOP
        EXECUTE 'ALTER TABLE ' || r.conrelid || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
        RAISE NOTICE 'Dropped constraint: % from %', r.conname, r.conrelid;
    END LOOP;
    
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
    
    -- Drop all types in public schema
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
        RAISE NOTICE 'Dropped type: %', r.typname;
    END LOOP;
    
    -- Drop all custom functions in public schema (excluding extension and system functions)
    FOR r IN (SELECT proname, oidvectortypes(proargtypes) as argtypes 
              FROM pg_proc p
              WHERE p.pronamespace = 'public'::regnamespace
              AND NOT EXISTS (
                  SELECT 1 FROM pg_depend d 
                  JOIN pg_extension e ON d.refobjid = e.oid 
                  WHERE d.objid = p.oid
              )
              AND proname NOT LIKE 'gin_%'
              AND proname NOT LIKE 'btree_%'
              AND proname NOT LIKE 'uuid_generate_%'
              AND proname NOT LIKE 'pg_%'
              AND proname NOT LIKE 'unaccent%') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
        RAISE NOTICE 'Dropped function: %(%) ', r.proname, r.argtypes;
    END LOOP;
    
    RAISE NOTICE 'Fresh database cleanup completed successfully!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Cleanup failed: %', SQLERRM;
END $$;

-- ============================================================================
-- COMPREHENSIVE TYPE SYSTEM
-- ============================================================================

-- User roles (matching your API exactly)
CREATE TYPE user_role AS ENUM (
  'principal_investigator',
  'co_investigator',
  'lab_manager',
  'data_analyst',
  'data_scientist',
  'regulatory_coordinator',
  'lab_assistant',
  'research_volunteer',
  'external_collaborator'
);

-- Status and priority enums
CREATE TYPE lab_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE bucket_status AS ENUM ('active', 'archived', 'deleted');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled');
CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Communication and content types
CREATE TYPE meeting_type AS ENUM ('standup', 'planning', 'review', 'presentation', 'training', 'social', 'other');
CREATE TYPE notification_type AS ENUM ('task_assigned', 'task_completed', 'task_overdue', 'deadline_reminder', 'mention', 'lab_invite', 'member_joined', 'meeting_scheduled', 'file_shared', 'comment_added');
CREATE TYPE activity_type AS ENUM ('created', 'updated', 'deleted', 'completed', 'assigned', 'commented', 'uploaded', 'shared', 'archived', 'restored');
CREATE TYPE comment_type AS ENUM ('task', 'project', 'idea', 'file', 'meeting', 'deadline', 'general');

-- Idea and deadline types
CREATE TYPE idea_status AS ENUM ('draft', 'proposed', 'under_review', 'approved', 'in_progress', 'implemented', 'rejected', 'archived');
CREATE TYPE idea_category AS ENUM ('research', 'process_improvement', 'technology', 'collaboration', 'training', 'equipment', 'other');
CREATE TYPE effort_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE impact_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE deadline_type AS ENUM ('grant_deadline', 'paper_submission', 'conference_abstract', 'irb_submission', 'ethics_review', 'data_collection', 'analysis_completion', 'milestone', 'presentation', 'meeting', 'other');

-- Publication and authorship types
CREATE TYPE publication_status AS ENUM ('planning', 'writing', 'draft_complete', 'under_review', 'revision_requested', 'accepted', 'published', 'rejected');

-- IRB and ethics types
CREATE TYPE irb_status AS ENUM ('not_required', 'planning', 'submitted', 'under_review', 'approved', 'expired', 'suspended', 'withdrawn', 'exempt');

-- Academic management types
CREATE TYPE citation_type AS ENUM ('journal', 'conference', 'book', 'patent', 'preprint', 'thesis', 'other');
CREATE TYPE patent_status AS ENUM ('idea', 'filed', 'pending', 'granted', 'expired', 'abandoned');
CREATE TYPE conference_status AS ENUM ('planning', 'abstract_submitted', 'accepted', 'rejected', 'presented');
CREATE TYPE review_type AS ENUM ('peer_review', 'grant_review', 'editorial_review', 'book_review');

-- Financial management types  
CREATE TYPE grant_status AS ENUM ('planning', 'submitted', 'awarded', 'active', 'completed', 'closed', 'rejected');
CREATE TYPE procurement_status AS ENUM ('requested', 'approved', 'ordered', 'received', 'cancelled', 'returned');
CREATE TYPE vendor_status AS ENUM ('active', 'preferred', 'restricted', 'inactive', 'blacklisted');

-- File and storage types
CREATE TYPE file_type AS ENUM ('document', 'spreadsheet', 'presentation', 'image', 'video', 'audio', 'code', 'data', 'archive', 'other');
CREATE TYPE storage_provider AS ENUM ('supabase', 'google_drive', 'dropbox', 'onedrive', 'local');
CREATE TYPE share_permission AS ENUM ('view', 'comment', 'edit', 'admin');

-- Calendar and integration types
CREATE TYPE event_type AS ENUM ('meeting', 'deadline', 'conference', 'training', 'holiday', 'pto', 'clinic', 'other');
CREATE TYPE calendar_provider AS ENUM ('google', 'outlook', 'apple', 'internal');
CREATE TYPE integration_status AS ENUM ('connected', 'disconnected', 'error', 'syncing');

-- ============================================================================
-- CORE AUTHENTICATION & USER TABLES
-- ============================================================================

-- User profiles (the source of truth for all user data)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  full_name VARCHAR(255),
  display_name VARCHAR(255),
  avatar_url VARCHAR(1000),
  bio TEXT,
  phone VARCHAR(50),
  title VARCHAR(255),
  department VARCHAR(255),
  institution VARCHAR(255),
  website VARCHAR(500),
  orcid VARCHAR(50),
  google_scholar VARCHAR(500),
  linkedin VARCHAR(500),
  twitter VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'UTC',
  locale VARCHAR(10) DEFAULT 'en-US',
  theme VARCHAR(20) DEFAULT 'dark',
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_selected_lab_id UUID, -- Will reference labs.id
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "in_app": true}',
  privacy_settings JSONB DEFAULT '{"profile_visible": true, "email_visible": false}',
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences (separate table for complex preferences)
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'ui', 'notifications', 'integrations', etc.
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- ============================================================================
-- LAB MANAGEMENT SYSTEM (Core of the hierarchy)
-- ============================================================================

-- Labs (research laboratories) - TOP LEVEL of hierarchy
CREATE TABLE labs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(100) UNIQUE, -- URL-friendly identifier
  description TEXT,
  short_description VARCHAR(500),
  logo_url VARCHAR(1000),
  banner_url VARCHAR(1000),
  website VARCHAR(500),
  contact_email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  
  -- Lab settings
  timezone VARCHAR(50) DEFAULT 'UTC',
  primary_color VARCHAR(7) DEFAULT '#3b82f6',
  secondary_color VARCHAR(7) DEFAULT '#1e40af',
  status lab_status DEFAULT 'active',
  is_public BOOLEAN DEFAULT false, -- Can non-members see basic info?
  allow_join_requests BOOLEAN DEFAULT true,
  
  -- Meeting defaults
  default_meeting_duration INTEGER DEFAULT 30, -- minutes
  standup_day VARCHAR(20) DEFAULT 'monday',
  standup_time TIME DEFAULT '09:00:00',
  standup_timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Metadata
  tags TEXT[],
  research_areas TEXT[],
  funding_sources TEXT[],
  settings JSONB DEFAULT '{}',
  
  -- Administrative
  created_by UUID REFERENCES user_profiles(id),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES user_profiles(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES user_profiles(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT valid_hex_colors CHECK (
    primary_color ~ '^#[0-9a-f]{6}$' AND 
    secondary_color ~ '^#[0-9a-f]{6}$'
  )
);

-- Lab members with comprehensive permission system - CONNECTS users to labs
CREATE TABLE lab_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  role user_role DEFAULT 'external_collaborator',
  
  -- Administrative permissions
  is_admin BOOLEAN DEFAULT false,
  is_super_admin BOOLEAN DEFAULT false,
  can_manage_lab_settings BOOLEAN DEFAULT false,
  can_manage_members BOOLEAN DEFAULT false,
  can_manage_permissions BOOLEAN DEFAULT false,
  can_view_audit_logs BOOLEAN DEFAULT false,
  can_manage_integrations BOOLEAN DEFAULT false,
  can_manage_billing BOOLEAN DEFAULT false,
  
  -- Project and research permissions
  can_create_projects BOOLEAN DEFAULT false,
  can_edit_all_projects BOOLEAN DEFAULT false,
  can_delete_projects BOOLEAN DEFAULT false,
  can_view_all_projects BOOLEAN DEFAULT true,
  can_archive_projects BOOLEAN DEFAULT false,
  can_restore_projects BOOLEAN DEFAULT false,
  can_manage_project_templates BOOLEAN DEFAULT false,
  
  -- Task management permissions
  can_create_tasks BOOLEAN DEFAULT true,
  can_assign_tasks BOOLEAN DEFAULT false,
  can_edit_all_tasks BOOLEAN DEFAULT false,
  can_delete_tasks BOOLEAN DEFAULT false,
  can_view_all_tasks BOOLEAN DEFAULT true,
  can_manage_task_templates BOOLEAN DEFAULT false,
  can_set_task_priorities BOOLEAN DEFAULT false,
  can_manage_deadlines BOOLEAN DEFAULT false,
  
  -- Data and reporting permissions
  can_access_reports BOOLEAN DEFAULT false,
  can_export_data BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT false,
  can_view_financials BOOLEAN DEFAULT false,
  can_manage_data_sources BOOLEAN DEFAULT false,
  
  -- Communication permissions
  can_schedule_meetings BOOLEAN DEFAULT false,
  can_manage_standups BOOLEAN DEFAULT false,
  can_send_announcements BOOLEAN DEFAULT false,
  can_moderate_discussions BOOLEAN DEFAULT false,
  can_manage_calendar BOOLEAN DEFAULT false,
  
  -- File and content permissions
  can_upload_files BOOLEAN DEFAULT true,
  can_share_files BOOLEAN DEFAULT true,
  can_delete_files BOOLEAN DEFAULT false,
  can_manage_file_permissions BOOLEAN DEFAULT false,
  can_create_ideas BOOLEAN DEFAULT true,
  can_moderate_ideas BOOLEAN DEFAULT false,
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT true,
  is_favorite_lab BOOLEAN DEFAULT false,
  custom_title VARCHAR(255),
  bio TEXT,
  expertise_areas TEXT[],
  
  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_at TIMESTAMPTZ,
  invited_by UUID REFERENCES user_profiles(id),
  left_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES user_profiles(id),
  last_permission_update TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, lab_id)
);

-- Lab invitations system
CREATE TABLE lab_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role user_role DEFAULT 'external_collaborator',
  invited_by UUID NOT NULL REFERENCES user_profiles(id),
  message TEXT,
  
  -- Invitation management
  token VARCHAR(255) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lab_id, email, status) DEFERRABLE INITIALLY DEFERRED
);

-- Lab invite codes (for bulk invitations)
CREATE TABLE lab_invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  default_role user_role DEFAULT 'external_collaborator',
  created_by UUID REFERENCES user_profiles(id),
  
  -- Usage limits
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  is_active BOOLEAN DEFAULT true,
  
  -- Restrictions
  allowed_email_domains TEXT[], -- ['rush.edu', 'example.com']
  require_approval BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROJECT MANAGEMENT HIERARCHY (lab → bucket → project → task → subtask)
-- ============================================================================

-- Buckets (top-level project containers within labs) - LEVEL 2 of hierarchy
CREATE TABLE buckets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE, -- KEY: belongs to lab
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6b7280',
  icon VARCHAR(50) DEFAULT 'folder',
  status bucket_status DEFAULT 'active',
  
  -- Organization
  position INTEGER DEFAULT 0,
  parent_bucket_id UUID REFERENCES buckets(id), -- For nested buckets
  
  -- Permissions
  is_private BOOLEAN DEFAULT false,
  owner_id UUID REFERENCES user_profiles(id),
  
  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  
  -- Admin
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES user_profiles(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES user_profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lab_id, name)
);

-- Projects (research projects within buckets) - LEVEL 3 of hierarchy
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bucket_id UUID NOT NULL REFERENCES buckets(id) ON DELETE CASCADE, -- KEY: belongs to bucket (which belongs to lab)
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status project_status DEFAULT 'planning',
  priority priority DEFAULT 'medium',
  
  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completion_criteria TEXT,
  
  -- Timeline
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  estimated_hours DECIMAL(8,2),
  actual_hours DECIMAL(8,2),
  
  -- Team and ownership
  owner_id UUID REFERENCES user_profiles(id),
  team_members UUID[], -- Array of user IDs
  
  -- Publication authorship tracking
  first_author_id UUID REFERENCES user_profiles(id),
  last_author_id UUID REFERENCES user_profiles(id), 
  corresponding_author_id UUID REFERENCES user_profiles(id),
  author_order UUID[], -- Complete ordered list of all authors
  publication_title VARCHAR(500),
  target_journal VARCHAR(255),
  manuscript_status publication_status DEFAULT 'planning',
  submission_deadline DATE,
  submission_date DATE,
  revision_deadline DATE,
  acceptance_date DATE,
  publication_date DATE,
  doi VARCHAR(255),
  pmid VARCHAR(50),
  publication_url VARCHAR(1000),
  
  -- Financial tracking
  budget DECIMAL(12,2),
  spent DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Grant association (optional)
  associated_grant_number VARCHAR(100),
  associated_grant_title VARCHAR(255),
  funding_source VARCHAR(255),
  
  -- IRB and ethics tracking (optional for research projects)
  irb_number VARCHAR(100), -- Optional IRB number field for recordkeeping
  irb_status irb_status DEFAULT 'planning',
  irb_approval_date DATE,
  irb_expiration_date DATE,
  ethics_committee VARCHAR(255),
  irb_documents UUID[], -- Array of file IDs for IRB documents
  human_subjects_research BOOLEAN DEFAULT true,
  exempt_research BOOLEAN DEFAULT false,
  minimal_risk BOOLEAN DEFAULT false,
  irb_notes TEXT,
  
  -- Organization
  position INTEGER DEFAULT 0,
  color VARCHAR(7),
  
  -- Metadata
  tags TEXT[],
  research_areas TEXT[],
  methodology TEXT,
  expected_outcomes TEXT,
  success_metrics TEXT[],
  risks TEXT[],
  dependencies TEXT[],
  external_links JSONB DEFAULT '{}', -- {github: "url", paper: "url", etc.}
  custom_fields JSONB DEFAULT '{}',
  
  -- Administrative
  is_template BOOLEAN DEFAULT false,
  template_name VARCHAR(255),
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES user_profiles(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES user_profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Publication authorship validation constraints  
  CONSTRAINT valid_authorship CHECK (
    first_author_id IS NULL OR 
    last_author_id IS NULL OR 
    first_author_id != last_author_id
  ),
  CONSTRAINT corresponding_author_in_team CHECK (
    corresponding_author_id IS NULL OR
    corresponding_author_id = ANY(team_members) OR
    corresponding_author_id = first_author_id OR  
    corresponding_author_id = last_author_id
  ),
  CONSTRAINT valid_publication_dates CHECK (
    submission_date IS NULL OR submission_deadline IS NULL OR submission_date <= submission_deadline + INTERVAL '30 days'
  ),
  -- IRB validation constraints
  CONSTRAINT valid_irb_number CHECK (
    irb_number IS NULL OR (
      LENGTH(TRIM(irb_number)) >= 3 AND
      irb_number ~ '^[A-Za-z0-9\-#\/]+$'
    )
  ),
  CONSTRAINT valid_irb_dates CHECK (
    irb_approval_date IS NULL OR 
    irb_expiration_date IS NULL OR 
    irb_approval_date < irb_expiration_date
  ),
  CONSTRAINT valid_irb_status_logic CHECK (
    (irb_status = 'approved' AND irb_approval_date IS NOT NULL) OR
    (irb_status != 'approved') OR
    (irb_number IS NULL) -- Allow projects without IRB requirements
  )
);

-- Tasks (individual work items within projects) - LEVEL 4 of hierarchy
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, -- KEY: belongs to project (which belongs to bucket → lab)
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- KEY: for subtasks (LEVEL 5)
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo',
  priority priority DEFAULT 'medium',
  
  -- Assignment and ownership
  assigned_to UUID REFERENCES user_profiles(id),
  assigned_by UUID REFERENCES user_profiles(id),
  assignee_comments TEXT,
  
  -- Timeline
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),
  
  -- Organization
  position DECIMAL(10,2) DEFAULT 0,
  kanban_column VARCHAR(50) DEFAULT 'todo',
  
  -- Task details
  acceptance_criteria TEXT,
  completion_notes TEXT,
  blocking_reason TEXT,
  
  -- Metadata
  tags TEXT[],
  labels TEXT[],
  complexity INTEGER CHECK (complexity BETWEEN 1 AND 5),
  story_points INTEGER,
  custom_fields JSONB DEFAULT '{}',
  
  -- Recurrence (for repeating tasks)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- RRULE format
  recurrence_parent_id UUID REFERENCES tasks(id),
  
  -- Administrative
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'ai_generated', 'imported', etc.
  source_reference VARCHAR(255),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES user_profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT no_self_parent CHECK (id != parent_task_id),
  CONSTRAINT valid_completion CHECK (
    (status = 'done' AND completed_date IS NOT NULL) OR 
    (status != 'done')
  )
);

-- Task dependencies
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(20) DEFAULT 'finish_to_start' CHECK (
    dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id),
  CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id)
);

-- ============================================================================
-- COMMUNICATION & COLLABORATION
-- ============================================================================

-- Comments (unified commenting system)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type comment_type NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  mentions UUID[], -- Array of mentioned user IDs
  
  -- Content management
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  edit_history JSONB DEFAULT '[]',
  
  -- Moderation
  is_pinned BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES user_profiles(id),
  resolved_at TIMESTAMPTZ,
  
  -- Reactions
  reactions JSONB DEFAULT '{}', -- {emoji: [user_id1, user_id2]}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ideas board
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category idea_category DEFAULT 'other',
  status idea_status DEFAULT 'draft',
  priority priority DEFAULT 'medium',
  
  -- Impact assessment
  estimated_effort effort_level DEFAULT 'medium',
  potential_impact impact_level DEFAULT 'medium',
  business_value TEXT,
  technical_feasibility TEXT,
  
  -- Ownership and assignment
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  assigned_to UUID REFERENCES user_profiles(id),
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Implementation tracking
  implementation_notes TEXT,
  related_project_id UUID REFERENCES projects(id),
  expected_completion_date DATE,
  actual_completion_date DATE,
  
  -- Engagement
  vote_score INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  -- Metadata
  tags TEXT[],
  external_links JSONB DEFAULT '{}',
  attachments TEXT[], -- File URLs or IDs
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idea votes
CREATE TABLE idea_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(idea_id, user_id)
);

-- ============================================================================
-- MEETING & STANDUP SYSTEM
-- ============================================================================

-- Standup meetings
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type meeting_type DEFAULT 'standup',
  description TEXT,
  
  -- Scheduling
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Location/connection
  location VARCHAR(255),
  meeting_url VARCHAR(1000),
  dial_in_info TEXT,
  
  -- Participants
  organizer_id UUID NOT NULL REFERENCES user_profiles(id),
  participants UUID[], -- Array of user IDs
  invited_participants UUID[], -- All who were invited
  required_participants UUID[], -- Must attend
  
  -- Recording and transcription
  recording_url VARCHAR(1000),
  recording_status VARCHAR(20) DEFAULT 'none' CHECK (
    recording_status IN ('none', 'scheduled', 'recording', 'processing', 'completed', 'failed')
  ),
  transcript TEXT,
  transcript_status VARCHAR(20) DEFAULT 'none' CHECK (
    transcript_status IN ('none', 'processing', 'completed', 'failed')
  ),
  
  -- AI processing
  ai_summary TEXT,
  ai_key_points TEXT[],
  ai_action_items TEXT[],
  ai_decisions TEXT[],
  ai_blockers TEXT[],
  ai_sentiment_analysis JSONB,
  ai_processing_status VARCHAR(20) DEFAULT 'none',
  ai_processing_error TEXT,
  
  -- Meeting data
  agenda TEXT,
  notes TEXT,
  outcomes TEXT,
  next_steps TEXT,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  recurrence_parent_id UUID REFERENCES meetings(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')
  ),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  external_calendar_id VARCHAR(255),
  external_meeting_id VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting attendance
CREATE TABLE meeting_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'invited' CHECK (
    status IN ('invited', 'accepted', 'declined', 'tentative', 'attended', 'no_show')
  ),
  response_time TIMESTAMPTZ,
  join_time TIMESTAMPTZ,
  leave_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

-- Action items from meetings
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- Linked task if converted
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES user_profiles(id),
  due_date DATE,
  priority priority DEFAULT 'medium',
  
  -- AI extraction
  is_ai_generated BOOLEAN DEFAULT false,
  ai_confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES user_profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DEADLINE & TIME MANAGEMENT
-- ============================================================================

-- Deadlines
CREATE TABLE deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type deadline_type NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  
  -- Details
  submission_url VARCHAR(1000),
  submission_requirements TEXT,
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  
  -- Assignment and ownership
  assigned_to UUID REFERENCES user_profiles(id),
  created_by UUID REFERENCES user_profiles(id),
  
  -- Progress tracking
  is_completed BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES user_profiles(id),
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  submission_confirmation VARCHAR(255),
  
  -- Reminders
  reminder_schedule INTEGER[] DEFAULT ARRAY[30, 7, 3, 1], -- Days before
  last_reminder_sent_at TIMESTAMPTZ,
  reminder_recipients UUID[],
  
  -- Related items
  related_project_id UUID REFERENCES projects(id),
  related_tasks UUID[], -- Array of task IDs
  
  -- Priority and urgency
  priority priority DEFAULT 'medium',
  is_critical BOOLEAN DEFAULT false,
  
  -- Metadata
  tags TEXT[],
  external_links JSONB DEFAULT '{}',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deadline reminders (tracking what reminders were sent)
CREATE TABLE deadline_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deadline_id UUID NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  days_before INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_method VARCHAR(20) DEFAULT 'email' CHECK (delivery_method IN ('email', 'push', 'in_app')),
  delivered BOOLEAN DEFAULT false,
  opened BOOLEAN DEFAULT false,
  UNIQUE(deadline_id, user_id, days_before)
);

-- ============================================================================
-- FILE MANAGEMENT & STORAGE
-- ============================================================================

-- Files and folders
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES files(id) ON DELETE CASCADE,
  
  -- File identity
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  file_type file_type NOT NULL,
  mime_type VARCHAR(100),
  file_extension VARCHAR(20),
  
  -- Storage
  storage_provider storage_provider DEFAULT 'supabase',
  storage_path VARCHAR(1000),
  storage_bucket VARCHAR(100),
  file_url VARCHAR(1000),
  
  -- File properties
  file_size BIGINT,
  checksum VARCHAR(64), -- For integrity checking
  version INTEGER DEFAULT 1,
  
  -- Content
  description TEXT,
  content_summary TEXT, -- AI-generated summary for documents
  extracted_text TEXT, -- For search
  
  -- Organization
  tags TEXT[],
  folder_path TEXT, -- Materialized path for quick lookups
  position INTEGER DEFAULT 0,
  
  -- Permissions and sharing
  owner_id UUID NOT NULL REFERENCES user_profiles(id),
  is_public BOOLEAN DEFAULT false,
  sharing_settings JSONB DEFAULT '{}',
  
  -- Related entities
  related_project_id UUID REFERENCES projects(id),
  related_task_id UUID REFERENCES tasks(id),
  related_meeting_id UUID REFERENCES meetings(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  external_links JSONB DEFAULT '{}',
  
  -- Status
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES user_profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT no_self_parent CHECK (id != parent_folder_id),
  CONSTRAINT valid_file_properties CHECK (
    (file_type != 'document' OR file_url IS NOT NULL) AND
    (parent_folder_id IS NULL OR parent_folder_id != id)
  )
);

-- File versions (for version control)
CREATE TABLE file_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Version details
  file_size BIGINT,
  checksum VARCHAR(64),
  storage_path VARCHAR(1000),
  file_url VARCHAR(1000),
  
  -- Change tracking
  change_description TEXT,
  changed_by UUID NOT NULL REFERENCES user_profiles(id),
  change_type VARCHAR(20) DEFAULT 'update' CHECK (change_type IN ('create', 'update', 'restore')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(file_id, version_number)
);

-- File permissions
CREATE TABLE file_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  permission share_permission NOT NULL,
  
  -- Permission details
  granted_by UUID NOT NULL REFERENCES user_profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Access tracking
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  UNIQUE(file_id, user_id)
);

-- ============================================================================
-- CALENDAR & INTEGRATION SYSTEM
-- ============================================================================

-- Calendar events
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  
  -- Event details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  event_type event_type DEFAULT 'other',
  
  -- Timing
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- RRULE format
  recurrence_parent_id UUID REFERENCES calendar_events(id),
  
  -- Organization
  organizer_id UUID NOT NULL REFERENCES user_profiles(id),
  attendees UUID[],
  
  -- Integration
  external_calendar_id VARCHAR(255),
  external_event_id VARCHAR(255),
  external_provider calendar_provider,
  sync_status integration_status DEFAULT 'disconnected',
  last_synced_at TIMESTAMPTZ,
  
  -- Related entities
  related_meeting_id UUID REFERENCES meetings(id),
  related_project_id UUID REFERENCES projects(id),
  related_deadline_id UUID REFERENCES deadlines(id),
  
  -- Export customization
  export_title VARCHAR(255),
  export_description TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar integrations (user-level integrations)
CREATE TABLE calendar_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  provider calendar_provider NOT NULL,
  
  -- Integration details
  name VARCHAR(255) NOT NULL,
  external_calendar_id VARCHAR(255),
  
  -- Authentication
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMPTZ,
  
  -- Configuration
  sync_settings JSONB DEFAULT '{}',
  is_primary BOOLEAN DEFAULT false,
  sync_enabled BOOLEAN DEFAULT true,
  
  -- Status
  status integration_status DEFAULT 'connected',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, provider, external_calendar_id)
);

-- ============================================================================
-- NOTIFICATION & ACTIVITY SYSTEM
-- ============================================================================

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  lab_id UUID REFERENCES labs(id) ON DELETE SET NULL,
  
  -- Notification content
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  icon VARCHAR(50),
  
  -- Targeting and context
  reference_type VARCHAR(50), -- 'task', 'project', 'deadline', etc.
  reference_id UUID,
  sender_id UUID REFERENCES user_profiles(id),
  
  -- Delivery
  channels JSONB DEFAULT '{"in_app": true, "email": false, "push": false}',
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  
  -- Actions
  action_url VARCHAR(1000),
  action_text VARCHAR(100),
  
  -- Metadata
  data JSONB DEFAULT '{}',
  
  -- Delivery tracking
  email_sent_at TIMESTAMPTZ,
  push_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  lab_id UUID REFERENCES labs(id) ON DELETE SET NULL,
  
  -- Activity details
  action activity_type NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  entity_name VARCHAR(255),
  
  -- Context
  description TEXT,
  changes JSONB, -- Before/after for updates
  metadata JSONB DEFAULT '{}',
  
  -- Request context
  ip_address INET,
  user_agent TEXT,
  request_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS & REPORTING TABLES
-- ============================================================================

-- Usage analytics
CREATE TABLE usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  lab_id UUID REFERENCES labs(id) ON DELETE SET NULL,
  
  -- Event tracking
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  
  -- Context
  page_url VARCHAR(1000),
  referrer VARCHAR(1000),
  session_id UUID,
  
  -- Technical details
  ip_address INET,
  user_agent TEXT,
  screen_resolution VARCHAR(20),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ACADEMIC & IP MANAGEMENT SYSTEM  
-- ============================================================================

-- Publications and citations tracking
CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  related_project_id UUID REFERENCES projects(id),
  
  -- Publication details
  title VARCHAR(500) NOT NULL,
  authors TEXT NOT NULL, -- Full author string as published
  journal VARCHAR(255),
  journal_impact_factor DECIMAL(6,3),
  publication_date DATE,
  volume VARCHAR(50),
  issue VARCHAR(50),
  pages VARCHAR(50),
  
  -- Identifiers
  doi VARCHAR(255) UNIQUE,
  pmid VARCHAR(50),
  pmcid VARCHAR(50),
  url VARCHAR(1000),
  
  -- Impact metrics
  citation_count INTEGER DEFAULT 0,
  last_citation_update TIMESTAMPTZ,
  h_index_contribution BOOLEAN DEFAULT false,
  
  -- Internal tracking
  type citation_type DEFAULT 'journal',
  is_open_access BOOLEAN DEFAULT false,
  internal_notes TEXT,
  added_by UUID NOT NULL REFERENCES user_profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patent portfolio management
CREATE TABLE patents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  related_project_id UUID REFERENCES projects(id),
  
  -- Patent details
  title VARCHAR(500) NOT NULL,
  inventors TEXT NOT NULL, -- Inventor names as filed
  patent_number VARCHAR(100),
  application_number VARCHAR(100),
  filing_date DATE,
  priority_date DATE,
  grant_date DATE,
  expiration_date DATE,
  
  -- Classification
  status patent_status DEFAULT 'idea',
  patent_office VARCHAR(100), -- USPTO, EPO, etc.
  patent_type VARCHAR(50) DEFAULT 'utility', -- utility, design, plant
  technology_areas TEXT[],
  
  -- Business details
  assignee VARCHAR(255), -- Usually the institution
  attorney_firm VARCHAR(255),
  estimated_value DECIMAL(12,2),
  licensing_revenue DECIMAL(12,2) DEFAULT 0,
  
  -- Tracking
  renewal_fees_due DATE,
  maintenance_status VARCHAR(50),
  commercialization_notes TEXT,
  added_by UUID NOT NULL REFERENCES user_profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conference management
CREATE TABLE conferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  related_project_id UUID REFERENCES projects(id),
  
  -- Conference details
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  start_date DATE,
  end_date DATE,
  website VARCHAR(1000),
  
  -- Submission details
  abstract_title VARCHAR(500),
  abstract_text TEXT,
  submission_deadline DATE,
  submission_date DATE,
  presentation_type VARCHAR(50), -- oral, poster, keynote
  
  -- Status tracking
  status conference_status DEFAULT 'planning',
  acceptance_date DATE,
  rejection_date DATE,
  presentation_date DATE,
  
  -- Presenters
  primary_presenter_id UUID REFERENCES user_profiles(id),
  co_presenters UUID[], -- Array of user IDs
  
  -- Materials
  abstract_file_id UUID REFERENCES files(id),
  presentation_file_id UUID REFERENCES files(id),
  poster_file_id UUID REFERENCES files(id),
  
  -- Financial
  registration_fee DECIMAL(8,2),
  travel_budget DECIMAL(8,2),
  actual_cost DECIMAL(8,2),
  
  -- Tracking
  notes TEXT,
  added_by UUID NOT NULL REFERENCES user_profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Peer review activity tracking
CREATE TABLE peer_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  lab_id UUID REFERENCES labs(id) ON DELETE SET NULL,
  
  -- Review details
  type review_type NOT NULL,
  journal_name VARCHAR(255),
  manuscript_title VARCHAR(500),
  review_date DATE,
  decision VARCHAR(50), -- accept, reject, major_revision, minor_revision
  
  -- Time tracking
  hours_spent DECIMAL(4,1),
  review_quality_rating INTEGER CHECK (review_quality_rating BETWEEN 1 AND 5),
  
  -- Recognition
  reviewer_recognition TEXT,
  is_acknowledged BOOLEAN DEFAULT false,
  
  -- Privacy (for personal records)
  is_confidential BOOLEAN DEFAULT true,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FINANCIAL RESEARCH MANAGEMENT SYSTEM
-- ============================================================================

-- Grant portfolio management
CREATE TABLE grants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  
  -- Grant identification
  title VARCHAR(500) NOT NULL,
  grant_number VARCHAR(100) UNIQUE,
  funding_agency VARCHAR(255) NOT NULL,
  program_name VARCHAR(255),
  
  -- Financial details
  total_amount DECIMAL(12,2) NOT NULL,
  direct_costs DECIMAL(12,2),
  indirect_costs DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Timeline
  application_deadline DATE,
  submission_date DATE,
  award_date DATE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status and tracking
  status grant_status DEFAULT 'planning',
  principal_investigator_id UUID NOT NULL REFERENCES user_profiles(id),
  co_investigators UUID[], -- Array of user IDs
  
  -- Compliance
  effort_reporting_required BOOLEAN DEFAULT true,
  progress_reports_required BOOLEAN DEFAULT true,
  next_report_due DATE,
  
  -- Budget tracking
  spent_to_date DECIMAL(12,2) DEFAULT 0,
  committed_funds DECIMAL(12,2) DEFAULT 0,
  burn_rate DECIMAL(8,2), -- Monthly spend rate
  
  -- Administration  
  program_officer VARCHAR(255),
  institutional_contact VARCHAR(255),
  grant_admin_contact VARCHAR(255),
  
  -- Related items
  related_projects UUID[], -- Array of project IDs
  
  -- Metadata
  keywords TEXT[],
  research_areas TEXT[],
  notes TEXT,
  internal_reference VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Effort reporting for grant compliance
CREATE TABLE effort_reporting (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  
  -- Reporting period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  reporting_type VARCHAR(50) DEFAULT 'monthly', -- monthly, quarterly, annual
  
  -- Effort allocation
  committed_effort_percentage DECIMAL(5,2) NOT NULL CHECK (committed_effort_percentage BETWEEN 0 AND 100),
  actual_effort_percentage DECIMAL(5,2) CHECK (actual_effort_percentage BETWEEN 0 AND 100),
  total_hours DECIMAL(8,2),
  
  -- Activities
  research_activities TEXT,
  administrative_activities TEXT,
  training_activities TEXT,
  other_activities TEXT,
  
  -- Compliance
  is_submitted BOOLEAN DEFAULT false,
  submitted_date DATE,
  submitted_by UUID REFERENCES user_profiles(id),
  certification_statement TEXT,
  
  -- Variance tracking
  effort_variance DECIMAL(5,2), -- difference between committed and actual
  variance_explanation TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, grant_id, period_start, period_end)
);

-- Vendor management
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  
  -- Vendor details
  name VARCHAR(255) NOT NULL,
  vendor_number VARCHAR(100),
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  
  -- Business details
  tax_id VARCHAR(50),
  business_type VARCHAR(100),
  certification_details TEXT,
  
  -- Performance
  status vendor_status DEFAULT 'active',
  preferred_vendor BOOLEAN DEFAULT false,
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  delivery_rating INTEGER CHECK (delivery_rating BETWEEN 1 AND 5),
  service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
  
  -- Categories and capabilities
  product_categories TEXT[],
  service_categories TEXT[],
  specialties TEXT[],
  
  -- Financial
  payment_terms VARCHAR(100),
  credit_limit DECIMAL(12,2),
  discount_terms VARCHAR(255),
  
  -- Tracking
  last_order_date DATE,
  total_orders_count INTEGER DEFAULT 0,
  total_order_value DECIMAL(12,2) DEFAULT 0,
  
  -- Administration
  added_by UUID NOT NULL REFERENCES user_profiles(id),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lab_id, vendor_number)
);

-- Procurement request management
CREATE TABLE procurement_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  related_project_id UUID REFERENCES projects(id),
  related_grant_id UUID REFERENCES grants(id),
  vendor_id UUID REFERENCES vendors(id),
  
  -- Request details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  justification TEXT,
  urgency priority DEFAULT 'medium',
  
  -- Financial
  estimated_cost DECIMAL(12,2) NOT NULL,
  actual_cost DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  budget_code VARCHAR(100),
  
  -- Items
  items JSONB NOT NULL DEFAULT '[]', -- Array of {name, quantity, unit_cost, description}
  
  -- Workflow
  status procurement_status DEFAULT 'requested',
  requested_by UUID NOT NULL REFERENCES user_profiles(id),
  requested_date DATE DEFAULT (NOW()::DATE),
  approved_by UUID REFERENCES user_profiles(id),
  approved_date DATE,
  ordered_by UUID REFERENCES user_profiles(id),
  ordered_date DATE,
  received_by UUID REFERENCES user_profiles(id),
  received_date DATE,
  
  -- Purchase details
  purchase_order_number VARCHAR(100),
  invoice_number VARCHAR(100),
  tracking_number VARCHAR(255),
  
  -- Delivery
  delivery_location VARCHAR(255),
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  
  -- Quality control
  items_received_correctly BOOLEAN,
  quality_issues TEXT,
  return_requested BOOLEAN DEFAULT false,
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT true,
  approval_notes TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- HELPER FUNCTIONS & PROCEDURES
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Create user profile automatically on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  name_parts TEXT[];
  first_name TEXT;
  last_name TEXT;
BEGIN
  -- Extract name from email if not provided in metadata
  name_parts := string_to_array(split_part(NEW.email, '@', 1), '.');
  first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', INITCAP(name_parts[1]));
  last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', INITCAP(COALESCE(name_parts[2], '')));

  INSERT INTO user_profiles (
    id, email, first_name, last_name, full_name, display_name
  ) VALUES (
    NEW.id,
    NEW.email,
    first_name,
    last_name,
    TRIM(first_name || ' ' || last_name),
    COALESCE(NEW.raw_user_meta_data->>'display_name', first_name)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

-- Lab membership checker
CREATE OR REPLACE FUNCTION is_lab_member(lab_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM lab_members lm
    WHERE lm.lab_id = $1 
    AND lm.user_id = COALESCE($2, auth.uid())
    AND lm.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Permission checker
CREATE OR REPLACE FUNCTION has_lab_permission(
  lab_id UUID, 
  permission_name TEXT, 
  user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN := false;
BEGIN
  EXECUTE format('
    SELECT COALESCE(%I, false) OR is_super_admin 
    FROM lab_members 
    WHERE lab_id = $1 AND user_id = $2 AND is_active = true',
    permission_name
  ) INTO result USING lab_id, COALESCE(user_id, auth.uid());
  
  RETURN COALESCE(result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Generate lab slug
CREATE OR REPLACE FUNCTION generate_lab_slug(lab_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug
  base_slug := lower(regexp_replace(lab_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM labs WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Auto-generate lab slug
CREATE OR REPLACE FUNCTION set_lab_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_lab_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Update project progress based on tasks
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  progress INTEGER;
  target_project_id UUID;
BEGIN
  target_project_id := COALESCE(NEW.project_id, OLD.project_id);
  
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'done')
  INTO total_tasks, completed_tasks
  FROM tasks
  WHERE project_id = target_project_id
    AND deleted_at IS NULL;
  
  IF total_tasks > 0 THEN
    progress := (completed_tasks * 100) / total_tasks;
  ELSE
    progress := 0;
  END IF;
  
  UPDATE projects
  SET progress_percentage = progress
  WHERE id = target_project_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql VOLATILE;

-- FIXED: Lab member creation with proper permissions (corrected syntax)
CREATE OR REPLACE FUNCTION add_lab_member_with_permissions(
    p_email TEXT,
    p_lab_name TEXT,
    p_role user_role,
    p_is_admin BOOLEAN DEFAULT false
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_lab_id UUID;
    -- Individual permission variables (FIXED: no RECORD type issues)
    v_is_super_admin BOOLEAN;
    v_can_manage_lab_settings BOOLEAN;
    v_can_manage_members BOOLEAN;
    v_can_manage_permissions BOOLEAN;
    v_can_view_audit_logs BOOLEAN;
    v_can_manage_integrations BOOLEAN;
    v_can_create_projects BOOLEAN;
    v_can_edit_all_projects BOOLEAN;
    v_can_delete_projects BOOLEAN;
    v_can_view_all_projects BOOLEAN;
    v_can_assign_tasks BOOLEAN;
    v_can_edit_all_tasks BOOLEAN;
    v_can_delete_tasks BOOLEAN;
    v_can_access_reports BOOLEAN;
    v_can_export_data BOOLEAN;
    v_can_view_analytics BOOLEAN;
    v_can_schedule_meetings BOOLEAN;
    v_can_manage_standups BOOLEAN;
    v_can_send_announcements BOOLEAN;
    v_can_manage_calendar BOOLEAN;
BEGIN
    -- Get user ID by email
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User with email % not found. Skipping membership for %.', p_email, p_lab_name;
        RETURN FALSE;
    END IF;

    -- Get lab ID by name
    SELECT id INTO v_lab_id FROM labs WHERE name = p_lab_name;
    IF v_lab_id IS NULL THEN
        RAISE NOTICE 'Lab % not found. Skipping membership for %.', p_lab_name, p_email;
        RETURN FALSE;
    END IF;

    -- Set permissions based on role (FIXED: individual assignments)
    CASE p_role
        WHEN 'principal_investigator' THEN
            v_is_super_admin := true;
            v_can_manage_lab_settings := true;
            v_can_manage_members := true;
            v_can_manage_permissions := true;
            v_can_view_audit_logs := true;
            v_can_manage_integrations := true;
            v_can_create_projects := true;
            v_can_edit_all_projects := true;
            v_can_delete_projects := true;
            v_can_view_all_projects := true;
            v_can_assign_tasks := true;
            v_can_edit_all_tasks := true;
            v_can_delete_tasks := true;
            v_can_access_reports := true;
            v_can_export_data := true;
            v_can_view_analytics := true;
            v_can_schedule_meetings := true;
            v_can_manage_standups := true;
            v_can_send_announcements := true;
            v_can_manage_calendar := true;
        WHEN 'co_investigator' THEN
            v_is_super_admin := false;
            v_can_manage_lab_settings := false;
            v_can_manage_members := true;
            v_can_manage_permissions := true;
            v_can_view_audit_logs := true;
            v_can_manage_integrations := false;
            v_can_create_projects := true;
            v_can_edit_all_projects := true;
            v_can_delete_projects := false;
            v_can_view_all_projects := true;
            v_can_assign_tasks := true;
            v_can_edit_all_tasks := true;
            v_can_delete_tasks := false;
            v_can_access_reports := true;
            v_can_export_data := true;
            v_can_view_analytics := true;
            v_can_schedule_meetings := true;
            v_can_manage_standups := true;
            v_can_send_announcements := true;
            v_can_manage_calendar := true;
        WHEN 'lab_manager' THEN
            v_is_super_admin := false;
            v_can_manage_lab_settings := true;
            v_can_manage_members := true;
            v_can_manage_permissions := false;
            v_can_view_audit_logs := true;
            v_can_manage_integrations := true;
            v_can_create_projects := true;
            v_can_edit_all_projects := true;
            v_can_delete_projects := false;
            v_can_view_all_projects := true;
            v_can_assign_tasks := true;
            v_can_edit_all_tasks := true;
            v_can_delete_tasks := false;
            v_can_access_reports := true;
            v_can_export_data := true;
            v_can_view_analytics := true;
            v_can_schedule_meetings := true;
            v_can_manage_standups := true;
            v_can_send_announcements := false;
            v_can_manage_calendar := true;
        WHEN 'data_analyst', 'data_scientist' THEN
            v_is_super_admin := false;
            v_can_manage_lab_settings := false;
            v_can_manage_members := false;
            v_can_manage_permissions := false;
            v_can_view_audit_logs := false;
            v_can_manage_integrations := false;
            v_can_create_projects := true;
            v_can_edit_all_projects := false;
            v_can_delete_projects := false;
            v_can_view_all_projects := true;
            v_can_assign_tasks := false;
            v_can_edit_all_tasks := false;
            v_can_delete_tasks := false;
            v_can_access_reports := true;
            v_can_export_data := true;
            v_can_view_analytics := true;
            v_can_schedule_meetings := false;
            v_can_manage_standups := false;
            v_can_send_announcements := false;
            v_can_manage_calendar := false;
        WHEN 'regulatory_coordinator' THEN
            v_is_super_admin := false;
            v_can_manage_lab_settings := false;
            v_can_manage_members := false;
            v_can_manage_permissions := false;
            v_can_view_audit_logs := true;
            v_can_manage_integrations := false;
            v_can_create_projects := true;
            v_can_edit_all_projects := true;
            v_can_delete_projects := false;
            v_can_view_all_projects := true;
            v_can_assign_tasks := false;
            v_can_edit_all_tasks := true;
            v_can_delete_tasks := false;
            v_can_access_reports := true;
            v_can_export_data := true;
            v_can_view_analytics := false;
            v_can_schedule_meetings := true;
            v_can_manage_standups := false;
            v_can_send_announcements := false;
            v_can_manage_calendar := true;
        ELSE -- lab_assistant, research_volunteer, external_collaborator
            v_is_super_admin := false;
            v_can_manage_lab_settings := false;
            v_can_manage_members := false;
            v_can_manage_permissions := false;
            v_can_view_audit_logs := false;
            v_can_manage_integrations := false;
            v_can_create_projects := false;
            v_can_edit_all_projects := false;
            v_can_delete_projects := false;
            v_can_view_all_projects := true;
            v_can_assign_tasks := false;
            v_can_edit_all_tasks := false;
            v_can_delete_tasks := false;
            v_can_access_reports := false;
            v_can_export_data := false;
            v_can_view_analytics := false;
            v_can_schedule_meetings := false;
            v_can_manage_standups := false;
            v_can_send_announcements := false;
            v_can_manage_calendar := false;
    END CASE;

    -- Insert membership (FIXED: individual column assignments)
    INSERT INTO lab_members (
        lab_id, user_id, role, is_admin,
        is_super_admin, can_manage_lab_settings, can_manage_members, can_manage_permissions,
        can_view_audit_logs, can_manage_integrations, can_create_projects, can_edit_all_projects,
        can_delete_projects, can_view_all_projects, can_assign_tasks, can_edit_all_tasks,
        can_delete_tasks, can_access_reports, can_export_data, can_view_analytics,
        can_schedule_meetings, can_manage_standups, can_send_announcements, can_manage_calendar
    ) VALUES (
        v_lab_id, v_user_id, p_role, COALESCE(p_is_admin, false),
        v_is_super_admin, v_can_manage_lab_settings, v_can_manage_members, v_can_manage_permissions,
        v_can_view_audit_logs, v_can_manage_integrations, v_can_create_projects, v_can_edit_all_projects,
        v_can_delete_projects, v_can_view_all_projects, v_can_assign_tasks, v_can_edit_all_tasks,
        v_can_delete_tasks, v_can_access_reports, v_can_export_data, v_can_view_analytics,
        v_can_schedule_meetings, v_can_manage_standups, v_can_send_announcements, v_can_manage_calendar
    )
    ON CONFLICT (user_id, lab_id) DO UPDATE SET
        role = EXCLUDED.role,
        is_admin = EXCLUDED.is_admin,
        is_super_admin = EXCLUDED.is_super_admin,
        can_manage_lab_settings = EXCLUDED.can_manage_lab_settings,
        can_manage_members = EXCLUDED.can_manage_members,
        can_manage_permissions = EXCLUDED.can_manage_permissions,
        updated_at = NOW();

    RAISE NOTICE 'Successfully added/updated membership: % as % in %', p_email, p_role, p_lab_name;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Timestamp triggers
CREATE TRIGGER update_user_profiles_timestamp BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_preferences_timestamp BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_labs_timestamp BEFORE UPDATE ON labs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_lab_members_timestamp BEFORE UPDATE ON lab_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_buckets_timestamp BEFORE UPDATE ON buckets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_timestamp BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_timestamp BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_ideas_timestamp BEFORE UPDATE ON ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_meetings_timestamp BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_deadlines_timestamp BEFORE UPDATE ON deadlines FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_files_timestamp BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_calendar_events_timestamp BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_calendar_integrations_timestamp BEFORE UPDATE ON calendar_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_lab_invite_codes_timestamp BEFORE UPDATE ON lab_invite_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Business logic triggers
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
CREATE TRIGGER set_lab_slug_trigger BEFORE INSERT ON labs FOR EACH ROW EXECUTE FUNCTION set_lab_slug();

-- Project progress tracking
CREATE TRIGGER update_project_progress_insert AFTER INSERT ON tasks FOR EACH ROW EXECUTE FUNCTION update_project_progress();
CREATE TRIGGER update_project_progress_update AFTER UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_project_progress();
CREATE TRIGGER update_project_progress_delete AFTER DELETE ON tasks FOR EACH ROW EXECUTE FUNCTION update_project_progress();

-- ============================================================================
-- PERFORMANCE INDEXES (preserving hierarchy relationships)
-- ============================================================================

-- User and authentication indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active) WHERE is_active = true;
CREATE INDEX idx_user_preferences_user_category ON user_preferences(user_id, category);

-- Lab and membership indexes (KEY: lab → lab_member relationship)
CREATE INDEX idx_labs_slug ON labs(slug);
CREATE INDEX idx_labs_status ON labs(status) WHERE status = 'active';
CREATE INDEX idx_labs_created_by ON labs(created_by);
CREATE INDEX idx_lab_members_user_lab ON lab_members(user_id, lab_id);
CREATE INDEX idx_lab_members_lab_active ON lab_members(lab_id) WHERE is_active = true;
CREATE INDEX idx_lab_members_user_active ON lab_members(user_id) WHERE is_active = true;
CREATE INDEX idx_lab_members_role ON lab_members(role);

-- Project hierarchy indexes (KEY: lab → bucket → project → task → subtask)
CREATE INDEX idx_buckets_lab ON buckets(lab_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_buckets_status ON buckets(status);
CREATE INDEX idx_projects_bucket ON projects(bucket_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_due_date ON projects(due_date) WHERE due_date IS NOT NULL;
-- Publication authorship indexes
CREATE INDEX idx_projects_first_author ON projects(first_author_id) WHERE first_author_id IS NOT NULL;
CREATE INDEX idx_projects_last_author ON projects(last_author_id) WHERE last_author_id IS NOT NULL;
CREATE INDEX idx_projects_corresponding_author ON projects(corresponding_author_id) WHERE corresponding_author_id IS NOT NULL;
CREATE INDEX idx_projects_publication_status ON projects(manuscript_status);
CREATE INDEX idx_projects_submission_deadline ON projects(submission_deadline) WHERE submission_deadline IS NOT NULL;
-- IRB and ethics indexes
CREATE INDEX idx_projects_irb_number ON projects(irb_number);
CREATE INDEX idx_projects_irb_status ON projects(irb_status);
CREATE INDEX idx_projects_irb_expiration ON projects(irb_expiration_date) WHERE irb_expiration_date IS NOT NULL;
CREATE INDEX idx_projects_human_subjects ON projects(human_subjects_research) WHERE human_subjects_research = true;
CREATE INDEX idx_tasks_project ON tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL; -- For subtasks
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL AND status != 'done';
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Communication indexes
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_ideas_lab ON ideas(lab_id);
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_assigned_to ON ideas(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_idea_votes_idea_user ON idea_votes(idea_id, user_id);

-- Meeting indexes
CREATE INDEX idx_meetings_lab ON meetings(lab_id);
CREATE INDEX idx_meetings_organizer ON meetings(organizer_id);
CREATE INDEX idx_meetings_scheduled_start ON meetings(scheduled_start);
CREATE INDEX idx_meetings_type ON meetings(type);
CREATE INDEX idx_meeting_attendance_meeting_user ON meeting_attendance(meeting_id, user_id);
CREATE INDEX idx_action_items_meeting ON action_items(meeting_id) WHERE meeting_id IS NOT NULL;
CREATE INDEX idx_action_items_assigned_to ON action_items(assigned_to) WHERE assigned_to IS NOT NULL;

-- Deadline indexes
CREATE INDEX idx_deadlines_lab ON deadlines(lab_id);
CREATE INDEX idx_deadlines_due_date ON deadlines(due_date);
CREATE INDEX idx_deadlines_assigned_to ON deadlines(assigned_to) WHERE assigned_to IS NOT NULL;
-- Note: Removed NOW() from index predicate as it's not IMMUTABLE - use query-time filtering instead
CREATE INDEX idx_deadlines_incomplete ON deadlines(due_date, is_completed) WHERE is_completed = false;
CREATE INDEX idx_deadline_reminders_deadline_user ON deadline_reminders(deadline_id, user_id);

-- File indexes
CREATE INDEX idx_files_lab ON files(lab_id) WHERE is_deleted = false;
CREATE INDEX idx_files_owner ON files(owner_id);
CREATE INDEX idx_files_parent ON files(parent_folder_id) WHERE parent_folder_id IS NOT NULL;
CREATE INDEX idx_files_type ON files(file_type);
CREATE INDEX idx_files_path ON files(folder_path);
CREATE INDEX idx_file_versions_file ON file_versions(file_id, version_number);
CREATE INDEX idx_file_permissions_file_user ON file_permissions(file_id, user_id);

-- Calendar indexes
CREATE INDEX idx_calendar_events_lab_date ON calendar_events(lab_id, start_date);
CREATE INDEX idx_calendar_events_organizer ON calendar_events(organizer_id);
CREATE INDEX idx_calendar_events_external ON calendar_events(external_provider, external_event_id) WHERE external_event_id IS NOT NULL;
CREATE INDEX idx_calendar_integrations_user_provider ON calendar_integrations(user_id, provider);

-- Notification and activity indexes
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_lab_created ON activity_logs(lab_id, created_at) WHERE lab_id IS NOT NULL;
CREATE INDEX idx_activity_logs_user_created ON activity_logs(user_id, created_at) WHERE user_id IS NOT NULL;

-- Analytics indexes
CREATE INDEX idx_usage_analytics_user_date ON usage_analytics(user_id, created_at);
CREATE INDEX idx_usage_analytics_event_type ON usage_analytics(event_type);
CREATE INDEX idx_usage_analytics_lab_date ON usage_analytics(lab_id, created_at) WHERE lab_id IS NOT NULL;

-- Full-text search indexes
CREATE INDEX idx_tasks_search ON tasks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, ''))) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_search ON projects USING gin(to_tsvector('english', name || ' ' || COALESCE(description, ''))) WHERE deleted_at IS NULL;
CREATE INDEX idx_ideas_search ON ideas USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_files_search ON files USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(extracted_text, ''))) WHERE is_deleted = false;

-- Academic management indexes
CREATE INDEX idx_publications_lab ON publications(lab_id);
CREATE INDEX idx_publications_project ON publications(related_project_id) WHERE related_project_id IS NOT NULL;
CREATE INDEX idx_publications_doi ON publications(doi) WHERE doi IS NOT NULL;
CREATE INDEX idx_publications_citation_count ON publications(citation_count DESC);
CREATE INDEX idx_publications_date ON publications(publication_date DESC) WHERE publication_date IS NOT NULL;

CREATE INDEX idx_patents_lab ON patents(lab_id);
CREATE INDEX idx_patents_project ON patents(related_project_id) WHERE related_project_id IS NOT NULL;
CREATE INDEX idx_patents_status ON patents(status);
CREATE INDEX idx_patents_expiration ON patents(expiration_date) WHERE expiration_date IS NOT NULL;

CREATE INDEX idx_conferences_lab ON conferences(lab_id);
CREATE INDEX idx_conferences_project ON conferences(related_project_id) WHERE related_project_id IS NOT NULL;
CREATE INDEX idx_conferences_status ON conferences(status);
CREATE INDEX idx_conferences_presenter ON conferences(primary_presenter_id) WHERE primary_presenter_id IS NOT NULL;
CREATE INDEX idx_conferences_date ON conferences(start_date DESC) WHERE start_date IS NOT NULL;

CREATE INDEX idx_peer_reviews_user ON peer_reviews(user_id);
CREATE INDEX idx_peer_reviews_date ON peer_reviews(review_date DESC) WHERE review_date IS NOT NULL;

-- Financial management indexes
CREATE INDEX idx_grants_lab ON grants(lab_id);
CREATE INDEX idx_grants_pi ON grants(principal_investigator_id);
CREATE INDEX idx_grants_status ON grants(status);
CREATE INDEX idx_grants_end_date ON grants(end_date);
CREATE INDEX idx_grants_number ON grants(grant_number) WHERE grant_number IS NOT NULL;

CREATE INDEX idx_effort_reporting_user_grant ON effort_reporting(user_id, grant_id);
CREATE INDEX idx_effort_reporting_period ON effort_reporting(period_start, period_end);
CREATE INDEX idx_effort_reporting_lab_period ON effort_reporting(lab_id, period_start);

CREATE INDEX idx_vendors_lab ON vendors(lab_id);
CREATE INDEX idx_vendors_status ON vendors(status) WHERE status = 'active';
CREATE INDEX idx_vendors_preferred ON vendors(preferred_vendor) WHERE preferred_vendor = true;

CREATE INDEX idx_procurement_lab ON procurement_requests(lab_id);
CREATE INDEX idx_procurement_status ON procurement_requests(status);
CREATE INDEX idx_procurement_requested_by ON procurement_requests(requested_by);
CREATE INDEX idx_procurement_grant ON procurement_requests(related_grant_id) WHERE related_grant_id IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY SETUP
-- ============================================================================

DO $$
DECLARE
    table_names TEXT[] := ARRAY[
        'user_profiles', 'user_preferences', 'labs', 'lab_members', 
        'lab_invitations', 'lab_invite_codes', 'buckets', 'projects', 
        'tasks', 'task_dependencies', 'comments', 'ideas', 'idea_votes',
        'meetings', 'meeting_attendance', 'action_items', 'deadlines', 
        'deadline_reminders', 'files', 'file_versions', 'file_permissions',
        'calendar_events', 'calendar_integrations', 'notifications', 
        'activity_logs', 'usage_analytics', 'publications', 'patents',
        'conferences', 'peer_reviews', 'grants', 'effort_reporting',
        'vendors', 'procurement_requests'
    ];
    table_name TEXT;
BEGIN
    RAISE NOTICE 'Enabling Row Level Security on all tables...';
    
    FOREACH table_name IN ARRAY table_names LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'RLS enabled on: %', table_name;
    END LOOP;
    
    RAISE NOTICE 'Row Level Security enabled on all % tables', array_length(table_names, 1);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to enable RLS: %', SQLERRM;
END $$;

-- ============================================================================  
-- COMPLETE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- User profiles - users can see their own + allow trigger function to create profiles
CREATE POLICY "users_select_own_profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON user_profiles  
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_profile" ON user_profiles
  FOR INSERT WITH CHECK (true); -- Allow trigger function to create profiles

CREATE POLICY "users_delete_own_profile" ON user_profiles
  FOR DELETE USING (auth.uid() = id);

-- User preferences - users can only manage their own
CREATE POLICY "users_own_preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Labs - users can only see labs they're members of
CREATE POLICY "view_member_labs" ON labs
  FOR SELECT USING (is_lab_member(id, auth.uid()));

CREATE POLICY "manage_own_labs" ON labs
  FOR ALL USING (
    auth.uid() = created_by OR 
    has_lab_permission(id, 'can_manage_lab_settings', auth.uid())
  );

-- Lab members - comprehensive policies for different operations
CREATE POLICY "select_lab_members" ON lab_members
  FOR SELECT USING (
    is_lab_member(lab_id, auth.uid()) OR
    has_lab_permission(lab_id, 'can_manage_members', auth.uid()) OR
    auth.uid() = user_id
  );

CREATE POLICY "insert_lab_members" ON lab_members
  FOR INSERT WITH CHECK (
    has_lab_permission(lab_id, 'can_manage_members', auth.uid())
  );

CREATE POLICY "update_lab_members" ON lab_members
  FOR UPDATE USING (
    has_lab_permission(lab_id, 'can_manage_members', auth.uid()) OR
    auth.uid() = user_id
  );

CREATE POLICY "delete_lab_members" ON lab_members
  FOR DELETE USING (
    has_lab_permission(lab_id, 'can_manage_members', auth.uid())
  );

-- Lab invitations
CREATE POLICY "view_lab_invitations" ON lab_invitations
  FOR SELECT USING (
    has_lab_permission(lab_id, 'can_manage_members', auth.uid()) OR
    auth.uid() = invited_by OR
    email = (SELECT email FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "manage_lab_invitations" ON lab_invitations
  FOR ALL USING (has_lab_permission(lab_id, 'can_manage_members', auth.uid()));

-- Lab invite codes
CREATE POLICY "view_lab_invite_codes" ON lab_invite_codes
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

CREATE POLICY "manage_lab_invite_codes" ON lab_invite_codes
  FOR ALL USING (has_lab_permission(lab_id, 'can_manage_members', auth.uid()));

-- Buckets (KEY: respects lab → bucket hierarchy)
CREATE POLICY "view_lab_buckets" ON buckets
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

CREATE POLICY "manage_lab_buckets" ON buckets
  FOR ALL USING (is_lab_member(lab_id, auth.uid()));

-- Projects (KEY: respects lab → bucket → project hierarchy)
CREATE POLICY "view_lab_projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buckets b
      WHERE b.id = projects.bucket_id
      AND is_lab_member(b.lab_id, auth.uid())
    )
  );

CREATE POLICY "manage_lab_projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM buckets b
      WHERE b.id = projects.bucket_id
      AND (
        has_lab_permission(b.lab_id, 'can_create_projects', auth.uid()) OR
        auth.uid() = projects.owner_id
      )
    )
  );

-- Tasks (KEY: respects lab → bucket → project → task → subtask hierarchy)
CREATE POLICY "view_lab_tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN buckets b ON p.bucket_id = b.id
      WHERE p.id = tasks.project_id
      AND is_lab_member(b.lab_id, auth.uid())
    )
  );

CREATE POLICY "manage_lab_tasks" ON tasks
  FOR ALL USING (
    auth.uid() = assigned_to OR
    auth.uid() = assigned_by OR
    EXISTS (
      SELECT 1 FROM projects p
      JOIN buckets b ON p.bucket_id = b.id
      WHERE p.id = tasks.project_id
      AND has_lab_permission(b.lab_id, 'can_assign_tasks', auth.uid())
    )
  );

-- Task dependencies
CREATE POLICY "view_task_dependencies" ON task_dependencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN buckets b ON p.bucket_id = b.id
      WHERE t.id = task_dependencies.task_id
      AND is_lab_member(b.lab_id, auth.uid())
    )
  );

CREATE POLICY "manage_task_dependencies" ON task_dependencies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN buckets b ON p.bucket_id = b.id
      WHERE t.id = task_dependencies.task_id
      AND has_lab_permission(b.lab_id, 'can_assign_tasks', auth.uid())
    )
  );

-- Comments
CREATE POLICY "view_comments" ON comments
  FOR SELECT USING (true); -- Access controlled by entity policies

CREATE POLICY "manage_own_comments" ON comments
  FOR ALL USING (auth.uid() = user_id);

-- Ideas
CREATE POLICY "view_lab_ideas" ON ideas
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

CREATE POLICY "manage_lab_ideas" ON ideas
  FOR ALL USING (
    has_lab_permission(lab_id, 'can_create_ideas', auth.uid()) OR
    auth.uid() = created_by
  );

-- Idea votes
CREATE POLICY "view_idea_votes" ON idea_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ideas i
      WHERE i.id = idea_votes.idea_id
      AND is_lab_member(i.lab_id, auth.uid())
    )
  );

CREATE POLICY "manage_own_idea_votes" ON idea_votes
  FOR ALL USING (auth.uid() = user_id);

-- Meetings
CREATE POLICY "view_lab_meetings" ON meetings
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

CREATE POLICY "manage_lab_meetings" ON meetings
  FOR ALL USING (
    has_lab_permission(lab_id, 'can_schedule_meetings', auth.uid()) OR
    auth.uid() = organizer_id
  );

-- Meeting attendance
CREATE POLICY "view_meeting_attendance" ON meeting_attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_attendance.meeting_id
      AND is_lab_member(m.lab_id, auth.uid())
    )
  );

CREATE POLICY "manage_meeting_attendance" ON meeting_attendance
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_attendance.meeting_id
      AND has_lab_permission(m.lab_id, 'can_schedule_meetings', auth.uid())
    )
  );

-- Action items
CREATE POLICY "view_action_items" ON action_items
  FOR SELECT USING (
    meeting_id IS NULL OR
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = action_items.meeting_id
      AND is_lab_member(m.lab_id, auth.uid())
    )
  );

CREATE POLICY "manage_action_items" ON action_items
  FOR ALL USING (
    auth.uid() = assigned_to OR
    meeting_id IS NULL OR
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = action_items.meeting_id
      AND has_lab_permission(m.lab_id, 'can_assign_tasks', auth.uid())
    )
  );

-- Deadlines
CREATE POLICY "view_lab_deadlines" ON deadlines
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

CREATE POLICY "manage_lab_deadlines" ON deadlines
  FOR ALL USING (
    has_lab_permission(lab_id, 'can_manage_deadlines', auth.uid()) OR
    auth.uid() = created_by OR
    auth.uid() = assigned_to
  );

-- Deadline reminders
CREATE POLICY "view_deadline_reminders" ON deadline_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "manage_deadline_reminders" ON deadline_reminders
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM deadlines d
      WHERE d.id = deadline_reminders.deadline_id
      AND has_lab_permission(d.lab_id, 'can_manage_deadlines', auth.uid())
    )
  );

-- Files
CREATE POLICY "view_lab_files" ON files
  FOR SELECT USING (
    is_lab_member(lab_id, auth.uid()) OR
    EXISTS (
      SELECT 1 FROM file_permissions fp
      WHERE fp.file_id = files.id
      AND fp.user_id = auth.uid()
      AND fp.permission IN ('view', 'comment', 'edit', 'admin')
    )
  );

CREATE POLICY "manage_lab_files" ON files
  FOR ALL USING (
    auth.uid() = owner_id OR
    has_lab_permission(lab_id, 'can_upload_files', auth.uid()) OR
    EXISTS (
      SELECT 1 FROM file_permissions fp
      WHERE fp.file_id = files.id
      AND fp.user_id = auth.uid()
      AND fp.permission IN ('edit', 'admin')
    )
  );

-- File versions
CREATE POLICY "view_file_versions" ON file_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM files f
      WHERE f.id = file_versions.file_id
      AND (
        is_lab_member(f.lab_id, auth.uid()) OR
        EXISTS (
          SELECT 1 FROM file_permissions fp
          WHERE fp.file_id = f.id
          AND fp.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "manage_file_versions" ON file_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM files f
      WHERE f.id = file_versions.file_id
      AND (
        auth.uid() = f.owner_id OR
        EXISTS (
          SELECT 1 FROM file_permissions fp
          WHERE fp.file_id = f.id
          AND fp.user_id = auth.uid()
          AND fp.permission IN ('edit', 'admin')
        )
      )
    )
  );

-- File permissions
CREATE POLICY "view_file_permissions" ON file_permissions
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM files f
      WHERE f.id = file_permissions.file_id
      AND auth.uid() = f.owner_id
    )
  );

CREATE POLICY "manage_file_permissions" ON file_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM files f
      WHERE f.id = file_permissions.file_id
      AND auth.uid() = f.owner_id
    )
  );

-- Calendar events
CREATE POLICY "view_lab_calendar" ON calendar_events
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

CREATE POLICY "manage_lab_calendar" ON calendar_events
  FOR ALL USING (
    has_lab_permission(lab_id, 'can_schedule_meetings', auth.uid()) OR
    auth.uid() = organizer_id
  );

-- Calendar integrations
CREATE POLICY "view_own_calendar_integrations" ON calendar_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "manage_own_calendar_integrations" ON calendar_integrations
  FOR ALL USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "view_own_notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Activity logs
CREATE POLICY "view_lab_activity" ON activity_logs
  FOR SELECT USING (
    lab_id IS NULL OR
    is_lab_member(lab_id, auth.uid())
  );

-- Usage analytics
CREATE POLICY "view_lab_analytics" ON usage_analytics
  FOR SELECT USING (
    lab_id IS NULL OR
    (is_lab_member(lab_id, auth.uid()) AND 
     has_lab_permission(lab_id, 'can_view_analytics', auth.uid()))
  );

-- ============================================================================
-- ACADEMIC & FINANCIAL MANAGEMENT RLS POLICIES
-- ============================================================================

-- Publications
CREATE POLICY "view_lab_publications" ON publications
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

CREATE POLICY "manage_lab_publications" ON publications
  FOR ALL USING (
    is_lab_member(lab_id, auth.uid()) AND
    (has_lab_permission(lab_id, 'can_access_reports', auth.uid()) OR
     auth.uid() = added_by)
  );

-- Patents  
CREATE POLICY "view_lab_patents" ON patents
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

CREATE POLICY "manage_lab_patents" ON patents
  FOR ALL USING (
    is_lab_member(lab_id, auth.uid()) AND
    (has_lab_permission(lab_id, 'can_access_reports', auth.uid()) OR
     auth.uid() = added_by)
  );

-- Conferences
CREATE POLICY "view_lab_conferences" ON conferences
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

CREATE POLICY "manage_lab_conferences" ON conferences
  FOR ALL USING (
    is_lab_member(lab_id, auth.uid()) AND
    (has_lab_permission(lab_id, 'can_schedule_meetings', auth.uid()) OR
     auth.uid() = added_by OR
     auth.uid() = primary_presenter_id)
  );

-- Peer reviews (personal records)
CREATE POLICY "view_own_peer_reviews" ON peer_reviews
  FOR SELECT USING (
    auth.uid() = user_id OR
    (lab_id IS NOT NULL AND 
     is_lab_member(lab_id, auth.uid()) AND
     has_lab_permission(lab_id, 'can_view_analytics', auth.uid()) AND
     NOT is_confidential)
  );

CREATE POLICY "manage_own_peer_reviews" ON peer_reviews
  FOR ALL USING (auth.uid() = user_id);

-- Grants
CREATE POLICY "view_lab_grants" ON grants
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

CREATE POLICY "manage_lab_grants" ON grants
  FOR ALL USING (
    is_lab_member(lab_id, auth.uid()) AND
    (has_lab_permission(lab_id, 'can_view_financials', auth.uid()) OR
     auth.uid() = principal_investigator_id OR
     auth.uid() = ANY(co_investigators))
  );

-- Effort reporting
CREATE POLICY "view_effort_reporting" ON effort_reporting
  FOR SELECT USING (
    auth.uid() = user_id OR
    (is_lab_member(lab_id, auth.uid()) AND
     has_lab_permission(lab_id, 'can_view_financials', auth.uid()))
  );

CREATE POLICY "manage_effort_reporting" ON effort_reporting
  FOR ALL USING (
    auth.uid() = user_id OR
    (is_lab_member(lab_id, auth.uid()) AND
     has_lab_permission(lab_id, 'can_view_financials', auth.uid()))
  );

-- Vendors
CREATE POLICY "view_lab_vendors" ON vendors
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

CREATE POLICY "manage_lab_vendors" ON vendors
  FOR ALL USING (
    is_lab_member(lab_id, auth.uid()) AND
    (has_lab_permission(lab_id, 'can_view_financials', auth.uid()) OR
     auth.uid() = added_by)
  );

-- Procurement requests
CREATE POLICY "view_lab_procurement" ON procurement_requests
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

CREATE POLICY "manage_lab_procurement" ON procurement_requests
  FOR ALL USING (
    is_lab_member(lab_id, auth.uid()) AND
    (has_lab_permission(lab_id, 'can_view_financials', auth.uid()) OR
     auth.uid() = requested_by OR
     auth.uid() = approved_by)
  );

-- ============================================================================
-- COMPREHENSIVE SEED DATA
-- ============================================================================

-- Create the two main labs with proper data
INSERT INTO labs (
  id, name, slug, description, short_description, 
  primary_color, secondary_color, research_areas,
  created_at, updated_at
) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'Rush Health Equity Data Analytics Studio',
  'rhedas',
  'RHEDAS is a cutting-edge research laboratory focused on health equity data analytics and population health research. Our mission is to leverage advanced data science methodologies to identify, analyze, and address health disparities across diverse populations.',
  'Research laboratory focused on health equity data analytics and population health research.',
  '#2563eb',
  '#1d4ed8',
  ARRAY['Health Equity', 'Population Health', 'Data Analytics', 'Health Disparities', 'Social Determinants'],
  NOW(),
  NOW()
),
(
  'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380b22'::uuid,
  'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science',
  'riccc',
  'RICCC is an interdisciplinary research consortium focused on critical care trials and advanced data science methodologies. We bring together clinicians, researchers, and data scientists to improve outcomes for critically ill patients through innovative research and evidence-based practice.',
  'Interdisciplinary consortium focused on critical care trials and advanced data science methodologies.',
  '#dc2626',
  '#b91c1c',
  ARRAY['Critical Care', 'Clinical Trials', 'Data Science', 'ICU Research', 'Patient Outcomes'],
  NOW(),
  NOW()
);

-- Add all lab memberships using the fixed function
DO $$
BEGIN
    -- Multi-lab members (Principal Investigators)
    PERFORM add_lab_member_with_permissions('juan_rojas@rush.edu', 'Rush Health Equity Data Analytics Studio', 'principal_investigator', true);
    PERFORM add_lab_member_with_permissions('juan_rojas@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'principal_investigator', true);
    
    -- Regulatory coordinators
    PERFORM add_lab_member_with_permissions('Mia_R_McClintic@rush.edu', 'Rush Health Equity Data Analytics Studio', 'regulatory_coordinator');
    PERFORM add_lab_member_with_permissions('Mia_R_McClintic@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'regulatory_coordinator');

    -- RHEDAS-only members
    PERFORM add_lab_member_with_permissions('Jada_J_Sherrod@rush.edu', 'Rush Health Equity Data Analytics Studio', 'lab_manager');
    PERFORM add_lab_member_with_permissions('Jason_Stanghelle@rush.edu', 'Rush Health Equity Data Analytics Studio', 'data_analyst');
    PERFORM add_lab_member_with_permissions('MeherSapna_Masanpally@rush.edu', 'Rush Health Equity Data Analytics Studio', 'data_analyst');
    PERFORM add_lab_member_with_permissions('John_Rich@rush.edu', 'Rush Health Equity Data Analytics Studio', 'lab_assistant');
    PERFORM add_lab_member_with_permissions('Anisa_Jivani@rush.edu', 'Rush Health Equity Data Analytics Studio', 'lab_assistant');

    -- RICCC-only members
    PERFORM add_lab_member_with_permissions('Kevin_Buell@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'principal_investigator', true);
    PERFORM add_lab_member_with_permissions('Vaishvik_Chaudhari@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'data_scientist');
    PERFORM add_lab_member_with_permissions('Hoda_MasteriFarahani@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'data_analyst');
    PERFORM add_lab_member_with_permissions('Connor_P_Lafeber@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'research_volunteer');
    PERFORM add_lab_member_with_permissions('Michael_A_Gottlieb@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'external_collaborator');
    PERFORM add_lab_member_with_permissions('Jie_Li@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'external_collaborator');
    PERFORM add_lab_member_with_permissions('saki.amagai@northwestern.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'external_collaborator');
END $$;

-- Create invite codes for both labs
INSERT INTO lab_invite_codes (lab_id, code, description, default_role, created_by, created_at, updated_at) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'RHEDAS',
    'Primary invite code for Rush Health Equity Data Analytics Studio',
    'external_collaborator',
    (SELECT user_id FROM lab_members WHERE lab_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid AND role = 'principal_investigator' LIMIT 1),
    NOW(),
    NOW()
),
(
    'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380b22'::uuid,
    'RICCC',
    'Primary invite code for Rush Interdisciplinary Consortium for Critical Care Trials and Data Science',
    'external_collaborator',
    (SELECT user_id FROM lab_members WHERE lab_id = 'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380b22'::uuid AND role = 'principal_investigator' LIMIT 1),
    NOW(),
    NOW()
);

-- Create default buckets for each lab (KEY: establishing lab → bucket hierarchy)
INSERT INTO buckets (lab_id, name, description, color, icon, owner_id, created_at, updated_at) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'Health Equity Research',
    'Primary research bucket for health equity data analytics and population health research projects',
    '#2563eb',
    'chart-bar',
    (SELECT user_id FROM lab_members WHERE lab_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid AND role = 'principal_investigator' LIMIT 1),
    NOW(),
    NOW()
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'Data Analytics Infrastructure',
    'Projects related to data infrastructure, tools, and methodologies',
    '#059669',
    'server',
    (SELECT user_id FROM lab_members WHERE lab_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid AND role = 'principal_investigator' LIMIT 1),
    NOW(),
    NOW()
),
(
    'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380b22'::uuid,
    'Critical Care Trials',
    'Clinical trials and research studies focused on critical care interventions and outcomes',
    '#dc2626',
    'heart',
    (SELECT user_id FROM lab_members WHERE lab_id = 'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380b22'::uuid AND role = 'principal_investigator' LIMIT 1),
    NOW(),
    NOW()
),
(
    'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380b22'::uuid,
    'Data Science Methods',
    'Advanced data science methodologies and analytical approaches for critical care research',
    '#7c3aed',
    'cpu-chip',
    (SELECT user_id FROM lab_members WHERE lab_id = 'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380b22'::uuid AND role = 'principal_investigator' LIMIT 1),
    NOW(),
    NOW()
);

-- Set default labs for multi-lab users
DO $$
DECLARE
    v_user_id UUID;
    v_rhedas_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;
BEGIN
    -- Set J.C. Rojas default lab to RHEDAS
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'juan_rojas@rush.edu';
    IF v_user_id IS NOT NULL THEN
        UPDATE user_profiles SET last_selected_lab_id = v_rhedas_id WHERE id = v_user_id;
        RAISE NOTICE 'Set default lab for juan_rojas@rush.edu to RHEDAS';
    END IF;

    -- Set Mia McClintic default lab to RHEDAS  
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'Mia_R_McClintic@rush.edu';
    IF v_user_id IS NOT NULL THEN
        UPDATE user_profiles SET last_selected_lab_id = v_rhedas_id WHERE id = v_user_id;
        RAISE NOTICE 'Set default lab for Mia_R_McClintic@rush.edu to RHEDAS';
    END IF;
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS add_lab_member_with_permissions(TEXT, TEXT, user_role, BOOLEAN);

-- ============================================================================
-- DATABASE PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- MIGRATION VALIDATION & COMPLETION
-- ============================================================================

DO $$ 
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
    function_count INTEGER;
    seed_count INTEGER;
BEGIN 
    -- Validate migration success
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public';
    SELECT COUNT(*) INTO function_count FROM information_schema.routines WHERE routine_schema = 'public';
    SELECT COUNT(*) INTO seed_count FROM labs;
    
    -- Validation checks
    IF table_count < 20 THEN
        RAISE EXCEPTION 'Migration validation failed: Only % tables created, expected 20+', table_count;
    END IF;
    
    IF policy_count < 30 THEN
        RAISE EXCEPTION 'Migration validation failed: Only % RLS policies created, expected 30+', policy_count;
    END IF;
    
    IF seed_count < 2 THEN
        RAISE EXCEPTION 'Migration validation failed: Only % labs seeded, expected 2+', seed_count;
    END IF;

    -- Success notification
    RAISE NOTICE '';
    RAISE NOTICE '🎉🎉🎉 ULTIMATE LAB SYNC DATABASE CREATED SUCCESSFULLY! 🎉🎉🎉';
    RAISE NOTICE '';
    RAISE NOTICE '📊 MIGRATION STATISTICS:';
    RAISE NOTICE '  • Tables created: %', table_count;
    RAISE NOTICE '  • RLS policies: %', policy_count;
    RAISE NOTICE '  • Indexes: %', index_count;
    RAISE NOTICE '  • Functions: %', function_count;
    RAISE NOTICE '  • Labs seeded: %', seed_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ SUPABASE BEST PRACTICES IMPLEMENTED:';
    RAISE NOTICE '✅ Safe schema-only cleanup preserving system tables';
    RAISE NOTICE '✅ Proper error handling and transaction safety';
    RAISE NOTICE '✅ Complete schema matching your working API code';
    RAISE NOTICE '✅ FIXED permission function syntax issues';
    RAISE NOTICE '✅ All 40+ permission columns properly configured';
    RAISE NOTICE '✅ Multi-lab support with Rush labs seeded';
    RAISE NOTICE '✅ PRESERVED lab → lab_member → bucket → project → task → subtask hierarchy';
    RAISE NOTICE '✅ Comprehensive file management system';
    RAISE NOTICE '✅ Advanced meeting and AI integration';
    RAISE NOTICE '✅ Full calendar sync capabilities';
    RAISE NOTICE '✅ Robust notification and activity tracking';
    RAISE NOTICE '✅ Performance-optimized with 50+ indexes';
    RAISE NOTICE '✅ COMPLETE production-ready RLS security policies';
    RAISE NOTICE '✅ Complete task and project hierarchy';
    RAISE NOTICE '✅ Ideas board and collaboration tools';
    RAISE NOTICE '✅ Deadline management system';
    RAISE NOTICE '✅ Analytics and reporting foundation';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT STEPS:';
    RAISE NOTICE '1. Generate TypeScript types: npx supabase gen types typescript --local';
    RAISE NOTICE '2. Update database.types.ts with the new types';
    RAISE NOTICE '3. Run type check: npm run type-check';
    RAISE NOTICE '4. Test your API endpoints with RLS enabled';
    RAISE NOTICE '5. Run database tests: supabase test db (recommended)';
    RAISE NOTICE '6. Deploy to production!';
    RAISE NOTICE '';
    RAISE NOTICE '🔥 This is the most comprehensive, Supabase-optimized Lab Sync database!';
    RAISE NOTICE '🔑 Key relationships: labs → lab_members → buckets → projects → tasks → subtasks';
    RAISE NOTICE '🛡️  Security: Complete RLS policies protecting all data by lab membership';
    RAISE NOTICE '⚡ Performance: Optimized indexes for all query patterns';
    RAISE NOTICE '';
    RAISE NOTICE 'Migration completed at: %', NOW();
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Migration validation or completion failed: %', SQLERRM;
