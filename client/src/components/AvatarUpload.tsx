import { useState, useRef } from "react";
import { Camera, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userName?: string;
  userId?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showUploadButton?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10", 
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

const containerSizeClasses = {
  sm: { width: '32px', height: '32px' },
  md: { width: '40px', height: '40px' },
  lg: { width: '64px', height: '64px' },
  xl: { width: '96px', height: '96px' },
};

export function AvatarUpload({
  currentAvatarUrl,
  userName,
  userId,
  size = "lg",
  showUploadButton = true,
  className = "",
}: AvatarUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
      const response = await apiRequest('POST', '/api/upload/avatar');
      const data = await response.json();
      console.log('Full response data:', data);
      console.log('Got upload URL:', data.uploadURL);

      if (!data.uploadURL) {
        throw new Error('No upload URL received from server');
      }

      // Upload file directly to the presigned URL
      console.log('Uploading file to:', data.uploadURL.substring(0, 100) + '...');
      const uploadResponse = await fetch(data.uploadURL, {
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
      const urlParts = data.uploadURL.split('/');
      const fileId = urlParts[urlParts.length - 1].split('?')[0];
      const normalizedPath = `/objects/avatars/${fileId}`;
      
      console.log('Normalized path:', normalizedPath);

      // Update user avatar in backend
      console.log('Updating user avatar...');
      await apiRequest('PUT', '/api/auth/avatar', { avatarUrl: normalizedPath });
      
      // Invalidate user data to refresh avatar
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });

      toast({
        title: "Success",
        description: "Avatar uploaded successfully",
      });

    } catch (error) {
      console.error('Upload error:', error);
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
    <div className={`relative inline-block ${className}`} style={containerSizeClasses[size]}>
      <Avatar className={`${sizeClasses[size]} ring-2 ring-background`}>
        <AvatarImage 
          src={currentAvatarUrl} 
          alt={userName || "User avatar"}
          style={{ objectFit: 'cover' }}
        />
        <AvatarFallback className="bg-muted">
          {userName ? getInitials(userName) : <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {showUploadButton && (
        <div className="absolute -bottom-1 -right-1 z-10">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={handleCameraClick}
            className="h-6 w-6 rounded-full p-0 bg-primary hover:bg-primary/90 border-2 border-background shadow-md"
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