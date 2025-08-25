-- =====================================================
-- LABSYNC COMPLETE PRODUCTION SCHEMA WITH CALENDAR INTEGRATION
-- =====================================================
-- Clean architecture with essential features including Google Calendar sync
-- =====================================================

-- =====================================================
-- WARNING: DESTRUCTIVE OPERATION - THIS WILL DELETE ALL DATA!
-- Only run this on an empty database or after backing up all data
-- To apply without data loss, comment out the DROP SCHEMA line
-- =====================================================

-- Drop existing schema and start fresh (DELETES ALL DATA!)
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;

-- For production, use these safer alternatives:
DO $$ 
BEGIN
  -- Only drop schema if it's empty or in development
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1) THEN
    RAISE NOTICE 'Schema contains tables. Skipping DROP SCHEMA for safety.';
    RAISE NOTICE 'To force reset, uncomment the DROP SCHEMA line above.';
  ELSE
    DROP SCHEMA IF EXISTS public CASCADE;
    CREATE SCHEMA public;
  END IF;
END $$;

-- Reset permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- ENUMS - Your exact role system preserved
-- =====================================================

-- Your exact user roles - preserved as requested
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

-- Status enums
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'archived');
CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'archived');
CREATE TYPE experiment_status AS ENUM ('planning', 'active', 'completed', 'failed');
CREATE TYPE email_status AS ENUM ('pending', 'processing', 'sent', 'failed', 'dead_letter');

-- IRB status - preserved for your research needs
CREATE TYPE irb_status AS ENUM (
  'not_required', 
  'planning', 
  'submitted', 
  'under_review', 
  'approved', 
  'expired', 
  'suspended', 
  'withdrawn', 
  'exempt'
);

-- Publication status - preserved for authorship tracking
CREATE TYPE publication_status AS ENUM (
  'planning', 
  'writing', 
  'draft_complete', 
  'under_review', 
  'revision_requested', 
  'accepted', 
  'published', 
  'rejected'
);

-- Meeting and deadline types
CREATE TYPE meeting_type AS ENUM ('standup', 'planning', 'review', 'presentation', 'other');
CREATE TYPE deadline_type AS ENUM ('grant', 'paper', 'conference', 'irb', 'milestone', 'other');

-- =====================================================
-- CORE TABLES WITH HIERARCHY
-- labs → buckets → projects → tasks → subtasks
-- =====================================================

-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  institution VARCHAR(255),
  department VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LEVEL 1: Labs
CREATE TABLE labs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  institution VARCHAR(255),
  settings JSONB DEFAULT '{"ai_features": true, "email_reminders": true}'::jsonb,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

-- Lab members with your permission system
CREATE TABLE lab_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'external_collaborator',
  
  -- Your simplified permissions (keeping as-is)
  can_manage_members BOOLEAN DEFAULT false,
  can_create_projects BOOLEAN DEFAULT true,
  can_edit_all_projects BOOLEAN DEFAULT false,
  can_delete_projects BOOLEAN DEFAULT false,
  can_create_tasks BOOLEAN DEFAULT true,
  can_edit_all_tasks BOOLEAN DEFAULT false,
  can_delete_tasks BOOLEAN DEFAULT false,
  can_view_financials BOOLEAN DEFAULT false,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lab_id, user_id)
);

-- LEVEL 2: Buckets
CREATE TABLE buckets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6b7280',
  position INTEGER DEFAULT 0,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  
  UNIQUE(lab_id, name) WHERE deleted_at IS NULL
);

