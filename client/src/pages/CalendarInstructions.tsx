import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Copy, 
  ExternalLink, 
  Info,
  CheckCircle,
  Download
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function CalendarInstructions() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Example URLs for demonstration - in practice, these would be generated for specific labs
  const exampleUrls = {
    riccc: "https://your-labsync-domain.replit.app/api/calendar/subscribe/riccc-lab-id",
    rhedas: "https://your-labsync-domain.replit.app/api/calendar/subscribe/rhedas-lab-id"
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
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
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="calendar-instructions-title">
          Calendar Subscription Setup
        </h1>
        <p className="text-muted-foreground">
          Subscribe to lab calendars in Outlook, Google Calendar, or other calendar applications
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>No authentication required!</strong> These calendar feeds are publicly accessible. 
          Anyone with the URL can subscribe to see lab deadlines, tasks, meetings, and milestones.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              RICCC Lab Calendar
            </CardTitle>
            <CardDescription>
              Research deadlines, tasks, and events for RICCC
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="riccc-url">Subscription URL</Label>
              <div className="flex gap-2">
                <Input
                  id="riccc-url"
                  value={exampleUrls.riccc}
                  readOnly
                  className="font-mono text-xs"
                  data-testid="input-riccc-url"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(exampleUrls.riccc)}
                  data-testid="button-copy-riccc"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              RHEDAS Lab Calendar
            </CardTitle>
            <CardDescription>
              Research deadlines, tasks, and events for RHEDAS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rhedas-url">Subscription URL</Label>
              <div className="flex gap-2">
                <Input
                  id="rhedas-url"
                  value={exampleUrls.rhedas}
                  readOnly
                  className="font-mono text-xs"
                  data-testid="input-rhedas-url"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(exampleUrls.rhedas)}
                  data-testid="button-copy-rhedas"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            Follow these steps to add lab calendars to your preferred application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="outlook" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="outlook">Outlook</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
              <TabsTrigger value="apple">Apple</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>
            
            <TabsContent value="outlook" className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Microsoft Outlook
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Open Outlook and go to the <strong>Calendar</strong> view</li>
                  <li>Click <strong>"Add Calendar"</strong> or <strong>"Subscribe to Calendar"</strong></li>
                  <li>Select <strong>"From Internet"</strong> or <strong>"From URL"</strong></li>
                  <li>Paste the subscription URL from above</li>
                  <li>Give your calendar a name (e.g., "RICCC Research Calendar")</li>
                  <li>Click <strong>"Subscribe"</strong> or <strong>"Add"</strong></li>
                </ol>
                <Alert className="mt-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    The calendar will appear in your "Other Calendars" section and refresh automatically every hour.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
            
            <TabsContent value="google" className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-medium mb-3">Google Calendar</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Open <strong>Google Calendar</strong></li>
                  <li>Click the <strong>"+"</strong> next to "Other calendars"</li>
                  <li>Select <strong>"From URL"</strong></li>
                  <li>Paste the subscription URL</li>
                  <li>Click <strong>"Add calendar"</strong></li>
                </ol>
                <Alert className="mt-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Events will appear in your calendar within a few minutes and update automatically.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
            
            <TabsContent value="apple" className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <h4 className="font-medium mb-3">Apple Calendar</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Open the <strong>Calendar</strong> app</li>
                  <li>Go to <strong>File → New Calendar Subscription</strong></li>
                  <li>Paste the subscription URL</li>
                  <li>Click <strong>"Subscribe"</strong></li>
                  <li>Configure refresh frequency and click <strong>"OK"</strong></li>
                </ol>
                <Alert className="mt-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Choose "Every hour" for refresh frequency to get the latest updates quickly.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
            
            <TabsContent value="other" className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-medium mb-3">Other Calendar Apps</h4>
                <p className="text-sm mb-3">
                  Most calendar applications support iCal/ICS subscriptions. Look for options like:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm mb-3">
                  <li><strong>"Subscribe to calendar"</strong></li>
                  <li><strong>"Add calendar from URL"</strong></li>
                  <li><strong>"Import calendar"</strong></li>
                  <li><strong>"Add external calendar"</strong></li>
                </ul>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    The URLs provide standard iCal feeds that work with any calendar application supporting the format.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What Gets Synced</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                📅 Research Deadlines
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Grant applications (NIH, NSF, etc.)</li>
                <li>• Paper submissions to journals</li>
                <li>• IRB renewals and submissions</li>
                <li>• Conference abstract deadlines</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                ✅ Tasks & Milestones
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Task due dates with assignees</li>
                <li>• Study milestones and targets</li>
                <li>• Project deliverables</li>
                <li>• Research checkpoints</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                🎤 Meetings
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Standup meetings</li>
                <li>• Team check-ins</li>
                <li>• Progress reviews</li>
                <li>• Collaboration sessions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                🎯 Study Events
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Patient enrollment targets</li>
                <li>• Data collection deadlines</li>
                <li>• Analysis milestones</li>
                <li>• Publication goals</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Automatic Updates:</strong> All calendars refresh every hour automatically. 
          New deadlines, tasks, and events will appear in your subscribed calendar without any manual action required.
        </AlertDescription>
      </Alert>
    </div>
  );
}