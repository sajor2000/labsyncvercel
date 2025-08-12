import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LabToggleDemo } from "@/components/LabToggleDemo";
import { useToast } from "@/hooks/use-toast";
import { useLabContext } from "@/hooks/useLabContext";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Building2, FolderOpen, Users, Calendar, CheckSquare, TrendingUp, Plus, Eye } from "lucide-react";
import { Link } from "wouter";
import type { Lab, Study, Bucket, Task } from "@shared/schema";

// Pretty labels for study statuses
const statusLabels: Record<string, string> = {
  PLANNING: "Planning",
  IRB_SUBMISSION: "IRB Submission",
  IRB_APPROVED: "IRB Approved",
  DATA_COLLECTION: "Data Collection",
  ANALYSIS: "Analysis",
  MANUSCRIPT: "Manuscript",
  UNDER_REVIEW: "Under Review",
  PUBLISHED: "Published",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled"
};

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { selectedLab, setAllLabs } = useLabContext();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch dashboard data
  const { data: labs = [] } = useQuery<Lab[]>({
    queryKey: ['/api/labs'],
    enabled: isAuthenticated,
  });

  // Update lab context when labs are loaded
  useEffect(() => {
    if (labs.length > 0) {
      setAllLabs(labs);
    }
  }, [labs, setAllLabs]);

  const { data: studies = [] } = useQuery<Study[]>({
    queryKey: ['/api/studies', selectedLab?.id],
    enabled: isAuthenticated && !!selectedLab,
  });

  const { data: buckets = [] } = useQuery<Bucket[]>({
    queryKey: ['/api/buckets', selectedLab?.id],
    enabled: isAuthenticated && !!selectedLab,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    enabled: isAuthenticated,
  });

  // Data is already filtered by lab on backend
  const labStudies = studies;
  const labBuckets = buckets;
  const labTasks = tasks.filter(task => 
    labStudies.some(study => study.id === task.studyId)
  );

  // Calculate statistics for selected lab
  const activeStudies = labStudies.filter(study => 
    study.status !== 'PUBLISHED' && study.status !== 'CANCELLED'
  ).length;

  const tasksInProgress = labTasks.filter(task => 
    task.status === 'IN_PROGRESS'
  ).length;

  const completedTasks = labTasks.filter(task => 
    task.status === 'DONE'
  ).length;

  const urgentTasks = labTasks.filter(task => 
    task.priority === 'URGENT' && task.status !== 'DONE'
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-8 space-y-8 animate-fade-in">
        {/* Monday.com-style Welcome Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-5xl font-bold gradient-text">
                Welcome back{(user as any)?.firstName ? `, ${(user as any).firstName}` : ''}!
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {selectedLab 
                  ? `Manage ${selectedLab.name} research activities and collaborate with your team`
                  : "Your centralized research management workspace"
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="btn-monday-secondary">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Link href="/studies">
                <Button className="btn-monday glow-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Monday.com-style Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover gradient-card border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Research Labs</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-foreground">{Array.isArray(labs) ? labs.length : 0}</div>
              <p className="text-sm text-muted-foreground flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Active laboratories
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover gradient-card border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Studies</CardTitle>
              <div className="p-2 bg-accent/10 rounded-lg">
                <FlaskConical className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-foreground">{activeStudies}</div>
              <p className="text-sm text-muted-foreground">
                Out of {labStudies.length} total studies
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover gradient-card border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Project Buckets</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FolderOpen className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-foreground">{labBuckets.length}</div>
              <p className="text-sm text-muted-foreground">
                Organized collections
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover gradient-card border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Task Progress</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckSquare className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-foreground">{completedTasks}/{labTasks.length}</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-medium">{Math.round((completedTasks / Math.max(labTasks.length, 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(completedTasks / Math.max(labTasks.length, 1)) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monday.com-style Main Content Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent Studies Section */}
          <Card className="md:col-span-2 card-hover gradient-card border-0 shadow-lg">
            <CardHeader className="space-y-4 pb-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold">Recent Studies</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Latest research activities across your labs
                  </CardDescription>
                </div>
                <Link href="/studies">
                  <Button variant="outline" className="btn-monday-secondary">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {labStudies.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                    <FlaskConical className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No studies yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Get started by creating your first research study
                  </p>
                  <Link href="/studies">
                    <Button className="btn-monday">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Study
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {labStudies.slice(0, 5).map((study) => (
                    <div key={study.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all duration-200 bg-card/50">
                      <div className="flex-1 space-y-1">
                        <h4 className="font-semibold text-foreground">{study.name}</h4>
                        {study.oraNumber && (
                          <p className="text-sm text-muted-foreground">ORA: {study.oraNumber}</p>
                        )}
                      </div>
                      <Badge 
                        variant={study.status === 'PUBLISHED' ? 'default' : 
                                study.status === 'ANALYSIS' ? 'secondary' : 'outline'}
                        className="font-medium"
                      >
                        {study.status ? statusLabels[study.status] || study.status : statusLabels.PLANNING}
                      </Badge>
                    </div>
                  ))}
                  <div className="pt-2 text-center">
                    <Link href="/studies">
                      <Button variant="ghost" className="text-sm text-muted-foreground hover:text-primary">
                        View all {labStudies.length} studies →
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Overview - Monday.com Style */}
          <Card className="card-hover gradient-card border-0 shadow-lg">
            <CardHeader className="space-y-3 pb-6">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold">Task Overview</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Track your progress across all projects
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium">In Progress</span>
                  </div>
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-700 font-semibold">
                    {tasksInProgress}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600 font-semibold">
                    {completedTasks}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">Urgent</span>
                  </div>
                  <Badge 
                    variant={urgentTasks > 0 ? 'destructive' : 'secondary'} 
                    className="font-semibold"
                  >
                    {urgentTasks}
                  </Badge>
                </div>
              </div>
              <Link href="/task-management" className="block">
                <Button className="w-full btn-monday">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Open Task Management
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions - Monday.com Style */}
          <Card className="lg:col-span-1 card-hover gradient-card border-0 shadow-lg">
            <CardHeader className="space-y-3 pb-6">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Common tasks and shortcuts
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/labs">
                <Button variant="outline" className="w-full justify-start btn-monday-secondary hover:shadow-md transition-all duration-200">
                  <div className="p-1 bg-primary/10 rounded mr-3">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  Create Lab
                </Button>
              </Link>
              <Link href="/buckets">
                <Button variant="outline" className="w-full justify-start btn-monday-secondary hover:shadow-md transition-all duration-200">
                  <div className="p-1 bg-blue-500/10 rounded mr-3">
                    <FolderOpen className="h-4 w-4 text-blue-500" />
                  </div>
                  New Bucket
                </Button>
              </Link>
              <Link href="/studies">
                <Button variant="outline" className="w-full justify-start btn-monday-secondary hover:shadow-md transition-all duration-200">
                  <div className="p-1 bg-accent/10 rounded mr-3">
                    <FlaskConical className="h-4 w-4 text-accent" />
                  </div>
                  Add Study
                </Button>
              </Link>
              <Link href="/task-management">
                <Button variant="outline" className="w-full justify-start btn-monday-secondary hover:shadow-md transition-all duration-200">
                  <div className="p-1 bg-green-500/10 rounded mr-3">
                    <CheckSquare className="h-4 w-4 text-green-500" />
                  </div>
                  Create Task
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity - Monday.com Style */}
          <Card className="lg:col-span-3 card-hover gradient-card border-0 shadow-lg">
            <CardHeader className="space-y-3 pb-6">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Latest updates and changes across your workspace
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Activity Feed Coming Soon</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Track all your lab activities, updates, and team collaboration in one place
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}