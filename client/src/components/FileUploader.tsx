import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";

interface FileUploaderProps {
  entityType: "TASK" | "PROJECT";
  entityId: string;
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onComplete?: (attachments: any[]) => void;
  buttonClassName?: string;
  children?: ReactNode;
}

/**
 * File uploader component for tasks and studies
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
      .on("complete", async (result) => {
        const attachments = [];
        
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
        
        onComplete?.(attachments);
        setShowModal(false);
      })
  );

  return (
    <div>
      <Button 
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        variant="outline"
        size="sm"
        data-testid="button-upload-file"
      >
        {children || (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Attach Files
          </>
        )}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        note="Upload documents, images, and files for this task or study. Max 50MB per file."
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
    return '🖼️';
  }
  
  switch (ext) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'ppt':
    case 'pptx':
      return '📊';
    case 'txt':
      return '📄';
    case 'csv':
      return '📋';
    case 'json':
      return '🔧';
    default:
      return <FileText className="w-4 h-4" />;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}