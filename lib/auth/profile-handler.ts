/**
 * User Profile Handler - Ensures user profiles are created and maintained
 * Handles profile creation, lab membership, and user data synchronization
 */

import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

export class ProfileHandler {
  private supabase = createClient()

  /**
   * Ensure user profile exists, create if missing
   */
  async ensureUserProfile(user: User): Promise<any> {
    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (existingProfile && !fetchError) {
        console.log('✅ User profile exists:', existingProfile.email)
        return existingProfile
      }

      // Create new profile from auth user data
      const profileData = {
        id: user.id,
        email: user.email!,
        first_name: user.user_metadata?.first_name || null,
        last_name: user.user_metadata?.last_name || null,
        full_name: user.user_metadata?.full_name || 
                   (user.user_metadata?.first_name && user.user_metadata?.last_name
                     ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                     : null),
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: newProfile, error: createError } = await this.supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single()

      if (createError) {
        console.error('❌ Failed to create user profile:', createError)
        throw createError
      }

      console.log('✅ User profile created successfully:', newProfile.email)
      return newProfile

    } catch (error) {
      console.error('❌ Profile handler error:', error)
      throw error
    }
  }

  /**
   * Create default lab for new users
   */
  async createDefaultLab(userId: string, userEmail: string): Promise<any> {
    try {
      // Check if user is already a member of any lab
      const { data: existingMemberships } = await this.supabase
        .from('lab_members')
        .select('lab_id')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (existingMemberships && existingMemberships.length > 0) {
        console.log('✅ User already has lab memberships')
        return null
      }

      // Create default lab
      const labName = `${userEmail.split('@')[0]}'s Lab`
      const { data: newLab, error: labError } = await this.supabase
        .from('labs')
        .insert({
          name: labName,
          description: 'Your personal research lab',
          status: 'active' as const,
          created_by: userId,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (labError) {
        console.error('❌ Failed to create default lab:', labError)
        return null // Non-critical, user can create lab later
      }

      // Add user as principal investigator
      const { error: membershipError } = await this.supabase
        .from('lab_members')
        .insert({
          lab_id: newLab.id,
          user_id: userId,
          role: 'principal_investigator' as const,
          is_active: true,
          can_manage_lab: true,
          can_manage_members: true,
          can_manage_permissions: true,
          // Grant all permissions for lab creator
          can_create_studies: true,
          can_edit_studies: true,
          can_delete_studies: true,
          can_manage_tasks: true,
          can_view_reports: true,
          can_export_data: true,
          joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (membershipError) {
        console.error('❌ Failed to create lab membership:', membershipError)
        return null
      }

      console.log('✅ Default lab created successfully:', labName)
      return newLab

    } catch (error) {
      console.error('❌ Default lab creation error:', error)
      return null // Non-critical
    }
  }

  /**
   * Handle complete user setup (profile + default lab)
   */
  async handleNewUserSetup(user: User): Promise<void> {
    try {
      // Ensure profile exists
      await this.ensureUserProfile(user)
      
      // Create default lab
      await this.createDefaultLab(user.id, user.email!)
      
      console.log('✅ New user setup completed for:', user.email)
    } catch (error) {
      console.error('❌ New user setup failed:', error)
      // Don't throw - auth should still succeed even if profile creation fails
    }
  }
}

export const profileHandler = new ProfileHandler()