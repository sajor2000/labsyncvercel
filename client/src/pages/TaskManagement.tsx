import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLabContext } from "@/hooks/useLabContext";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Filter, Search, Edit, Trash2, ChevronDown, ChevronRight, GripVertical, Table as TableIcon, Columns, Eye, Calendar, Clock, X, Settings, CalendarDays } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InlineTaskEditor } from "@/components/InlineTaskEditor";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Study, Lab, Bucket, TeamMember, Task } from "@shared/schema";
import { TimelineView } from "@/components/TimelineView";

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

const statusColors = {
  TODO: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  DONE: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  BLOCKED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

const studyStatusColors = {
  PLANNING: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  IRB_SUBMISSION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400", 
  IRB_APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  DATA_COLLECTION: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  ANALYSIS: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  MANUSCRIPT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
  UNDER_REVIEW: "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400",
  PUBLISHED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  ON_HOLD: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

const fundingColors = {
  NIH: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  INDUSTRY: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400", 
  INTERNAL: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  NONE: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
};

// Sortable Task Row Component for drag and drop
function SortableTaskRow({ task, assignee, onEdit, onDelete, onPreview, bulkOperationMode, isSelected, onSelect }: {
  task: Task;
  assignee?: TeamMember;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
  bulkOperationMode?: boolean;
  isSelected?: boolean;
  onSelect?: (taskId: string, isSelected: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`hover:bg-muted/25 border-l-4 border-l-muted ${isDragging ? 'z-50' : ''}`}
    >
      {/* Phase 4: Bulk Operations Checkbox */}
      {bulkOperationMode && (
        <TableCell className="w-12">
          <Checkbox
            checked={isSelected || false}
            onCheckedChange={(checked) => onSelect?.(task.id, !!checked)}
            data-testid={`checkbox-task-${task.id}`}
          />
        </TableCell>
      )}
      <TableCell className="pl-8">
        <div className="flex items-center gap-2">
          <div
            className="cursor-grab active:cursor-grabbing p-1"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
        </div>
      </TableCell>
      <TableCell className="font-medium pl-4">
        <div className="flex flex-col gap-1 cursor-pointer" onClick={onPreview}>
          <span className="text-sm hover:text-primary transition-colors">{task.title}</span>
          {task.description && (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {task.description}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">Subtask</span>
      </TableCell>
      <TableCell>
        <Badge className={statusColors[task.status as keyof typeof statusColors] || statusColors.TODO} variant="secondary">
          {task.status?.replace('_', ' ') || 'TODO'}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.MEDIUM} variant="outline">
          {task.priority || 'MEDIUM'}
        </Badge>
      </TableCell>
      <TableCell>
        {assignee ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">
              {(assignee.name?.[0] || assignee.email?.[0] || '?').toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs">
                {assignee.name || assignee.email || assignee.id}
              </span>
              {assignee.role && (
                <span className="text-xs text-muted-foreground">{assignee.role}</span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">Task</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={onEdit}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Enhanced Task Card Component for Kanban View
function TaskCard({ task, assignee, onEdit, onDelete, onPreview }: {
  task: Task;
  assignee?: TeamMember;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityIndicatorColors = {
    LOW: "bg-gray-400",
    MEDIUM: "bg-blue-400", 
    HIGH: "bg-orange-400",
    URGENT: "bg-red-400",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group ${isDragging ? 'rotate-2 shadow-lg' : ''}`}
      onClick={onPreview}
    >
      {/* Priority Indicator Strip */}
      <div className={`h-1 w-full rounded-full mb-3 ${priorityIndicatorColors[task.priority as keyof typeof priorityIndicatorColors] || priorityIndicatorColors.MEDIUM}`}></div>
      
      {/* Drag Handle */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Card Content */}
      <div className="space-y-3">
        {/* Title */}
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 pr-6">
          {task.title}
        </h4>

        {/* Status Badge */}
        <Badge 
          variant="secondary"
          className={`
            ${task.status === 'TODO' ? 'bg-gray-100 text-gray-700' :
              task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
              task.status === 'REVIEW' ? 'bg-yellow-100 text-yellow-700' :
              task.status === 'DONE' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'}
          `}
        >
          {task.status?.replace('_', ' ') || 'TODO'}
        </Badge>

        {/* Assignee */}
        {assignee && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
              {(assignee.name?.[0] || assignee.email?.[0] || '?').toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {assignee.name || assignee.email || assignee.id}
              </span>
              <span className="text-xs text-gray-500">{assignee.role}</span>
            </div>
          </div>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1">
            {task.estimatedHours && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{task.estimatedHours}h</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Preview Panel Component
function TaskPreviewPanel({ task, assignee, onClose, onEdit, onDelete }: {
  task: Task | null;
  assignee?: TeamMember;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!task) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Task Details</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Plus className="h-4 w-4 rotate-45" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Title */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <p className="mt-1 text-gray-900 dark:text-gray-100">{task.title}</p>
        </div>

        {/* Description */}
        {task.description && (
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{task.description}</p>
          </div>
        )}

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <div className="mt-1">
              <Badge className={statusColors[task.status as keyof typeof statusColors] || statusColors.TODO} variant="secondary">
                {task.status?.replace('_', ' ') || 'TODO'}
              </Badge>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
            <div className="mt-1">
              <Badge className={priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.MEDIUM} variant="outline">
                {task.priority || 'MEDIUM'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Assignee */}
        {assignee && (
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Assignee</label>
            <div className="mt-1 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                {(assignee.name?.[0] || assignee.email?.[0] || '?').toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {assignee.name || assignee.email || assignee.id}
                </span>
                <span className="text-sm text-gray-500">{assignee.role} • {assignee.email}</span>
              </div>
            </div>
          </div>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">
              {new Date(task.dueDate).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Time Tracking */}
        {(task.estimatedHours || task.actualHours) && (
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Tracking</label>
            <div className="mt-1 space-y-1">
              {task.estimatedHours && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Estimated: {task.estimatedHours} hours
                </p>
              )}
              {task.actualHours && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Actual: {task.actualHours} hours
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onEdit} className="flex-1">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Quick task form schema
const quickTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  studyId: z.string().min(1, "Study is required"),
  priority: z.string().default("MEDIUM"),
  assigneeId: z.string().optional(),
});

type QuickTaskFormValues = z.infer<typeof quickTaskSchema>;

export default function TaskManagement() {
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedLab: contextLab } = useLabContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [studyFilter, setStudyFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [expandedStudies, setExpandedStudies] = useState<Set<string>>(new Set());
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'timeline'>('table');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  
  // Phase 4: Advanced Filtering
  const [dateRangeFilter, setDateRangeFilter] = useState<{start?: Date, end?: Date}>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [savedFilters, setSavedFilters] = useState<Array<{name: string, filters: any}>>([]);
  
  // Phase 4: Bulk Operations
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [bulkOperationMode, setBulkOperationMode] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch data
  const { data: studies = [], isLoading: studiesLoading } = useQuery<Study[]>({
    queryKey: ['/api/studies', contextLab?.id],
    enabled: isAuthenticated && !!contextLab,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    enabled: isAuthenticated,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['/api/team-members', contextLab?.id],
    enabled: isAuthenticated && !!contextLab,
  }) as { data: TeamMember[] };

  // Quick task form
  const quickForm = useForm<QuickTaskFormValues>({
    resolver: zodResolver(quickTaskSchema),
    defaultValues: {
      title: "",
      studyId: "",
      priority: "MEDIUM",
      assigneeId: "",
    },
  });

  // Task operations mutations
  const createTaskMutation = useMutation({
    mutationFn: async (data: QuickTaskFormValues) => {
      return apiRequest('/api/tasks', 'POST', {
        ...data,
        status: 'TODO',
        description: '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      quickForm.reset();
      setShowQuickAdd(false);
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, newStatus, newPosition, newStudyId }: {
      taskId: string;
      newStatus?: string;
      newPosition?: string;
      newStudyId?: string;
    }) => {
      return apiRequest(`/api/tasks/${taskId}/move`, 'PATCH', {
        newStatus,
        newPosition,
        newStudyId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task moved successfully",
      });
    },
    onError: (error) => {
      console.error("Move task error:", error);
      toast({
        title: "Error",
        description: "Failed to move task",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest(`/api/tasks/${taskId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Delete task error:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent, columnStatus?: string) => {
    const { active, over } = event;

    if (!over) return;

    const activeTask = filteredTasks.find(task => task.id === active.id);
    if (!activeTask) return;

    // Handle column-based drops (status change) for Kanban view
    if (columnStatus && activeTask.status !== columnStatus) {
      moveTaskMutation.mutate({
        taskId: activeTask.id,
        newStatus: columnStatus,
      });
      return;
    }

    // Handle reordering within same status/study for table view
    if (active.id !== over.id) {
      const overTask = tasks.find(task => task.id === over.id);
      if (overTask && activeTask.studyId === overTask.studyId) {
        moveTaskMutation.mutate({
          taskId: activeTask.id,
          newPosition: String(Date.now()),
        });
      }
    }
  };

  // Filter studies by lab context
  const labFilteredStudies = contextLab ? studies.filter(study => study.labId === contextLab.id) : studies;

  // Group tasks by study
  const tasksByStudy = tasks.reduce((acc, task) => {
    const studyId = task.studyId || 'unassigned';
    if (!acc[studyId]) acc[studyId] = [];
    acc[studyId].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Filter tasks with Phase 4 advanced filtering
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesStudy = studyFilter === 'ALL' || task.studyId === studyFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'ALL' || 
                           (assigneeFilter === 'UNASSIGNED' && !task.assigneeId) ||
                           (assigneeFilter !== 'UNASSIGNED' && task.assigneeId === assigneeFilter);
    
    // Phase 4: Date range filtering
    const matchesDateRange = (() => {
      if (!dateRangeFilter.start && !dateRangeFilter.end) return true;
      
      const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt || '');
      
      if (dateRangeFilter.start && taskDate < dateRangeFilter.start) return false;
      if (dateRangeFilter.end && taskDate > dateRangeFilter.end) return false;
      
      return true;
    })();
    
    // Only show tasks from the current lab's studies
    const taskStudy = studies.find(s => s.id === task.studyId);
    const matchesLab = !contextLab || !taskStudy || taskStudy.labId === contextLab.id;
    
    return matchesSearch && matchesStatus && matchesStudy && matchesPriority && matchesAssignee && matchesDateRange && matchesLab;
  });

  const toggleStudyExpansion = (studyId: string) => {
    setExpandedStudies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studyId)) {
        newSet.delete(studyId);
      } else {
        newSet.add(studyId);
      }
      return newSet;
    });
  };

  const onQuickSubmit = (data: QuickTaskFormValues) => {
    createTaskMutation.mutate(data);
  };

  // Phase 4: Bulk operations functions
  const handleSelectTask = (taskId: string, isSelected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAllTasks = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedTasks(new Set(filteredTasks.map(task => task.id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  const bulkUpdateStatus = useMutation({
    mutationFn: async (status: string) => {
      const taskIds = Array.from(selectedTasks);
      return Promise.all(taskIds.map(taskId => 
        apiRequest(`/api/tasks/${taskId}`, 'PATCH', { status })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setSelectedTasks(new Set());
      setBulkOperationMode(false);
      toast({
        title: "Success",
        description: `Updated ${selectedTasks.size} tasks`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update tasks",
        variant: "destructive",
      });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async () => {
      const taskIds = Array.from(selectedTasks);
      return Promise.all(taskIds.map(taskId => 
        apiRequest(`/api/tasks/${taskId}`, 'DELETE')
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setSelectedTasks(new Set());
      setBulkOperationMode(false);
      toast({
        title: "Success",
        description: `Deleted ${selectedTasks.size} tasks`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete tasks",
        variant: "destructive",
      });
    },
  });

  // Clear filters function
  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setStudyFilter("ALL");
    setPriorityFilter("ALL");
    setAssigneeFilter("ALL");
    setDateRangeFilter({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Research Project Board</h1>
          <p className="text-muted-foreground">State-of-the-art project management for research studies and tasks</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Phase 4: Bulk Operations Controls */}
          {selectedTasks.size > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border">
              <span className="text-sm font-medium">{selectedTasks.size} selected</span>
              <Separator orientation="vertical" className="h-4" />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => bulkUpdateStatus.mutate('DONE')}
                disabled={bulkUpdateStatus.isPending}
              >
                Mark Done
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => bulkUpdateStatus.mutate('IN_PROGRESS')}
                disabled={bulkUpdateStatus.isPending}
              >
                In Progress
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => bulkDelete.mutate()}
                disabled={bulkDelete.isPending}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedTasks(new Set())}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <Button 
            variant="outline"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            data-testid="button-toggle-quick-add"
          >
            <Plus className="h-4 w-4 mr-2" />
            Quick Add Task
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setBulkOperationMode(!bulkOperationMode)}
            data-testid="button-toggle-bulk-mode"
          >
            <Settings className="h-4 w-4 mr-2" />
            {bulkOperationMode ? 'Exit Bulk' : 'Bulk Edit'}
          </Button>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center border rounded-lg p-1 bg-muted/50">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex items-center gap-2"
            >
              <TableIcon className="h-4 w-4" />
              Table
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="flex items-center gap-2"
            >
              <Columns className="h-4 w-4" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('timeline')}
              className="flex items-center gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              Timeline
            </Button>
          </div>
        </div>
        
        {/* Phase 4: Advanced Filters Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            data-testid="button-toggle-advanced-filters"
          >
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
          
          {(searchTerm || statusFilter !== 'ALL' || studyFilter !== 'all' || 
            priorityFilter !== 'ALL' || assigneeFilter !== 'ALL' || 
            dateRangeFilter.start || dateRangeFilter.end) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              data-testid="button-clear-filters"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Phase 4: Advanced Filters Panel */}
      {showAdvancedFilters && (
        <Card className="mb-6 border border-primary/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={dateRangeFilter.start ? dateRangeFilter.start.toISOString().split('T')[0] : ''}
                  onChange={(e) => setDateRangeFilter(prev => ({
                    ...prev,
                    start: e.target.value ? new Date(e.target.value) : undefined
                  }))}
                  data-testid="input-date-start"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={dateRangeFilter.end ? dateRangeFilter.end.toISOString().split('T')[0] : ''}
                  onChange={(e) => setDateRangeFilter(prev => ({
                    ...prev,
                    end: e.target.value ? new Date(e.target.value) : undefined
                  }))}
                  data-testid="input-date-end"
                />
              </div>
              
              {/* Existing Filters */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                    <SelectItem value="BLOCKED">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger data-testid="select-priority-filter">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Priority</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Study</label>
                <Select value={studyFilter} onValueChange={setStudyFilter}>
                  <SelectTrigger data-testid="select-study-filter">
                    <SelectValue placeholder="All Studies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Studies</SelectItem>
                    {labFilteredStudies.map((study) => (
                      <SelectItem key={study.id} value={study.id}>
                        {study.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Assignee</label>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger data-testid="select-assignee-filter">
                    <SelectValue placeholder="All Assignees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Assignees</SelectItem>
                    <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search tasks and descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-tasks"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Add Task Row */}
      {showQuickAdd && (
        <Card className="mb-6 border-dashed border-2 border-primary/20">
          <CardContent className="p-4">
            <Form {...quickForm}>
              <form onSubmit={quickForm.handleSubmit(onQuickSubmit)} className="flex items-end gap-4">
                <FormField
                  control={quickForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input 
                          placeholder="What needs to be done?" 
                          {...field} 
                          data-testid="input-quick-task-title"
                          className="text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={quickForm.control}
                  name="studyId"
                  render={({ field }) => (
                    <FormItem className="w-48">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-quick-study">
                            <SelectValue placeholder="Select study" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {labFilteredStudies.map((study) => (
                            <SelectItem key={study.id} value={study.id}>
                              {study.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={quickForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="w-32">
                      <Select onValueChange={field.onChange} defaultValue="MEDIUM">
                        <FormControl>
                          <SelectTrigger data-testid="select-quick-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={quickForm.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem className="w-48">
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-quick-assignee">
                            <SelectValue placeholder="Assign to..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                  {(member.name?.[0] || member.email?.[0] || '?').toUpperCase()}
                                </div>
                                <span>
                                  {member.name || member.email || member.id}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({member.role})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={createTaskMutation.isPending} data-testid="button-create-quick-task">
                    {createTaskMutation.isPending ? "Creating..." : "Add Task"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowQuickAdd(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks and projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-tasks"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={studyFilter} onValueChange={setStudyFilter}>
            <SelectTrigger className="w-48" data-testid="select-study-filter">
              <SelectValue placeholder="All Studies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Studies</SelectItem>
              {labFilteredStudies.map((study) => (
                <SelectItem key={study.id} value={study.id}>
                  {study.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="REVIEW">Review</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-48" data-testid="select-priority-filter">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-48" data-testid="select-assignee-filter">
              <SelectValue placeholder="Filter by assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Assignees</SelectItem>
              <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                      {(member.name?.[0] || member.email?.[0] || '?').toUpperCase()}
                    </div>
                    <span>
                      {member.name || member.email || member.id}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
              setPriorityFilter("ALL");
              setAssigneeFilter("ALL");
              setStudyFilter("ALL");
            }}
            className="whitespace-nowrap"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'table' ? (
        // Table View
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>Research Project Dashboard</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{labFilteredStudies.length} projects</Badge>
                  <Badge variant="outline">{filteredTasks.length} tasks</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-primary/20"></div>
                  <span>Projects</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                  <span>Tasks</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
          {tasksLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* Phase 4: Bulk Operations Checkbox Column */}
                    {bulkOperationMode && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                          onCheckedChange={handleSelectAllTasks}
                          data-testid="checkbox-select-all"
                        />
                      </TableHead>
                    )}
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="min-w-[200px]">Project/Study Name</TableHead>
                    <TableHead>Study Type</TableHead>
                    <TableHead>Study Status</TableHead>
                    <TableHead>Funding</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={filteredTasks.map(task => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                {labFilteredStudies.map((study) => {
                  const studyTasks = tasksByStudy[study.id] || [];
                  const filteredStudyTasks = studyTasks.filter(task => {
                    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
                    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
                    return matchesSearch && matchesStatus && matchesPriority;
                  });
                  
                  if (studyFilter !== 'ALL' && study.id !== studyFilter) return null;
                  if (filteredStudyTasks.length === 0 && searchTerm) return null;
                  
                  const isExpanded = expandedStudies.has(study.id);
                  
                  return [
                    // Study header row
                    <TableRow key={`study-${study.id}`} className="bg-muted/50 hover:bg-muted/70 border-l-4 border-l-primary">
                      {/* Phase 4: Bulk Operations - Empty cell for study rows */}
                      {bulkOperationMode && <TableCell></TableCell>}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStudyExpansion(study.id)}
                          className="p-0 h-6 w-6"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-base">{study.name}</span>
                          {study.oraNumber && (
                            <span className="text-xs text-muted-foreground">ORA: {study.oraNumber}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {study.studyType || 'Not Specified'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={studyStatusColors[study.status as keyof typeof studyStatusColors] || studyStatusColors.PLANNING}>
                          {study.status?.replace('_', ' ') || 'Planning'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={fundingColors[study.funding as keyof typeof fundingColors] || fundingColors.NONE}>
                          {study.funding || 'None'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {study.assignees && study.assignees.length > 0 ? (
                            <>
                              <div className="flex -space-x-1">
                                {study.assignees.slice(0, 3).map((assigneeId, index) => {
                                  const member = teamMembers.find(m => m.id === assigneeId);
                                  return (
                                    <div 
                                      key={assigneeId}
                                      className="w-6 h-6 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-medium"
                                      title={member?.name || member?.email || assigneeId}
                                    >
                                      {(member?.name?.[0] || member?.email?.[0] || '?').toUpperCase()}
                                    </div>
                                  );
                                })}
                              </div>
                              {study.assignees.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{study.assignees.length - 3}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">No team assigned</span>
                          )}
                          {study.externalCollaborators && (
                            <Badge variant="secondary" className="text-xs ml-2">
                              Ext. Collab.
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {filteredStudyTasks.length} tasks
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              quickForm.setValue('studyId', study.id);
                              setShowQuickAdd(true);
                            }}
                            data-testid={`button-add-task-${study.id}`}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Task
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>,
                    // Task rows (only shown when expanded) - now with drag and drop
                    ...(isExpanded ? filteredStudyTasks.map((task) => {
                      const assignee = teamMembers.find(m => m.id === task.assigneeId);
                      
                      return (
                        <SortableTaskRow
                          key={`task-${task.id}`}
                          task={task}
                          assignee={assignee}
                          bulkOperationMode={bulkOperationMode}
                          isSelected={selectedTasks.has(task.id)}
                          onSelect={handleSelectTask}
                          onEdit={() => console.log('Edit task:', task.id)}
                          onDelete={() => deleteTaskMutation.mutate(task.id)}
                          onPreview={() => {
                            setSelectedTask(task);
                            setShowPreviewPanel(true);
                          }}
                        />
                      );
                    }) : [])
                  ];
                })}
                
                {labFilteredStudies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={bulkOperationMode ? 9 : 8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-4xl">📊</div>
                        <div className="text-lg font-medium text-foreground">No research projects found</div>
                        <div className="text-muted-foreground">Create studies first to organize your research workflow</div>
                        <Button variant="outline" className="mt-2">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Study
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          )}
        </CardContent>
      </Card>
      ) : viewMode === 'kanban' ? (
        // Kanban View
        <div className="h-full overflow-x-auto">
          <div className="flex gap-6 min-w-max pb-6">
            {/* Kanban Columns */}
            {(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const).map((status) => (
              <div key={status} className="flex-shrink-0 w-80">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'TODO' ? 'bg-gray-400' :
                          status === 'IN_PROGRESS' ? 'bg-blue-500' :
                          status === 'REVIEW' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        <h3 className="font-medium">
                          {status.replace('_', ' ')}
                        </h3>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {filteredTasks.filter(task => task.status === status).length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => handleDragEnd(event, status)}
                    >
                      <SortableContext
                        items={filteredTasks.filter(task => task.status === status).map(task => task.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3 min-h-[200px]">
                          {filteredTasks
                            .filter(task => task.status === status)
                            .map((task) => {
                              const assignee = teamMembers.find(m => m.id === task.assigneeId);
                              return (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  assignee={assignee}
                                  onEdit={() => console.log('Edit task:', task.id)}
                                  onDelete={() => deleteTaskMutation.mutate(task.id)}
                                  onPreview={() => {
                                    setSelectedTask(task);
                                    setShowPreviewPanel(true);
                                  }}
                                />
                              );
                            })}
                          {filteredTasks.filter(task => task.status === status).length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              <div className="text-2xl mb-2">📋</div>
                              <p className="text-sm">No {status.toLowerCase().replace('_', ' ')} tasks</p>
                            </div>
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === 'timeline' ? (
        // Timeline/Gantt View
        <TimelineView 
          tasks={filteredTasks}
          studies={labFilteredStudies}
          teamMembers={teamMembers}
          onTaskEdit={(task) => console.log('Edit task:', task.id)}
          onTaskDelete={(taskId) => deleteTaskMutation.mutate(taskId)}
        />
      ) : null}

      {/* Task Preview Panel */}
      {showPreviewPanel && selectedTask && (
        <TaskPreviewPanel
          task={selectedTask}
          assignee={teamMembers.find(m => m.id === selectedTask.assigneeId)}
          onClose={() => {
            setShowPreviewPanel(false);
            setSelectedTask(null);
          }}
          onEdit={() => console.log('Edit task:', selectedTask.id)}
          onDelete={() => {
            deleteTaskMutation.mutate(selectedTask.id);
            setShowPreviewPanel(false);
            setSelectedTask(null);
          }}
        />
      )}
    </main>
  );
}