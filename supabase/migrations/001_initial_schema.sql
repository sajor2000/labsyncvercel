-- LabFlow Database Schema for Supabase
-- Complete migration from Neon PostgreSQL to Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE user_role AS ENUM (
  'PRINCIPAL_INVESTIGATOR',
  'CO_PRINCIPAL_INVESTIGATOR',
  'DATA_SCIENTIST',
  'DATA_ANALYST',
  'CLINICAL_RESEARCH_COORDINATOR',
  'REGULATORY_COORDINATOR',
  'STAFF_COORDINATOR',
  'LAB_ADMINISTRATOR',
  'FELLOW',
  'MEDICAL_STUDENT',
  'RESEARCH_ASSISTANT',
  'VOLUNTEER_RESEARCH_ASSISTANT',
  'EXTERNAL_COLLABORATOR',
  'PI',
  'RESEARCH_COORDINATOR',
  'RESEARCHER',
  'STUDENT',
  'ADMIN'
);

CREATE TYPE study_status AS ENUM (
  'PLANNING',
  'IRB_SUBMISSION',
  'IRB_APPROVED',
  'DATA_COLLECTION',
  'ANALYSIS',
  'MANUSCRIPT',
  'UNDER_REVIEW',
  'PUBLISHED',
  'ON_HOLD',
  'CANCELLED'
);

CREATE TYPE task_status AS ENUM (
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'DONE',
  'BLOCKED'
);

CREATE TYPE priority AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);

CREATE TYPE funding_type AS ENUM (
  'NIH',
  'NSF',
  'INDUSTRY_SPONSORED',
  'INTERNAL',
  'FOUNDATION',
  'OTHER'
);

-- Labs table
CREATE TABLE labs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  full_name VARCHAR(500),
  description TEXT,
  website_url VARCHAR(500),
  contact_email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  lab_code VARCHAR(20),
  funding_sources TEXT[],
  research_areas TEXT[],
  equipment TEXT[],
  certifications TEXT[],
  compliance_info JSONB,
  features TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab Members table (many-to-many users and labs)
CREATE TABLE lab_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  
  -- Lab-specific role
  lab_role user_role DEFAULT 'RESEARCH_ASSISTANT',
  
  -- Administrative Permissions
  is_admin BOOLEAN DEFAULT false,
  is_super_admin BOOLEAN DEFAULT false,
  can_manage_members BOOLEAN DEFAULT false,
  can_manage_lab_settings BOOLEAN DEFAULT false,
  can_view_audit_logs BOOLEAN DEFAULT false,
  can_manage_permissions BOOLEAN DEFAULT false,
  
  -- Project & Study Management Permissions
  can_create_projects BOOLEAN DEFAULT false,
  can_edit_all_projects BOOLEAN DEFAULT false,
  can_delete_projects BOOLEAN DEFAULT false,
  can_view_all_projects BOOLEAN DEFAULT false,
  can_archive_projects BOOLEAN DEFAULT false,
  can_restore_projects BOOLEAN DEFAULT false,
  
  -- Task Management Permissions
  can_assign_tasks BOOLEAN DEFAULT false,
  can_edit_all_tasks BOOLEAN DEFAULT false,
  can_delete_tasks BOOLEAN DEFAULT false,
  can_view_all_tasks BOOLEAN DEFAULT false,
  can_manage_task_templates BOOLEAN DEFAULT false,
  can_set_task_priorities BOOLEAN DEFAULT false,
  
  -- Data & Reporting Permissions
  can_access_reports BOOLEAN DEFAULT false,
  can_export_data BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT false,
  can_manage_deadlines BOOLEAN DEFAULT false,
  can_view_financials BOOLEAN DEFAULT false,
  
  -- Meeting & Communication Permissions
  can_schedule_meetings BOOLEAN DEFAULT false,
  can_manage_standups BOOLEAN DEFAULT false,
  can_send_lab_announcements BOOLEAN DEFAULT false,
  can_moderate_discussions BOOLEAN DEFAULT false,
  
  -- Status and dates
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  last_permission_update TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, lab_id)
);

-- User Profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  initials VARCHAR(10),
  avatar_url VARCHAR(500),
  phone VARCHAR(50),
  department VARCHAR(255),
  title VARCHAR(255),
  bio TEXT,
  research_interests TEXT[],
  publications JSONB,
  education JSONB,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Studies table
