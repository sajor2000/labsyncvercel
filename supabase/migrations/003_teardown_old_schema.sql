-- =====================================================
-- TEARDOWN SCRIPT - REMOVES OLD SCHEMA
-- =====================================================
-- WARNING: THIS WILL DELETE ALL DATA!
-- Make sure to backup your database before running this script
-- 
-- Run this BEFORE 004_setup_new_schema.sql
-- =====================================================

-- Disable foreign key checks temporarily for clean drops
SET session_replication_role = 'replica';

-- =====================================================
-- DROP TABLES (in reverse dependency order)
-- =====================================================

-- Drop tables that depend on others first
DROP TABLE IF EXISTS email_queue CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS calendar_sync_log CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS calendar_integrations CASCADE;
DROP TABLE IF EXISTS samples CASCADE;
DROP TABLE IF EXISTS experiments CASCADE;
DROP TABLE IF EXISTS ideas CASCADE;
DROP TABLE IF EXISTS deadlines CASCADE;
DROP TABLE IF EXISTS task_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS task_assignees CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS buckets CASCADE;
DROP TABLE IF EXISTS lab_members CASCADE;
DROP TABLE IF EXISTS labs CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop any remaining old tables from previous schema
DROP TABLE IF EXISTS action_items CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS conferences CASCADE;
DROP TABLE IF EXISTS deadline_reminders CASCADE;
DROP TABLE IF EXISTS effort_reporting CASCADE;
DROP TABLE IF EXISTS file_permissions CASCADE;
DROP TABLE IF EXISTS file_versions CASCADE;
DROP TABLE IF EXISTS grants CASCADE;
DROP TABLE IF EXISTS idea_votes CASCADE;
DROP TABLE IF EXISTS lab_invitations CASCADE;
DROP TABLE IF EXISTS lab_invite_codes CASCADE;
DROP TABLE IF EXISTS meeting_attendance CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS patents CASCADE;
DROP TABLE IF EXISTS peer_reviews CASCADE;
DROP TABLE IF EXISTS procurement_requests CASCADE;
DROP TABLE IF EXISTS publications CASCADE;
DROP TABLE IF EXISTS standup_action_items CASCADE;
DROP TABLE IF EXISTS standup_meetings CASCADE;
DROP TABLE IF EXISTS studies CASCADE;
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS usage_analytics CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS workflow_steps CASCADE;

-- =====================================================
-- DROP FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS is_lab_member(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS has_permission(UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_lab_slug() CASCADE;
DROP FUNCTION IF EXISTS set_default_permissions() CASCADE;
DROP FUNCTION IF EXISTS create_calendar_event_from_meeting() CASCADE;
DROP FUNCTION IF EXISTS get_lab_id_from_entity(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS approve_ai_tasks(UUID[], UUID) CASCADE;
DROP FUNCTION IF EXISTS queue_deadline_reminders() CASCADE;

-- =====================================================
-- DROP TYPES
-- =====================================================

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS priority CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS experiment_status CASCADE;
DROP TYPE IF EXISTS email_status CASCADE;
DROP TYPE IF EXISTS irb_status CASCADE;
DROP TYPE IF EXISTS publication_status CASCADE;
DROP TYPE IF EXISTS meeting_type CASCADE;
DROP TYPE IF EXISTS deadline_type CASCADE;
DROP TYPE IF EXISTS study_status CASCADE;
DROP TYPE IF EXISTS funding_type CASCADE;

-- =====================================================
-- DROP TRIGGERS (if any remain)
-- =====================================================

-- Drop all triggers on auth.users table (if they exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- =====================================================
-- RECREATE CLEAN SCHEMA
-- =====================================================

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Drop and recreate the public schema for a clean slate
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Grant permissions to the schema
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEARDOWN COMPLETE!';
  RAISE NOTICE 'Old schema has been completely removed.';
  RAISE NOTICE 'Now run 004_setup_new_schema.sql to create the new schema.';
  RAISE NOTICE '========================================';
END $$;