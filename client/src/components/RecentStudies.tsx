import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Study } from "@shared/schema";

const statusLabels = {
  PLANNING: "Planning",
  IRB_SUBMISSION: "IRB Submission",
  IRB_APPROVED: "IRB Approved",
  DATA_COLLECTION: "Data Collection",
  ANALYSIS: "Analysis",
  MANUSCRIPT: "Manuscript",
  UNDER_REVIEW: "Under Review",
  PUBLISHED: "Published",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
};

const statusColors = {
  PLANNING: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  IRB_SUBMISSION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  IRB_APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  DATA_COLLECTION: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  ANALYSIS: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  MANUSCRIPT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
  UNDER_REVIEW: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  ON_HOLD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

export default function RecentStudies() {
  const { data: studies = [], isLoading } = useQuery<Study[]>({
    queryKey: ['/api/studies'],
  });

  // Show only the 6 most recent studies
  const recentStudies = studies.slice(0, 6);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Studies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
                  <div className="h-5 w-20 bg-muted animate-pulse rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                    <div className="h-3 w-8 bg-muted animate-pulse rounded"></div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2"></div>
                  <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
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
        <CardTitle>Recent Studies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentStudies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No studies found</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first study to get started</p>
            </div>
          ) : (
            recentStudies.map((study) => (
              <div
                key={study.id}
                className="p-4 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                data-testid={`study-${study.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-foreground line-clamp-2">
                    {study.name}
                  </h4>
                  <Badge 
                    className={study.status ? statusColors[study.status] : statusColors.PLANNING} 
                    variant="secondary"
                  >
                    {study.status ? statusLabels[study.status] || study.status : statusLabels.PLANNING}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Status</span>
                    <span>{study.status ? statusLabels[study.status] || study.status : statusLabels.PLANNING}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {study.updatedAt ? new Date(study.updatedAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}