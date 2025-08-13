import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailNotificationPreview } from "@/components/EmailNotificationPreview";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Bell, BellOff, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

export default function EmailSettings() {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const [emailPreferences, setEmailPreferences] = useState({
    taskAssignments: true,
    deadlineReminders: true,
    standupSummaries: true,
    weeklyDigest: false,
  });
  const [sendingTest, setSendingTest] = useState(false);

  // Example data for preview
  const previewData = {
    assignerName: "Dr. J.C. Rojas",
    assigneeName: user?.firstName || "Team Member",
    taskTitle: "Review IRB submission for COVID-19 study",
    taskDescription: "Please review the IRB submission documents and provide feedback on the study protocol by end of week.",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    labName: "RICCC",
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    try {
      // In a real implementation, this would call an API endpoint to send a test email
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      toast({
        title: "Test email sent!",
        description: `A test notification has been sent to ${user?.email}`,
      });
    } catch (error) {
      toast({
        title: "Failed to send test email",
        description: "Please check your email settings and try again.",
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handlePreferenceChange = (preference: keyof typeof emailPreferences) => {
    setEmailPreferences(prev => ({
      ...prev,
      [preference]: !prev[preference],
    }));
    
    toast({
      title: "Preference updated",
      description: "Your email notification preferences have been saved.",
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <Mail className="w-8 h-8 text-[#6264A7]" />
          Email Notification Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure how you receive task assignment notifications and other updates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose which email notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="task-assignments" className="font-medium">
                    Task Assignments
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get notified when someone assigns you a task
                  </p>
                </div>
                <Switch
                  id="task-assignments"
                  checked={emailPreferences.taskAssignments}
                  onCheckedChange={() => handlePreferenceChange('taskAssignments')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="deadline-reminders" className="font-medium">
                    Deadline Reminders
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive reminders about upcoming task deadlines
                  </p>
                </div>
                <Switch
                  id="deadline-reminders"
                  checked={emailPreferences.deadlineReminders}
                  onCheckedChange={() => handlePreferenceChange('deadlineReminders')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="standup-summaries" className="font-medium">
                    Standup Summaries
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get AI-generated summaries after standup meetings
                  </p>
                </div>
                <Switch
                  id="standup-summaries"
                  checked={emailPreferences.standupSummaries}
                  onCheckedChange={() => handlePreferenceChange('standupSummaries')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="weekly-digest" className="font-medium">
                    Weekly Digest
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive a weekly summary of lab activities
                  </p>
                </div>
                <Switch
                  id="weekly-digest"
                  checked={emailPreferences.weeklyDigest}
                  onCheckedChange={() => handlePreferenceChange('weeklyDigest')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Notifications</CardTitle>
              <CardDescription>
                Send yourself a test email to see how notifications will appear
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleSendTestEmail}
                disabled={sendingTest || !emailPreferences.taskAssignments}
                className="w-full"
              >
                {sendingTest ? (
                  <>Loading...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>
              {!emailPreferences.taskAssignments && (
                <p className="text-sm text-amber-600 mt-2">
                  Enable task assignment notifications to send a test email
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Email Preview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>
                This is how your task assignment notifications will appear
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="scale-90 origin-top">
                <EmailNotificationPreview {...previewData} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Messages */}
      <div className="mt-8">
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {emailPreferences.taskAssignments ? (
                <>
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Email notifications are active
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      You'll receive Microsoft Planner-style notifications when tasks are assigned to you.
                      Emails will be sent to: <span className="font-medium">{user?.email}</span>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <BellOff className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      Email notifications are disabled
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Enable task assignment notifications to receive emails when tasks are assigned to you.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}