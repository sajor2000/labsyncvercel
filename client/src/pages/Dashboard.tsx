import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LabToggleDemo } from "@/components/LabToggleDemo";
import { CreateSampleDataButton } from "@/components/CreateSampleDataButton";
import { useToast } from "@/hooks/use-toast";
import { useLabContext } from "@/hooks/useLabContext";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Building2, FolderOpen, Users, Calendar, CheckSquare, TrendingUp, Plus } from "lucide-react";
import { Link } from "wouter";
import type { Lab, Study, Bucket, Task } from "@shared/schema";

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
    <main className="flex-1 overflow-y-auto p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back{(user as any)?.firstName ? `, ${(user as any).firstName}` : ''}!
          </h1>
          <CreateSampleDataButton />
        </div>
        <p className="text-muted-foreground">
          {selectedLab 
            ? `Here's an overview of ${selectedLab.name} activities`
            : "Here's an overview of your research activities"
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Labs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(labs) ? labs.length : 0}</div>
            <p className="text-xs text-muted-foreground">
              Research laboratories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Studies</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudies}</div>
            <p className="text-xs text-muted-foreground">
              Out of {labStudies.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Buckets</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labBuckets.length}</div>
            <p className="text-xs text-muted-foreground">
              Organized collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Progress</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}/{labTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Completed tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Studies */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Studies</CardTitle>
              <Link href="/studies">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <CardDescription>
              Latest research studies across all labs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {labStudies.length === 0 ? (
              <div className="text-center py-8">
                <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No studies yet</p>
                <Link href="/studies">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Study
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {labStudies.slice(0, 5).map((study) => (
                  <div key={study.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <h4 className="font-medium">{study.name}</h4>
                      {study.oraNumber && (
                        <p className="text-sm text-muted-foreground">ORA: {study.oraNumber}</p>
                      )}
                    </div>
                    <Badge variant={study.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                      {study.status?.replace('_', ' ') || 'Planning'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Task Overview</CardTitle>
            <CardDescription>
              Current task status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">In Progress</span>
                <Badge variant="secondary">{tasksInProgress}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed</span>
                <Badge variant="default">{completedTasks}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Urgent</span>
                <Badge variant={urgentTasks > 0 ? 'destructive' : 'secondary'}>
                  {urgentTasks}
                </Badge>
              </div>
              <Link href="/kanban" className="block pt-2">
                <Button className="w-full" size="sm">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Task Board
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/labs">
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="h-4 w-4 mr-2" />
                  Create Lab
                </Button>
              </Link>
              <Link href="/buckets">
                <Button variant="outline" className="w-full justify-start">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  New Bucket
                </Button>
              </Link>
              <Link href="/studies">
                <Button variant="outline" className="w-full justify-start">
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Add Study
                </Button>
              </Link>
              <Link href="/kanban">
                <Button variant="outline" className="w-full justify-start">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Activity tracking coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}