'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Beaker,
  FlaskConical,
  FolderOpen,
  CheckCircle2,
  Calendar,
  Plus,
  Eye,
  CircleDot,
  AlertCircle,
  Building2,
  Users,
  X,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface Lab {
  id: string
  name: string
  description?: string
}

interface Study {
  id: string
  title: string
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED'
}

interface User {
  id: string
  email: string
}

interface DashboardData {
  selectedLab: Lab | null
  labCount: number
  studyCount: number
  bucketCount: number
  taskStats: {
    total: number
    completed: number
    inProgress: number
    urgent: number
  }
  studies?: Study[]
  completionPercentage: number
  recentMeetings?: any[]
  upcomingDeadlines?: any[]
  recentTasks?: any[]
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog states
  const [showCreateLab, setShowCreateLab] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [creating, setCreating] = useState(false)
  
  // Form states
  const [labForm, setLabForm] = useState({ name: '', description: '' })
  const [projectForm, setProjectForm] = useState({ title: '', description: '' })
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        router.push('/auth/signin')
        return
      }

      setUser(authUser as any)

      // Ensure user profile exists (create if needed)
      try {
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', authUser.id)
          .single()

        if (profileCheckError && profileCheckError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('Creating user profile for:', authUser.email)
          const { error: createProfileError } = await supabase
            .from('user_profiles')
            .insert({
              id: authUser.id,
              email: authUser.email!,
              first_name: authUser.user_metadata?.first_name || null,
              last_name: authUser.user_metadata?.last_name || null,
              full_name: authUser.user_metadata?.full_name || 
                        (authUser.user_metadata?.first_name && authUser.user_metadata?.last_name
                          ? `${authUser.user_metadata.first_name} ${authUser.user_metadata.last_name}`
                          : null),
              avatar_url: authUser.user_metadata?.avatar_url || null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (createProfileError) {
            console.error('Failed to create profile:', createProfileError)
          } else {
            console.log('✅ User profile created successfully')
          }
        }
      } catch (error) {
        console.error('Profile creation error:', error)
        // Don't block dashboard load
      }

      // Get user's labs
      const { data: userLabs, error: labError } = await supabase
        .from('lab_members')
        .select(`
          id,
          lab_role,
          labs!inner (
            id,
            name,
            description
          )
        `)
        .eq('user_id', authUser.id)

      if (labError) throw labError

      const labsArray = Array.isArray(userLabs?.[0]?.labs) ? userLabs[0].labs : (userLabs?.[0]?.labs ? [userLabs[0].labs] : [])
      let selectedLab = labsArray[0]
      
      if (!selectedLab) {
        // No labs found, show onboarding/welcome page instead of error
        console.log('No lab memberships found for user')
        setData({
          selectedLab: null,
          labCount: 0,
          studyCount: 0,
          bucketCount: 0,
          taskStats: { total: 0, completed: 0, inProgress: 0, urgent: 0 },
          completionPercentage: 0,
          recentMeetings: [],
          upcomingDeadlines: [],
          recentTasks: []
        })
        setLoading(false)
        return
      }

      const labId = selectedLab.id

      // Fetch all dashboard data in parallel
      const [
        { count: labCount },
        { data: studies, count: studyCount },
        { count: bucketCount },
        { data: tasks }
      ] = await Promise.all([
        // Count labs
        supabase
          .from('lab_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id),
        
        // Get recent studies
        supabase
          .from('studies')
          .select('id, title, status', { count: 'exact' })
          .eq('lab_id', labId)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Count buckets
        supabase
          .from('project_buckets')
          .select('*', { count: 'exact', head: true })
          .eq('lab_id', labId),
        
        // Get tasks for stats
        supabase
          .from('tasks')
          .select('id, status, priority')
          .eq('lab_id', labId)
      ])

      const taskStats = {
        total: tasks?.length || 0,
        completed: tasks?.filter(t => t.status === 'DONE').length || 0,
        inProgress: tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0,
        urgent: tasks?.filter(t => t.priority === 'URGENT').length || 0,
      }

      const completionPercentage = taskStats.total > 0 
        ? Math.round((taskStats.completed / taskStats.total) * 100) 
        : 0

      setData({
        selectedLab: selectedLab as any,
        labCount: labCount || 0,
        studyCount: studyCount || 0,
        bucketCount: bucketCount || 0,
        taskStats,
        studies: studies || [],
        completionPercentage
      })

    } catch (err: any) {
      console.error('Dashboard error:', err)
      setError(err.message || 'Failed to load dashboard')
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const createLab = async () => {
    if (!user || !labForm.name.trim()) return

    try {
      setCreating(true)
      
      // Call the database function to create lab
      const { data, error } = await supabase.rpc('create_lab', {
        p_name: labForm.name.trim(),
        p_description: labForm.description.trim() || null
      })

      if (error) throw error

      toast.success('Lab created successfully!')
      setShowCreateLab(false)
      setLabForm({ name: '', description: '' })
      
      // Reload dashboard data
      await loadDashboardData()

    } catch (err: any) {
      console.error('Create lab error:', err)
      toast.error(err.message || 'Failed to create lab')
    } finally {
      setCreating(false)
    }
  }

  const createProject = async () => {
    if (!user || !data?.selectedLab || !projectForm.title.trim()) return

    try {
      setCreating(true)
      
      // Call the database function to create study
      const { data: studyData, error } = await supabase
        .from('studies')
        .insert({
          title: projectForm.title.trim(),
          description: projectForm.description.trim() || null,
          lab_id: data.selectedLab.id,
          status: 'PLANNING'
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Project created successfully!')
      setShowCreateProject(false)
      setProjectForm({ title: '', description: '' })
      
      // Reload dashboard data
      await loadDashboardData()

    } catch (err: any) {
      console.error('Create project error:', err)
      toast.error(err.message || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'PLANNING': return 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
      case 'ON_HOLD': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
          <p className="text-slate-400">{error || 'Failed to load dashboard'}</p>
          <button 
            onClick={loadDashboardData}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Show welcome screen if no lab membership
  if (data && !data.selectedLab) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center space-y-6">
          <div className="card-slack p-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Welcome to Lab Sync! 🔬
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Your account has been created successfully. To get started, you need to join a research lab or create your own.
            </p>
            
            <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
              <div className="card-slack p-6 text-center">
                <h3 className="text-xl font-semibold text-foreground mb-3">Join RHEDAS Lab</h3>
                <p className="text-muted-foreground mb-4">
                  Join the Rush Health Equity Data Analytics Studio to collaborate on health equity research.
                </p>
                <Button 
                  className="btn-slack-primary w-full"
                  onClick={() => {
                    // Add user to RHEDAS lab
                    const addToRHEDAS = async () => {
                      try {
                        const { error } = await supabase
                          .from('lab_members')
                          .insert({
                            lab_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                            user_id: user?.id,
                            role: 'data_scientist',
                            is_active: true,
                            can_create_studies: true,
                            can_edit_studies: true,
                            can_manage_tasks: true,
                            can_view_reports: true,
                            can_export_data: true,
                            joined_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          })
                        
                        if (!error) {
                          toast.success('Successfully joined RHEDAS lab!')
                          loadDashboardData()
                        } else {
                          toast.error('Failed to join lab. Please try again.')
                        }
                      } catch (err) {
                        toast.error('Failed to join lab. Please try again.')
                      }
                    }
                    addToRHEDAS()
                  }}
                >
                  Join RHEDAS Lab
                </Button>
              </div>
              
              <div className="card-slack p-6 text-center">
                <h3 className="text-xl font-semibold text-foreground mb-3">Create Your Lab</h3>
                <p className="text-muted-foreground mb-4">
                  Create your own research lab and invite team members to collaborate.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/dashboard/labs')}
                >
                  Create New Lab
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {data.selectedLab?.name} Dashboard
            </h1>
            <p className="text-slate-400">
              Manage research activities and collaborate with your team
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              className="flex items-center px-4 py-2 border border-slate-600 hover:bg-slate-800 text-white rounded-lg transition-colors"
              onClick={() => router.push('/dashboard/calendar')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </button>
            <button 
              onClick={() => setShowCreateProject(true)}
              className="flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-5 h-5 text-violet-400" />
            <span className="text-xs text-slate-500 font-medium">RESEARCH LABS</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{data.labCount}</div>
          <div className="text-sm text-slate-400">Active laboratories</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <FlaskConical className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-slate-500 font-medium">ACTIVE STUDIES</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{data.studyCount}</div>
          <div className="text-sm text-slate-400">Research projects</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-slate-500 font-medium">PROJECT BUCKETS</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{data.bucketCount}</div>
          <div className="text-sm text-slate-400">Organized collections</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-xs text-slate-500 font-medium">TASK PROGRESS</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {data.taskStats.completed}/{data.taskStats.total}
          </div>
          <div className="flex items-center">
            <div className="text-sm text-slate-400 mr-2">Completion</div>
            <div className="text-sm text-green-400 font-medium">{data.completionPercentage}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Studies - 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Studies</h2>
              <button 
                onClick={() => router.push('/dashboard/studies')}
                className="flex items-center text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Eye className="w-4 h-4 mr-1" />
                View All
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-400 mb-4">
                Latest research activities in your lab
              </p>
              {data.studies && data.studies.length > 0 ? (
                <div className="space-y-3">
                  {data.studies.map((study) => (
                    <div key={study.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:bg-slate-900/70 transition-colors">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white mb-1">{study.title}</p>
                        <p className="text-xs text-slate-500">Research study</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(study.status)}`}>
                          {study.status}
                        </span>
                        <button className="p-1 text-slate-400 hover:text-white transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FlaskConical className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 mb-4">No studies yet</p>
                  <button 
                    onClick={() => setShowCreateProject(true)}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors text-sm"
                  >
                    Create First Study
                  </button>
                </div>
              )}
              
              {data.studies && data.studies.length > 0 && (
                <button 
                  onClick={() => router.push('/dashboard/studies')}
                  className="mt-4 w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  View all {data.studyCount} studies →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Task Overview - 1 column */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Task Overview</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-400 mb-6">
                Track your progress across all projects
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CircleDot className="w-4 h-4 text-amber-400 mr-3" />
                    <span className="text-sm text-white">In Progress</span>
                  </div>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                    {data.taskStats.inProgress}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mr-3" />
                    <span className="text-sm text-white">Completed</span>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                    {data.taskStats.completed}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-red-400 mr-3" />
                    <span className="text-sm text-white">Urgent</span>
                  </div>
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full font-medium">
                    {data.taskStats.urgent}
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Overall Progress</span>
                  <span className="text-xs text-violet-400 font-medium">{data.completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-violet-600 to-violet-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${data.completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 space-y-2">
                <button 
                  onClick={() => router.push('/dashboard/tasks')}
                  className="w-full py-2 text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-all"
                >
                  View All Tasks →
                </button>
                <button 
                  onClick={() => setShowCreateLab(true)}
                  className="w-full py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                >
                  Create New Lab
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Lab Dialog */}
      {showCreateLab && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create New Lab</h3>
              <button 
                onClick={() => setShowCreateLab(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                disabled={creating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Lab Name *
                </label>
                <input
                  type="text"
                  value={labForm.name}
                  onChange={(e) => setLabForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter lab name"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  disabled={creating}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={labForm.description}
                  onChange={(e) => setLabForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter lab description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  disabled={creating}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateLab(false)}
                className="flex-1 px-4 py-2 border border-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={createLab}
                disabled={!labForm.name.trim() || creating}
                className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Lab'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Dialog */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create New Project</h3>
              <button 
                onClick={() => setShowCreateProject(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                disabled={creating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter project title"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  disabled={creating}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter project description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  disabled={creating}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateProject(false)}
                className="flex-1 px-4 py-2 border border-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!projectForm.title.trim() || creating}
                className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}