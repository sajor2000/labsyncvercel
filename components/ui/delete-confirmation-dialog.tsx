'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, AlertOctagon, Info, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'

export type DeleteSeverity = 'critical' | 'high' | 'medium' | 'low'

interface DeleteWarningConfig {
  entityType: string
  entityName: string
  entityId: string
  severity: DeleteSeverity
  cascadeInfo?: {
    tables: string[]
    counts?: Record<string, number>
    totalCount?: number
  }
  requireTypeName?: boolean
  customWarning?: string
}

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: DeleteWarningConfig
  onConfirm: () => Promise<void>
  onCancel?: () => void
}

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertOctagon,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/50',
    borderColor: 'border-red-200 dark:border-red-800',
    buttonVariant: 'destructive' as const,
    title: 'Critical Action',
    description: 'This action cannot be undone and will result in permanent data loss.',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/50',
    borderColor: 'border-orange-200 dark:border-orange-800',
    buttonVariant: 'destructive' as const,
    title: 'High Impact',
    description: 'This will delete multiple related items.',
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/50',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    buttonVariant: 'default' as const,
    title: 'Moderate Impact',
    description: 'Some related data will be affected.',
  },
  low: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    borderColor: 'border-blue-200 dark:border-blue-800',
    buttonVariant: 'default' as const,
    title: 'Low Impact',
    description: 'Only this item will be deleted.',
  },
}

