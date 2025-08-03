import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const mockStudies = [
  {
    id: "1",
    title: "COVID-19 Long-term Effects Study",
    status: "ACTIVE" as const,
    progress: 75,
    lastUpdated: "2024-01-10",
  },
  {
    id: "2", 
    title: "Diabetes Prevention Trial",
    status: "RECRUITING" as const,
    progress: 30,
    lastUpdated: "2024-01-09",
  },
  {
    id: "3",
    title: "Cardiovascular Health Assessment",
    status: "ANALYZING" as const,
    progress: 90,
    lastUpdated: "2024-01-08",
  },
];

const statusColors = {
  ACTIVE: "bg-green-100 text-green-800",
  RECRUITING: "bg-blue-100 text-blue-800",
  ANALYZING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  PAUSED: "bg-red-100 text-red-800",
};

export default function RecentStudies() {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Studies</span>
          <Button variant="ghost" size="sm">
            View All <ExternalLink className="h-4 w-4 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockStudies.map((study) => (
            <div
              key={study.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              data-testid={`study-${study.id}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 line-clamp-2">
                  {study.title}
                </h4>
                <Badge className={statusColors[study.status]} variant="secondary">
                  {study.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{study.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${study.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(study.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}