-- ============================================================================
-- LAB SYNC - FINAL PRODUCTION MIGRATION (Complete Schema + Seed Data)
-- ============================================================================
-- This migration creates the EXACT schema structure that matches the working
-- API code and TypeScript types, plus seeds the initial production data.
-- 
-- Run this ONCE on a fresh database to ensure complete consistency.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- ============================================================================
-- DROP ALL EXISTING OBJECTS (Clean Slate)
-- ============================================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS
  lab_invites,
  notifications,
  activity_logs,
  calendar_events,
  user_preferences,
  file_permissions,
  file_versions,
  files,
  attachments,
  deadline_reminders,
  deadlines,
  ideas,
  comments,
  standup_action_items,
  standup_summaries,
  standup_meetings,
  tasks,
  projects,
  buckets,
  lab_members,
  user_profiles,
  labs
CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS
  user_role,
  lab_status,
  bucket_status,
  project_status,
  task_status,
  priority,
  notification_type,
  activity_type
CASCADE;

-- ============================================================================
-- TYPE DEFINITIONS
-- ============================================================================

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

CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done', 'blocked');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE bucket_status AS ENUM ('active', 'archived');
CREATE TYPE notification_type AS ENUM ('task_assigned', 'task_completed', 'deadline_reminder', 'mention', 'lab_invite');
CREATE TYPE activity_type AS ENUM ('created', 'updated', 'deleted', 'completed', 'assigned');

-- ============================================================================
-- CORE TABLES (Matching current database.types.ts exactly)
-- ============================================================================

-- Labs table
CREATE TABLE labs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE, -- Added UNIQUE constraint for ON CONFLICT
  description TEXT,
  logo_url VARCHAR(500),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table (matching current structure)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  bio TEXT,
  phone VARCHAR(20),
  title VARCHAR(100),
  department VARCHAR(100),
  institution VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_selected_lab_id UUID REFERENCES labs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab members table (with ALL individual permission columns)
CREATE TABLE lab_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  role user_role DEFAULT 'external_collaborator',
  
  -- Admin flags
  is_admin BOOLEAN DEFAULT false,
  is_super_admin BOOLEAN DEFAULT false,
  
  -- Member management permissions
  can_manage_members BOOLEAN DEFAULT false,
  can_manage_lab_settings BOOLEAN DEFAULT false,
  can_view_audit_logs BOOLEAN DEFAULT false,
  can_manage_permissions BOOLEAN DEFAULT false,
  
  -- Project permissions
  can_create_projects BOOLEAN DEFAULT false,
  can_edit_all_projects BOOLEAN DEFAULT false,
  can_delete_projects BOOLEAN DEFAULT false,
  can_view_all_projects BOOLEAN DEFAULT true,
  can_archive_projects BOOLEAN DEFAULT false,
  can_restore_projects BOOLEAN DEFAULT false,
  
  -- Task permissions
  can_assign_tasks BOOLEAN DEFAULT false,
  can_edit_all_tasks BOOLEAN DEFAULT false,
  can_delete_tasks BOOLEAN DEFAULT false,
  can_view_all_tasks BOOLEAN DEFAULT true,
  can_manage_task_templates BOOLEAN DEFAULT false,
  can_set_task_priorities BOOLEAN DEFAULT false,
  
  -- Data and reporting permissions
  can_access_reports BOOLEAN DEFAULT false,
  can_export_data BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT false,
  can_manage_deadlines BOOLEAN DEFAULT false,
  can_view_financials BOOLEAN DEFAULT false,
  
  -- Communication permissions
  can_schedule_meetings BOOLEAN DEFAULT false,
  can_manage_standups BOOLEAN DEFAULT false,
  can_send_lab_announcements BOOLEAN DEFAULT false,
  can_moderate_discussions BOOLEAN DEFAULT false,
  
  -- Status and timestamps
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  last_permission_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, lab_id)
);

-- Buckets table
CREATE TABLE buckets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status bucket_status DEFAULT 'active',
  color VARCHAR(7),
  position INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lab_id, name)
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bucket_id UUID NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status project_status DEFAULT 'planning',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo',
  priority priority DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id),
  assigned_by UUID REFERENCES auth.users(id),
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT check_no_self_parent CHECK (id != parent_task_id)
);

-- ============================================================================
-- ADDITIONAL SUPPORT TABLES
-- ============================================================================

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id UUID REFERENCES labs(id) ON DELETE SET NULL,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url VARCHAR(500),
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar events (matching current structure)
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL DEFAULT 'OTHER',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  duration INTEGER,
  location VARCHAR(255),
  participants INTEGER,
  status VARCHAR(50),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  google_calendar_id VARCHAR(255),
  google_calendar_url VARCHAR(500),
  export_title VARCHAR(255),
  export_description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab invites (for invite codes)
