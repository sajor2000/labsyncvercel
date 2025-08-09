import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Check, X, Edit3 } from "lucide-react";
import type { Task, TeamMember } from "@shared/schema";

const inlineTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  assigneeId: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  dueDate: z.string().optional(),
});

type InlineTaskFormValues = z.infer<typeof inlineTaskSchema>;

interface InlineTaskEditorProps {
  task: Task;
  teamMembers: TeamMember[];
  onSave?: () => void;
  onCancel?: () => void;
  field?: 'title' | 'description' | 'status' | 'priority' | 'assignee' | 'hours' | 'dueDate';
}

export function InlineTaskEditor({ 
  task, 
  teamMembers, 
  onSave, 
  onCancel, 
  field = 'title' 
}: InlineTaskEditorProps) {
  const [isEditing, setIsEditing] = useState(!!field);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InlineTaskFormValues>({
    resolver: zodResolver(inlineTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || "",
      status: task.status as any,
      priority: task.priority as any,
      assigneeId: task.assigneeId || "",
      estimatedHours: task.estimatedHours || undefined,
      dueDate: task.dueDate || undefined,
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: Partial<InlineTaskFormValues>) => {
      return apiRequest(`/api/tasks/${task.id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsEditing(false);
      onSave?.();
      toast({
        title: "Success",
        description: "Task updated successfully",
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
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const handleSave = (data: InlineTaskFormValues) => {
    updateTaskMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
    onCancel?.();
  };

  const handleFieldSave = (fieldName: keyof InlineTaskFormValues, value: any) => {
    updateTaskMutation.mutate({ [fieldName]: value });
  };

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    if (isEditing) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEditing]);

  // Single field editors
  const renderFieldEditor = () => {
    switch (field) {
      case 'title':
        return (
          <div className="flex items-center gap-2 w-full">
            <Input
              value={form.watch('title')}
              onChange={(e) => form.setValue('title', e.target.value)}
              onBlur={() => {
                if (form.watch('title') !== task.title) {
                  handleFieldSave('title', form.watch('title'));
                } else {
                  handleCancel();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="flex-1"
              autoFocus
            />
          </div>
        );

      case 'description':
        return (
          <div className="flex items-start gap-2 w-full">
            <Textarea
              value={form.watch('description')}
              onChange={(e) => form.setValue('description', e.target.value)}
              onBlur={() => {
                if (form.watch('description') !== task.description) {
                  handleFieldSave('description', form.watch('description'));
                } else {
                  handleCancel();
                }
              }}
              placeholder="Add description..."
              className="flex-1 min-h-[60px]"
              autoFocus
            />
          </div>
        );

      case 'status':
        return (
          <Select
            value={form.watch('status')}
            onValueChange={(value) => {
              form.setValue('status', value as any);
              handleFieldSave('status', value);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="REVIEW">Review</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'priority':
        return (
          <Select
            value={form.watch('priority')}
            onValueChange={(value) => {
              form.setValue('priority', value as any);
              handleFieldSave('priority', value);
            }}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'assignee':
        return (
          <Select
            value={form.watch('assigneeId')}
            onValueChange={(value) => {
              form.setValue('assigneeId', value);
              handleFieldSave('assigneeId', value);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Assign to..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
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
        );

      case 'hours':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              step="0.5"
              value={form.watch('estimatedHours')?.toString() || ''}
              onChange={(e) => form.setValue('estimatedHours', e.target.value ? Number(e.target.value) : undefined)}
              onBlur={() => {
                if (form.watch('estimatedHours') !== task.estimatedHours) {
                  handleFieldSave('estimatedHours', form.watch('estimatedHours'));
                } else {
                  handleCancel();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-20"
              autoFocus
            />
            <span className="text-sm text-muted-foreground">hours</span>
          </div>
        );

      case 'dueDate':
        return (
          <Input
            type="date"
            value={form.watch('dueDate') || ''}
            onChange={(e) => {
              form.setValue('dueDate', e.target.value);
              handleFieldSave('dueDate', e.target.value);
            }}
            className="w-40"
          />
        );

      default:
        return null;
    }
  };

  if (!isEditing && !field) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="h-6 w-6 p-0"
      >
        <Edit3 className="h-3 w-3" />
      </Button>
    );
  }

  if (field) {
    return renderFieldEditor();
  }

  // Full form editor
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave as any)} className="space-y-4">
          <div className="space-y-4">
            <Input 
              placeholder="Task title" 
              value={form.watch('title')}
              onChange={(e) => form.setValue('title', e.target.value)}
            />
            
            <Textarea 
              placeholder="Task description" 
              value={form.watch('description')}
              onChange={(e) => form.setValue('description', e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select 
                value={form.watch('status')}
                onValueChange={(value) => form.setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={form.watch('priority')}
                onValueChange={(value) => form.setValue('priority', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={updateTaskMutation.isPending}>
                <Check className="h-4 w-4 mr-2" />
                {updateTaskMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}