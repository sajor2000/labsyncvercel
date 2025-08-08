import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings as SettingsIcon, Moon, Sun, Bell, Shield, Database, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface UserSettings {
  notifications: {
    email: boolean;
    inApp: boolean;
    deadlines: boolean;
    standups: boolean;
    taskAssignments: boolean;
  };
  preferences: {
    theme: "light" | "dark" | "system";
    language: string;
    timezone: string;
    defaultLabView: string;
  };
  privacy: {
    profileVisibility: "public" | "team" | "private";
    activityTracking: boolean;
    dataExport: boolean;
  };
}

export default function Settings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ['/api/auth/settings'],
    placeholderData: {
      notifications: {
        email: true,
        inApp: true,
        deadlines: true,
        standups: true,
        taskAssignments: true,
      },
      preferences: {
        theme: theme as "light" | "dark" | "system",
        language: "en",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        defaultLabView: "overview",
      },
      privacy: {
        profileVisibility: "team" as const,
        activityTracking: true,
        dataExport: true,
      },
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      return apiRequest('/api/auth/settings', {
        method: 'PUT',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/settings'] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/auth/export-data', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Data export initiated. You'll receive an email when ready.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/auth/delete-account', {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      // Redirect to logout
      window.location.href = "/api/logout";
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNotificationSetting = (key: keyof UserSettings['notifications'], value: boolean) => {
    if (!settings) return;
    const updatedSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const updatePreferenceSetting = (key: keyof UserSettings['preferences'], value: string) => {
    if (!settings) return;
    
    // Handle theme change specially
    if (key === 'theme') {
      setTheme(value as "light" | "dark" | "system");
    }
    
    const updatedSettings = {
      ...settings,
      preferences: {
        ...settings.preferences,
        [key]: value,
      },
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const updatePrivacySetting = (key: keyof UserSettings['privacy'], value: boolean | string) => {
    if (!settings) return;
    const updatedSettings = {
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: value,
      },
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-32"></div>
              <div className="h-4 bg-muted rounded w-64"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-40"></div>
                  <div className="h-6 bg-muted rounded w-12"></div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Unable to load settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and privacy settings</p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you want to receive notifications about lab activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.notifications.email}
              onCheckedChange={(checked) => updateNotificationSetting('email', checked)}
              data-testid="switch-email-notifications"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="in-app-notifications">In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">Show notifications within the application</p>
            </div>
            <Switch
              id="in-app-notifications"
              checked={settings.notifications.inApp}
              onCheckedChange={(checked) => updateNotificationSetting('inApp', checked)}
              data-testid="switch-in-app-notifications"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="deadline-notifications">Deadline Reminders</Label>
              <p className="text-sm text-muted-foreground">Get notified about upcoming deadlines</p>
            </div>
            <Switch
              id="deadline-notifications"
              checked={settings.notifications.deadlines}
              onCheckedChange={(checked) => updateNotificationSetting('deadlines', checked)}
              data-testid="switch-deadline-notifications"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="standup-notifications">Standup Reminders</Label>
              <p className="text-sm text-muted-foreground">Receive reminders for standup meetings</p>
            </div>
            <Switch
              id="standup-notifications"
              checked={settings.notifications.standups}
              onCheckedChange={(checked) => updateNotificationSetting('standups', checked)}
              data-testid="switch-standup-notifications"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="task-notifications">Task Assignments</Label>
              <p className="text-sm text-muted-foreground">Get notified when tasks are assigned to you</p>
            </div>
            <Switch
              id="task-notifications"
              checked={settings.notifications.taskAssignments}
              onCheckedChange={(checked) => updateNotificationSetting('taskAssignments', checked)}
              data-testid="switch-task-notifications"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="mr-2 h-5 w-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Customize your LabSync experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="theme-select">Theme</Label>
              <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
            </div>
            <Select
              value={settings.preferences.theme}
              onValueChange={(value) => updatePreferenceSetting('theme', value)}
            >
              <SelectTrigger className="w-32" data-testid="select-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center">
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center">
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="language-select">Language</Label>
              <p className="text-sm text-muted-foreground">Select your preferred language</p>
            </div>
            <Select
              value={settings.preferences.language}
              onValueChange={(value) => updatePreferenceSetting('language', value)}
            >
              <SelectTrigger className="w-32" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="timezone-select">Timezone</Label>
              <p className="text-sm text-muted-foreground">Your local timezone for dates and times</p>
            </div>
            <Select
              value={settings.preferences.timezone}
              onValueChange={(value) => updatePreferenceSetting('timezone', value)}
            >
              <SelectTrigger className="w-48" data-testid="select-timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London Time</SelectItem>
                <SelectItem value="Europe/Paris">Paris Time</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Control your privacy and data sharing preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="profile-visibility">Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">Who can see your profile information</p>
            </div>
            <Select
              value={settings.privacy.profileVisibility}
              onValueChange={(value) => updatePrivacySetting('profileVisibility', value)}
            >
              <SelectTrigger className="w-32" data-testid="select-profile-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="team">Team Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="activity-tracking">Activity Tracking</Label>
              <p className="text-sm text-muted-foreground">Allow tracking of your activity for analytics</p>
            </div>
            <Switch
              id="activity-tracking"
              checked={settings.privacy.activityTracking}
              onCheckedChange={(checked) => updatePrivacySetting('activityTracking', checked)}
              data-testid="switch-activity-tracking"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export or delete your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Export Your Data</Label>
              <p className="text-sm text-muted-foreground">
                Download a copy of all your LabSync data
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => exportDataMutation.mutate()}
              disabled={exportDataMutation.isPending}
              data-testid="button-export-data"
            >
              <Download className="mr-2 h-4 w-4" />
              {exportDataMutation.isPending ? "Exporting..." : "Export Data"}
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-destructive">Delete Account</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" data-testid="button-delete-account">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Account</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete your account? This action cannot be undone.
                    All your data, including studies, tasks, and profile information, will be permanently deleted.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                    data-testid="button-cancel-delete"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      deleteAccountMutation.mutate();
                      setShowDeleteDialog(false);
                    }}
                    disabled={deleteAccountMutation.isPending}
                    data-testid="button-confirm-delete"
                  >
                    {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <SettingsIcon className="h-4 w-4" />
        <AlertDescription>
          Changes to your settings are automatically saved. Some changes may require you to refresh the page to take effect.
        </AlertDescription>
      </Alert>
    </div>
  );
}