const DEFAULT_WARNINGS: Record<string, (name: string, cascadeInfo?: any) => string> = {
  labs: (name, cascadeInfo) => 
    `Deleting the lab "${name}" will permanently delete ALL associated data including ${
      cascadeInfo?.totalCount || 'all'
    } items across projects, tasks, files, meetings, and remove all members. This action cannot be undone.`,
  
  buckets: (name, cascadeInfo) =>
    `Deleting the bucket "${name}" will permanently delete ${
      cascadeInfo?.counts?.projects || 'all'
    } projects and ${cascadeInfo?.counts?.tasks || 'their'} tasks. This action cannot be undone.`,
  
  projects: (name, cascadeInfo) =>
    `Deleting the project "${name}" will permanently delete ${
      cascadeInfo?.counts?.tasks || 'all'
    } tasks, ${cascadeInfo?.counts?.subtasks || 'their'} subtasks, and all comments. This action cannot be undone.`,
  
  studies: (name, cascadeInfo) =>
    `Deleting the study "${name}" will permanently delete ${
      cascadeInfo?.counts?.tasks || 'all'
    } tasks, ${cascadeInfo?.counts?.subtasks || 'their'} subtasks, and all comments. This action cannot be undone.`,
  
  tasks: (name, cascadeInfo) =>
    cascadeInfo?.counts?.subtasks 
      ? `This task "${name}" has ${cascadeInfo.counts.subtasks} subtasks. Deleting it will also delete all subtasks and comments. This action cannot be undone.`
      : `Deleting the task "${name}" will permanently remove it and any comments. This action cannot be undone.`,
  
  files: (name, cascadeInfo) =>
    cascadeInfo?.counts?.children
      ? `Deleting the folder "${name}" will permanently delete ${cascadeInfo.counts.children} files and subfolders within it. This action cannot be undone.`
      : `Deleting the file "${name}" will permanently remove it and all versions. This action cannot be undone.`,
  
  folders: (name, cascadeInfo) =>
    `Deleting the folder "${name}" will permanently delete ${
      cascadeInfo?.counts?.files || 'all'
    } files and subfolders within it. This action cannot be undone.`,
  
  ideas: (name, cascadeInfo) =>
    `Deleting the idea "${name}" will permanently delete ${
      cascadeInfo?.counts?.comments || 'all'
    } comments and discussions. This action cannot be undone.`,
  
  deadlines: (name, cascadeInfo) =>
    `Deleting the deadline "${name}" will remove ${
      cascadeInfo?.counts?.reminders || 'all'
    } reminder notifications. This action cannot be undone.`,
  
  standup_meetings: (name, cascadeInfo) =>
    `Deleting the standup meeting "${name}" will permanently delete ${
      cascadeInfo?.counts?.updates || 'all'
    } updates and action items. This action cannot be undone.`,
  
  calendar_events: (name) =>
    `Deleting the calendar event "${name}" will remove it from all participants' calendars. This action cannot be undone.`,
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  config,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [typedName, setTypedName] = useState('')
  const [cascadeInfo, setCascadeInfo] = useState(config.cascadeInfo)
  const [loadingCascade, setLoadingCascade] = useState(false)
  
  const severityConfig = SEVERITY_CONFIG[config.severity]
  const Icon = severityConfig.icon
  
  // Fetch cascade information if not provided
  useEffect(() => {
    if (open && !cascadeInfo && config.severity !== 'low') {
      fetchCascadeInfo()
    }
  }, [open, config.entityId, config.entityType])
  
  const fetchCascadeInfo = async () => {
    setLoadingCascade(true)
    const supabase = createClient()
    
    try {
      // Fetch cascade counts based on entity type
      const counts: Record<string, number> = {}
      let totalCount = 0
      
      switch (config.entityType) {
        case 'labs':
          const { count: projectCount } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('lab_id', config.entityId)
          
          const { count: taskCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('lab_id', config.entityId)
          
          counts.projects = projectCount || 0
          counts.tasks = taskCount || 0
          totalCount = (projectCount || 0) + (taskCount || 0)
          break
          
        case 'buckets':
          const { data: projects } = await supabase
            .from('projects')
            .select('id')
            .eq('bucket_id', config.entityId)
          
          const projectIds = projects?.map(p => p.id) || []
          
          const { count: taskCountBucket } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .in('project_id', projectIds)
          
          counts.projects = projects?.length || 0
          counts.tasks = taskCountBucket || 0
          break
          
        case 'projects':
        case 'studies':
          const { count: taskCountProject } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', config.entityId)
            .is('parent_task_id', null)
          
          const { count: subtaskCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', config.entityId)
            .not('parent_task_id', 'is', null)
          
          counts.tasks = taskCountProject || 0
          counts.subtasks = subtaskCount || 0
          break
          
        case 'tasks':
          const { count: subtaskCountTask } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('parent_task_id', config.entityId)
          
          if (subtaskCountTask && subtaskCountTask > 0) {
            counts.subtasks = subtaskCountTask
          }
          break
          
        case 'files':
        case 'folders':
          const { count: childCount } = await supabase
            .from('files')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', config.entityId)
          
          counts.children = childCount || 0
          break
          
        case 'ideas':
          const { count: commentCount } = await supabase
            .from('idea_comments')
            .select('*', { count: 'exact', head: true })
            .eq('idea_id', config.entityId)
          
          counts.comments = commentCount || 0
          break
          
        case 'deadlines':
          const { count: reminderCount } = await supabase
            .from('deadline_reminders')
            .select('*', { count: 'exact', head: true })
            .eq('deadline_id', config.entityId)
          
          counts.reminders = reminderCount || 0
          break
          
        case 'standup_meetings':
          const { count: updateCount } = await supabase
            .from('standup_updates')
            .select('*', { count: 'exact', head: true })
            .eq('meeting_id', config.entityId)
          
          counts.updates = updateCount || 0
          break
      }
      
      setCascadeInfo({
        tables: Object.keys(counts),
        counts,
        totalCount: totalCount || Object.values(counts).reduce((a, b) => a + b, 0),
      })
    } catch (error) {
      console.error('Failed to fetch cascade info:', error)
    } finally {
      setLoadingCascade(false)
    }
  }
  
  const getWarningMessage = () => {
    if (config.customWarning) return config.customWarning
    
    const defaultWarning = DEFAULT_WARNINGS[config.entityType]
    if (defaultWarning) {
      return defaultWarning(config.entityName, cascadeInfo)
    }
    
    return `Are you sure you want to delete "${config.entityName}"? This action cannot be undone.`
  }
  
  const handleConfirm = async () => {
    if (config.requireTypeName && typedName !== config.entityName) {
      return
    }
    
    setIsDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
      setTypedName('')
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }
  
  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
    setTypedName('')
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', severityConfig.color)} />
            Delete {config.entityType.slice(0, -1)}
          </DialogTitle>
          <DialogDescription>
            {severityConfig.title} - {severityConfig.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert className={cn('border', severityConfig.borderColor, severityConfig.bgColor)}>
            <Icon className={cn('h-4 w-4', severityConfig.color)} />
            <AlertDescription className="ml-2">
              {loadingCascade ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculating impact...
                </div>
              ) : (
                getWarningMessage()
              )}
            </AlertDescription>
          </Alert>
          
          {cascadeInfo && cascadeInfo.counts && Object.keys(cascadeInfo.counts).length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Items that will be deleted:</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(cascadeInfo.counts).map(([key, count]) => (
                  <Badge key={key} variant="secondary">
                    {count} {key}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {config.requireTypeName && (
            <div className="space-y-2">
              <Label htmlFor="confirmName">
                Type <span className="font-mono font-semibold">{config.entityName}</span> to confirm
              </Label>
              <Input
                id="confirmName"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type the name to confirm deletion"
                className={cn(
                  typedName && typedName !== config.entityName && 'border-red-500'
                )}
              />
              {typedName && typedName !== config.entityName && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Names don't match
                </p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant={severityConfig.buttonVariant}
            onClick={handleConfirm}
            disabled={
              isDeleting || 
              loadingCascade ||
              (config.requireTypeName && typedName !== config.entityName)
            }
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {config.entityType.slice(0, -1)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Export a hook for easy usage
export function useDeleteConfirmation() {
  const [deleteConfig, setDeleteConfig] = useState<DeleteWarningConfig | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => Promise<void>) | null>(null)
  
  const showDeleteConfirmation = (
    config: DeleteWarningConfig,
    onConfirm: () => Promise<void>
  ) => {
    setDeleteConfig(config)
    setOnConfirmCallback(() => onConfirm)
    setIsOpen(true)
  }
  
  const DeleteDialog = deleteConfig ? (
    <DeleteConfirmationDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      config={deleteConfig}
      onConfirm={async () => {
        if (onConfirmCallback) {
          await onConfirmCallback()
        }
        setIsOpen(false)
        setDeleteConfig(null)
        setOnConfirmCallback(null)
      }}
      onCancel={() => {
        setIsOpen(false)
        setDeleteConfig(null)
        setOnConfirmCallback(null)
      }}
    />
  ) : null
  
  return {
    showDeleteConfirmation,
    DeleteDialog,
  }
}