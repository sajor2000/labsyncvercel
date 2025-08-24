-- Migration: Seed Initial Users and Labs for RHEDAS and RICCC
-- This migration creates the initial labs and user memberships for production
-- Safe to run multiple times - uses ON CONFLICT DO NOTHING for idempotency

-- First, create the two labs with fixed UUIDs for consistency
-- First add unique constraint if it doesn't exist
ALTER TABLE labs ADD CONSTRAINT labs_name_unique UNIQUE (name);

INSERT INTO labs (id, name, description, created_by, is_active, created_at, updated_at) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'Rush Health Equity Data Analytics Studio',
  'RHEDAS - Research laboratory focused on health equity data analytics and population health research.',
  NULL, -- Will be updated after user profiles are created
  true,
  NOW(),
  NOW()
),
(
  'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380b22'::uuid,
  'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science',
  'RICCC - Interdisciplinary research consortium focused on critical care trials and advanced data science methodologies.',
  NULL, -- Will be updated after user profiles are created
  true,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Create a function to safely add lab memberships (only if user exists)
CREATE OR REPLACE FUNCTION add_lab_membership(
    p_email TEXT,
    p_lab_name TEXT,
    p_role TEXT,
    p_permissions JSONB
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

    -- Insert membership (ON CONFLICT DO NOTHING for idempotency)
    INSERT INTO lab_members (id, lab_id, user_id, role, is_active, permissions, created_at, updated_at) 
    VALUES (gen_random_uuid(), v_lab_id, v_user_id, p_role, true, p_permissions, NOW(), NOW())
    ON CONFLICT (lab_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        updated_at = NOW();

    RAISE NOTICE 'Added/Updated membership: % as % in %', p_email, p_role, p_lab_name;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Now add all the lab memberships
DO $$
DECLARE
    admin_permissions JSONB := '{"can_manage_members": true, "can_create_studies": true, "can_edit_studies": true, "can_delete_studies": true, "can_manage_tasks": true, "can_view_reports": true, "can_export_data": true, "can_manage_lab": true, "can_manage_permissions": true}';
    coordinator_permissions JSONB := '{"can_manage_members": false, "can_create_studies": true, "can_edit_studies": true, "can_delete_studies": false, "can_manage_tasks": true, "can_view_reports": true, "can_export_data": true, "can_manage_lab": false, "can_manage_permissions": false}';
    manager_permissions JSONB := '{"can_manage_members": true, "can_create_studies": true, "can_edit_studies": true, "can_delete_studies": false, "can_manage_tasks": true, "can_view_reports": true, "can_export_data": true, "can_manage_lab": false, "can_manage_permissions": false}';
    analyst_permissions JSONB := '{"can_manage_members": false, "can_create_studies": false, "can_edit_studies": true, "can_delete_studies": false, "can_manage_tasks": true, "can_view_reports": true, "can_export_data": true, "can_manage_lab": false, "can_manage_permissions": false}';
    scientist_permissions JSONB := '{"can_manage_members": false, "can_create_studies": true, "can_edit_studies": true, "can_delete_studies": false, "can_manage_tasks": true, "can_view_reports": true, "can_export_data": true, "can_manage_lab": false, "can_manage_permissions": false}';
    collaborator_permissions JSONB := '{"can_manage_members": false, "can_create_studies": false, "can_edit_studies": true, "can_delete_studies": false, "can_manage_tasks": false, "can_view_reports": true, "can_export_data": false, "can_manage_lab": false, "can_manage_permissions": false}';
    member_permissions JSONB := '{"can_manage_members": false, "can_create_studies": false, "can_edit_studies": false, "can_delete_studies": false, "can_manage_tasks": false, "can_view_reports": true, "can_export_data": false, "can_manage_lab": false, "can_manage_permissions": false}';
    volunteer_permissions JSONB := '{"can_manage_members": false, "can_create_studies": false, "can_edit_studies": false, "can_delete_studies": false, "can_manage_tasks": false, "can_view_reports": true, "can_export_data": false, "can_manage_lab": false, "can_manage_permissions": false}';
BEGIN
    -- Multi-lab members (appear in both labs)
    PERFORM add_lab_membership('juan_rojas@rush.edu', 'Rush Health Equity Data Analytics Studio', 'principal_investigator', admin_permissions);
    PERFORM add_lab_membership('juan_rojas@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'principal_investigator', admin_permissions);
    
    PERFORM add_lab_membership('Mia_R_McClintic@rush.edu', 'Rush Health Equity Data Analytics Studio', 'regulatory_coordinator', coordinator_permissions);
    PERFORM add_lab_membership('Mia_R_McClintic@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'regulatory_coordinator', coordinator_permissions);

    -- RHEDAS-only members
    PERFORM add_lab_membership('Jada_J_Sherrod@rush.edu', 'Rush Health Equity Data Analytics Studio', 'lab_manager', manager_permissions);
    PERFORM add_lab_membership('Jason_Stanghelle@rush.edu', 'Rush Health Equity Data Analytics Studio', 'data_analyst', analyst_permissions);
    PERFORM add_lab_membership('MeherSapna_Masanpally@rush.edu', 'Rush Health Equity Data Analytics Studio', 'data_analyst', analyst_permissions);
    PERFORM add_lab_membership('John_Rich@rush.edu', 'Rush Health Equity Data Analytics Studio', 'lab_assistant', member_permissions);
    PERFORM add_lab_membership('Anisa_Jivani@rush.edu', 'Rush Health Equity Data Analytics Studio', 'lab_assistant', member_permissions);

    -- RICCC-only members
    PERFORM add_lab_membership('Kevin_Buell@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'principal_investigator', admin_permissions);
    PERFORM add_lab_membership('Vaishvik_Chaudhari@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'data_scientist', scientist_permissions);
    PERFORM add_lab_membership('Hoda_MasteriFarahani@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'data_analyst', analyst_permissions);
    PERFORM add_lab_membership('Connor_P_Lafeber@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'research_volunteer', volunteer_permissions);
    PERFORM add_lab_membership('Michael_A_Gottlieb@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'external_collaborator', collaborator_permissions);
    PERFORM add_lab_membership('Jie_Li@rush.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'external_collaborator', collaborator_permissions);
    PERFORM add_lab_membership('saki.amagai@northwestern.edu', 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science', 'external_collaborator', collaborator_permissions);

END $$;

-- Set default labs for multi-lab users (only if users exist)
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

-- Create initial invite codes for both labs
INSERT INTO lab_invites (id, lab_id, invite_code, created_by, expires_at, max_uses, current_uses, is_active, created_at, updated_at) VALUES
(
    gen_random_uuid(),
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
    gen_random_uuid(),
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

-- Clean up the helper function (optional - keep it for future use)
-- DROP FUNCTION IF EXISTS add_lab_membership(TEXT, TEXT, TEXT, JSONB);

-- Final success message
DO $$ BEGIN RAISE NOTICE 'Migration completed successfully! Labs and memberships have been created.'; END $$;