import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLabContext } from "@/hooks/useLabContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Copy, 
  ExternalLink, 
  Info, 
  RefreshCw,
  CheckCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SubscriptionData {
  subscriptionUrl: string;
  instructions: {
    outlook: string;
    google: string;
    apple: string;
    general: string;
  };
}

export function CalendarSubscription() {
  const { selectedLab } = useLabContext();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateUrlMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/calendar/subscription-url/${selectedLab?.id}`, "GET");
    },
    onSuccess: (data) => {
      setSubscriptionData(data);
      toast({
        title: "Calendar URL Generated",
        description: "You can now subscribe to this calendar in Outlook and other calendar apps",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Generate URL",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const copyToClipboard = async () => {
    if (subscriptionData?.subscriptionUrl) {
      try {
        await navigator.clipboard.writeText(subscriptionData.subscriptionUrl);
        setCopied(true);
        toast({
          title: "URL Copied",
          description: "Calendar subscription URL copied to clipboard",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Could not copy to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const openCalendarUrl = () => {
    if (subscriptionData?.subscriptionUrl) {
      window.open(subscriptionData.subscriptionUrl, '_blank');
    }
  };

  if (!selectedLab) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Please select a lab to generate calendar subscription
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Subscription
        </CardTitle>
        <CardDescription>
          Subscribe to {selectedLab.name}'s calendar in Outlook, Google Calendar, or other calendar apps
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!subscriptionData ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Generate a subscription URL to access your lab's deadlines, tasks, and events in your calendar app
            </p>
            <Button
              onClick={() => generateUrlMutation.mutate()}
              disabled={generateUrlMutation.isPending}
              data-testid="button-generate-calendar-url"
            >
              {generateUrlMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Generate Calendar URL
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Public calendar subscription URL generated! Anyone can use this URL to subscribe to {selectedLab.name}'s calendar. It updates automatically with your latest events.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="subscription-url">Subscription URL</Label>
              <div className="flex gap-2">
                <Input
                  id="subscription-url"
                  value={subscriptionData.subscriptionUrl}
                  readOnly
                  className="font-mono text-xs"
                  data-testid="input-subscription-url"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  data-testid="button-copy-url"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openCalendarUrl}
                  data-testid="button-open-calendar"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" data-testid="button-view-instructions">
                  <Info className="h-4 w-4 mr-2" />
                  View Setup Instructions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Calendar Subscription Setup</DialogTitle>
                  <DialogDescription>
                    Follow these instructions to add the calendar to your preferred app
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="outlook" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="outlook">Outlook</TabsTrigger>
                    <TabsTrigger value="google">Google</TabsTrigger>
                    <TabsTrigger value="apple">Apple</TabsTrigger>
                    <TabsTrigger value="general">Other</TabsTrigger>
                  </TabsList>
                  <TabsContent value="outlook" className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium mb-2">Microsoft Outlook</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Open Outlook and go to the Calendar view</li>
                        <li>Click "Add Calendar" or "Subscribe to Calendar"</li>
                        <li>Select "From Internet" or "From URL"</li>
                        <li>Paste the subscription URL</li>
                        <li>Give your calendar a name (e.g., "{selectedLab.name} Research")</li>
                        <li>Click "Subscribe" or "Add"</li>
                      </ol>
                    </div>
                  </TabsContent>
                  <TabsContent value="google" className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-medium mb-2">Google Calendar</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Open Google Calendar</li>
                        <li>Click the "+" next to "Other calendars"</li>
                        <li>Select "From URL"</li>
                        <li>Paste the subscription URL</li>
                        <li>Click "Add calendar"</li>
                      </ol>
                    </div>
                  </TabsContent>
                  <TabsContent value="apple" className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <h4 className="font-medium mb-2">Apple Calendar</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Open the Calendar app</li>
                        <li>Go to File → New Calendar Subscription</li>
                        <li>Paste the subscription URL</li>
                        <li>Click "Subscribe"</li>
                        <li>Configure refresh frequency and click "OK"</li>
                      </ol>
                    </div>
                  </TabsContent>
                  <TabsContent value="general" className="space-y-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <h4 className="font-medium mb-2">Other Calendar Apps</h4>
                      <p className="text-sm mb-2">
                        Most calendar applications support iCal/ICS subscriptions. Look for options like:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>"Subscribe to calendar"</li>
                        <li>"Add calendar from URL"</li>
                        <li>"Import calendar"</li>
                        <li>"Add external calendar"</li>
                      </ul>
                      <p className="text-sm mt-2 text-muted-foreground">
                        The URL provides a standard iCal feed that updates automatically.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>What gets synced:</strong> Deadlines, task due dates, standup meetings, and study milestones from {selectedLab.name} will appear in your calendar. The calendar updates automatically every hour. This is a public feed that anyone can subscribe to.
              </AlertDescription>
            </Alert>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubscriptionData(null);
                generateUrlMutation.mutate();
              }}
              className="w-full"
              data-testid="button-regenerate-url"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate URL
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}