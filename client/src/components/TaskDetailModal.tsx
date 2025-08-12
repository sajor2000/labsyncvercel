import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar,
  Clock,
  User,
  FileText,
  Edit,
  X
} from "lucide-react";
import { FileUploader } from "./FileUploader";
import { AttachmentList } from "./AttachmentList";
import type { Task, TeamMember } from "@shared/schema";

// Status color mapping  
const statusColors: Record<string, string> = {
  "TODO": "bg-gray-500",
  "IN_PROGRESS": "bg-blue-500", 
  "REVIEW": "bg-yellow-500",
  "DONE": "bg-green-500",
  "BLOCKED": "bg-red-500"
};

const statusLabels: Record<string, string> = {
  "TODO": "To Do",
  "IN_PROGRESS": "In Progress",
  "REVIEW": "In Review", 
  "DONE": "Done",
  "BLOCKED": "Blocked"
};

const priorityColors: Record<string, string> = {
  "LOW": "bg-gray-400",
  "MEDIUM": "bg-blue-400",
  "HIGH": "bg-orange-400", 
  "URGENT": "bg-red-400"
};

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  teamMembers: TeamMember[];
}

export function TaskDetailModal({ 
  task, 
  isOpen, 
  onClose, 
  onEdit,
  teamMembers 
}: TaskDetailModalProps) {
  if (!task) return null;

  const assignee = teamMembers.find(member => member.id === task.assigneeId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <DialogTitle className="text-xl font-semibold pr-8">
                {task.title}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge 
                  className={`${statusColors[task.status || 'TODO'] || statusColors.TODO} text-white border-0`}
                >
                  {statusLabels[task.status || 'TODO'] || task.status}
                </Badge>
                <Badge 
                  variant="outline"
                  className={`${priorityColors[task.priority || 'MEDIUM'] || priorityColors.MEDIUM} text-white border-0`}
                >
                  {task.priority || 'MEDIUM'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Description */}
            {task.description && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Description</h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                </div>
              </div>
            )}

            {/* Task Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assignee */}
              {assignee && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    Assignee
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {(assignee.name?.[0] || assignee.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {assignee.name || assignee.email || assignee.id}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {assignee.role} • {assignee.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Due Date */}
              {task.dueDate && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <span className="font-medium">
                      {new Date(task.dueDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* Time Tracking */}
              {(task.estimatedHours || task.actualHours) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Time Tracking
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    {task.estimatedHours && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Estimated:</span>
                        <span className="ml-1 font-medium">{task.estimatedHours} hours</span>
                      </div>
                    )}
                    {task.actualHours && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Actual:</span>
                        <span className="ml-1 font-medium">{task.actualHours} hours</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* File Attachments Section */}
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  File Attachments
                </div>
                <FileUploader
                  entityType="TASK"
                  entityId={task.id}
                  onComplete={() => {
                    // Refresh attachment list after upload
                  }}
                />
              </div>
              <AttachmentList
                entityType="TASK"
                entityId={task.id}
                onAttachmentUpdate={() => {
                  // Handle attachment updates if needed
                }}
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}