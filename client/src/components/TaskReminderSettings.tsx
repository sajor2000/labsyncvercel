import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface ReminderPreferences {
  dailyReminders: boolean;
  weeklyDigest: boolean;
  overdueAlerts: boolean;
  reminderTime: string;
  digestDay: string;
}

export function TaskReminderSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current preferences
  const { data: preferences, isLoading } = useQuery<ReminderPreferences>({
    queryKey: ['/api/email-reminders/preferences'],
    queryFn: async () => {
      const response = await fetch('/api/email-reminders/preferences', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch preferences');
      return response.json();
    }
  });

  // Update preferences mutation
  const updatePreferences = useMutation({
    mutationFn: async (newPreferences: ReminderPreferences) => {
      const response = await fetch('/api/email-reminders/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newPreferences)
      });
      if (!response.ok) throw new Error('Failed to update preferences');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your email reminder preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-reminders/preferences'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not save your reminder preferences. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Send weekly digest mutation
  const sendWeeklyDigest = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/email-reminders/send-weekly-digest', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to send digest');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Digest Sent",
        description: "Your weekly task digest has been sent to your email.",
      });
    },
    onError: () => {
      toast({
        title: "Send Failed",
        description: "Could not send weekly digest. Please try again.",
        variant: "destructive",
      });
    }
  });

  const [localPreferences, setLocalPreferences] = useState<ReminderPreferences | null>(null);

  // Use local state if available, otherwise use fetched preferences
  const currentPreferences = localPreferences || preferences;

  const handlePreferenceChange = (key: keyof ReminderPreferences, value: string | boolean) => {
    if (!currentPreferences) return;
    
    const updated = { ...currentPreferences, [key]: value };
    setLocalPreferences(updated);
  };

  const handleSave = () => {
    if (localPreferences) {
      updatePreferences.mutate(localPreferences);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Reminder Settings</CardTitle>
          <CardDescription>Loading preferences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!currentPreferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Reminder Settings</CardTitle>
          <CardDescription>Unable to load preferences</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card data-testid="task-reminder-settings">
      <CardHeader>
        <CardTitle>📧 Email Reminder Settings</CardTitle>
        <CardDescription>
          Configure when and how you receive task reminder emails
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Daily Reminders */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="daily-reminders">Daily Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Get notified about tasks due tomorrow or overdue
            </p>
          </div>
          <Switch
            id="daily-reminders"
            data-testid="switch-daily-reminders"
            checked={currentPreferences.dailyReminders}
            onCheckedChange={(checked) => handlePreferenceChange('dailyReminders', checked)}
          />
        </div>

        {/* Reminder Time */}
        {currentPreferences.dailyReminders && (
          <div className="space-y-2">
            <Label htmlFor="reminder-time">Reminder Time</Label>
            <Select
              value={currentPreferences.reminderTime}
              onValueChange={(value) => handlePreferenceChange('reminderTime', value)}
            >
              <SelectTrigger data-testid="select-reminder-time">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="07:00">7:00 AM</SelectItem>
                <SelectItem value="08:00">8:00 AM</SelectItem>
                <SelectItem value="09:00">9:00 AM</SelectItem>
                <SelectItem value="10:00">10:00 AM</SelectItem>
                <SelectItem value="17:00">5:00 PM</SelectItem>
                <SelectItem value="18:00">6:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Weekly Digest */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="weekly-digest">Weekly Digest</Label>
            <p className="text-sm text-muted-foreground">
              Get a summary of upcoming tasks each week
            </p>
          </div>
          <Switch
            id="weekly-digest"
            data-testid="switch-weekly-digest"
            checked={currentPreferences.weeklyDigest}
            onCheckedChange={(checked) => handlePreferenceChange('weeklyDigest', checked)}
          />
        </div>

        {/* Digest Day */}
        {currentPreferences.weeklyDigest && (
          <div className="space-y-2">
            <Label htmlFor="digest-day">Digest Day</Label>
            <Select
              value={currentPreferences.digestDay}
              onValueChange={(value) => handlePreferenceChange('digestDay', value)}
            >
              <SelectTrigger data-testid="select-digest-day">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="tuesday">Tuesday</SelectItem>
                <SelectItem value="wednesday">Wednesday</SelectItem>
                <SelectItem value="thursday">Thursday</SelectItem>
                <SelectItem value="friday">Friday</SelectItem>
                <SelectItem value="sunday">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Overdue Alerts */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="overdue-alerts">Overdue Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Get urgent notifications for overdue tasks
            </p>
          </div>
          <Switch
            id="overdue-alerts"
            data-testid="switch-overdue-alerts"
            checked={currentPreferences.overdueAlerts}
            onCheckedChange={(checked) => handlePreferenceChange('overdueAlerts', checked)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!localPreferences || updatePreferences.isPending}
            data-testid="button-save-preferences"
            className="flex-1"
          >
            {updatePreferences.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => sendWeeklyDigest.mutate()}
            disabled={sendWeeklyDigest.isPending}
            data-testid="button-send-digest"
            className="flex-1"
          >
            {sendWeeklyDigest.isPending ? 'Sending...' : 'Send Weekly Digest Now'}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium mb-1">💡 How it works:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Daily reminders check for tasks due within 24-48 hours</li>
            <li>Weekly digests include all tasks due in the next 7 days</li>
            <li>Overdue alerts are sent for tasks past their due date</li>
            <li>All emails include beautiful HTML formatting with task details</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}