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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Users, 
  DollarSign, 
  Building, 
  Search,
  Filter,
  SortDesc,
  Palette,
  Share,
  Settings2,
  FlaskConical,
  Calendar,
  User
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudySchema, type Study, type InsertStudy, type Bucket, type Lab } from "@shared/schema";
import { z } from "zod";

// Status color mapping similar to Airtable
const statusColors = {
  "PLANNING": "bg-gray-500",
  "IRB_SUBMISSION": "bg-yellow-500",
  "IRB_APPROVED": "bg-blue-500",
  "DATA_COLLECTION": "bg-indigo-500",
  "ANALYSIS": "bg-green-500",
  "MANUSCRIPT": "bg-purple-500",
  "UNDER_REVIEW": "bg-orange-500",
  "PUBLISHED": "bg-emerald-500",
  "ON_HOLD": "bg-red-500",
  "CANCELLED": "bg-gray-400"
};

const statusLabels = {
  "PLANNING": "Planning",
  "IRB_SUBMISSION": "IRB Submission",
  "IRB_APPROVED": "IRB Approved",
  "DATA_COLLECTION": "Data Collection",
  "ANALYSIS": "Analysis phase",
  "MANUSCRIPT": "Manuscript phase",
  "UNDER_REVIEW": "Under Review",
  "PUBLISHED": "Published",
  "ON_HOLD": "On Hold",
  "CANCELLED": "Cancelled"
};

const fundingColors = {
  "NIH": "bg-blue-600",
  "NSF": "bg-purple-600",
  "INDUSTRY_SPONSORED": "bg-green-600",
  "INTERNAL": "bg-orange-600",
  "FOUNDATION": "bg-pink-600",
  "OTHER": "bg-gray-600"
};

