import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { 
  Download, 
  FileText, 
  Image, 
  FileSpreadsheet, 
  FileCode,
  File,
  Eye,
  Calendar,
  User,
  Paperclip
} from "lucide-react";
import type { Attachment } from "@shared/schema";
import { formatFileSize } from "./FileUploader";

interface AttachmentViewerProps {
  entityType: "TASK" | "PROJECT" | "IDEA" | "DEADLINE";
  entityId: string;
  entityTitle?: string;
  showHeader?: boolean;
  compact?: boolean;
}

// Get appropriate icon for file type
function getFileTypeIcon(filename: string, mimeType?: string) {
  const extension = filename.toLowerCase().split('.').pop();
  
  if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
    return <Image className="h-4 w-4" />;
  }
  
  if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
    return <FileSpreadsheet className="h-4 w-4" />;
  }
  
  if (['json', 'xml', 'js', 'ts', 'py', 'r'].includes(extension || '')) {
    return <FileCode className="h-4 w-4" />;
  }
  
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(extension || '')) {
    return <FileText className="h-4 w-4" />;
  }
  
  return <File className="h-4 w-4" />;
}

// Get file type badge color
function getFileTypeBadge(filename: string, mimeType?: string) {
  const extension = filename.toLowerCase().split('.').pop();
  
  if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
    return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
  }
  
  if (['pdf'].includes(extension || '')) {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
  
  if (['doc', 'docx'].includes(extension || '')) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  }
  
  if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  }
  
  return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
}

export function AttachmentViewer({
  entityType,
  entityId,
  entityTitle,
  showHeader = true,
  compact = false
}: AttachmentViewerProps) {
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const {
    data: attachments = [],
    isLoading,
    error,
  } = useQuery<Attachment[]>({
    queryKey: [`/api/attachments/${entityType}/${entityId}`],
    enabled: !!entityId,
  });

  const handleDownload = async (attachment: Attachment) => {
    try {
      setDownloadingIds(prev => new Set(prev).add(attachment.id));
      
      const response = await fetch(attachment.url, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(attachment.id);
        return newSet;
      });
    }
  };

  const handleView = (attachment: Attachment) => {
    window.open(attachment.url, '_blank');
  };

  if (isLoading) {
    return (
      <Card className={compact ? "p-3" : ""}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Paperclip className="h-4 w-4 animate-spin" />
          Loading attachments...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={compact ? "p-3" : ""}>
        <div className="flex items-center gap-2 text-sm text-destructive">
          <Paperclip className="h-4 w-4" />
          Failed to load attachments
        </div>
      </Card>
    );
  }

  if (attachments.length === 0) {
    return compact ? null : (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Paperclip className="h-8 w-8" />
            <p>No attachments found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="h-4 w-4" />
          {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
        </div>
        <div className="space-y-1">
          {attachments.slice(0, 3).map((attachment) => (
            <div key={attachment.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getFileTypeIcon(attachment.filename, attachment.mimeType)}
                <span className="truncate">{attachment.filename}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(attachment)}
                  className="h-6 w-6 p-0"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  disabled={downloadingIds.has(attachment.id)}
                  className="h-6 w-6 p-0"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {attachments.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{attachments.length - 3} more attachment{attachments.length - 3 !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            File Attachments
            {entityTitle && <span className="text-muted-foreground">- {entityTitle}</span>}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={showHeader ? "" : "p-6"}>
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {attachments.map((attachment, index) => (
              <div key={attachment.id}>
                {index > 0 && <Separator className="my-3" />}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-1">
                      {getFileTypeIcon(attachment.filename, attachment.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{attachment.filename}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getFileTypeBadge(attachment.filename, attachment.mimeType)}`}
                        >
                          {attachment.filename.split('.').pop()?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(parseInt(attachment.fileSize))}</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {attachment.uploadedAt ? new Date(attachment.uploadedAt).toLocaleDateString() : 'Unknown'}
                        </div>
                        {attachment.uploadedById && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Uploaded by user</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(attachment)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(attachment)}
                      disabled={downloadingIds.has(attachment.id)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {downloadingIds.has(attachment.id) ? "Downloading..." : "Download"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}