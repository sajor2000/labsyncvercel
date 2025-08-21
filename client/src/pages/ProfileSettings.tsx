import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Save, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

export default function ProfileSettings() {
  const { user } = useAuth() as { user: UserType | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);

  // Update email mutation
  const updateEmailMutation = useMutation({
    mutationFn: async (newEmail: string) => {
      return await apiRequest('/api/user/email', 'PUT', { email: newEmail });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Email updated successfully",
        description: "Your email address has been updated and will be used for notifications.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update email",
        description: error.message || "Please check your email format and try again.",
        variant: "destructive",
      });
    }
  });

  const handleEmailUpdate = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateEmailMutation.mutateAsync(email);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <User className="w-8 h-8 text-[#4C9A92]" />
          Profile Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Update your profile information and notification preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Address
            </CardTitle>
            <CardDescription>
              This email will be used for task notifications and system updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="max-w-md"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleEmailUpdate}
                disabled={isSaving || updateEmailMutation.isPending}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>Loading...</>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Email
                  </>
                )}
              </Button>
              
              {user?.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Current: {user.email}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Profile Information
                </p>
                <div className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                  <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
                  <p><strong>Current Email:</strong> {user?.email || 'Not set'}</p>
                  <p><strong>User ID:</strong> {user?.id}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}