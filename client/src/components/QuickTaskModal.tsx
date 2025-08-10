import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Study, TeamMember } from "@shared/schema";

const quickTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]),
  dueDate: z.date().optional(),
  assigneeId: z.string().optional(),
});

interface QuickTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  study: Study;
  teamMembers: TeamMember[];
  bucketId: string;
  labId: string;
}

export function QuickTaskModal({
  open,
  onOpenChange,
  study,
  teamMembers,
  bucketId,
  labId,
}: QuickTaskModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isQuickMode, setIsQuickMode] = useState(true);

  const form = useForm<z.infer<typeof quickTaskSchema>>({
    resolver: zodResolver(quickTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      status: "TODO",
      assigneeId: study.assignees?.[0] || undefined,
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof quickTaskSchema>) => {
      const body = {
        ...data,
        studyId: study.id,
        bucketId,
        labId,
        createdBy: "current-user", // This would come from auth context
      };
      return apiRequest('/api/tasks', 'POST', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Task Created",
        description: `Task added to ${study.name}`,
      });
      form.reset();
      if (isQuickMode) {
        // Keep modal open for rapid task entry
        form.setFocus("title");
      } else {
        onOpenChange(false);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: z.infer<typeof quickTaskSchema>) => {
    createTaskMutation.mutate(data);
  };

  const handleQuickAdd = () => {
    const title = form.getValues("title");
    if (title) {
      createTaskMutation.mutate({
        title,
        priority: "MEDIUM",
        status: "TODO",
        assigneeId: study.assignees?.[0],
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Task for {study.name}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={isQuickMode ? "secondary" : "ghost"}
                onClick={() => setIsQuickMode(true)}
              >
                Quick
              </Button>
              <Button
                size="sm"
                variant={!isQuickMode ? "secondary" : "ghost"}
                onClick={() => setIsQuickMode(false)}
              >
                Detailed
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isQuickMode ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type task and press Enter..."
                value={form.watch("title")}
                onChange={(e) => form.setValue("title", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleQuickAdd();
                  }
                }}
                autoFocus
                data-testid="input-quick-task-title"
              />
              <Button onClick={handleQuickAdd} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Press Enter to add task • Tasks auto-assigned to {teamMembers.find(m => m.id === study.assignees?.[0])?.name || "team"}
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task title" {...field} data-testid="input-task-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add task details..." 
                        {...field} 
                        value={field.value || ""}
                        className="min-h-[80px]"
                        data-testid="textarea-task-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-task-priority">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-task-assignee">
                            <SelectValue placeholder="Select assignee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-task-due-date"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}