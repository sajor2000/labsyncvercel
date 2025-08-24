import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import IdeasPageClient from './ideas-client'

// Force dynamic rendering for auth-dependent page
export const dynamic = 'force-dynamic'

export default async function LabIdeasPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params
  
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      redirect('/auth/signin')
    }

    // Verify user has access to this lab
    const { data: membership, error: memberError } = await supabase
      .from('lab_members')
      .select('id, role, can_create_ideas, can_moderate_ideas')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError || !membership) {
      redirect('/dashboard/labs')
    }

    // Get lab details
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('id, name, description')
      .eq('id', labId)
      .single()

    if (labError || !lab) {
      redirect('/dashboard/labs')
    }

    // Get lab's ideas with vote counts
    const { data: ideas, error: ideasError } = await supabase
      .from('ideas')
      .select(`
        id,
        title,
        description,
        category,
        status,
        effort_level,
        impact_level,
        tags,
        submitted_by,
        implementation_notes,
        feedback,
        created_at,
        updated_at
      `)
      .eq('lab_id', labId)
      .order('created_at', { ascending: false })

    // Get vote counts for each idea
    let ideasWithVotes: any[] = []
    if (ideas && ideas.length > 0) {
      const ideaIds = ideas.map(idea => idea.id)
      
      const { data: votes, error: votesError } = await supabase
        .from('idea_votes')
        .select('idea_id, vote_type')
        .in('idea_id', ideaIds)

      if (votesError) {
        console.error('Error fetching votes:', votesError)
      }

      // Calculate vote counts for each idea
      ideasWithVotes = ideas.map(idea => {
        const ideaVotes = votes?.filter(vote => vote.idea_id === idea.id) || []
        const upvotes = ideaVotes.filter(vote => vote.vote_type === 'upvote').length
        const downvotes = ideaVotes.filter(vote => vote.vote_type === 'downvote').length
        
        return {
          ...idea,
          upvotes,
          downvotes,
          score: upvotes - downvotes
        }
      })
    }

    // Get user's votes for these ideas
    const { data: userVotes, error: userVotesError } = await supabase
      .from('idea_votes')
      .select('idea_id, vote_type')
      .eq('user_id', user.id)
      .in('idea_id', ideas?.map(idea => idea.id) || [])

    // Get lab members for idea attribution
    const { data: labMembers, error: membersError } = await supabase
      .from('lab_members')
      .select(`
        user_id,
        role,
        user_profiles (
          id,
          email,
          full_name,
          first_name,
          last_name
        )
      `)
      .eq('lab_id', labId)
      .eq('is_active', true)

    if (ideasError) console.error('Error fetching ideas:', ideasError)
    if (userVotesError) console.error('Error fetching user votes:', userVotesError)
    if (membersError) console.error('Error fetching members:', membersError)

    // Transform lab members to handle Supabase join structure
    const transformedMembers = (labMembers || []).map(member => ({
      ...member,
      user_profiles: Array.isArray(member.user_profiles) 
        ? member.user_profiles[0] 
        : member.user_profiles
    }))

    return (
      <IdeasPageClient 
        lab={lab}
        initialIdeas={ideasWithVotes}
        userVotes={userVotes || []}
        labMembers={transformedMembers}
        currentUserId={user.id}
        userPermissions={{
          canCreate: membership.can_create_ideas || false,
          canModerate: membership.can_moderate_ideas || false
        }}
      />
    )

  } catch (error) {
    console.error('Lab ideas page error:', error)
    redirect('/dashboard/labs')
  }
}