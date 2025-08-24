import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'
import { z } from 'zod'

const CreateProjectSchema = z.object({
  bucket_id: z.string().uuid('Invalid bucket ID'),
  name: z.string().min(2, 'Project name must be at least 2 characters').max(255, 'Project name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  // IRB fields
  irb_number: z.string().min(3, 'IRB number must be at least 3 characters').optional(),
  irb_status: z.enum(['not_required', 'planning', 'submitted', 'under_review', 'approved', 'expired', 'suspended', 'withdrawn', 'exempt']).optional(),
  human_subjects_research: z.boolean().optional(),
  // Publication fields
  first_author_id: z.string().uuid().optional(),
  last_author_id: z.string().uuid().optional(),
  corresponding_author_id: z.string().uuid().optional(),
  publication_title: z.string().max(500).optional(),
  target_journal: z.string().max(255).optional(),
  // Grant association
  associated_grant_number: z.string().max(100).optional(),
  funding_source: z.string().max(255).optional(),
})

// GET /api/projects - Get projects filtered by bucket_id or lab_id
export async function GET(request: Request) {
  try {
    await rateLimit('api', 30) // 30 requests per minute
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const bucket_id = url.searchParams.get('bucket_id')
    const lab_id = url.searchParams.get('lab_id')

    let query = supabase
      .from('projects')
      .select(`
        id,
        bucket_id,
        name,
        description,
        status,
        priority,
        progress_percentage,
        start_date,
        due_date,
        completed_date,
        estimated_hours,
        actual_hours,
        owner_id,
        team_members,
        first_author_id,
        last_author_id,
        corresponding_author_id,
        publication_title,
        target_journal,
        manuscript_status,
        irb_number,
        irb_status,
        irb_approval_date,
        irb_expiration_date,
        human_subjects_research,
        budget,
        spent,
        associated_grant_number,
        funding_source,
        tags,
        research_areas,
        created_at,
        updated_at,
        buckets!inner (
          id,
          lab_id,
          name
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (bucket_id) {
      query = query.eq('bucket_id', bucket_id)
    } else if (lab_id) {
      query = query.eq('buckets.lab_id', lab_id)
    }

    const { data: projects, error } = await query

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    // Transform for frontend compatibility (projects → studies)
    const studies = projects?.map(project => ({
      ...project,
      // Map database fields to frontend expectations
      title: project.name, // UI expects 'title', DB has 'name'
      study_id: project.id, // For backwards compatibility
      bucket: project.buckets,
      _count: {
        tasks: 0, // TODO: Add task count
        completed_tasks: 0
      }
    }))

    return NextResponse.json({ studies })

  } catch (error) {
    console.error('Projects GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  try {
    await rateLimit('api', 10) // 10 requests per minute for creation
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreateProjectSchema.parse(body)

    // Verify user has permission to create projects in this bucket's lab
    const { data: bucket, error: bucketError } = await supabase
      .from('buckets')
      .select('lab_id')
      .eq('id', validatedData.bucket_id)
      .single()

    if (bucketError || !bucket) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }

    // Check lab membership and permission
    const { data: membership, error: membershipError } = await supabase
      .from('lab_members')
      .select('can_create_projects, is_super_admin')
      .eq('lab_id', bucket.lab_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this lab' }, { status: 403 })
    }

    if (!membership.can_create_projects && !membership.is_super_admin) {
      return NextResponse.json({ error: 'Insufficient permissions to create projects' }, { status: 403 })
    }

    // Create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        bucket_id: validatedData.bucket_id,
        name: validatedData.name,
        description: validatedData.description,
        status: validatedData.status || 'planning',
        priority: validatedData.priority || 'medium',
        start_date: validatedData.start_date,
        due_date: validatedData.due_date,
        estimated_hours: validatedData.estimated_hours,
        owner_id: user.id,
        // IRB fields
        irb_number: validatedData.irb_number,
        irb_status: validatedData.irb_status || 'planning',
        human_subjects_research: validatedData.human_subjects_research ?? true,
        // Publication fields
        first_author_id: validatedData.first_author_id,
        last_author_id: validatedData.last_author_id,
        corresponding_author_id: validatedData.corresponding_author_id,
        publication_title: validatedData.publication_title,
        target_journal: validatedData.target_journal,
        // Grant association
        associated_grant_number: validatedData.associated_grant_number,
        funding_source: validatedData.funding_source,
      })
      .select()
      .single()

    if (projectError) {
      console.error('Error creating project:', projectError)
      if (projectError.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'A project with this name already exists in this bucket' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    // Transform for frontend compatibility
    const study = {
      ...project,
      title: project.name,
      study_id: project.id,
    }

    return NextResponse.json({ study }, { status: 201 })

  } catch (error) {
    console.error('Projects POST error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}