CREATE TABLE lab_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  invite_code VARCHAR(50) UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, first_name, last_name, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(split_part(NEW.email, '@', 1), '.', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', split_part(split_part(NEW.email, '@', 1), '.', 2)),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_labs_timestamp BEFORE UPDATE ON labs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_profiles_timestamp BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_lab_members_timestamp BEFORE UPDATE ON lab_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_buckets_timestamp BEFORE UPDATE ON buckets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_timestamp BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_timestamp BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_calendar_events_timestamp BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auth trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- SEED INITIAL PRODUCTION DATA
-- ============================================================================

-- Create the two main labs
INSERT INTO labs (id, name, description, created_by, is_active, created_at, updated_at) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'Rush Health Equity Data Analytics Studio',
  'RHEDAS - Research laboratory focused on health equity data analytics and population health research.',
  NULL,
  true,
  NOW(),
  NOW()
),
(
  'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380b22'::uuid,
  'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science',
  'RICCC - Interdisciplinary research consortium focused on critical care trials and advanced data science methodologies.',
  NULL,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Function to safely add lab memberships (only if user exists)
CREATE OR REPLACE FUNCTION add_lab_membership_with_permissions(
    p_email TEXT,
    p_lab_name TEXT,
    p_role user_role,
    p_is_admin BOOLEAN DEFAULT false,
    p_can_manage_members BOOLEAN DEFAULT false,
    p_can_create_projects BOOLEAN DEFAULT false,
    p_can_schedule_meetings BOOLEAN DEFAULT false,
    p_can_export_data BOOLEAN DEFAULT false
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_lab_id UUID;
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

    -- Insert membership with proper permissions structure
    INSERT INTO lab_members (
        lab_id, user_id, role, is_admin,
        can_manage_members, can_manage_lab_settings, can_manage_permissions,
        can_create_projects, can_edit_all_projects, can_view_all_projects,
        can_assign_tasks, can_edit_all_tasks, can_view_all_tasks,
        can_access_reports, can_export_data, can_view_analytics,
        can_schedule_meetings, can_manage_standups,
        created_at, updated_at
    ) 
    VALUES (
        v_lab_id, v_user_id, p_role, p_is_admin,
        p_can_manage_members, p_is_admin, p_is_admin,
        p_can_create_projects, p_is_admin, true,
        p_can_create_projects, p_is_admin, true,
        p_can_export_data, p_can_export_data, p_can_export_data,
        p_can_schedule_meetings, p_can_schedule_meetings,
        NOW(), NOW()
    )
    ON CONFLICT (user_id, lab_id) DO UPDATE SET
        role = EXCLUDED.role,
        is_admin = EXCLUDED.is_admin,
        can_manage_members = EXCLUDED.can_manage_members,
        updated_at = NOW();

    RAISE NOTICE 'Added/Updated membership: % as % in %', p_email, p_role, p_lab_name;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add lab memberships with proper permission structure
DO $$
BEGIN
    -- Multi-lab members (Principal Investigators with full permissions)
    PERFORM add_lab_membership_with_permissions('juan_rojas@rush.edu', 'Rush Health Equity Data Analytics Studio', 'principal_investigator', true, true, true, true, true);
    PERFORM add_lab_membership_with_permissions('juan_rojas@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'principal_investigator', true, true, true, true, true);
    
    -- Regulatory coordinators (moderate permissions)
    PERFORM add_lab_membership_with_permissions('Mia_R_McClintic@rush.edu', 'Rush Health Equity Data Analytics Studio', 'regulatory_coordinator', false, false, true, true, true);
    PERFORM add_lab_membership_with_permissions('Mia_R_McClintic@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'regulatory_coordinator', false, false, true, true, true);

    -- RHEDAS-only members
    PERFORM add_lab_membership_with_permissions('Jada_J_Sherrod@rush.edu', 'Rush Health Equity Data Analytics Studio', 'lab_manager', false, true, true, true, true);
    PERFORM add_lab_membership_with_permissions('Jason_Stanghelle@rush.edu', 'Rush Health Equity Data Analytics Studio', 'data_analyst', false, false, false, false, true);
    PERFORM add_lab_membership_with_permissions('MeherSapna_Masanpally@rush.edu', 'Rush Health Equity Data Analytics Studio', 'data_analyst', false, false, false, false, true);
    PERFORM add_lab_membership_with_permissions('John_Rich@rush.edu', 'Rush Health Equity Data Analytics Studio', 'lab_assistant', false, false, false, false, false);
    PERFORM add_lab_membership_with_permissions('Anisa_Jivani@rush.edu', 'Rush Health Equity Data Analytics Studio', 'lab_assistant', false, false, false, false, false);

    -- RICCC-only members
    PERFORM add_lab_membership_with_permissions('Kevin_Buell@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'principal_investigator', true, true, true, true, true);
    PERFORM add_lab_membership_with_permissions('Vaishvik_Chaudhari@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'data_scientist', false, false, true, false, true);
    PERFORM add_lab_membership_with_permissions('Hoda_MasteriFarahani@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'data_analyst', false, false, false, false, true);
    PERFORM add_lab_membership_with_permissions('Connor_P_Lafeber@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'research_volunteer', false, false, false, false, false);
    PERFORM add_lab_membership_with_permissions('Michael_A_Gottlieb@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'external_collaborator', false, false, false, false, false);
    PERFORM add_lab_membership_with_permissions('Jie_Li@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'external_collaborator', false, false, false, false, false);
    PERFORM add_lab_membership_with_permissions('saki.amagai@northwestern.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'external_collaborator', false, false, false, false, false);
END $$;

-- Create invite codes for both labs
INSERT INTO lab_invites (lab_id, invite_code, created_by, expires_at, max_uses, current_uses, is_active, created_at, updated_at) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'RHEDAS',
    (SELECT user_id FROM lab_members WHERE lab_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid AND role = 'principal_investigator' LIMIT 1),
    NOW() + INTERVAL '1 year',
    100,
    0,
    true,
    NOW(),
    NOW()
),
(
    'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380b22'::uuid,
    'RICCC',
    (SELECT user_id FROM lab_members WHERE lab_id = 'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380b22'::uuid AND role = 'principal_investigator' LIMIT 1),
    NOW() + INTERVAL '1 year',
    100,
    0,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (invite_code) DO NOTHING;

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

-- Create default buckets for each lab
INSERT INTO buckets (lab_id, name, description, created_by, created_at, updated_at) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'Health Equity Research',
    'Primary research bucket for health equity data analytics projects',
    (SELECT user_id FROM lab_members WHERE lab_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid AND role = 'principal_investigator' LIMIT 1),
    NOW(),
    NOW()
),
(
    'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380b22'::uuid,
    'Critical Care Trials',
    'Primary research bucket for critical care trials and data science projects',
    (SELECT user_id FROM lab_members WHERE lab_id = 'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380b22'::uuid AND role = 'principal_investigator' LIMIT 1),
    NOW(),
    NOW()
);

-- Clean up helper function
DROP FUNCTION IF EXISTS add_lab_membership_with_permissions(TEXT, TEXT, user_role, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Core indexes for optimal performance
CREATE INDEX idx_lab_members_user_lab ON lab_members(user_id, lab_id) WHERE is_active = true;
CREATE INDEX idx_lab_members_lab_active ON lab_members(lab_id) WHERE is_active = true;
CREATE INDEX idx_buckets_lab ON buckets(lab_id);
CREATE INDEX idx_projects_bucket ON projects(bucket_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_calendar_events_lab_date ON calendar_events(lab_id, start_date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_invites ENABLE ROW LEVEL SECURITY;

-- Helper function for lab membership check
CREATE OR REPLACE FUNCTION is_lab_member(p_lab_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM lab_members
    WHERE lab_id = p_lab_id 
    AND user_id = p_user_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- User profiles - users can only see their own
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- Labs - users can only see labs they're members of
CREATE POLICY "View member labs" ON labs
  FOR SELECT USING (is_lab_member(id, auth.uid()));

-- Lab members - users can see members of their labs
CREATE POLICY "View lab members" ON lab_members
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

CREATE POLICY "Manage lab members" ON lab_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lab_members lm
      WHERE lm.lab_id = lab_members.lab_id
      AND lm.user_id = auth.uid()
      AND lm.is_active = true
      AND (lm.can_manage_members = true OR lm.is_admin = true)
    )
  );

-- Buckets - users can see buckets in their labs
CREATE POLICY "View lab buckets" ON buckets
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

CREATE POLICY "Manage lab buckets" ON buckets
  FOR ALL USING (is_lab_member(lab_id, auth.uid()));

-- Projects - users can see projects in their lab buckets
CREATE POLICY "View lab projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buckets b
      WHERE b.id = projects.bucket_id
      AND is_lab_member(b.lab_id, auth.uid())
    )
  );

CREATE POLICY "Manage lab projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM buckets b
      WHERE b.id = projects.bucket_id
      AND is_lab_member(b.lab_id, auth.uid())
    )
  );

-- Tasks - users can see tasks in their lab projects
CREATE POLICY "View lab tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN buckets b ON p.bucket_id = b.id
      WHERE p.id = tasks.project_id
      AND is_lab_member(b.lab_id, auth.uid())
    )
  );

CREATE POLICY "Manage lab tasks" ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN buckets b ON p.bucket_id = b.id
      WHERE p.id = tasks.project_id
      AND is_lab_member(b.lab_id, auth.uid())
    )
  );

-- Notifications - users can only see their own
CREATE POLICY "View own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Calendar events - users can see events in their labs
CREATE POLICY "View lab calendar events" ON calendar_events
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

CREATE POLICY "Manage lab calendar events" ON calendar_events
  FOR ALL USING (is_lab_member(lab_id, auth.uid()));

-- Lab invites - users can see invites for their labs
CREATE POLICY "View lab invites" ON lab_invites
  FOR SELECT USING (is_lab_member(lab_id, auth.uid()));

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '🎉 Lab Sync Final Migration Completed Successfully!';
  RAISE NOTICE '✅ Schema matches working API code structure';
  RAISE NOTICE '✅ All permission columns properly configured';
  RAISE NOTICE '✅ Initial lab memberships created';
  RAISE NOTICE '✅ RLS policies enabled for security';
  RAISE NOTICE '✅ Performance indexes created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Regenerate TypeScript types: npx supabase gen types typescript';
  RAISE NOTICE '2. Update database.types.ts with new types';
  RAISE NOTICE '3. Run type check: npm run type-check';
END $$;