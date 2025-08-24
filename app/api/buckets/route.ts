import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'
import { z } from 'zod'

const CreateBucketSchema = z.object({
  lab_id: z.string().uuid('Invalid lab ID'),
  name: z.string().min(2, 'Bucket name must be at least 2 characters').max(255, 'Bucket name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Invalid color format').optional(),
  icon: z.string().max(50).optional(),
})

// GET /api/buckets - Get buckets filtered by lab_id
export async function GET(request: Request) {
  try {
    await rateLimit('api', 30) // 30 requests per minute
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const lab_id = url.searchParams.get('lab_id')

    if (!lab_id) {
      return NextResponse.json({ error: 'lab_id parameter required' }, { status: 400 })
    }

    // Verify user is member of this lab
    const { data: membership, error: membershipError } = await supabase
      .from('lab_members')
      .select('id')
      .eq('lab_id', lab_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this lab' }, { status: 403 })
    }

    // Get buckets with project counts
    const { data: buckets, error } = await supabase
      .from('buckets')
      .select(`
        id,
        lab_id,
        name,
        description,
        color,
        icon,
        status,
        position,
        owner_id,
        created_at,
        updated_at,
        owner:user_profiles!buckets_owner_id_fkey (
          id,
          first_name,
          last_name,
          display_name
        )
      `)
      .eq('lab_id', lab_id)
      .is('deleted_at', null)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching buckets:', error)
      return NextResponse.json({ error: 'Failed to fetch buckets' }, { status: 500 })
    }

    // Get project counts for each bucket
    const bucketsWithCounts = await Promise.all(
      (buckets || []).map(async (bucket) => {
        const { count: projectCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('bucket_id', bucket.id)
          .is('deleted_at', null)

        return {
          ...bucket,
          _count: {
            projects: projectCount || 0,
            studies: projectCount || 0, // Backwards compatibility
          }
        }
      })
    )

    return NextResponse.json({ buckets: bucketsWithCounts })

  } catch (error) {
    console.error('Buckets GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/buckets - Create a new bucket
export async function POST(request: Request) {
  try {
    await rateLimit('api', 10) // 10 requests per minute for creation
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreateBucketSchema.parse(body)

    // Check lab membership and permissions
    const { data: membership, error: membershipError } = await supabase
      .from('lab_members')
      .select('can_create_projects, is_super_admin, is_admin')
      .eq('lab_id', validatedData.lab_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this lab' }, { status: 403 })
    }

    if (!membership.can_create_projects && !membership.is_super_admin && !membership.is_admin) {
      return NextResponse.json({ error: 'Insufficient permissions to create buckets' }, { status: 403 })
    }

    // Create the bucket
    const { data: bucket, error: bucketError } = await supabase
      .from('buckets')
      .insert({
        lab_id: validatedData.lab_id,
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color || '#6b7280',
        icon: validatedData.icon || 'folder',
        owner_id: user.id,
        status: 'active',
      })
      .select(`
        id,
        lab_id,
        name,
        description,
        color,
        icon,
        status,
        position,
        owner_id,
        created_at,
        updated_at
      `)
      .single()

    if (bucketError) {
      console.error('Error creating bucket:', bucketError)
      if (bucketError.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'A bucket with this name already exists in this lab' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create bucket' }, { status: 500 })
    }

    const bucketWithCount = {
      ...bucket,
      _count: {
        projects: 0,
        studies: 0,
      }
    }

    return NextResponse.json({ bucket: bucketWithCount }, { status: 201 })

  } catch (error) {
    console.error('Buckets POST error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}