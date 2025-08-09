import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, Calendar, CheckCircle, Clock, Target, Zap, FlaskConical, FolderOpen, AlertTriangle, Activity } from "lucide-react";
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
  totalBuckets: number;
  activeBuckets: number;
  totalIdeas: number;
  recentMeetings: number;
}

export default function Analytics() {
  const { selectedLab } = useLabContext();

  const { data: studies = [], isLoading: studiesLoading } = useQuery({
    queryKey: ['/api/studies', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ['/api/team-members'],
  });

  const { data: deadlines = [], isLoading: deadlinesLoading } = useQuery({
    queryKey: ['/api/deadlines', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: standups = [], isLoading: standupsLoading } = useQuery({
    queryKey: ['/api/standups', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: buckets = [], isLoading: bucketsLoading } = useQuery({
    queryKey: ['/api/buckets'],
  });

  const { data: ideas = [], isLoading: ideasLoading } = useQuery({
    queryKey: ['/api/ideas'],
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ['/api/standups/meetings', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  // Calculate analytics from real data
  const analytics: AnalyticsData = {
    totalStudies: studies.length,
    activeStudies: studies.filter((s: any) => s.status === 'active' || s.status === 'ongoing').length,
    completedStudies: studies.filter((s: any) => s.status === 'completed').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t: any) => t.status === 'completed' || t.status === 'done').length,
    overdueTasks: tasks.filter((t: any) => {
      return t.dueDate && new Date(t.dueDate) < new Date() && !['completed', 'done'].includes(t.status);
    }).length,
    totalTeamMembers: teamMembers.length,
    activeTeamMembers: teamMembers.filter((m: any) => m.status !== 'inactive').length,
    upcomingDeadlines: deadlines.filter((d: any) => {
      const dueDate = new Date(d.dueDate);
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return dueDate > now && dueDate <= thirtyDaysFromNow;
    }).length,
    standupCompletionRate: standups.length > 0 ? Math.round((standups.filter((s: any) => s.status === 'completed').length / standups.length) * 100) : 0,
    averageTaskCompletionTime: tasks.length > 0 ? Math.round(tasks.reduce((acc: number, task: any) => {
      if (task.completedAt && task.createdAt) {
        const completionTime = new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime();
        return acc + (completionTime / (1000 * 60 * 60 * 24)); // Days
      }
      return acc;
    }, 0) / tasks.filter((t: any) => t.completedAt).length) : 0,
    studyCompletionRate: studies.length > 0 ? Math.round((analytics.completedStudies / studies.length) * 100) : 0,
    totalBuckets: buckets.length,
    activeBuckets: buckets.filter((b: any) => b.isActive !== false).length,
    totalIdeas: ideas.length,
    recentMeetings: meetings.filter((m: any) => {
      const meetingDate = new Date(m.createdAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return meetingDate > thirtyDaysAgo;
    }).length,
  };

  const isLoading = studiesLoading || tasksLoading || teamLoading || deadlinesLoading || 
                   standupsLoading || bucketsLoading || ideasLoading || meetingsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-teal-600" />
          <h1 className="text-3xl font-bold">Lab Analytics Dashboard</h1>
        </div>
        <div className="text-center py-12">Loading analytics data...</div>
      </div>
    );
  }

  if (!selectedLab) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-teal-600" />
          <h1 className="text-3xl font-bold">Lab Analytics Dashboard</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Please select a lab to view analytics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const taskCompletionPercentage = analytics.totalTasks > 0 ? 
    Math.round((analytics.completedTasks / analytics.totalTasks) * 100) : 0;

  const studyProgressPercentage = analytics.totalStudies > 0 ? 
    Math.round((analytics.activeStudies / analytics.totalStudies) * 100) : 0;

  const teamUtilizationPercentage = analytics.totalTeamMembers > 0 ? 
    Math.round((analytics.activeTeamMembers / analytics.totalTeamMembers) * 100) : 0;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-teal-600" />
          <h1 className="text-3xl font-bold">Lab Analytics Dashboard</h1>
        </div>
        <Badge variant="outline" className="text-sm">
          {selectedLab?.name} • Real-time Data
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Studies</CardTitle>
            <FlaskConical className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalStudies}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              {analytics.completedStudies} completed • {analytics.activeStudies} active
            </div>
            <Progress value={studyProgressPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completedTasks}/{analytics.totalTasks}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              {taskCompletionPercentage}% completion rate
              {analytics.overdueTasks > 0 && (
                <span className="ml-2 text-red-500">• {analytics.overdueTasks} overdue</span>
              )}
            </div>
            <Progress value={taskCompletionPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeTeamMembers}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Activity className="h-3 w-3 mr-1 text-purple-500" />
              {teamUtilizationPercentage}% active • {analytics.totalTeamMembers} total
            </div>
            <Progress value={teamUtilizationPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.upcomingDeadlines}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3 mr-1 text-orange-500" />
              Next 30 days
              {analytics.overdueTasks > 0 && (
                <span className="ml-2 text-red-500">• {analytics.overdueTasks} overdue tasks</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Research Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-teal-600" />
              Research Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Study Completion</span>
                  <span className="text-sm text-muted-foreground">
                    {analytics.completedStudies} of {analytics.totalStudies}
                  </span>
                </div>
                <Progress value={analytics.studyCompletionRate} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Task Completion</span>
                  <span className="text-sm text-muted-foreground">
                    {analytics.completedTasks} of {analytics.totalTasks}
                  </span>
                </div>
                <Progress value={taskCompletionPercentage} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Standup Completion</span>
                  <span className="text-sm text-muted-foreground">
                    {analytics.standupCompletionRate}%
                  </span>
                </div>
                <Progress value={analytics.standupCompletionRate} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Resource Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Active Buckets</span>
                </div>
                <Badge variant="outline">{analytics.activeBuckets} / {analytics.totalBuckets}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Team Utilization</span>
                </div>
                <Badge variant="outline">{teamUtilizationPercentage}%</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Recent Meetings</span>
                </div>
                <Badge variant="outline">{analytics.recentMeetings} this month</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-teal-500" />
                  <span className="text-sm font-medium">Ideas Generated</span>
                </div>
                <Badge variant="outline">{analytics.totalIdeas} total</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lab Performance</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Overall Health</span>
              <Badge className={`${
                taskCompletionPercentage > 80 ? 'bg-green-100 text-green-800' : 
                taskCompletionPercentage > 60 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'
              }`}>
                {taskCompletionPercentage > 80 ? 'Excellent' : 
                 taskCompletionPercentage > 60 ? 'Good' : 'Needs Attention'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Avg. Task Time</span>
              <span className="text-sm font-medium">
                {analytics.averageTaskCompletionTime > 0 ? 
                  `${analytics.averageTaskCompletionTime} days` : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Meeting Cadence</span>
              <span className="text-sm font-medium">
                {analytics.recentMeetings > 0 ? 'Active' : 'Low'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Indicators</CardTitle>
            <CardDescription>Areas requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.overdueTasks > 0 && (
              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded border-l-2 border-red-500">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-400">
                  {analytics.overdueTasks} overdue tasks
                </span>
              </div>
            )}

            {analytics.upcomingDeadlines > 5 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border-l-2 border-yellow-500">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-700 dark:text-yellow-400">
                  {analytics.upcomingDeadlines} deadlines approaching
                </span>
              </div>
            )}

            {analytics.standupCompletionRate < 60 && (
              <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded border-l-2 border-orange-500">
                <Activity className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-700 dark:text-orange-400">
                  Low standup completion rate
                </span>
              </div>
            )}

            {analytics.overdueTasks === 0 && analytics.upcomingDeadlines <= 5 && analytics.standupCompletionRate >= 60 && (
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded border-l-2 border-green-500">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700 dark:text-green-400">
                  All systems operating normally
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Growth Metrics</CardTitle>
            <CardDescription>Lab expansion and development</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Research Portfolio</span>
              <span className="text-sm font-medium">{analytics.totalStudies} studies</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Team Size</span>
              <span className="text-sm font-medium">{analytics.totalTeamMembers} members</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Project Organization</span>
              <span className="text-sm font-medium">{analytics.totalBuckets} buckets</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Innovation Pipeline</span>
              <span className="text-sm font-medium">{analytics.totalIdeas} ideas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lab Goals Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-teal-600" />
            {selectedLab?.name} Goals & Objectives
          </CardTitle>
          <CardDescription>
            Real-time progress tracking for {selectedLab?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalStudies}</div>
              <div className="text-sm text-muted-foreground mt-1">Research Studies</div>
              <div className="text-xs text-green-600 mt-1">
                {analytics.completedStudies} completed
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{taskCompletionPercentage}%</div>
              <div className="text-sm text-muted-foreground mt-1">Task Completion</div>
              <div className="text-xs text-muted-foreground mt-1">
                {analytics.completedTasks} of {analytics.totalTasks} tasks
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{analytics.totalTeamMembers}</div>
              <div className="text-sm text-muted-foreground mt-1">Team Members</div>
              <div className="text-xs text-green-600 mt-1">
                {analytics.activeTeamMembers} active
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{analytics.recentMeetings}</div>
              <div className="text-sm text-muted-foreground mt-1">Recent Meetings</div>
              <div className="text-xs text-muted-foreground mt-1">
                Last 30 days
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}