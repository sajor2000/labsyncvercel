'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, useSensor, useSensors, PointerSensor, KeyboardSensor, closestCorners } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeleteConfirmation } from '@/components/ui/delete-confirmation-dialog'
import { cn } from '@/lib/utils'
import { Plus, MoreVertical, Clock, Calendar, Flag, User, CheckCircle2, Circle, AlertCircle, Pause, Filter, Search, ChevronRight, ChevronDown, Layers, Hash, GripVertical } from 'lucide-react'
import type { Task } from '@/lib/db/types'
import { useTasks } from '@/lib/hooks/use-data'
import { format } from 'date-fns'
import { toast } from 'sonner'

// ============================================
// Types
// ============================================

interface KanbanColumn {
  id: Task['status']
  title: string
  color: string
  icon: React.ReactNode
}

interface KanbanBoardProps {
  study_id: string // Keep study_id for UI compatibility (maps to project_id in backend)
  lab_id: string
  onTaskClick?: (task: Task) => void
  className?: string
}

// ============================================
// Constants
// ============================================

const COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-500', icon: <Circle className="w-4 h-4" /> },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500', icon: <Clock className="w-4 h-4" /> },
  { id: 'done', title: 'Done', color: 'bg-green-500', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'archived', title: 'Archived', color: 'bg-gray-500', icon: <AlertCircle className="w-4 h-4" /> },
]

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

// ============================================
// Draggable Task Card Component
// ============================================

interface TaskCardProps {
  task: Task
  isDragging?: boolean
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

function TaskCard({ task, isDragging, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Removed subtask support - not in simplified schema

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "opacity-50"
      )}
    >
      <Card className="cursor-move hover:shadow-lg transition-all duration-200 border-l-4"
        style={{ borderLeftColor: task.priority ? (task.priority === 'low' ? '#64748b' : task.priority === 'medium' ? '#3b82f6' : task.priority === 'high' ? '#f59e0b' : '#ef4444') : '#3b82f6' }}
      >
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 ml-6">
              <CardTitle className="text-sm font-medium line-clamp-2">
                {task.title}
              </CardTitle>
              {task.description && (
                <CardDescription className="text-xs mt-1 line-clamp-2">
                  {task.description}
                </CardDescription>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(task.id)}
                  className="text-destructive"
                >
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            {task.priority && (
              <Badge variant="outline" className={cn("text-xs", PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS])}>
                <Flag className="w-3 h-3 mr-1" />
                {task.priority}
              </Badge>
            )}
            
            {task.due_date && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                {format(new Date(task.due_date), 'MMM d')}
              </Badge>
            )}
            
            {/* Tags removed from simplified schema */}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Simplified - removed subtasks, assignee display, and hours tracking */}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// Column Component
// ============================================

interface ColumnProps {
  column: KanbanColumn
  tasks: Task[]
  onAddTask: (status: Task['status']) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (id: string) => void
}

function Column({ column, tasks, onAddTask, onEditTask, onDeleteTask }: ColumnProps) {
  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks])
  
  return (
    <div className="flex flex-col h-full min-w-[320px] max-w-[380px]">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={cn("p-1 rounded", column.color, "text-white")}>
            {column.icon}
          </div>
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 px-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 pb-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
            
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <div className={cn("p-3 rounded-full mb-3", column.color, "text-white opacity-20")}>
                  {column.icon}
                </div>
                <p className="text-sm">No tasks</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => onAddTask(column.id)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add task
                </Button>
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  )
}

// ============================================
// Main Kanban Board Component
// ============================================

