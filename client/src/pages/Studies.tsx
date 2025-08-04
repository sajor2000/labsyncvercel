import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLabContext } from "@/hooks/useLabContext";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Study, Lab, Bucket } from "@shared/schema";

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

export default function Studies() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedLab: contextLab } = useLabContext();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLab, setSelectedLab] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

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

  // Fetch data
  const { data: labs = [], isLoading: labsLoading } = useQuery<Lab[]>({
    queryKey: ['/api/labs'],
    enabled: isAuthenticated,
  });

  const { data: studies = [], isLoading: studiesLoading, error: studiesError } = useQuery<Study[]>({
    queryKey: ['/api/studies'],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  // Filter studies by selected lab context first, then by other filters
  const labFilteredStudies = contextLab ? studies.filter(study => study.labId === contextLab.id) : studies;
  
  const filteredStudies = labFilteredStudies.filter(study => {
    const matchesSearch = study.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLab = !selectedLab || selectedLab === "ALL" || study.labId === selectedLab;
    const matchesStatus = !selectedStatus || selectedStatus === "ALL" || study.status === selectedStatus;
    return matchesSearch && matchesLab && matchesStatus;
  });

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Studies</h1>
          <p className="text-muted-foreground">Manage your research studies</p>
        </div>
        <Button data-testid="button-create-study">
          <Plus className="h-4 w-4 mr-2" />
          New Study
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search studies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-studies"
          />
        </div>
        <Select value={selectedLab} onValueChange={setSelectedLab}>
          <SelectTrigger className="w-[180px]" data-testid="select-lab-filter">
            <SelectValue placeholder="All Labs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Labs</SelectItem>
            {labs.map((lab) => (
              <SelectItem key={lab.id} value={lab.id}>
                {lab.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PLANNING">Planning</SelectItem>
            <SelectItem value="IRB_SUBMISSION">IRB Submission</SelectItem>
            <SelectItem value="IRB_APPROVED">IRB Approved</SelectItem>
            <SelectItem value="DATA_COLLECTION">Data Collection</SelectItem>
            <SelectItem value="ANALYSIS">Analysis</SelectItem>
            <SelectItem value="MANUSCRIPT">Manuscript</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Studies Grid */}
      {studiesLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-3/4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-muted animate-pulse rounded"></div>
                  <div className="h-3 w-2/3 bg-muted animate-pulse rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredStudies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">No studies found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedLab || selectedStatus 
                  ? "Try adjusting your filters" 
                  : "Create your first study to get started"
                }
              </p>
              <Button data-testid="button-create-first-study">
                <Plus className="h-4 w-4 mr-2" />
                Create Study
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudies.map((study) => (
            <Card key={study.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`study-card-${study.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{study.name}</CardTitle>
                  <Badge 
                    className={study.status ? statusColors[study.status] : statusColors.PLANNING} 
                    variant="secondary"
                  >
                    {study.status ? study.status.replace('_', ' ') : 'Planning'}
                  </Badge>
                </div>
                {study.oraNumber && (
                  <p className="text-sm text-muted-foreground">ORA: {study.oraNumber}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {study.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{study.notes}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Priority: {study.priority || 'Medium'}</span>
                    {study.dueDate && (
                      <span>Due: {new Date(study.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Updated: {study.updatedAt ? new Date(study.updatedAt).toLocaleDateString() : 'Unknown'}
                    </span>
                    <Button variant="ghost" size="sm" data-testid={`button-view-study-${study.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}