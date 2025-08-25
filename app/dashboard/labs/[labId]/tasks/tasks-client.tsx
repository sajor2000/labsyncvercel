"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckCircle2, Clock, AlertTriangle, Plus, Search, ArrowLeft, User, LayoutGrid, List, Edit2, Trash2, Calendar } from "lucide-react"
import { KanbanBoard } from "@/components/dashboard/kanban-board"
import { format } from "date-fns"
import { toast } from "sonner"
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
  title: string
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
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterProject, setFilterProject] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterAssignee, setFilterAssignee] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list")
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    status: 'todo',
    priority: 'medium',
    assigned_to: '',
    due_date: ''
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      project_id: '',
      status: 'todo',
      priority: 'medium',
      assigned_to: '',
      due_date: ''
    })
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.project_id) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          project_id: formData.project_id,
          status: formData.status,
          priority: formData.priority,
          assigned_to: formData.assigned_to || null,
          due_date: formData.due_date || null
        })
        .select()
        .single()

      if (error) throw error

      setTasks(prev => [data, ...prev])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success('Task created successfully!')
      
    } catch (error: any) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask || !formData.title.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          project_id: formData.project_id,
          status: formData.status,
          priority: formData.priority,
          assigned_to: formData.assigned_to || null,
          due_date: formData.due_date || null
        })
        .eq('id', selectedTask.id)
        .select()
        .single()

      if (error) throw error

      setTasks(prev => prev.map(t => t.id === selectedTask.id ? data : t))
      setIsEditDialogOpen(false)
      setSelectedTask(null)
      resetForm()
      toast.success('Task updated successfully!')
      
    } catch (error: any) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!selectedTask) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', selectedTask.id)

      if (error) throw error

      setTasks(prev => prev.filter(t => t.id !== selectedTask.id))
      setIsDeleteDialogOpen(false)
      setSelectedTask(null)
      toast.success('Task deleted successfully!')
      
    } catch (error: any) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (task: Task) => {
    setSelectedTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      project_id: task.project_id,
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      due_date: task.due_date || ''
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (task: Task) => {
    setSelectedTask(task)
    setIsDeleteDialogOpen(true)
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesProject = filterProject === "all" || task.project_id === filterProject
    const matchesStatus = filterStatus === "all" || task.status === filterStatus
    const matchesAssignee = filterAssignee === "all" || task.assigned_to === filterAssignee
    
    return matchesSearch && matchesProject && matchesStatus && matchesAssignee
  })

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.title || 'Unknown Project'
  }

  const getBucketForProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return buckets.find(b => b.id === project?.bucket_id)
  }

  const getMemberName = (userId: string) => {
    const member = labMembers.find(m => m.user_id === userId)
    if (!member || !member.user_profiles) return 'Unassigned'
    
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
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "kanban")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" className="flex items-center space-x-1">
                <List className="h-3 w-3" />
                <span>List</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center space-x-1">
                <LayoutGrid className="h-3 w-3" />
                <span>Board</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {userPermissions.canCreate && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-slack-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to track work in your lab
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <Label htmlFor="task-title">Task Title *</Label>
                    <Input
                      id="task-title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Review manuscript draft"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea
                      id="task-description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Provide details about this task..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="task-project">Project *</Label>
                    <Select 
                      value={formData.project_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                    >
                      <SelectTrigger id="task-project">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="task-status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger id="task-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="task-priority">Priority</Label>
                      <Select 
                        value={formData.priority} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger id="task-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="task-assignee">Assign To</Label>
                      <Select 
                        value={formData.assigned_to} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
                      >
                        <SelectTrigger id="task-assignee">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {labMembers.map((member) => (
                            <SelectItem key={member.user_id} value={member.user_id}>
                              {getMemberName(member.user_id)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="task-due">Due Date</Label>
                      <Input
                        id="task-due"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Task'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
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
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
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
            {labMembers.map((member) => (
              <SelectItem key={member.user_id} value={member.user_id}>
                {getMemberName(member.user_id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Display */}
      {viewMode === "list" ? (
        filteredTasks.length === 0 ? (
          <Card className="card-slack p-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">
              {tasks.length === 0 ? 'No Tasks Yet' : 'No Matching Tasks'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {tasks.length === 0 
                ? 'Create your first task to start tracking work'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="card-slack">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-foreground">{task.title}</h3>
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
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{getProjectName(task.project_id)}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {getMemberName(task.assigned_to || '')}
                        </span>
                        {task.due_date && (
                          <>
                            <span>•</span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(task.due_date), 'MMM d, yyyy')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {(userPermissions.canEdit || userPermissions.canDelete) && (
                      <div className="flex space-x-2">
                        {userPermissions.canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(task)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {userPermissions.canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteDialog(task)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <KanbanBoard
          study_id={selectedProject || ''}
          lab_id={lab.id}
          onTaskClick={(task) => openEditDialog(task)}
        />
      )}

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTask} className="space-y-4">
            <div>
              <Label htmlFor="edit-task-title">Task Title *</Label>
              <Input
                id="edit-task-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Review manuscript draft"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-task-description">Description</Label>
              <Textarea
                id="edit-task-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide details about this task..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-task-project">Project *</Label>
              <Select 
                value={formData.project_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
              >
                <SelectTrigger id="edit-task-project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-task-status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="edit-task-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-task-priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger id="edit-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-task-assignee">Assign To</Label>
                <Select 
                  value={formData.assigned_to} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger id="edit-task-assignee">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {labMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {getMemberName(member.user_id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-task-due">Due Date</Label>
                <Input
                  id="edit-task-due"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Task Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="py-4">
              <p className="font-medium text-foreground">{selectedTask.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Project: {getProjectName(selectedTask.project_id)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTask}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}