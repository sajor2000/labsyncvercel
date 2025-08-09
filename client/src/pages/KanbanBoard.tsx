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
import { Plus, MoreHorizontal, User, Calendar, Flag, Folder, ArrowRight, GripVertical } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, Study, Lab, Bucket } from "@shared/schema";

const statusColumns = [
  { id: "TODO", title: "To Do", color: "bg-gray-100 dark:bg-gray-900" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-100 dark:bg-blue-900" },
  { id: "REVIEW", title: "Review", color: "bg-yellow-100 dark:bg-yellow-900" },
  { id: "DONE", title: "Done", color: "bg-green-100 dark:bg-green-900" },
  { id: "BLOCKED", title: "Blocked", color: "bg-red-100 dark:bg-red-900" },
];

const priorityColors = {
  LOW: "text-green-600 dark:text-green-400",
  MEDIUM: "text-yellow-600 dark:text-yellow-400",
  HIGH: "text-orange-600 dark:text-orange-400",
  URGENT: "text-red-600 dark:text-red-400",
};

// Draggable Task Card Component
function DraggableTaskCard({ task }: { task: Task }) {
  const { toast } = useToast();
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
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
        isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''
      }`}
      data-testid={`task-${task.id}`}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1">
              <div
                {...attributes}
                {...listeners}
                className="mt-1 p-1 hover:bg-muted/50 rounded cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-3 w-3 text-muted-foreground" />
              </div>
              <h4 className="font-medium text-sm line-clamp-2 flex-1">{task.title}</h4>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  toast({
                    title: "Edit Task",
                    description: "Task editing interface coming soon",
                  });
                }}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  toast({
                    title: "Assign Task",
                    description: "Task assignment interface coming soon",
                  });
                }}>Assign</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => {
                  toast({
                    title: "Delete Task",
                    description: "Task deletion interface coming soon",
                  });
                }}>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 ml-6">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs ml-6">
            <div className="flex items-center gap-2">
              {task.priority && (
                <div className="flex items-center">
                  <Flag className={`h-3 w-3 ${priorityColors[task.priority]}`} />
                </div>
              )}
              {task.assigneeId && (
                <div className="flex items-center">
                  <User className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
            </div>
            {task.dueDate && (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Droppable Column Component  
function DroppableColumn({ 
  column, 
  tasks, 
  tasksLoading 
}: { 
  column: typeof statusColumns[0];
  tasks: Task[];
  tasksLoading: boolean;
}) {
  const { toast } = useToast();
  return (
    <div className="flex flex-col">
      {/* Column Header */}
      <div className={`${column.color} p-3 rounded-t-lg border-b`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 bg-muted/20 p-3 rounded-b-lg overflow-y-auto min-h-[500px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasksLoading ? (
              [...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                      <div className="h-3 w-2/3 bg-muted animate-pulse rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-2xl mb-2">📋</div>
                <p className="text-sm text-muted-foreground">Drop tasks here</p>
              </div>
            ) : (
              tasks.map((task) => <DraggableTaskCard key={task.id} task={task} />)
            )}
          </div>
        </SortableContext>

        {/* Add Task Button */}
        <Button
          variant="ghost"
          className="w-full mt-3 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50"
          data-testid={`button-add-task-${column.id.toLowerCase()}`}
          onClick={() => {
            toast({
              title: "Add Task",
              description: `Create new task in ${column.title} column. Task creation interface coming soon.`,
            });
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedLab: contextLab } = useLabContext();
  const queryClient = useQueryClient();
  const [selectedBucket, setSelectedBucket] = useState("");
  const [selectedStudy, setSelectedStudy] = useState("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // DND Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
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

  // Fetch data filtered by lab context
  const { data: buckets = [] } = useQuery<Bucket[]>({
    queryKey: ['/api/buckets', contextLab?.id],
    enabled: isAuthenticated && !!contextLab,
  });

  const { data: allStudies = [] } = useQuery<Study[]>({
    queryKey: ['/api/studies', contextLab?.id],
    enabled: isAuthenticated && !!contextLab,
  });

  // Studies are already filtered by lab context on backend
  const labStudies = allStudies;
  const bucketStudies = selectedBucket && selectedBucket !== "ALL" ? labStudies.filter(study => study.bucketId === selectedBucket) : labStudies;

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks', selectedStudy],
    enabled: isAuthenticated && !!selectedStudy,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  // Update task status
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return apiRequest(`/api/tasks/${taskId}`, 'PUT', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task moved successfully",
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
        description: "Failed to move task",
        variant: "destructive",
      });
    },
  });

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeTask = tasks.find(t => t.id === active.id);
    const overId = over.id.toString();
    
    // Check if dragging over a column
    const targetColumn = statusColumns.find(col => overId.endsWith(col.id));
    if (targetColumn && activeTask && activeTask.status !== targetColumn.id) {
      // Optimistically update the UI
      queryClient.setQueryData(['/api/tasks', selectedStudy], (oldTasks: Task[]) => {
        return oldTasks?.map(task => 
          task.id === activeTask.id 
            ? { ...task, status: targetColumn.id }
            : task
        ) || [];
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    
    if (!over) return;
    
    const activeTask = tasks.find(t => t.id === active.id);
    const overId = over.id.toString();
    
    // Determine the target status
    let targetStatus: string | null = null;
    
    // Check if dropped on a column
    const targetColumn = statusColumns.find(col => overId.endsWith(col.id));
    if (targetColumn) {
      targetStatus = targetColumn.id;
    } else {
      // Check if dropped on another task
      const targetTask = tasks.find(t => t.id === overId);
      if (targetTask) {
        targetStatus = targetTask.status;
      }
    }
    
    if (activeTask && targetStatus && activeTask.status !== targetStatus) {
      updateTaskMutation.mutate({
        taskId: activeTask.id,
        status: targetStatus,
      });
    }
  };

  // Group tasks by status
  const tasksByStatus = statusColumns.reduce((acc, column) => {
    acc[column.id] = tasks.filter(task => task.status === column.id);
    return acc;
  }, {} as Record<string, Task[]>);

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
          <h1 className="text-2xl font-bold text-foreground">Project Task Board</h1>
          <p className="text-muted-foreground">
            {contextLab 
              ? `Manage subtasks for projects in ${contextLab.name}`
              : "Manage subtasks for your research projects"
            }
          </p>
          {/* Hierarchy Breadcrumb */}
          {(selectedBucket || selectedStudy) && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span>Path:</span>
              {selectedBucket && (
                <>
                  <Folder className="h-3 w-3" />
                  <span>{buckets.find(b => b.id === selectedBucket)?.name}</span>
                  <ArrowRight className="h-3 w-3" />
                </>
              )}
              {selectedStudy && (
                <>
                  <span>{bucketStudies.find(s => s.id === selectedStudy)?.name}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>Subtasks</span>
                </>
              )}
            </div>
          )}
        </div>
        <Button 
          data-testid="button-create-task"
          disabled={!selectedStudy}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Subtask
        </Button>
      </div>

      {/* Filters - Following Bucket → Project/Study → Subtasks hierarchy */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            1. Select Bucket
          </label>
          <Select value={selectedBucket} onValueChange={setSelectedBucket}>
            <SelectTrigger className="w-[200px]" data-testid="select-bucket">
              <SelectValue placeholder="All Buckets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Buckets</SelectItem>
              {buckets.filter(bucket => bucket.id && bucket.id.trim() !== "").map((bucket) => (
                <SelectItem key={bucket.id} value={bucket.id!}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: bucket.color || '#3b82f6' }}
                    />
                    {bucket.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            2. Select Project/Study
          </label>
          <Select value={selectedStudy} onValueChange={setSelectedStudy}>
            <SelectTrigger className="w-[250px]" data-testid="select-study">
              <SelectValue placeholder="Select Project/Study" />
            </SelectTrigger>
            <SelectContent>
              {bucketStudies.filter(study => study.id && study.id.trim() !== "").map((study) => (
                <SelectItem key={study.id} value={study.id!}>
                  {study.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board */}
      {!selectedStudy ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-4xl mb-4">
                <Folder className="h-8 w-8 text-muted-foreground" />
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <span className="text-2xl">📊</span>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Select a Project/Study to view subtasks
              </h3>
              <p className="text-muted-foreground">
                Follow the hierarchy: Choose a bucket, then select a project/study to manage its subtasks
              </p>
              {buckets.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No buckets found. Create buckets first to organize your projects.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 h-[calc(100vh-12rem)]">
            {statusColumns.map((column) => (
              <div key={`column-${column.id}`} id={`droppable-${column.id}`}>
                <DroppableColumn
                  column={column}
                  tasks={tasksByStatus[column.id] || []}
                  tasksLoading={tasksLoading}
                />
              </div>
            ))}
          </div>
          
          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask ? (
              <Card className="cursor-grabbing shadow-lg ring-2 ring-primary/20 rotate-3">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-3 w-3 text-muted-foreground mt-1" />
                      <h4 className="font-medium text-sm line-clamp-2">{activeTask.title}</h4>
                    </div>
                    {activeTask.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 ml-6">
                        {activeTask.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </main>
  );
}