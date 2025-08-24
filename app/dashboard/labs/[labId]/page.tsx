import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LabOverview from '@/components/dashboard/labs/lab-overview'
import LabMembers from '@/components/dashboard/labs/lab-members'
import LabSettings from '@/components/dashboard/labs/lab-settings'

export default async function LabDetailsPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/signin')
  }

  // Check if user has access to this lab
  const { data: membership, error: memberError } = await supabase
    .from('lab_members')
    .select('role, permissions')
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
    .select('*')
    .eq('id', labId)
    .single()

  if (labError || !lab) {
    redirect('/dashboard/labs')
  }

  // Get lab statistics
  const { count: memberCount } = await supabase
    .from('lab_members')
    .select('*', { count: 'exact', head: true })
    .eq('lab_id', labId)
    .eq('is_active', true)

  const { count: studyCount } = await supabase
    .from('studies')
    .select('*', { count: 'exact', head: true })
    .eq('lab_id', labId)

  const labWithStats = {
    ...lab,
    userRole: membership.role,
    userPermissions: membership.permissions,
    memberCount: memberCount || 0,
    studyCount: studyCount || 0,
    bucketCount: 0, // Placeholder
  }

  const permissions = membership.permissions as Record<string, boolean>
  const canManageMembers = permissions?.can_manage_members || false
  const canManageLab = permissions?.can_manage_lab || false

  return (
    <div className="p-8">
      {/* Lab Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{lab.name}</h1>
            <p className="text-slate-400 mt-2">{lab.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${lab.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-slate-400">
              {lab.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center gap-6 mt-4 text-sm text-slate-400">
          <div className="flex items-center gap-1">
            <span className="font-medium text-white">{labWithStats.memberCount}</span>
            <span>members</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-white">{labWithStats.studyCount}</span>
            <span>studies</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-white">{labWithStats.bucketCount}</span>
            <span>buckets</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Your role:</span>
            <span className="font-medium text-violet-400">
              {membership.role.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-violet-600">
            Overview
          </TabsTrigger>
          {canManageMembers && (
            <TabsTrigger value="members" className="data-[state=active]:bg-violet-600">
              Members
            </TabsTrigger>
          )}
          {canManageLab && (
            <TabsTrigger value="settings" className="data-[state=active]:bg-violet-600">
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <LabOverview lab={labWithStats} />
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
    </div>
  )
}