-- LEVEL 3: Projects (with IRB and authorship as requested)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bucket_id UUID NOT NULL REFERENCES buckets(id) ON DELETE RESTRICT,
  lab_id UUID NOT NULL, -- Redundant for efficient RLS
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status project_status DEFAULT 'planning',
  priority priority DEFAULT 'medium',
  
  -- Team
  lead_id UUID REFERENCES auth.users(id),
  team_members UUID[],
  
  -- Timeline
  start_date DATE,
  due_date DATE,
  
  -- IRB tracking (preserved as requested)
  irb_number VARCHAR(100),
  irb_status irb_status DEFAULT 'planning',
  irb_approval_date DATE,
  irb_expiration_date DATE,
  irb_notes TEXT,
  
  -- Publication authorship (preserved as requested)
  first_author_id UUID REFERENCES auth.users(id),
  last_author_id UUID REFERENCES auth.users(id),
  corresponding_author_id UUID REFERENCES auth.users(id),
  author_order UUID[],
  manuscript_status publication_status DEFAULT 'planning',
  target_journal VARCHAR(255),
  doi VARCHAR(255),
  
  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Enforce hierarchy
  -- NOTE: This CHECK constraint uses a subquery which may impact INSERT/UPDATE performance
  -- Consider removing in production if performance is an issue (enforce in application layer)
  CONSTRAINT projects_bucket_lab_match CHECK (
    lab_id = (SELECT b.lab_id FROM buckets b WHERE b.id = bucket_id)
  ),
  CONSTRAINT projects_lab_fk FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE
);

-- LEVEL 4: Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL, -- Redundant for efficient RLS
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- For subtasks
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo',
  priority priority DEFAULT 'medium',
  
  -- Single assignee for simplicity (can be extended to many-to-many later)
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- For kanban/grid views
  position DECIMAL(10,2) DEFAULT 0,
  
  -- AI task generation support
  is_ai_generated BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(3,2),
  meeting_id UUID, -- Will reference meetings table
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Enforce hierarchy
  -- NOTE: This CHECK constraint uses a subquery which may impact INSERT/UPDATE performance
  -- Consider removing in production if performance is an issue (enforce in application layer)
  CONSTRAINT tasks_project_lab_match CHECK (
    lab_id = (SELECT p.lab_id FROM projects p WHERE p.id = project_id)
  ),
  CONSTRAINT subtask_same_project CHECK (
    parent_id IS NULL OR 
    project_id = (SELECT project_id FROM tasks WHERE id = parent_id)
  ),
  CONSTRAINT tasks_lab_fk FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE
);

-- Many-to-many task assignments
CREATE TABLE task_assignees (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (task_id, user_id)
);

-- Tags system
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#6b7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(lab_id, name)
);

CREATE TABLE task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- Meetings
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type meeting_type DEFAULT 'standup',
  description TEXT,
  
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location VARCHAR(255),
  
  organizer_id UUID NOT NULL REFERENCES auth.users(id),
  attendee_ids UUID[],
  
  -- Transcription and AI
  recording_url TEXT,
  transcript TEXT,
  ai_summary TEXT,
  ai_suggested_tasks JSONB,
  
  -- Email tracking
  minutes_sent BOOLEAN DEFAULT false,
  minutes_sent_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint for tasks.meeting_id now that meetings table exists
ALTER TABLE tasks ADD CONSTRAINT tasks_meeting_fk FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE SET NULL;

-- Deadlines
CREATE TABLE deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type deadline_type NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  priority priority DEFAULT 'medium',
  
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Reminder system
  reminder_days_before INTEGER[] DEFAULT '{7, 1}',
  reminders_sent JSONB DEFAULT '[]'::jsonb,
  
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ideas
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  bucket_id UUID REFERENCES buckets(id) ON DELETE SET NULL,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'proposed',
  upvotes INTEGER DEFAULT 0,
  
  -- Audit
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lab-specific experiments
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  protocol TEXT,
  status experiment_status DEFAULT 'planning',
  
  started_at DATE,
  completed_at DATE,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Samples
CREATE TABLE samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  
  identifier VARCHAR(100) NOT NULL,
  sample_type VARCHAR(50),
  quantity DECIMAL(10,3),
  unit VARCHAR(20),
  storage_location VARCHAR(100),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(experiment_id, identifier)
);

-- =====================================================
-- CALENDAR INTEGRATION (CRITICAL FOR LAB MANAGEMENT)
-- =====================================================

