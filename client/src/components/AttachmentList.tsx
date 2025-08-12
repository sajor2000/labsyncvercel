import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Download, Trash2, FileText, AlertCircle } from "lucide-react";
import { getFileTypeIcon, formatFileSize } from "./FileUploader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Attachment } from "@shared/schema";

interface AttachmentListProps {
  entityType: "TASK" | "PROJECT";
  entityId: string;
  onAttachmentUpdate?: () => void;
}

export function AttachmentList({
  entityType,
  entityId,
  onAttachmentUpdate,
}: AttachmentListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: attachments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/attachments/${entityType}/${entityId}`],
    enabled: !!entityId,
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete attachment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/attachments/${entityType}/${entityId}`],
      });
      onAttachmentUpdate?.();
      toast({
        title: "Success",
        description: "File attachment deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting attachment:", error);
      toast({
        title: "Error",
        description: "Failed to delete attachment",
        variant: "destructive",
      });
    },
  });

  const handleDownload = (attachment: Attachment) => {
    // Open file in new tab/window for download
    window.open(attachment.url, '_blank');
  };

  const handleDelete = (attachmentId: string) => {
    deleteAttachmentMutation.mutate(attachmentId);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Failed to load attachments
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!attachments.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            No file attachments yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload documents, images, and research files
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment: Attachment, index: number) => (
        <Card key={attachment.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 text-2xl">
                  {getFileTypeIcon(attachment.mimeType, attachment.filename)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm font-medium text-foreground truncate"
                    title={attachment.filename}
                    data-testid={`text-filename-${index}`}
                  >
                    {attachment.filename}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span data-testid={`text-filesize-${index}`}>
                      {formatFileSize(parseInt(attachment.fileSize))}
                    </span>
                    <span>•</span>
                    <span data-testid={`text-upload-date-${index}`}>
                      {new Date(attachment.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  data-testid={`button-download-${index}`}
                >
                  <Download className="w-4 h-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`button-delete-${index}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete File Attachment</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{attachment.filename}"? 
                        This action cannot be undone and the file will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(attachment.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete File
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}