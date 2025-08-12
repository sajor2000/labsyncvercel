import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  X, 
  FileText, 
  Image, 
  FileSpreadsheet,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import type { Attachment } from "@shared/schema";

interface FilePreviewProps {
  attachment: Attachment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreview({ attachment, isOpen, onClose }: FilePreviewProps) {
  const [imageError, setImageError] = useState(false);

  if (!attachment) return null;

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getFileType = (filename: string) => {
    const ext = getFileExtension(filename);
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
    if (['txt', 'md', 'json', 'xml', 'html'].includes(ext)) return 'text';
    return 'unknown';
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `/api/attachments/${attachment.id}/download`;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fileType = getFileType(attachment.filename);
  const fileExtension = getFileExtension(attachment.filename);

  const renderPreviewContent = () => {
    switch (fileType) {
      case 'image':
        return (
          <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg min-h-[400px]">
            {!imageError ? (
              <img
                src={`/api/attachments/${attachment.id}/download`}
                alt={attachment.filename}
                className="max-w-full max-h-[600px] object-contain rounded-lg"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="text-center p-8">
                <Image className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Unable to load image</p>
                <Button onClick={handleDownload} className="mt-4" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download to view
                </Button>
              </div>
            )}
          </div>
        );

      case 'pdf':
        return (
          <div className="text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <FileText className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">PDF Document</h3>
            <p className="text-muted-foreground mb-6">
              PDF files require external viewer for preview
            </p>
            <div className="space-x-2">
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open(`/api/attachments/${attachment.id}/download`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in new tab
              </Button>
            </div>
          </div>
        );

      case 'word':
        return (
          <div className="text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <FileText className="h-16 w-16 mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-semibold mb-2">Word Document</h3>
            <p className="text-muted-foreground mb-6">
              Microsoft Word documents require external application to view
            </p>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Document
            </Button>
          </div>
        );

      case 'excel':
        return (
          <div className="text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">Excel Spreadsheet</h3>
            <p className="text-muted-foreground mb-6">
              Excel files require external application to view
            </p>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Spreadsheet
            </Button>
          </div>
        );

      default:
        return (
          <div className="text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">File Preview Not Available</h3>
            <p className="text-muted-foreground mb-6">
              Preview not supported for .{fileExtension} files
            </p>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              {fileType === 'image' && <Image className="h-5 w-5" />}
              {fileType === 'pdf' && <FileText className="h-5 w-5 text-red-500" />}
              {fileType === 'word' && <FileText className="h-5 w-5 text-blue-500" />}
              {fileType === 'excel' && <FileSpreadsheet className="h-5 w-5 text-green-500" />}
              {fileType === 'unknown' && <FileText className="h-5 w-5" />}
              {attachment.filename}
            </DialogTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">
                .{fileExtension.toUpperCase()}
              </Badge>
              <span>{formatFileSize(attachment.fileSize)}</span>
              <span>•</span>
              <span>Uploaded {new Date(attachment.uploadedAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              data-testid="button-download-preview"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              data-testid="button-close-preview"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          {renderPreviewContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}