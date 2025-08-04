import { useState, useRef } from "react";
import { Camera, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5242880) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      // Get upload URL
      console.log('Getting upload URL...');
      const response = await apiRequest('POST', '/api/upload/avatar') as any;
      console.log('Full response:', response);
      console.log('Got upload URL:', response.uploadURL);

      if (!response.uploadURL) {
        throw new Error('No upload URL received from server');
      }

      // Upload file directly to the presigned URL
      console.log('Uploading file to:', response.uploadURL.substring(0, 100) + '...');
      const uploadResponse = await fetch(response.uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      console.log('Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed with response:', errorText);
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      console.log('Upload successful');

      // Extract file ID from upload URL
      const urlParts = response.uploadURL.split('/');
      const fileId = urlParts[urlParts.length - 1].split('?')[0];
      const normalizedPath = `/objects/avatars/${fileId}`;
      
      console.log('Normalized path:', normalizedPath);

      if (onAvatarChange) {
        console.log('Calling onAvatarChange with:', normalizedPath);
        onAvatarChange(normalizedPath);
      }

      toast({
        title: "Success",
        description: "Avatar uploaded successfully",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCameraClick = () => {
    console.log('Camera button clicked');
    if (!fileInputRef.current) {
      console.error('File input ref is null');
      return;
    }
    console.log('Triggering file input click');
    fileInputRef.current.click();
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={handleCameraClick}
            className="h-6 w-6 rounded-full p-0 bg-primary hover:bg-primary/90 border-2 border-background"
            disabled={uploadingAvatar}
          >
            <Camera className="h-3 w-3 text-primary-foreground" />
          </Button>
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