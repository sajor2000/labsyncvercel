import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, ExternalLink, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLabContext } from "@/hooks/useLabContext";

interface GoogleCalendarEmbedProps {
  height?: number;
  showHeader?: boolean;
  enableSync?: boolean;
}

export function GoogleCalendarEmbed({ 
  height = 600, 
  showHeader = true, 
  enableSync = true 
}: GoogleCalendarEmbedProps) {
  const { toast } = useToast();
  const { selectedLab } = useLabContext();
  const [showEmbed, setShowEmbed] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Get Google Calendar embed URL
  const { data: embedData, isLoading } = useQuery<{ embedUrl: string }>({
    queryKey: ['/api/google-calendar/embed-url'],
    enabled: !!selectedLab?.id,
  });

  // Fetch combined events from Google Calendar and LabSync
  const { data: events = [], refetch: refetchEvents } = useQuery<any[]>({
    queryKey: ['/api/google-calendar/events', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const handleSyncRefresh = async () => {
    setSyncInProgress(true);
    try {
      await refetchEvents();
      toast({
        title: "Calendar Synced",
        description: "Google Calendar and LabSync events are now synchronized",
      });
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "Failed to sync calendar data",
        variant: "destructive",
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  const openInGoogleCalendar = () => {
    window.open("https://calendar.google.com/calendar/u/0?cid=riccclabs@gmail.com", "_blank");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading calendar integration...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const googleEvents = events.filter((event: any) => event.source === 'google');
  const labSyncEvents = events.filter((event: any) => event.source === 'labsync');

  return (
    <div className="space-y-4">
      {showHeader && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                📅 Google Calendar Integration
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {googleEvents.length} Google Events
                </Badge>
                <Badge variant="outline" className="bg-teal-50 text-teal-700">
                  {labSyncEvents.length} LabSync Events
                </Badge>
              </div>
            </CardTitle>
            <CardDescription>
              🔄 Two-way sync between riccclabs@gmail.com and your LabSync calendar • Real-time updates and smart event categorization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleSyncRefresh} 
                disabled={syncInProgress}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncInProgress ? 'animate-spin' : ''}`} />
                {syncInProgress ? 'Syncing...' : 'Refresh Sync'}
              </Button>
              
              <Button 
                onClick={() => setShowEmbed(!showEmbed)}
                variant="outline"
                size="sm"
              >
                {showEmbed ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showEmbed ? 'Hide Calendar' : 'Show Calendar'}
              </Button>
              
              <Button 
                onClick={openInGoogleCalendar}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Google
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="embedded" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="embedded">Embedded View</TabsTrigger>
          <TabsTrigger value="sync-status">Sync Status</TabsTrigger>
          <TabsTrigger value="events">Event List</TabsTrigger>
        </TabsList>

        <TabsContent value="embedded">
          <Card>
            <CardContent className="p-0">
              {showEmbed && embedData?.embedUrl ? (
                <iframe
                  src={embedData.embedUrl}
                  style={{ 
                    border: 0,
                    width: '100%',
                    height: `${height}px`,
                  }}
                  frameBorder="0"
                  scrolling="no"
                  title="RICCC Labs Google Calendar"
                  className="rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                  <div className="text-center">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {showEmbed ? 'Calendar embed not available' : 'Calendar hidden'}
                    </p>
                    {!showEmbed && (
                      <Button 
                        onClick={() => setShowEmbed(true)}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        Show Calendar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync-status">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Status</CardTitle>
              <CardDescription>
                Real-time sync between Google Calendar and LabSync
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Google Calendar Events</h4>
                    <Badge variant="secondary">{googleEvents.length}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Events pulled from riccclabs@gmail.com
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">LabSync Events</h4>
                    <Badge variant="secondary">{labSyncEvents.length}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tasks, deadlines, and meetings from LabSync
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Integration Features</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Real-time event synchronization</li>
                  <li>✓ Two-way data flow (Google ↔ LabSync)</li>
                  <li>✓ Automatic event categorization</li>
                  <li>✓ Smart conflict resolution</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Combined Event List</CardTitle>
              <CardDescription>
                All events from Google Calendar and LabSync in one view
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No events found</p>
                  </div>
                ) : (
                  events.map((event: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{event.title}</h4>
                          <Badge 
                            variant={event.source === 'google' ? 'default' : 'secondary'}
                          >
                            {event.source === 'google' ? 'Google' : 'LabSync'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.startDate).toLocaleDateString()} 
                          {event.allDay ? ' (All day)' : ` at ${new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                        {event.location && (
                          <p className="text-sm text-muted-foreground">📍 {event.location}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}