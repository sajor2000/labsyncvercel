import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users } from "lucide-react";

const mockStandups = [
  {
    id: "1",
    title: "Weekly Research Update",
    date: "2024-01-12",
    time: "10:00 AM",
    participants: 8,
  },
  {
    id: "2",
    title: "Data Analysis Review",
    date: "2024-01-15",
    time: "2:00 PM", 
    participants: 5,
  },
];

export default function UpcomingStandups() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Standups</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockStandups.map((standup) => (
            <div key={standup.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{standup.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(standup.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {standup.time}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {standup.participants}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">Join</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}