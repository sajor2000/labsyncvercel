import { useState } from "react";
import { Camera, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { UploadResult } from "@uppy/core";

interface TeamMemberAvatarUploadProps {
  currentAvatarUrl?: string;
  userName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showUploadButton?: boolean;
  className?: string;
  onAvatarChange?: (avatarUrl: string) => void;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10", 
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

export function TeamMemberAvatarUpload({
  currentAvatarUrl,
  userName,
  size = "lg",
  showUploadButton = true,
  className = "",
  onAvatarChange,
}: TeamMemberAvatarUploadProps) {
  const { toast } = useToast();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest('POST', '/api/upload/avatar') as any;
      return {
        method: 'PUT' as const,
        url: response.uploadURL,
      };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get upload URL",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    setUploadingAvatar(true);
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const avatarUrl = (uploadedFile as any).uploadURL;
      if (avatarUrl && onAvatarChange) {
        // Normalize the path for team member avatars
        const normalizedPath = `/objects/avatars/${avatarUrl.split('/').pop()}`;
        onAvatarChange(normalizedPath);
        setUploadingAvatar(false);
        toast({
          title: "Success",
          description: "Avatar uploaded successfully",
        });
      }
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`relative ${className}`}>
      <Avatar className={`${sizeClasses[size]} ring-2 ring-background`}>
        <AvatarImage 
          src={currentAvatarUrl} 
          alt={userName || "Team member avatar"}
          className="object-cover"
        />
        <AvatarFallback className="bg-muted">
          {userName ? getInitials(userName) : <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {showUploadButton && (
        <div className="absolute -bottom-1 -right-1">
          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={5242880} // 5MB
            allowedFileTypes={['.jpg', '.jpeg', '.png']}
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="h-6 w-6 rounded-full p-0 bg-primary hover:bg-primary/90 border-2 border-background"
          >
            <Camera className="h-3 w-3 text-primary-foreground" />
          </ObjectUploader>
        </div>
      )}

      {uploadingAvatar && (
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
}