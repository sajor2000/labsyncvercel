/**
 * Simple lab API - GET, PATCH, DELETE operations
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    const { labId } = await params
    const supabase = await createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get lab and check membership
    const { data: lab, error } = await supabase
      .from('labs')
      .select('*')
      .eq('id', labId)
      .single()
    
    if (error || !lab) {
      return NextResponse.json({ error: 'Lab not found' }, { status: 404 })
    }
    
    const { data: membership } = await supabase
      .from('lab_members')
      .select('*')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .single()
    
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Get simple stats
    const { count: memberCount } = await supabase
      .from('lab_members')
      .select('*', { count: 'exact', head: true })
      .eq('lab_id', labId)
    
    const { data: buckets } = await supabase
      .from('buckets')
      .select('id')
      .eq('lab_id', labId)
      .is('deleted_at', null)
    
    let projectCount = 0
    if (buckets && buckets.length > 0) {
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('bucket_id', buckets.map(b => b.id))
        .is('deleted_at', null)
      projectCount = count || 0
    }
    
    return NextResponse.json({
      lab,
      membership,
      stats: {
        memberCount: memberCount || 0,
        bucketCount: buckets?.length || 0,
        projectCount
      }
    })
    
  } catch (error) {
    console.error('Lab GET error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    const { labId } = await params
    const supabase = await createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check permissions
    const { data: membership } = await supabase
      .from('lab_members')
      .select('role, can_manage_members')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .single()
    
    if (!membership || (!membership.can_manage_members && membership.role !== 'principal_investigator')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    
    // Update lab
    const body = await request.json()
    const { name, description } = body
    
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Invalid lab name' }, { status: 400 })
    }
    
    const { data: lab, error } = await supabase
      .from('labs')
      .update({
        name,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', labId)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
    
    return NextResponse.json({ lab })
    
  } catch (error) {
    console.error('Lab PATCH error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    const { labId } = await params
    const supabase = await createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Only PI can delete
    const { data: membership } = await supabase
      .from('lab_members')
      .select('role')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .single()
    
    if (!membership || membership.role !== 'principal_investigator') {
      return NextResponse.json({ error: 'Only PI can delete lab' }, { status: 403 })
    }
    
    // Delete lab (cascades to all related data)
    const { error } = await supabase
      .from('labs')
      .delete()
      .eq('id', labId)
    
    if (error) {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Lab DELETE error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}