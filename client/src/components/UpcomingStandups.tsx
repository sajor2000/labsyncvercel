import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { StandupMeeting } from "@shared/schema";

// Pretty labels for meeting types
const meetingTypeLabels: Record<string, string> = {
  DAILY_STANDUP: "Daily Standup",
  WEEKLY_REVIEW: "Weekly Review", 
  MONTHLY_REVIEW: "Monthly Review",
  PROJECT_KICKOFF: "Project Kickoff",
  PROJECT_SYNC: "Project Sync",
  STUDY_REVIEW: "Study Review",
  RETROSPECTIVE: "Retrospective",
  OTHER: "Other"
};

export default function UpcomingStandups() {
  const { data: standups = [], isLoading } = useQuery<StandupMeeting[]>({
    queryKey: ['/api/standups'],
  });

  // Filter for upcoming standups and take only the next 3
  const now = new Date();
  const upcomingStandups = standups
    .filter(standup => new Date(standup.meetingDate) >= now)
    .sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime())
    .slice(0, 3);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Standups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="h-4 w-40 bg-muted animate-pulse rounded mb-2"></div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
                      <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
                    </div>
                  </div>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Standups</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingStandups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No upcoming standups</p>
              <p className="text-sm text-muted-foreground mt-1">Schedule a standup to get started</p>
            </div>
          ) : (
            upcomingStandups.map((standup) => (
              <div key={standup.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Standup Meeting</h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{new Date(standup.meetingDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{new Date(standup.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>Team Meeting</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">
                      {standup.meetingType ? (meetingTypeLabels[standup.meetingType] || standup.meetingType).toLowerCase() : 'standup'}
                    </span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded mt-1">
                      Scheduled
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}