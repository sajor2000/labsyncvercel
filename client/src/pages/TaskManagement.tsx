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
import { Plus, Filter, Search, Edit, Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
function SortableTaskRow({ task, assignee, onEdit, onDelete }: {
  task: Task;
  assignee?: TeamMember;
  onEdit: () => void;
  onDelete: () => void;
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
        <div className="flex flex-col gap-1">
          <span className="text-sm">{task.title}</span>
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
              {(assignee.user?.firstName?.[0] || assignee.user?.email?.[0] || '?').toUpperCase()}
            </div>
            <span className="text-xs">
              {assignee.user?.firstName || assignee.user?.email || assignee.userId}
            </span>
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [studyFilter, setStudyFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [expandedStudies, setExpandedStudies] = useState<Set<string>>(new Set());
  const [showQuickAdd, setShowQuickAdd] = useState(false);

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

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
    enabled: isAuthenticated,
  });

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const activeTask = tasks.find(task => task.id === active.id);
    if (!activeTask) return;

    // For now, just update position within same study
    const overTask = tasks.find(task => task.id === over.id);
    if (overTask && activeTask.studyId === overTask.studyId) {
      moveTaskMutation.mutate({
        taskId: activeTask.id,
        newPosition: String(Date.now()),
      });
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

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesStudy = studyFilter === 'all' || task.studyId === studyFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    // Only show tasks from the current lab's studies
    const taskStudy = studies.find(s => s.id === task.studyId);
    const matchesLab = !contextLab || !taskStudy || taskStudy.labId === contextLab.id;
    
    return matchesSearch && matchesStatus && matchesStudy && matchesPriority && matchesLab;
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
          <Button 
            variant="outline"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            data-testid="button-toggle-quick-add"
          >
            <Plus className="h-4 w-4 mr-2" />
            Quick Add Task
          </Button>
        </div>
      </div>

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
                          <SelectItem value="">Unassigned</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.userId} value={member.userId}>
                              {member.user?.firstName || member.user?.email || member.userId}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-tasks"
          />
        </div>
        <Select value={studyFilter} onValueChange={setStudyFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-study-filter">
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
          <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="REVIEW">Review</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-priority-filter">
            <SelectValue placeholder="All Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Monday.com-style Task Table */}
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
                    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
                    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
                    return matchesSearch && matchesStatus && matchesPriority;
                  });
                  
                  if (studyFilter !== 'all' && study.id !== studyFilter) return null;
                  if (filteredStudyTasks.length === 0 && searchTerm) return null;
                  
                  const isExpanded = expandedStudies.has(study.id);
                  
                  return [
                    // Study header row
                    <TableRow key={`study-${study.id}`} className="bg-muted/50 hover:bg-muted/70 border-l-4 border-l-primary">
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
                                  const member = teamMembers.find(m => m.userId === assigneeId);
                                  return (
                                    <div 
                                      key={assigneeId}
                                      className="w-6 h-6 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-medium"
                                      title={member?.user?.firstName || member?.user?.email || assigneeId}
                                    >
                                      {(member?.user?.firstName?.[0] || member?.user?.email?.[0] || '?').toUpperCase()}
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
                      const assignee = teamMembers.find(m => m.userId === task.assigneeId);
                      
                      return (
                        <SortableTaskRow
                          key={`task-${task.id}`}
                          task={task}
                          assignee={assignee}
                          onEdit={() => console.log('Edit task:', task.id)}
                          onDelete={() => deleteTaskMutation.mutate(task.id)}
                        />
                      );
                    }) : [])
                  ];
                })}
                
                {labFilteredStudies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
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
    </main>
  );
}