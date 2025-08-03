import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Users, CheckSquare, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  activeStudies: number;
  teamMembers: number;
  completedTasks: number;
  upcomingStandups: number;
}

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const statConfigs = [
    {
      title: "Active Studies",
      value: stats?.activeStudies ?? 0,
      change: "+2 this month",
      icon: FlaskConical,
      color: "text-primary",
    },
    {
      title: "Team Members",
      value: stats?.teamMembers ?? 0,
      change: "+3 new",
      icon: Users,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Completed Tasks",
      value: stats?.completedTasks ?? 0,
      change: "+12 today",
      icon: CheckSquare,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Upcoming Standups",
      value: stats?.upcomingStandups ?? 0,
      change: "This week",
      icon: Calendar,
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1"></div>
              <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statConfigs.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}