export default function StackedView() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedLab: contextLab } = useLabContext();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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
  const { data: buckets = [], isLoading: bucketsLoading } = useQuery<Bucket[]>({
    queryKey: ['/api/buckets'],
    enabled: isAuthenticated && !!contextLab,
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

  const { data: allStudies = [], isLoading: studiesLoading } = useQuery<Study[]>({
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

  // Filter studies by lab context
  const labStudies = contextLab ? allStudies.filter(study => study.labId === contextLab.id) : allStudies;

  // Filter studies by search and status
  const filteredStudies = labStudies.filter(study => {
    const matchesSearch = study.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         study.studyType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         study.assignees?.some((assignee: string) => assignee.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !selectedStatus || study.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Group studies by bucket
  const studiesByBucket = buckets.map(bucket => ({
    bucket,
    studies: filteredStudies.filter(study => study.bucketId === bucket.id)
  })).filter(group => group.studies.length > 0);

  // Create study form
  const createStudyForm = useForm<InsertStudy>({
    resolver: zodResolver(insertStudySchema.omit({ id: true, createdAt: true, updatedAt: true })),
    defaultValues: {
      name: "",
      status: "PLANNING",
      funding: "OTHER",
      priority: "MEDIUM",
      assignees: [],
      labId: contextLab?.id || "",
      bucketId: "",
      studyType: "",
      externalCollaborators: "",
      createdBy: "",
    },
  });

  const createStudyMutation = useMutation({
    mutationFn: async (data: InsertStudy) => {
      return apiRequest('/api/studies', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studies'] });
      setIsCreateDialogOpen(false);
      createStudyForm.reset();
      toast({
        title: "Success",
        description: "Study created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to create study",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertStudy) => {
    // Convert assignees string to array
    const processedData = {
      ...data,
      assignees: data.assignees && Array.isArray(data.assignees) 
        ? data.assignees 
        : typeof data.assignees === 'string' 
          ? (data.assignees as string).split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0)
          : [],
      labId: contextLab?.id || "",
      createdBy: "current-user", // This should be set from auth context
    };
    createStudyMutation.mutate(processedData);
  };

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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white text-xs font-bold">
                S
              </div>
              Stacked by Bucket
            </div>
          </h1>
          <p className="text-muted-foreground">
            {contextLab 
              ? `Research studies organized by project buckets in ${contextLab.name}`
              : "Research studies organized by project buckets"
            }
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-customize">
            <Settings2 className="h-4 w-4 mr-2" />
            Customize cards
          </Button>
          <Button variant="outline" size="sm" data-testid="button-filter">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" data-testid="button-sort">
            <SortDesc className="h-4 w-4 mr-2" />
            Sort
          </Button>
          <Button variant="outline" size="sm" data-testid="button-color">
            <Palette className="h-4 w-4 mr-2" />
            Color
          </Button>
          <Button variant="outline" size="sm" data-testid="button-share">
            <Share className="h-4 w-4 mr-2" />
            Share view
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-study">
                <Plus className="h-4 w-4 mr-2" />
                New Study
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Study</DialogTitle>
                <DialogDescription>
                  Add a new research study to your selected lab and bucket.
                </DialogDescription>
              </DialogHeader>
              <Form {...createStudyForm}>
                <form onSubmit={createStudyForm.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createStudyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Study Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-study-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createStudyForm.control}
                      name="bucketId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bucket</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-bucket">
                                <SelectValue placeholder="Select bucket" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {buckets.map((bucket) => (
                                <SelectItem key={bucket.id} value={bucket.id}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: bucket.color || '#3b82f6' }}
                                    />
                                    {bucket.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createStudyForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "PLANNING"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(statusLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createStudyForm.control}
                      name="funding"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Funding</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "OTHER"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="NIH">NIH</SelectItem>
                              <SelectItem value="NSF">NSF</SelectItem>
                              <SelectItem value="INDUSTRY_SPONSORED">Industry-sponsored</SelectItem>
                              <SelectItem value="INTERNAL">Internal</SelectItem>
                              <SelectItem value="FOUNDATION">Foundation</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createStudyForm.control}
                    name="studyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Study Type</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="e.g., retrospective EHR data analysis, quasi-RCT" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createStudyForm.control}
                    name="assignees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignees</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="e.g., JC, Mia, Nag, Cherise" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createStudyForm.control}
                    name="externalCollaborators"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>External Collaborators</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="e.g., Abbott Laboratories, University of Wisconsin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createStudyMutation.isPending}
                      data-testid="button-submit-study"
                    >
                      {createStudyMutation.isPending ? "Creating..." : "Create Study"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search studies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {(bucketsLoading || studiesLoading) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-6 w-full bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!bucketsLoading && !studiesLoading && studiesByBucket.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium text-foreground">No studies found</h3>
              <p className="text-muted-foreground">
                {buckets.length === 0 
                  ? "Create buckets first to organize your studies"
                  : searchTerm || selectedStatus
                    ? "Try adjusting your search or filters"
                    : "Create your first study to get started"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stacked by Bucket View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {studiesByBucket.map(({ bucket, studies }) => (
          <div key={bucket.id} className="space-y-4">
            {/* Bucket Header */}
            <div className="flex items-center gap-2">
              <div 
                className="px-3 py-1 rounded-full text-white text-sm font-medium flex items-center gap-2"
                style={{ backgroundColor: bucket.color || '#3b82f6' }}
              >
                {bucket.name}
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                  {studies.length}
                </Badge>
              </div>
            </div>

            {/* Study Cards */}
            <div className="space-y-3">
              {studies.map((study) => (
                <Card 
                  key={study.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer border-l-4"
                  style={{ borderLeftColor: bucket.color || '#3b82f6' }}
                  data-testid={`study-card-${study.id}`}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Study Title */}
                    <div>
                      <h3 className="font-medium text-foreground leading-tight">
                        {study.name}
                      </h3>
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Status</p>
                      <Badge 
                        className={`${statusColors[study.status] || 'bg-gray-500'} text-white border-0`}
                      >
                        {statusLabels[study.status] || study.status}
                      </Badge>
                    </div>

                    {/* Study Type */}
                    {study.studyType && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">study type</p>
                        <p className="text-sm text-foreground">{study.studyType}</p>
                      </div>
                    )}

                    {/* Assignees */}
                    {study.assignees && study.assignees.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Assignee</p>
                        <p className="text-sm text-foreground">{study.assignees.join(', ')}</p>
                      </div>
                    )}

                    {/* Funding */}
                    {study.funding && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Funding</p>
                        <Badge 
                          className={`${fundingColors[study.funding] || 'bg-gray-600'} text-white border-0`}
                        >
                          {study.funding === 'INDUSTRY_SPONSORED' ? 'Industry-sponsored' : study.funding}
                        </Badge>
                      </div>
                    )}

                    {/* External Collaborators */}
                    {study.externalCollaborators && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">External Collaborators</p>
                        <p className="text-sm text-foreground">{study.externalCollaborators}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}