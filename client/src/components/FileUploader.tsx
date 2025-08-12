import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, File, Image, FileSpreadsheet, FileCode, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  entityType: "TASK" | "PROJECT" | "IDEA" | "DEADLINE";
  entityId: string;
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onComplete?: (attachments: any[]) => void;
  buttonClassName?: string;
  children?: ReactNode;
}

/**
 * File uploader component for tasks, studies, ideas, and deadlines
 * Supports common research file types: PDF, Word docs, Excel, PowerPoint, images
 */
export function FileUploader({
  entityType,
  entityId,
  maxNumberOfFiles = 5,
  maxFileSize = 50485760, // 50MB default
  onComplete,
  buttonClassName,
  children,
}: FileUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: [
          // Documents
          '.pdf',
          '.doc', '.docx',
          '.xls', '.xlsx',
          '.ppt', '.pptx',
          '.txt', '.csv',
          '.json',
          // Images
          '.jpg', '.jpeg', '.png', '.gif', '.webp',
          '.svg', '.bmp', '.tiff',
        ],
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async () => {
          const response = await fetch("/api/upload/attachment", {
            method: "POST",
            credentials: "include",
          });
          const data = await response.json();
          return {
            method: "PUT" as const,
            url: data.uploadURL,
          };
        },
      })
      .on("upload", () => {
        setIsUploading(true);
        setUploadComplete(false);
      })
      .on("complete", async (result) => {
        setIsUploading(false);
        const attachments = [];
        
        if (result.successful) {
          for (const file of result.successful) {
            try {
            // Create attachment record in database
            const response = await fetch("/api/attachments", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                filename: file.name,
                fileUrl: file.uploadURL,
                fileSize: file.size?.toString() || "0",
                mimeType: file.type || "application/octet-stream",
                entityType,
                entityId,
              }),
            });
            
            if (response.ok) {
              const attachment = await response.json();
              attachments.push(attachment);
            }
            } catch (error) {
              console.error("Error creating attachment record:", error);
            }
          }
        }
        
        setUploadComplete(true);
        onComplete?.(attachments);
        setShowModal(false);
        
        if (attachments.length > 0) {
          toast({
            title: "Upload Complete",
            description: `Successfully uploaded ${attachments.length} file${attachments.length === 1 ? '' : 's'}`,
          });
        }
      })
      .on("error", (error) => {
        setIsUploading(false);
        console.error("Upload error:", error);
        toast({
          title: "Upload Error",
          description: "Failed to upload files. Please try again.",
          variant: "destructive",
        });
      })
  );

  return (
    <div className="space-y-2">
      <Button 
        onClick={() => setShowModal(true)} 
        className={`${buttonClassName} transition-all duration-200 hover:shadow-md`}
        variant="outline"
        size="sm"
        disabled={isUploading}
        data-testid="button-upload-file"
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Uploading...
          </>
        ) : uploadComplete ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            Upload Complete
          </>
        ) : (
          children || (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Attach Files
            </>
          )
        )}
      </Button>

      {/* File type support info */}
      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary" className="text-xs">PDF</Badge>
        <Badge variant="secondary" className="text-xs">Word</Badge>
        <Badge variant="secondary" className="text-xs">Excel</Badge>
        <Badge variant="secondary" className="text-xs">Images</Badge>
        <Badge variant="secondary" className="text-xs">+More</Badge>
      </div>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        note={`Upload research files for this ${entityType.toLowerCase()}. Supports PDF, Word, Excel, PowerPoint, images, and more. Max 50MB per file.`}
      />
    </div>
  );
}

/**
 * Helper function to get file type icon
 */
export function getFileTypeIcon(mimeType: string, filename: string): ReactNode {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (mimeType.startsWith('image/')) {
    return <Image className="w-4 h-4 text-blue-500" />;
  }
  
  switch (ext) {
    case 'pdf':
      return <FileText className="w-4 h-4 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="w-4 h-4 text-blue-600" />;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
    case 'ppt':
    case 'pptx':
      return <FileCode className="w-4 h-4 text-orange-500" />;
    case 'txt':
    case 'json':
      return <FileCode className="w-4 h-4 text-gray-500" />;
    default:
      return <File className="w-4 h-4 text-gray-400" />;
  }
}

/**
 * Helper function to format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}