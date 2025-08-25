import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'
import { z } from 'zod'

const UpdateBucketSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().max(1000).optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  icon: z.string().max(50).optional(),
  status: z.enum(['active', 'archived']).optional(),
})

// GET /api/buckets/[bucketId] - Get a single bucket
export async function GET(
  request: Request,
  { params }: { params: Promise<{ bucketId: string }> }
) {
  try {
    const { bucketId } = await params
    await rateLimit('api', 50)
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: bucket, error } = await supabase
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
        updated_at
      `)
      .eq('id', bucketId)
      .is('deleted_at', null)
      .single()

    if (error || !bucket) {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }

    // Verify user has access to this lab
    const { data: membership } = await supabase
      .from('lab_members')
      .select('id')
      .eq('lab_id', bucket.lab_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized to view this bucket' }, { status: 403 })
    }

    // Get project count
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('bucket_id', bucketId)
      .is('deleted_at', null)

    const bucketWithCount = {
      ...bucket,
      _count: {
        projects: projectCount || 0,
        studies: projectCount || 0, // Backwards compatibility
      }
    }

    return NextResponse.json({ bucket: bucketWithCount })

  } catch (error) {
    console.error('Bucket GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/buckets/[bucketId] - Update a bucket
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bucketId: string }> }
) {
  try {
    const { bucketId } = await params
    await rateLimit('api', 20)
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UpdateBucketSchema.parse(body)

    // Get bucket to check lab
    const { data: bucket, error: bucketError } = await supabase
      .from('buckets')
      .select('lab_id')
      .eq('id', bucketId)
      .single()

    if (bucketError || !bucket) {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }

    // Check permissions
    const { data: membership, error: membershipError } = await supabase
      .from('lab_members')
      .select('can_edit_all_projects, is_super_admin, is_admin')
      .eq('lab_id', bucket.lab_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this lab' }, { status: 403 })
    }

    if (!membership.can_edit_all_projects && !membership.is_super_admin && !membership.is_admin) {
      return NextResponse.json({ error: 'Insufficient permissions to edit buckets' }, { status: 403 })
    }

    // Update the bucket
    const { data: updatedBucket, error: updateError } = await supabase
      .from('buckets')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', bucketId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating bucket:', updateError)
      if (updateError.code === '23505') {
        return NextResponse.json({ error: 'A bucket with this name already exists in this lab' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to update bucket' }, { status: 500 })
    }

    return NextResponse.json({ bucket: updatedBucket })

  } catch (error) {
    console.error('Bucket PATCH error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/buckets/[bucketId] - Soft delete a bucket
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ bucketId: string }> }
) {
  try {
    const { bucketId } = await params
    await rateLimit('api', 10)
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get bucket to check lab
    const { data: bucket, error: bucketError } = await supabase
      .from('buckets')
      .select('lab_id')
      .eq('id', bucketId)
      .single()

    if (bucketError || !bucket) {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }

    // Check permissions
    const { data: membership, error: membershipError } = await supabase
      .from('lab_members')
      .select('can_delete_projects, is_super_admin, is_admin')
      .eq('lab_id', bucket.lab_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this lab' }, { status: 403 })
    }

    if (!membership.can_delete_projects && !membership.is_super_admin && !membership.is_admin) {
      return NextResponse.json({ error: 'Insufficient permissions to delete buckets' }, { status: 403 })
    }

    // Check if bucket has projects
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('bucket_id', bucketId)
      .is('deleted_at', null)

    if (projectCount && projectCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete bucket with active projects. Please move or delete projects first.' 
      }, { status: 400 })
    }

    // Soft delete the bucket
    const { error: deleteError } = await supabase
      .from('buckets')
      .update({ 
        deleted_at: new Date().toISOString() 
      })
      .eq('id', bucketId)

    if (deleteError) {
      console.error('Error deleting bucket:', deleteError)
      return NextResponse.json({ error: 'Failed to delete bucket' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Bucket DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}