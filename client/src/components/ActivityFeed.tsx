import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock } from "lucide-react";

const mockActivities = [
  {
    id: "1",
    user: "Dr. Sarah Chen",
    action: "completed task",
    target: "Patient data validation",
    time: "5 minutes ago",
    initials: "SC",
  },
  {
    id: "2",
    user: "Mike Johnson",
    action: "created study",
    target: "Hypertension Prevention Trial",
    time: "2 hours ago",
    initials: "MJ",
  },
  {
    id: "3",
    user: "Dr. Alex Kim",
    action: "scheduled standup",
    target: "Weekly Research Update",
    time: "4 hours ago",
    initials: "AK",
  },
];

export default function ActivityFeed() {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {activity.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user}</span>
                  {" "}
                  <span className="text-gray-600">{activity.action}</span>
                  {" "}
                  <span className="font-medium">{activity.target}</span>
                </p>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {activity.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}