import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { 
  Calendar, 
  Users, 
  ClipboardList, 
  Flask, 
  Bell, 
  TrendingUp,
  Mic,
  Brain,
  Mail
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/signin')
  }

  // Fetch user's labs
  const { data: userLabs } = await supabase
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
    .eq('user_id', user.id)

  // Fetch recent meetings
  const { data: recentMeetings } = await supabase
    .from('standup_meetings')
    .select('id, title, date, ai_processing_status')
    .in('lab_id', userLabs?.map(l => l.labs.id) || [])
    .order('date', { ascending: false })
    .limit(5)

  // Fetch pending tasks
  const { data: pendingTasks } = await supabase
    .from('tasks')
    .select('id, title, due_date, priority, status')
    .eq('assignee_id', user.id)
    .in('status', ['TODO', 'IN_PROGRESS'])
    .order('due_date', { ascending: true })
    .limit(5)

  // Count total labs, meetings, and tasks
  const labCount = userLabs?.length || 0
  const meetingCount = recentMeetings?.length || 0
  const taskCount = pendingTasks?.length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.user_metadata?.first_name || 'Researcher'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's an overview of your medical research lab activities
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Flask className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Labs</p>
                <p className="text-2xl font-semibold text-gray-900">{labCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Meetings</p>
                <p className="text-2xl font-semibold text-gray-900">{meetingCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <ClipboardList className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                <p className="text-2xl font-semibold text-gray-900">{taskCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Productivity</p>
                <p className="text-2xl font-semibold text-gray-900">92%</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Features Highlight */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-4">AI-Powered Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start">
              <Mic className="w-6 h-6 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Meeting Transcription</h3>
                <p className="text-sm text-blue-100">
                  Automatic transcription with OpenAI Whisper
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Brain className="w-6 h-6 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Task Extraction</h3>
                <p className="text-sm text-blue-100">
                  GPT-4o-mini identifies action items from meetings
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="w-6 h-6 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Smart Emails</h3>
                <p className="text-sm text-blue-100">
                  AI-generated professional notifications
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Meetings */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Meetings</h2>
            </div>
            <div className="p-6">
              {recentMeetings && recentMeetings.length > 0 ? (
                <ul className="space-y-3">
                  {recentMeetings.map((meeting) => (
                    <li key={meeting.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{meeting.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(meeting.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        meeting.ai_processing_status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800'
                          : meeting.ai_processing_status === 'PROCESSING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {meeting.ai_processing_status || 'PENDING'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No recent meetings</p>
              )}
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pending Tasks</h2>
            </div>
            <div className="p-6">
              {pendingTasks && pendingTasks.length > 0 ? (
                <ul className="space-y-3">
                  {pendingTasks.map((task) => (
                    <li key={task.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">
                          Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No deadline'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.priority === 'URGENT' 
                          ? 'bg-red-100 text-red-800'
                          : task.priority === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : task.priority === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No pending tasks</p>
              )}
            </div>
          </div>

          {/* Your Labs */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Your Labs</h2>
            </div>
            <div className="p-6">
              {userLabs && userLabs.length > 0 ? (
                <ul className="space-y-3">
                  {userLabs.map((membership) => (
                    <li key={membership.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{membership.labs.name}</p>
                        <p className="text-xs text-gray-500">{membership.labs.description}</p>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {membership.lab_role?.replace('_', ' ')}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">Not a member of any labs yet</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </button>
                <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Create Task
                </button>
                <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <Mic className="w-4 h-4 mr-2" />
                  Record Standup
                </button>
                <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <Users className="w-4 h-4 mr-2" />
                  Invite Member
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}