-- Calendar integrations (OAuth per user/lab)
CREATE TABLE calendar_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Provider info
  provider VARCHAR(50) DEFAULT 'google', -- future: outlook, apple
  calendar_id TEXT NOT NULL, -- Google Calendar ID
  calendar_name TEXT,
  is_primary BOOLEAN DEFAULT false,
  
  -- OAuth tokens (MUST be encrypted in production using pgcrypto or vault)
  -- TODO: Implement encryption before production deployment
  access_token TEXT, -- SECURITY: Encrypt using pgcrypto extension
  refresh_token TEXT, -- SECURITY: Encrypt using pgcrypto extension
  token_expires_at TIMESTAMPTZ,
  
  -- Sync configuration
  sync_enabled BOOLEAN DEFAULT true,
  sync_direction VARCHAR(20) DEFAULT 'both', -- 'both', 'from_google', 'to_google'
  auto_add_meetings BOOLEAN DEFAULT true,
  auto_add_deadlines BOOLEAN DEFAULT true,
  
  -- Sync state
  last_sync_at TIMESTAMPTZ,
  last_sync_token TEXT, -- For incremental sync
  sync_error TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lab_id, user_id, calendar_id)
);

-- Calendar events (two-way sync with Google)
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES calendar_integrations(id) ON DELETE CASCADE,
  
  -- Google Calendar reference
  google_event_id TEXT,
  google_calendar_id TEXT,
  google_recurring_event_id TEXT, -- For recurring events
  
  -- Link to app entities
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  deadline_id UUID REFERENCES deadlines(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Event details
  title VARCHAR(500) NOT NULL,
  description TEXT,
  location TEXT,
  
  -- Time
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Recurrence (store Google's RRULE)
  recurrence_rule TEXT,
  
  -- Attendees
  organizer_email VARCHAR(255),
  attendees JSONB DEFAULT '[]'::jsonb, -- [{email, name, responseStatus, optional}]
  
  -- Reminders
  reminders JSONB DEFAULT '[]'::jsonb, -- [{method: 'email', minutes: 10}]
  
  -- Visibility
  visibility VARCHAR(20) DEFAULT 'default', -- 'default', 'public', 'private'
  
  -- Colors (for visual organization)
  color_id VARCHAR(20), -- Google's color scheme
  
  -- Sync metadata
  source VARCHAR(20) DEFAULT 'google', -- 'google', 'app', 'manual'
  sync_status VARCHAR(20) DEFAULT 'synced', -- 'synced', 'pending', 'error', 'conflict'
  last_modified TIMESTAMPTZ,
  etag TEXT, -- For change detection
  
  -- Soft delete (for sync reconciliation)
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate Google events
  UNIQUE(google_event_id, google_calendar_id) WHERE google_event_id IS NOT NULL
);

-- Calendar sync log (for debugging and conflict resolution)
CREATE TABLE calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES calendar_integrations(id) ON DELETE CASCADE,
  
  sync_type VARCHAR(20) NOT NULL, -- 'full', 'incremental'
  direction VARCHAR(20) NOT NULL, -- 'from_google', 'to_google', 'both'
  
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  
  events_created INTEGER DEFAULT 0,
  events_updated INTEGER DEFAULT 0,
  events_deleted INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  
  error_details JSONB,
  sync_token TEXT, -- Next sync token from Google
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  size_bytes BIGINT,
  
  -- Polymorphic association
  entity_type VARCHAR(50),
  entity_id UUID,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  
  content TEXT NOT NULL,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  -- Audit
  user_id UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  entity_title TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email queue
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  
  to_emails TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  
  status email_status NOT NULL DEFAULT 'pending',
  type VARCHAR(50),
  entity_id UUID,
  
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  
  -- Concurrency control
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  
  -- Idempotency
  idempotency_key TEXT UNIQUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF TG_TABLE_NAME IN ('labs', 'buckets', 'projects', 'tasks', 'meetings', 'deadlines', 'ideas', 'experiments', 'comments', 'files', 'calendar_integrations', 'calendar_events') THEN
    NEW.updated_by = auth.uid();
    IF TG_TABLE_NAME IN ('labs', 'buckets', 'projects', 'tasks', 'experiments') THEN
      NEW.version = COALESCE(OLD.version, 0) + 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is lab member
CREATE OR REPLACE FUNCTION is_lab_member(p_lab_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM lab_members
    WHERE lab_id = p_lab_id 
    AND user_id = COALESCE(p_user_id, auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check specific permission
CREATE OR REPLACE FUNCTION has_permission(
  p_lab_id UUID,
  p_permission TEXT,
  p_user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN;
  v_role user_role;
BEGIN
  -- Get user's role
  SELECT role INTO v_role
  FROM lab_members
  WHERE lab_id = p_lab_id AND user_id = COALESCE(p_user_id, auth.uid());
  
  -- PIs, Lab Managers, and Regulatory Coordinators have all permissions
  IF v_role IN ('principal_investigator', 'lab_manager', 'regulatory_coordinator') THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  EXECUTE format('
    SELECT %I FROM lab_members 
    WHERE lab_id = $1 AND user_id = $2',
    p_permission
  ) INTO v_result USING p_lab_id, COALESCE(p_user_id, auth.uid());
  
  RETURN COALESCE(v_result, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Generate unique lab slug
CREATE OR REPLACE FUNCTION generate_lab_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL THEN
    base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM labs WHERE slug = final_slug) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set default permissions based on role
CREATE OR REPLACE FUNCTION set_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Everyone can create projects and tasks by default
  NEW.can_create_projects := TRUE;
  NEW.can_create_tasks := TRUE;
  
  -- Set edit/delete permissions based on role
  CASE 
    WHEN NEW.role IN ('principal_investigator', 'lab_manager', 'regulatory_coordinator') THEN
      NEW.can_manage_members := TRUE;
      NEW.can_edit_all_projects := TRUE;
      NEW.can_delete_projects := TRUE;
      NEW.can_edit_all_tasks := TRUE;
      NEW.can_delete_tasks := TRUE;
      NEW.can_view_financials := TRUE;
      
    WHEN NEW.role = 'co_investigator' THEN
      NEW.can_manage_members := TRUE;
      NEW.can_edit_all_projects := TRUE;
      NEW.can_delete_projects := FALSE;
      NEW.can_edit_all_tasks := TRUE;
      NEW.can_delete_tasks := FALSE;
      NEW.can_view_financials := TRUE;
      
    WHEN NEW.role IN ('data_analyst', 'data_scientist') THEN
      NEW.can_manage_members := FALSE;
      NEW.can_edit_all_projects := FALSE;
      NEW.can_delete_projects := FALSE;
      NEW.can_edit_all_tasks := FALSE;
      NEW.can_delete_tasks := FALSE;
      NEW.can_view_financials := FALSE;
      
    ELSE -- lab_assistant, research_volunteer, external_collaborator
      NEW.can_manage_members := FALSE;
      NEW.can_edit_all_projects := FALSE;
      NEW.can_delete_projects := FALSE;
      NEW.can_edit_all_tasks := FALSE;
      NEW.can_delete_tasks := FALSE;
      NEW.can_view_financials := FALSE;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to create calendar event from meeting
CREATE OR REPLACE FUNCTION create_calendar_event_from_meeting()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-create calendar event when meeting is created
  IF NEW.scheduled_at IS NOT NULL THEN
    INSERT INTO calendar_events (
      lab_id,
      meeting_id,
      title,
      description,
      start_time,
      end_time,
      source,
      sync_status
    )
    VALUES (
      NEW.lab_id,
      NEW.id,
      NEW.title,
      NEW.description,
      NEW.scheduled_at,
      NEW.scheduled_at + (NEW.duration_minutes || ' minutes')::INTERVAL,
      'app',
      'pending'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Timestamp triggers
CREATE TRIGGER update_user_profiles_timestamp BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_labs_timestamp BEFORE UPDATE ON labs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_lab_members_timestamp BEFORE UPDATE ON lab_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_buckets_timestamp BEFORE UPDATE ON buckets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_timestamp BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_timestamp BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_meetings_timestamp BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_deadlines_timestamp BEFORE UPDATE ON deadlines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_ideas_timestamp BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_experiments_timestamp BEFORE UPDATE ON experiments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_comments_timestamp BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_calendar_integrations_timestamp BEFORE UPDATE ON calendar_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_calendar_events_timestamp BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Business logic triggers
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
CREATE TRIGGER generate_lab_slug_trigger BEFORE INSERT ON labs
  FOR EACH ROW EXECUTE FUNCTION generate_lab_slug();
CREATE TRIGGER set_member_permissions BEFORE INSERT ON lab_members
  FOR EACH ROW EXECUTE FUNCTION set_default_permissions();
CREATE TRIGGER create_meeting_calendar_event AFTER INSERT ON meetings
  FOR EACH ROW EXECUTE FUNCTION create_calendar_event_from_meeting();

-- =====================================================
-- INDEXES (Performance critical)
-- =====================================================

-- User and auth indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Lab hierarchy indexes (with soft delete support)
CREATE INDEX idx_lab_members_lab_user ON lab_members(lab_id, user_id);
CREATE INDEX idx_lab_members_user ON lab_members(user_id);
CREATE INDEX idx_lab_members_role ON lab_members(role);

CREATE INDEX idx_buckets_lab ON buckets(lab_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_buckets_lab_position ON buckets(lab_id, position) WHERE deleted_at IS NULL;

CREATE INDEX idx_projects_bucket ON projects(bucket_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_lab ON projects(lab_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_lab_status ON projects(lab_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_lab_updated ON projects(lab_id, updated_at DESC, id) WHERE deleted_at IS NULL;

CREATE INDEX idx_tasks_project ON tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_lab ON tasks(lab_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_lab_status ON tasks(lab_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_lab_updated ON tasks(lab_id, updated_at DESC, id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_parent ON tasks(parent_id) WHERE parent_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to) WHERE assigned_to IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE due_date IS NOT NULL AND deleted_at IS NULL;

-- Many-to-many indexes
CREATE INDEX idx_task_assignees_task ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_user ON task_assignees(user_id);
CREATE INDEX idx_tags_lab ON tags(lab_id);
CREATE INDEX idx_task_tags_task ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag ON task_tags(tag_id);

-- IRB and authorship indexes
CREATE INDEX idx_projects_irb_number ON projects(irb_number) WHERE irb_number IS NOT NULL;
CREATE INDEX idx_projects_irb_status ON projects(irb_status);
CREATE INDEX idx_projects_first_author ON projects(first_author_id) WHERE first_author_id IS NOT NULL;
CREATE INDEX idx_projects_corresponding ON projects(corresponding_author_id) WHERE corresponding_author_id IS NOT NULL;

-- Calendar indexes
CREATE INDEX idx_calendar_integrations_lab_user ON calendar_integrations(lab_id, user_id);
CREATE INDEX idx_calendar_integrations_sync ON calendar_integrations(sync_enabled, last_sync_at) 
  WHERE sync_enabled = true;

CREATE INDEX idx_calendar_events_lab ON calendar_events(lab_id);
CREATE INDEX idx_calendar_events_integration ON calendar_events(integration_id);
CREATE INDEX idx_calendar_events_google ON calendar_events(google_event_id, google_calendar_id) 
  WHERE google_event_id IS NOT NULL;
CREATE INDEX idx_calendar_events_entities ON calendar_events(meeting_id, deadline_id, task_id) 
  WHERE meeting_id IS NOT NULL OR deadline_id IS NOT NULL OR task_id IS NOT NULL;
CREATE INDEX idx_calendar_events_time ON calendar_events(start_time, end_time);
CREATE INDEX idx_calendar_events_sync ON calendar_events(sync_status, last_modified) 
  WHERE sync_status != 'synced';
CREATE INDEX idx_calendar_events_deleted ON calendar_events(deleted_at) 
  WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_calendar_sync_log_integration ON calendar_sync_log(integration_id, started_at DESC);

-- Additional performance indexes
CREATE INDEX idx_labs_slug ON labs(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_projects_lead ON projects(lead_id) WHERE lead_id IS NOT NULL;

-- Other indexes
CREATE INDEX idx_meetings_lab ON meetings(lab_id);
CREATE INDEX idx_meetings_scheduled ON meetings(scheduled_at);
CREATE INDEX idx_deadlines_lab ON deadlines(lab_id);
CREATE INDEX idx_deadlines_due ON deadlines(due_date);
CREATE INDEX idx_deadlines_incomplete ON deadlines(completed, due_date) WHERE completed = false;
CREATE INDEX idx_ideas_lab ON ideas(lab_id);
CREATE INDEX idx_experiments_project ON experiments(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_experiments_lab ON experiments(lab_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_samples_experiment ON samples(experiment_id);
CREATE INDEX idx_samples_lab ON samples(lab_id);
CREATE INDEX idx_files_entity ON files(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_lab ON files(lab_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_lab ON comments(lab_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_activity_log_lab ON activity_log(lab_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- Email queue indexes
CREATE INDEX idx_email_queue_processing ON email_queue(status, scheduled_for) 
  WHERE status IN ('pending', 'failed');
CREATE INDEX idx_email_queue_lab ON email_queue(lab_id, status, scheduled_for);
CREATE INDEX idx_email_queue_idempotency ON email_queue(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY (Using direct lab_id for efficiency)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- User profiles
CREATE POLICY "users_view_own" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Labs
CREATE POLICY "view_member_labs" ON labs
  FOR SELECT USING (is_lab_member(id));

-- Lab members
CREATE POLICY "view_lab_members" ON lab_members
  FOR SELECT USING (is_lab_member(lab_id));
CREATE POLICY "manage_lab_members" ON lab_members
  FOR ALL USING (has_permission(lab_id, 'can_manage_members'));

-- Buckets (direct lab_id)
CREATE POLICY "view_lab_buckets" ON buckets
  FOR SELECT USING (is_lab_member(lab_id));
CREATE POLICY "manage_lab_buckets" ON buckets
  FOR ALL USING (is_lab_member(lab_id));

-- Projects (using direct lab_id for efficiency)
CREATE POLICY "view_lab_projects" ON projects
  FOR SELECT USING (is_lab_member(lab_id));
CREATE POLICY "create_projects" ON projects
  FOR INSERT WITH CHECK (is_lab_member(lab_id));
CREATE POLICY "update_projects" ON projects
  FOR UPDATE USING (
    auth.uid() = lead_id OR
    has_permission(lab_id, 'can_edit_all_projects')
  );
CREATE POLICY "delete_projects" ON projects
  FOR DELETE USING (
    auth.uid() = lead_id OR
    has_permission(lab_id, 'can_delete_projects')
  );

-- Tasks (using direct lab_id for efficiency)
CREATE POLICY "view_lab_tasks" ON tasks
  FOR SELECT USING (is_lab_member(lab_id));
CREATE POLICY "create_tasks" ON tasks
  FOR INSERT WITH CHECK (is_lab_member(lab_id));
CREATE POLICY "update_tasks" ON tasks
  FOR UPDATE USING (
    auth.uid() = assigned_to OR
    auth.uid() = created_by OR
    has_permission(lab_id, 'can_edit_all_tasks')
  );
CREATE POLICY "delete_tasks" ON tasks
  FOR DELETE USING (
    auth.uid() = created_by OR
    has_permission(lab_id, 'can_delete_tasks')
  );

-- Task assignees
CREATE POLICY "view_task_assignees" ON task_assignees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_assignees.task_id 
      AND is_lab_member(t.lab_id)
    )
  );
CREATE POLICY "manage_task_assignees" ON task_assignees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_assignees.task_id 
      AND is_lab_member(t.lab_id)
    )
  );

-- Tags
CREATE POLICY "view_lab_tags" ON tags
  FOR SELECT USING (is_lab_member(lab_id));
CREATE POLICY "manage_lab_tags" ON tags
  FOR ALL USING (is_lab_member(lab_id));

-- Task tags
CREATE POLICY "view_task_tags" ON task_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_tags.task_id 
      AND is_lab_member(t.lab_id)
    )
  );
CREATE POLICY "manage_task_tags" ON task_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_tags.task_id 
      AND is_lab_member(t.lab_id)
    )
  );

-- Meetings
CREATE POLICY "view_lab_meetings" ON meetings
  FOR SELECT USING (is_lab_member(lab_id));
CREATE POLICY "manage_meetings" ON meetings
  FOR ALL USING (auth.uid() = organizer_id OR is_lab_member(lab_id));

-- Deadlines
CREATE POLICY "view_lab_deadlines" ON deadlines
  FOR SELECT USING (is_lab_member(lab_id));
CREATE POLICY "manage_deadlines" ON deadlines
  FOR ALL USING (auth.uid() = created_by OR auth.uid() = assigned_to OR is_lab_member(lab_id));

-- Ideas
CREATE POLICY "view_lab_ideas" ON ideas
  FOR SELECT USING (is_lab_member(lab_id));
CREATE POLICY "manage_ideas" ON ideas
  FOR ALL USING (auth.uid() = created_by OR is_lab_member(lab_id));

-- Experiments
CREATE POLICY "view_lab_experiments" ON experiments
  FOR SELECT USING (is_lab_member(lab_id));
CREATE POLICY "manage_experiments" ON experiments
  FOR ALL USING (is_lab_member(lab_id));

-- Samples
CREATE POLICY "view_lab_samples" ON samples
  FOR SELECT USING (is_lab_member(lab_id));
CREATE POLICY "manage_samples" ON samples
  FOR ALL USING (is_lab_member(lab_id));

-- Calendar integrations - users manage their own
CREATE POLICY "users_view_own_integrations" ON calendar_integrations
  FOR SELECT USING (auth.uid() = user_id OR is_lab_member(lab_id));
CREATE POLICY "users_manage_own_integrations" ON calendar_integrations
  FOR ALL USING (auth.uid() = user_id);

-- Calendar events - lab members can view, owners can manage
CREATE POLICY "view_lab_calendar_events" ON calendar_events
  FOR SELECT USING (is_lab_member(lab_id));
CREATE POLICY "manage_calendar_events" ON calendar_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM calendar_integrations ci
      WHERE ci.id = calendar_events.integration_id
      AND ci.user_id = auth.uid()
    ) OR is_lab_member(lab_id)
  );

-- Sync log - view only for integration owners
CREATE POLICY "view_own_sync_log" ON calendar_sync_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calendar_integrations ci
      WHERE ci.id = calendar_sync_log.integration_id
      AND ci.user_id = auth.uid()
    )
  );

-- Files
CREATE POLICY "view_lab_files" ON files
  FOR SELECT USING (is_lab_member(lab_id));
CREATE POLICY "manage_files" ON files
  FOR ALL USING (auth.uid() = uploaded_by OR is_lab_member(lab_id));

-- Comments
CREATE POLICY "view_lab_comments" ON comments
  FOR SELECT USING (is_lab_member(lab_id));
CREATE POLICY "create_comments" ON comments
  FOR INSERT WITH CHECK (is_lab_member(lab_id));
CREATE POLICY "update_own_comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Activity log
CREATE POLICY "view_activity" ON activity_log
  FOR SELECT USING (is_lab_member(lab_id));

-- Email queue (service role only)
-- No RLS policies - accessed via Edge Functions with service role

-- =====================================================
-- REALTIME CONFIGURATION
-- =====================================================

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_assignees;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;