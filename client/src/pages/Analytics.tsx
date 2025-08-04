import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, Calendar, CheckCircle, Clock, Target, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLabContext } from "@/hooks/useLabContext";

interface AnalyticsData {
  totalStudies: number;
  activeStudies: number;
  completedStudies: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalTeamMembers: number;
  activeTeamMembers: number;
  upcomingDeadlines: number;
  standupCompletionRate: number;
  averageTaskCompletionTime: number;
  studyCompletionRate: number;
}

export default function Analytics() {
  const { selectedLab } = useLabContext();

  const { data: studies = [] } = useQuery({
    queryKey: ['/api/studies', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['/api/team-members'],
  });

  const { data: deadlines = [] } = useQuery({
    queryKey: ['/api/deadlines', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: standups = [] } = useQuery({
    queryKey: ['/api/standups', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  // Calculate analytics
  const analytics: AnalyticsData = {
    totalStudies: studies.length,
    activeStudies: studies.filter((s: any) => s.status === 'active').length,
    completedStudies: studies.filter((s: any) => s.status === 'completed').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
    overdueTasks: tasks.filter((t: any) => {
      return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed';
    }).length,
    totalTeamMembers: teamMembers.length,
    activeTeamMembers: teamMembers.filter((m: any) => m.status === 'active').length,
    upcomingDeadlines: deadlines.filter((d: any) => {
      const dueDate = new Date(d.dueDate);
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return dueDate > now && dueDate <= thirtyDaysFromNow;
    }).length,
    standupCompletionRate: standups.length > 0 
      ? (standups.filter((s: any) => s.status === 'completed').length / standups.length) * 100 
      : 0,
    averageTaskCompletionTime: 5.2, // Mock data - would be calculated from actual task data
    studyCompletionRate: studies.length > 0 
      ? (analytics.completedStudies / studies.length) * 100 
      : 0,
  };

  const metricCards = [
    {
      title: "Total Studies",
      value: analytics.totalStudies,
      change: "+12%",
      changeType: "positive" as const,
      icon: BarChart3,
      description: `${analytics.activeStudies} active, ${analytics.completedStudies} completed`,
    },
    {
      title: "Task Completion",
      value: `${analytics.completedTasks}/${analytics.totalTasks}`,
      change: "+8%",
      changeType: "positive" as const,
      icon: CheckCircle,
      description: `${analytics.overdueTasks} overdue tasks`,
    },
    {
      title: "Team Members",
      value: analytics.activeTeamMembers,
      change: "0%",
      changeType: "neutral" as const,
      icon: Users,
      description: `${analytics.totalTeamMembers} total members`,
    },
    {
      title: "Upcoming Deadlines",
      value: analytics.upcomingDeadlines,
      change: "-5%",
      changeType: "positive" as const,
      icon: Calendar,
      description: "Next 30 days",
    },
  ];

  const progressMetrics = [
    {
      title: "Study Completion Rate",
      value: analytics.studyCompletionRate,
      target: 85,
      icon: Target,
      color: "bg-blue-500",
    },
    {
      title: "Standup Completion Rate",
      value: analytics.standupCompletionRate,
      target: 90,
      icon: Zap,
      color: "bg-green-500",
    },
    {
      title: "Task Progress",
      value: analytics.totalTasks > 0 ? (analytics.completedTasks / analytics.totalTasks) * 100 : 0,
      target: 75,
      icon: Clock,
      color: "bg-purple-500",
    },
  ];

  if (!selectedLab) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a lab to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track lab performance and research progress</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} data-testid={`metric-card-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`metric-value-${index}`}>
                  {metric.value}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={metric.changeType === "positive" ? "default" : "secondary"}
                    className={
                      metric.changeType === "positive" 
                        ? "bg-green-500 text-white" 
                        : metric.changeType === "negative"
                        ? "bg-red-500 text-white"
                        : "bg-gray-500 text-white"
                    }
                  >
                    {metric.changeType === "positive" && <TrendingUp className="mr-1 h-3 w-3" />}
                    {metric.change}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {progressMetrics.map((metric, index) => {
          const Icon = metric.icon;
          const percentage = Math.min(metric.value, 100);
          const isOnTarget = percentage >= metric.target;
          
          return (
            <Card key={index} data-testid={`progress-card-${index}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold" data-testid={`progress-value-${index}`}>
                      {percentage.toFixed(1)}%
                    </span>
                    <Badge variant={isOnTarget ? "default" : "secondary"}>
                      Target: {metric.target}%
                    </Badge>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="w-full"
                    data-testid={`progress-bar-${index}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    {isOnTarget ? "✓ On target" : `${(metric.target - percentage).toFixed(1)}% below target`}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Study Status Overview</CardTitle>
            <CardDescription>Current status of all studies in the lab</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['planning', 'active', 'on_hold', 'completed'].map((status) => {
                const count = studies.filter((s: any) => s.status === status).length;
                const percentage = studies.length > 0 ? (count / studies.length) * 100 : 0;
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {status.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
            <CardDescription>Tasks across different stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['todo', 'in_progress', 'review', 'completed'].map((status) => {
                const count = tasks.filter((t: any) => t.status === status).length;
                const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {status.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}