export function KanbanBoard({ study_id, lab_id, onTaskClick, className }: KanbanBoardProps) {
  const { tasks, loading, addTask, editTask, removeTask } = useTasks(study_id)
  const { showDeleteConfirmation, DeleteDialog } = useDeleteConfirmation()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<Task['priority'] | 'ALL'>('ALL')
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [addingToColumn, setAddingToColumn] = useState<Task['status'] | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  
  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped = COLUMNS.reduce((acc, column) => {
      acc[column.id as NonNullable<Task['status']>] = []
      return acc
    }, {} as Record<NonNullable<Task['status']>, Task[]>)
    
    tasks
      .filter(task => {
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false
        }
        if (filterPriority !== 'ALL' && task.priority !== filterPriority) {
          return false
        }
        return true
      })
      .forEach(task => {
        if (task.status && grouped[task.status]) {
          grouped[task.status].push(task)
        }
      })
    
    return grouped
  }, [tasks, searchQuery, filterPriority])
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }
    
    const activeTask = tasks.find(t => t.id === active.id)
    if (!activeTask) {
      setActiveId(null)
      return
    }
    
    // Find which column it was dropped into
    const overColumn = COLUMNS.find(col => col.id === over.id)
    if (overColumn && activeTask.status !== overColumn.id) {
      await editTask(activeTask.id, { status: overColumn.id })
    }
    
    setActiveId(null)
  }
  
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    
    if (!over) return
    
    const activeTask = tasks.find(t => t.id === active.id)
    const overTask = tasks.find(t => t.id === over.id)
    
    if (!activeTask) return
    
    // If dragging over another task, get its status
    if (overTask && activeTask.status !== overTask.status) {
      editTask(activeTask.id, { status: overTask.status })
    }
  }
  
  const handleAddTask = (status: Task['status']) => {
    setAddingToColumn(status)
    setIsAddingTask(true)
  }
  
  const handleCreateTask = async (data: any) => {
    if (!addingToColumn) return
    
    await addTask({
      ...data,
      status: addingToColumn
    })
    
    setIsAddingTask(false)
    setAddingToColumn(null)
  }
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }
  
  const handleUpdateTask = async (data: any) => {
    if (!editingTask) return
    
    await editTask(editingTask.id, data)
    setEditingTask(null)
  }
  
  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    
    // Simplified - no subtasks in new schema
    const hasSubtasks = false
    
    showDeleteConfirmation(
      {
        entityType: 'tasks',
        entityName: task.title,
        entityId: taskId,
        severity: hasSubtasks ? 'medium' : 'low',
        requireTypeName: hasSubtasks,
      },
      async () => {
        try {
          await removeTask(taskId)
          toast.success('Task deleted successfully')
        } catch (error) {
          toast.error('Failed to delete task')
          console.error('Delete task error:', error)
        }
      }
    )
  }
  
  if (loading) {
    return (
      <div className="flex gap-6 p-6">
        {COLUMNS.map(column => (
          <div key={column.id} className="min-w-[320px]">
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          
          <Select value={filterPriority || undefined} onValueChange={(v) => setFilterPriority(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {tasks.length} total tasks
          </Badge>
          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">
            {tasks.filter(t => t.status === 'done').length} completed
          </Badge>
        </div>
      </div>
      
      {/* Kanban Columns */}
      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="flex gap-6 p-6 h-full">
            {COLUMNS.map(column => (
              <Column
                key={column.id}
                column={column}
                tasks={tasksByStatus[column.id as NonNullable<Task['status']>] || []}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </div>
        </DndContext>
      </div>
      
      {/* Add Task Dialog */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task in the {addingToColumn} column
            </DialogDescription>
          </DialogHeader>
          
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setIsAddingTask(false)}
            defaultStatus={addingToColumn || 'todo'}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          
          {editingTask && (
            <TaskForm
              task={editingTask}
              onSubmit={handleUpdateTask}
              onCancel={() => setEditingTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      {DeleteDialog}
    </div>
  )
}

// ============================================
// Task Form Component
// ============================================

interface TaskFormProps {
  task?: Task
  defaultStatus?: Task['status']
  onSubmit: (data: any) => void
  onCancel: () => void
}

function TaskForm({ task, defaultStatus, onSubmit, onCancel }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || defaultStatus || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : ''
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
    })
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          autoFocus
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLUMNS.map(col => (
                <SelectItem key={col.id} value={col.id!}>
                  {col.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as any })}>
            <SelectTrigger>
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
      
      <div>
        <Label htmlFor="due_date">Due Date</Label>
        <Input
          id="due_date"
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
        />
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {task ? 'Update' : 'Create'} Task
        </Button>
      </DialogFooter>
    </form>
  )
}