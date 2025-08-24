"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Clock, AlertTriangle, Plus, Search, ArrowLeft, User } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: string
  priority: string
  assigned_to: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

interface Project {
  id: string
  name: string
  bucket_id: string
}

interface Bucket {
  id: string
  name: string
  color: string | null
}

interface Lab {
  id: string
  name: string
  description: string | null
}

interface LabMember {
  user_id: string
  role: string
  user_profiles: {
    id: string
    email: string
    full_name: string | null
    first_name: string | null
    last_name: string | null
  } | null
}

interface TasksPageClientProps {
  lab: Lab
  buckets: Bucket[]
  projects: Project[]
  initialTasks: Task[]
  labMembers: LabMember[]
  userPermissions: {
    canCreate: boolean
    canAssign: boolean
    canEdit: boolean
    canDelete: boolean
    canView: boolean
  }
}

const statusIcons = {
  'todo': Clock,
  'in_progress': AlertTriangle,
  'review': Clock,
  'done': CheckCircle2,
  'blocked': AlertTriangle,
  'cancelled': AlertTriangle
}

const statusColors = {
  'todo': 'bg-gray-500',
  'in_progress': 'bg-blue-500',
  'review': 'bg-yellow-500', 
  'done': 'bg-green-500',
  'blocked': 'bg-red-500',
  'cancelled': 'bg-gray-600'
}

const priorityColors = {
  'low': 'bg-gray-500',
  'medium': 'bg-blue-500',
  'high': 'bg-orange-500',
  'urgent': 'bg-red-500'
}

export default function TasksPageClient({ 
  lab, 
  buckets, 
  projects, 
  initialTasks, 
  labMembers,
  userPermissions 
}: TasksPageClientProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterProject, setFilterProject] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterAssignee, setFilterAssignee] = useState<string>("all")

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesProject = filterProject === "all" || task.project_id === filterProject
    const matchesStatus = filterStatus === "all" || task.status === filterStatus
    const matchesAssignee = filterAssignee === "all" || task.assigned_to === filterAssignee
    
    return matchesSearch && matchesProject && matchesStatus && matchesAssignee
  })

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project'
  }

  const getBucketForProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return buckets.find(b => b.id === project?.bucket_id)
  }

  const getMemberName = (userId: string) => {
    const member = labMembers.find(m => m.user_id === userId)
    if (!member || !member.user_profiles) return 'Unknown'
    
    const profile = member.user_profiles
    return profile.full_name || 
           `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
           profile.email || 'Unknown'
  }

  const getTaskStats = () => {
    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
    }
    return stats
  }

  const stats = getTaskStats()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href={`/dashboard/labs/${lab.id}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {lab.name} - Tasks
            </h1>
            <p className="text-muted-foreground">
              Track and manage tasks across all lab projects
            </p>
          </div>
        </div>
        
        {userPermissions.canCreate && (
          <Button 
            onClick={() => router.push(`/dashboard/labs/${lab.id}/tasks/new`)}
            className="btn-slack-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        )}
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="card-slack">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </CardContent>
        </Card>
        <Card className="card-slack">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.in_progress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card className="card-slack">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card className="card-slack">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.todo}</div>
            <div className="text-sm text-muted-foreground">To Do</div>
          </CardContent>
        </Card>
        <Card className="card-slack">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.overdue}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {labMembers.map(member => (
              <SelectItem key={member.user_id} value={member.user_id}>
                {member.user_profiles?.full_name || member.user_profiles?.email || 'Unknown'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card className="card-slack p-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium text-foreground mb-2">
            {tasks.length === 0 ? 'No Tasks Yet' : 'No Matching Tasks'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {tasks.length === 0 
              ? 'Create your first task to start tracking work in this lab'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {userPermissions.canCreate && tasks.length === 0 && (
            <Button 
              onClick={() => router.push(`/dashboard/labs/${lab.id}/tasks/new`)}
              className="btn-slack-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Task
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const StatusIcon = statusIcons[task.status as keyof typeof statusIcons] || Clock
            const bucket = getBucketForProject(task.project_id)
            
            return (
              <Card key={task.id} className="card-slack hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <StatusIcon className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-lg font-medium text-foreground truncate">
                          {task.title}
                        </h3>
                        <Badge 
                          variant="outline"
                          className={`text-xs text-white ${statusColors[task.status as keyof typeof statusColors] || 'bg-gray-500'}`}
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={`text-xs text-white ${priorityColors[task.priority as keyof typeof priorityColors] || 'bg-gray-500'}`}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <span>Project:</span>
                          <span className="font-medium">{getProjectName(task.project_id)}</span>
                        </div>
                        {bucket && (
                          <div className="flex items-center space-x-1">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: bucket.color || '#6b7280' }}
                            />
                            <span>{bucket.name}</span>
                          </div>
                        )}
                        {task.assigned_to && (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{getMemberName(task.assigned_to)}</span>
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center space-x-1">
                            <span>Due:</span>
                            <span className={
                              new Date(task.due_date) < new Date() && task.status !== 'done'
                                ? 'text-red-400 font-medium'
                                : ''
                            }>
                              {format(new Date(task.due_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push(`/dashboard/labs/${lab.id}/tasks/${task.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}