import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

// Mock data for action items
const mockActionItems = [
  {
    id: "1",
    description: "Review patient recruitment protocols",
    assignee: "Dr. Sarah Chen",
    dueDate: "2024-01-15",
    priority: "HIGH" as const,
    status: "OPEN" as const,
  },
  {
    id: "2",
    description: "Update IRB documentation",
    assignee: "Mike Johnson",
    dueDate: "2024-01-18",
    priority: "MEDIUM" as const,
    status: "IN_PROGRESS" as const,
  },
  {
    id: "3",
    description: "Schedule data analysis meeting",
    assignee: "Dr. Alex Kim",
    dueDate: "2024-01-20",
    priority: "LOW" as const,
    status: "COMPLETED" as const,
  },
];

const priorityIcons = {
  HIGH: AlertTriangle,
  MEDIUM: Clock,
  LOW: CheckCircle2,
  URGENT: AlertTriangle,
};

const priorityColors = {
  HIGH: "text-red-500",
  MEDIUM: "text-yellow-500", 
  LOW: "text-green-500",
  URGENT: "text-red-600",
};

const statusColors = {
  OPEN: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  BLOCKED: "bg-red-100 text-red-800",
};

export function ActionItems() {
  const { data: actionItems = [], isLoading } = useQuery({
    queryKey: ["/api/action-items"],
    enabled: false, // Disable for now since we're using mock data
  });

  // Use mock data for now
  const displayItems = mockActionItems;

  if (isLoading) {
    return <div>Loading action items...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Action Items</span>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">{displayItems.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayItems.map((item) => {
            const PriorityIcon = priorityIcons[item.priority];
            const isOverdue = new Date(item.dueDate) < new Date() && item.status !== "COMPLETED";
            
            return (
              <div
                key={item.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                data-testid={`action-item-${item.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <PriorityIcon 
                        className={`h-4 w-4 ${priorityColors[item.priority]}`} 
                      />
                      <span className="font-medium">{item.description}</span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Assigned to: {item.assignee}</span>
                      <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                        Due: {new Date(item.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span 
                      className={`px-2 py-1 rounded text-xs ${statusColors[item.status]}`}
                      data-testid={`status-${item.status.toLowerCase()}`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                    
                    {item.status !== "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        data-testid={`button-complete-${item.id}`}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {displayItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No action items found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}