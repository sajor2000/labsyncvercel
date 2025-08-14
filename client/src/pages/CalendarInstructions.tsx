import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Calendar as CalendarIcon, Smartphone, Monitor, Globe, Info, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Lab {
  id: string;
  name: string;
}

export default function CalendarInstructions() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [selectedLab, setSelectedLab] = useState<string>("");
  
  const { data: labs, isLoading: labsLoading } = useQuery<Lab[]>({
    queryKey: ['/api/labs'],
    enabled: isAuthenticated,
  });

  const { data: integrationData, isLoading: integrationLoading } = useQuery({
    queryKey: ['/api/calendar/google-integration', selectedLab],
    enabled: isAuthenticated && !!selectedLab,
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  if (!isAuthenticated || labsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          {!isAuthenticated ? "Please sign in to view calendar instructions." : "Loading..."}
        </p>
      </div>
    );
  }

  const subscriptionUrl = integrationData?.subscriptionUrl || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Google Calendar Integration</h1>
        <p className="text-muted-foreground">
          Single Master Calendar approach - all lab events in one organized calendar
        </p>
      </div>

      {/* Integration Strategy Overview */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Single Master Calendar Strategy</AlertTitle>
        <AlertDescription>
          Instead of managing multiple separate calendars, all lab events appear in one master calendar with category prefixes like [PTO], [Clinical], [IRB], etc. This makes it easier to view your complete schedule while maintaining clear organization.
        </AlertDescription>
      </Alert>

      {/* Lab Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5" />
            Select Lab
          </CardTitle>
          <CardDescription>
            Choose which lab calendar you want to integrate with Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {labs?.map((lab) => (
              <Button
                key={lab.id}
                variant={selectedLab === lab.id ? "default" : "outline"}
                onClick={() => setSelectedLab(lab.id)}
                className="justify-start"
                data-testid={`select-lab-${lab.id}`}
              >
                {lab.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedLab && (
        <>
          {/* Integration Features */}
          {integrationData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  {integrationData.integration?.type || 'Calendar Integration'}
                </CardTitle>
                <CardDescription>
                  {integrationData.integration?.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Key Features:</h4>
                    <ul className="mt-2 space-y-1">
                      {integrationData.integration?.features?.map((feature: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center">
                          <CheckCircle className="mr-2 h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {integrationData.integration?.colorCoding && (
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <p className="text-sm">
                        <strong>Color Coding:</strong> {integrationData.integration.colorCoding}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription URL */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar Subscription URL</CardTitle>
              <CardDescription>
                Use this URL to subscribe to your {integrationData?.labName} calendar in any calendar application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                  {integrationLoading ? "Loading..." : subscriptionUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(subscriptionUrl, "Subscription URL")}
                  disabled={!subscriptionUrl}
                  data-testid="copy-subscription-url"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Platform Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Google Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-blue-600" />
                  Google Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  <li>1. Open Google Calendar in your web browser</li>
                  <li>2. Click the "+" next to "Other calendars" on the left</li>
                  <li>3. Select "From URL"</li>
                  <li>4. Paste the subscription URL above</li>
                  <li>5. Click "Add Calendar"</li>
                </ol>
                
                <div className="mt-4 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://calendar.google.com', '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Google Calendar
                  </Button>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                    <strong>Tip:</strong> After adding, events will appear with prefixes like [PTO], [Clinical] for easy identification
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Outlook */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="mr-2 h-5 w-5 text-blue-500" />
                  Outlook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  <li>1. Open Outlook calendar</li>
                  <li>2. Click "Add calendar" → "Subscribe from web"</li>
                  <li>3. Paste the subscription URL</li>
                  <li>4. Enter calendar name</li>
                  <li>5. Click "Import"</li>
                </ol>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => window.open('https://outlook.live.com/calendar', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Outlook
                </Button>
              </CardContent>
            </Card>

            {/* Apple Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="mr-2 h-5 w-5 text-gray-600" />
                  Apple Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  <li>1. Open Calendar app</li>
                  <li>2. Go to File → New Calendar Subscription</li>
                  <li>3. Paste the subscription URL</li>
                  <li>4. Set refresh frequency</li>
                  <li>5. Click "OK"</li>
                </ol>
              </CardContent>
            </Card>

            {/* Mobile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="mr-2 h-5 w-5 text-green-600" />
                  Mobile Apps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  <li>1. Open your calendar app</li>
                  <li>2. Look for "Add calendar" or "Subscribe"</li>
                  <li>3. Paste the subscription URL</li>
                  <li>4. Follow the app-specific prompts</li>
                </ol>
                <Badge variant="secondary" className="mt-2">
                  Works with most calendar apps
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Event Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Event Categories & Prefixes</CardTitle>
              <CardDescription>
                All events are categorized with clear prefixes for easy identification in your calendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Badge variant="outline" className="text-blue-700 border-blue-200">[PTO] Personal Time Off</Badge>
                <Badge variant="outline" className="text-teal-700 border-teal-200">[Clinical] Clinical Service</Badge>
                <Badge variant="outline" className="text-red-700 border-red-200">[Holiday] Lab Holidays</Badge>
                <Badge variant="outline" className="text-purple-700 border-purple-200">[Conference] Conferences</Badge>
                <Badge variant="outline" className="text-yellow-700 border-yellow-200">[Training] Training Events</Badge>
                <Badge variant="outline" className="text-gray-700 border-gray-200">[Meeting] Lab Meetings</Badge>
              </div>
              <div className="mt-4 p-4 bg-muted/20 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Smart Event Details:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• All-day events show with special visual indicators</li>
                  <li>• Multi-hour events display duration (e.g., "3h")</li>
                  <li>• Rich descriptions include lab context and metadata</li>
                  <li>• Automatic color coding by event type</li>
                  <li>• Real-time synchronization with lab calendar changes</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Integration Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Calendar Format:</strong> iCal (.ics) standard
                </div>
                <div>
                  <strong>Update Frequency:</strong> Automatic refresh every hour
                </div>
                <div>
                  <strong>Timezone:</strong> America/Chicago (Central Time)
                </div>
                <div>
                  <strong>Supported Features:</strong> All-day events, multi-day events, recurring events, categories, colors
                </div>
                <div>
                  <strong>Compatibility:</strong> Google Calendar, Outlook, Apple Calendar, and most other calendar applications
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}