CREATE TABLE studies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status study_status DEFAULT 'PLANNING',
  priority priority DEFAULT 'MEDIUM',
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  principal_investigator_id UUID REFERENCES auth.users(id),
  
  -- Study details
  study_type VARCHAR(100),
  funding_type funding_type,
  funding_amount DECIMAL(15,2),
  start_date DATE,
  end_date DATE,
  estimated_duration_months INTEGER,
  
  -- IRB and compliance
  irb_number VARCHAR(100),
  irb_approval_date DATE,
  irb_expiration_date DATE,
  protocol_version VARCHAR(20),
  
  -- Study metadata
  objectives TEXT,
  inclusion_criteria TEXT,
  exclusion_criteria TEXT,
  primary_endpoints TEXT,
  secondary_endpoints TEXT,
  study_population_size INTEGER,
  current_enrollment INTEGER DEFAULT 0,
  
  -- File attachments and resources
  protocol_file_url VARCHAR(500),
  consent_form_url VARCHAR(500),
  data_collection_forms JSONB,
  
  -- Status tracking
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status task_status DEFAULT 'TODO',
  priority priority DEFAULT 'MEDIUM',
  
  -- Relationships
  study_id UUID REFERENCES studies(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  
  -- Dates and scheduling
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  
  -- Task metadata
  task_type VARCHAR(100),
  dependencies TEXT[],
  tags TEXT[],
  attachments JSONB,
  
  -- Email reminders
  reminder_sent BOOLEAN DEFAULT false,
  reminder_date TIMESTAMPTZ,
  
  -- Status tracking
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standup Meetings table
CREATE TABLE standup_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  
  -- Meeting details
  duration_minutes INTEGER,
  attendees TEXT[],
  meeting_type VARCHAR(50) DEFAULT 'STANDUP',
  location VARCHAR(255),
  
  -- Recording and transcription
  audio_file_url VARCHAR(500),
  transcript TEXT,
  transcript_processed BOOLEAN DEFAULT false,
  
  -- AI Processing
  ai_summary JSONB,
  ai_processing_status VARCHAR(50) DEFAULT 'PENDING',
  ai_processing_error TEXT,
  
  -- Notes and outcomes
  notes TEXT,
  next_meeting_topics TEXT[],
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action Items from meetings
CREATE TABLE standup_action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES standup_meetings(id) ON DELETE CASCADE,
  
  -- Action item details
  description TEXT NOT NULL,
  assignee_id UUID REFERENCES auth.users(id),
  priority priority DEFAULT 'MEDIUM',
  due_date DATE,
  status task_status DEFAULT 'TODO',
  
  -- Context
  related_study_id UUID REFERENCES studies(id),
  mentioned_by UUID REFERENCES auth.users(id),
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- AI extraction metadata
  ai_confidence DECIMAL(3,2),
  ai_extraction_method VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Events table
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  event_type VARCHAR(100) NOT NULL,
  
  -- Dates and timing
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  duration DECIMAL(4,2),
  
  -- Location and participants
  location VARCHAR(500),
  participants INTEGER DEFAULT 0,
  
  -- Status and metadata
  status VARCHAR(50) DEFAULT 'confirmed',
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  
  -- Google Calendar integration
  google_calendar_id VARCHAR(255),
  google_calendar_url VARCHAR(500),
  
  -- Export settings
  export_title VARCHAR(500),
  export_description TEXT,
  
  -- Event metadata
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deadlines table
CREATE TABLE deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(100) NOT NULL,
  
  -- Deadline specifics
  due_date TIMESTAMPTZ NOT NULL,
  priority priority DEFAULT 'MEDIUM',
  status VARCHAR(50) DEFAULT 'PENDING',
  
  -- Relationships
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  study_id UUID REFERENCES studies(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  
  -- Notifications
  reminder_days_before INTEGER[] DEFAULT '{7,3,1}',
  last_reminder_sent TIMESTAMPTZ,
  
  -- Completion tracking
  completed_date TIMESTAMPTZ,
  completion_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Steps table (for AI processing tracking)
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL,
  
  -- Step details
  step_type VARCHAR(50) NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Processing data
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  processing_time_ms INTEGER,
  
  -- Context
  user_id UUID REFERENCES auth.users(id),
  lab_id UUID REFERENCES labs(id),
  meeting_id UUID REFERENCES standup_meetings(id),
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ideas table
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Categorization
  category VARCHAR(100),
  priority priority DEFAULT 'MEDIUM',
  status VARCHAR(50) DEFAULT 'PROPOSED',
  
  -- Context
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  
  -- Implementation tracking
  implementation_notes TEXT,
  estimated_effort VARCHAR(50),
  potential_impact VARCHAR(50),
  
  -- Collaboration
  interested_members UUID[],
  discussion_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_lab_members_user_id ON lab_members(user_id);
CREATE INDEX idx_lab_members_lab_id ON lab_members(lab_id);
CREATE INDEX idx_lab_members_active ON lab_members(lab_id, is_active);

CREATE INDEX idx_studies_lab_id ON studies(lab_id);
CREATE INDEX idx_studies_status ON studies(status);
CREATE INDEX idx_studies_pi ON studies(principal_investigator_id);

CREATE INDEX idx_tasks_study_id ON tasks(study_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

CREATE INDEX idx_standup_meetings_lab_id ON standup_meetings(lab_id);
CREATE INDEX idx_standup_meetings_date ON standup_meetings(date);

CREATE INDEX idx_action_items_meeting_id ON standup_action_items(meeting_id);
CREATE INDEX idx_action_items_assignee ON standup_action_items(assignee_id);

CREATE INDEX idx_calendar_events_lab_id ON calendar_events(lab_id);
CREATE INDEX idx_calendar_events_dates ON calendar_events(start_date, end_date);

CREATE INDEX idx_deadlines_lab_id ON deadlines(lab_id);
CREATE INDEX idx_deadlines_due_date ON deadlines(due_date);

CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_meeting_id ON workflow_steps(meeting_id);

-- Row Level Security (RLS) policies
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE standup_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE standup_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lab_members (core security)
CREATE POLICY "Users can view lab memberships they belong to" ON lab_members
FOR SELECT USING (
  user_id = auth.uid() OR 
  lab_id IN (
    SELECT lab_id FROM lab_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Lab admins can manage memberships" ON lab_members
FOR ALL USING (
  lab_id IN (
    SELECT lab_id FROM lab_members 
    WHERE user_id = auth.uid() 
    AND (lab_role IN ('PRINCIPAL_INVESTIGATOR', 'CO_PRINCIPAL_INVESTIGATOR') OR can_manage_members = true)
    AND is_active = true
  )
);

-- RLS Policies for labs
CREATE POLICY "Users can view labs they belong to" ON labs
FOR SELECT USING (
  id IN (
    SELECT lab_id FROM lab_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
FOR ALL USING (id = auth.uid());

CREATE POLICY "Lab members can view other members' profiles" ON user_profiles
FOR SELECT USING (
  id IN (
    SELECT DISTINCT lm1.user_id 
    FROM lab_members lm1 
    WHERE lm1.lab_id IN (
      SELECT lm2.lab_id FROM lab_members lm2 
      WHERE lm2.user_id = auth.uid() AND lm2.is_active = true
    )
    AND lm1.is_active = true
  )
);

-- RLS Policies for studies
CREATE POLICY "Users can access studies in their labs" ON studies
FOR ALL USING (
  lab_id IN (
    SELECT lab_id FROM lab_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- RLS Policies for tasks
CREATE POLICY "Users can access tasks in their labs or assigned to them" ON tasks
FOR ALL USING (
  lab_id IN (
    SELECT lab_id FROM lab_members 
    WHERE user_id = auth.uid() AND is_active = true
  ) OR assignee_id = auth.uid()
);

-- RLS Policies for standup_meetings
CREATE POLICY "Users can access meetings in their labs" ON standup_meetings
FOR ALL USING (
  lab_id IN (
    SELECT lab_id FROM lab_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- RLS Policies for action_items
CREATE POLICY "Users can access action items from their lab meetings" ON standup_action_items
FOR ALL USING (
  meeting_id IN (
    SELECT id FROM standup_meetings 
    WHERE lab_id IN (
      SELECT lab_id FROM lab_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  ) OR assignee_id = auth.uid()
);

-- RLS Policies for calendar_events
CREATE POLICY "Users can access calendar events in their labs" ON calendar_events
FOR ALL USING (
  lab_id IN (
    SELECT lab_id FROM lab_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- RLS Policies for deadlines
CREATE POLICY "Users can access deadlines in their labs" ON deadlines
FOR ALL USING (
  lab_id IN (
    SELECT lab_id FROM lab_members 
    WHERE user_id = auth.uid() AND is_active = true
  ) OR assigned_to = auth.uid()
);

-- RLS Policies for workflow_steps
CREATE POLICY "Users can access workflow steps they created" ON workflow_steps
FOR ALL USING (
  user_id = auth.uid() OR 
  lab_id IN (
    SELECT lab_id FROM lab_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- RLS Policies for ideas
CREATE POLICY "Users can access ideas in their labs" ON ideas
FOR ALL USING (
  lab_id IN (
    SELECT lab_id FROM lab_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_labs_updated_at BEFORE UPDATE ON labs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_members_updated_at BEFORE UPDATE ON lab_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_studies_updated_at BEFORE UPDATE ON studies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_standup_meetings_updated_at BEFORE UPDATE ON standup_meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_standup_action_items_updated_at BEFORE UPDATE ON standup_action_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deadlines_updated_at BEFORE UPDATE ON deadlines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_steps_updated_at BEFORE UPDATE ON workflow_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data (optional)
-- You can add default labs, demo data, etc. here