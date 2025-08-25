import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import LabOverview from '@/components/dashboard/labs/lab-overview'
import LabMembers from '@/components/dashboard/labs/lab-members'
import LabSettings from '@/components/dashboard/labs/lab-settings'
import LabWorkspaceClient from './lab-workspace-client'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Users, FolderOpen, Beaker } from 'lucide-react'

export default async function LabDetailsPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/signin')
  }

  // Get user profile for header
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Check if user has access to this lab
  const { data: membership, error: memberError } = await supabase
    .from('lab_members')
    .select('role, permissions')
    .eq('lab_id', labId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (memberError || !membership) {
    redirect('/dashboard')
  }

  // Get lab details
  const { data: lab, error: labError } = await supabase
    .from('labs')
    .select('*')
    .eq('id', labId)
    .single()

  if (labError || !lab) {
    redirect('/dashboard')
  }

  // Get lab statistics
  const { count: memberCount } = await supabase
    .from('lab_members')
    .select('*', { count: 'exact', head: true })
    .eq('lab_id', labId)
    .eq('is_active', true)

  // Get project count through buckets  
  const { data: buckets } = await supabase
    .from('buckets')
    .select('id')
    .eq('lab_id', labId)
  
  let studyCount = 0
  if (buckets && buckets.length > 0) {
    const bucketIds = buckets.map(b => b.id)
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('bucket_id', bucketIds)
    studyCount = count || 0
  }

  const labWithStats = {
    ...lab,
    userRole: membership.role,
    userPermissions: membership.permissions,
    memberCount: memberCount || 0,
    studyCount: studyCount || 0,
    bucketCount: buckets?.length || 0,
  }

  const permissions = membership.permissions as Record<string, boolean>
  const canManageMembers = permissions?.can_manage_members || false
  const canManageLab = permissions?.can_manage_lab || false

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <DashboardHeader 
        user={{
          email: user.email,
          name: profile?.full_name || user.email?.split('@')[0]
        }} 
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lab Header */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{lab.name}</h1>
              <p className="text-muted-foreground mt-2">{lab.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={membership.role === 'owner' ? 'default' : 'secondary'}>
                {formatRole(membership.role)}
              </Badge>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${lab.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-muted-foreground">
                  {lab.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="font-medium text-foreground">{labWithStats.memberCount}</span>
              <span>members</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Beaker className="h-4 w-4" />
              <span className="font-medium text-foreground">{labWithStats.studyCount}</span>
              <span>studies</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FolderOpen className="h-4 w-4" />
              <span className="font-medium text-foreground">{labWithStats.bucketCount}</span>
              <span>buckets</span>
            </div>
          </div>
        </Card>

        {/* Tab Navigation */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/30 border-border/50">
            <TabsTrigger value="overview">
              Overview
            </TabsTrigger>
            {canManageMembers && (
              <TabsTrigger value="members">
                Members
              </TabsTrigger>
            )}
            {canManageLab && (
              <TabsTrigger value="settings">
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <LabOverview lab={labWithStats} />
            <LabWorkspaceClient labId={labId} />
          </TabsContent>

          {canManageMembers && (
            <TabsContent value="members" className="space-y-6">
              <LabMembers labId={labId} userRole={membership.role} />
            </TabsContent>
          )}

          {canManageLab && (
            <TabsContent value="settings" className="space-y-6">
              <LabSettings lab={labWithStats} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}