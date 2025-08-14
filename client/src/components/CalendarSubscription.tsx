import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Calendar as CalendarIcon, Info, CheckCircle, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CalendarSubscriptionProps {
  labId: string;
  labName: string;
  compact?: boolean;
}

interface IntegrationData {
  subscriptionUrl: string;
  labName: string;
  integration?: {
    type: string;
    description: string;
    colorCoding: string;
    features: string[];
  };
}

export function CalendarSubscription({ labId, labName, compact = false }: CalendarSubscriptionProps) {
  const { toast } = useToast();

  const { data: integrationData, isLoading } = useQuery<IntegrationData>({
    queryKey: ['/api/calendar/google-integration', labId],
    enabled: !!labId,
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Loading calendar integration...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!integrationData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Calendar integration not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const subscriptionUrl = integrationData.subscriptionUrl;

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Subscribe to {labName} Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center space-x-2">
            <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
              {subscriptionUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(subscriptionUrl, "Calendar URL")}
              data-testid="copy-calendar-url"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Works with Google Calendar, Outlook, Apple Calendar, and mobile apps</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Integration Overview */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Single Master Calendar Integration</AlertTitle>
        <AlertDescription>
          {integrationData.integration?.description || 
           "All lab events appear in one calendar with category prefixes for easy organization"}
        </AlertDescription>
      </Alert>

      {/* Subscription URL */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar Subscription URL</CardTitle>
          <CardDescription>
            Copy this URL to subscribe to {labName} calendar in any calendar application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <code className="flex-1 p-3 bg-muted rounded text-sm font-mono break-all">
              {subscriptionUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(subscriptionUrl, "Calendar URL")}
              data-testid="copy-calendar-url"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Setup Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🌐 Google Calendar</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-3">
              Quick setup: Other calendars → From URL → Paste URL
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://calendar.google.com', '_blank')}
              data-testid="open-google-calendar"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Google Calendar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📱 Mobile & Others</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-3">
              Works with Outlook, Apple Calendar, and mobile apps
            </p>
            <Badge variant="secondary" className="text-xs">
              <Smartphone className="mr-1 h-3 w-3" />
              Universal iCal Support
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What's Included</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {integrationData.integration?.features?.map((feature: string, index: number) => (
              <div key={index} className="flex items-center text-xs">
                <CheckCircle className="mr-2 h-3 w-3 text-green-500 flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-1">
              Event Categories
            </h4>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">[PTO]</Badge>
              <Badge variant="outline" className="text-xs">[Clinical]</Badge>
              <Badge variant="outline" className="text-xs">[Holiday]</Badge>
              <Badge variant="outline" className="text-xs">[Conference]</Badge>
              <Badge variant="outline" className="text-xs">[Training]</Badge>
              <Badge variant="outline" className="text-xs">[Meeting]</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}