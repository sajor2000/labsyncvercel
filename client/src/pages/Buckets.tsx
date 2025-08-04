import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Folder, FlaskConical, Settings, Eye, Edit, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLabContext } from "@/hooks/useLabContext";
import type { Bucket, Lab, Study, TeamMember } from "@shared/schema";

// Form schema for bucket creation
const bucketFormSchema = z.object({
  name: z.string().min(1, "Bucket name is required"),
  color: z.string().optional(),
});

// Form schema for study creation
const studyFormSchema = z.object({
  name: z.string().min(1, "Study name is required"),
  oraNumber: z.string().optional(),
  status: z.string().default("PLANNING"),
  studyType: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  funding: z.string().optional(),
  externalCollaborators: z.string().optional(),
  notes: z.string().optional(),
  priority: z.string().default("MEDIUM"),
  dueDate: z.string().optional(),
  bucketId: z.string().min(1, "Bucket is required"),
});

type BucketFormValues = z.infer<typeof bucketFormSchema>;
type StudyFormValues = z.infer<typeof studyFormSchema>;

export default function Buckets() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedLab: currentLab } = useLabContext();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLab, setSelectedLab] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isStudyCreateOpen, setIsStudyCreateOpen] = useState(false);
  const [selectedBucketForStudy, setSelectedBucketForStudy] = useState<string | null>(null);

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
  const { data: labs = [] } = useQuery<Lab[]>({
    queryKey: ['/api/labs'],
    enabled: isAuthenticated,
  });

  const { data: buckets = [], isLoading: bucketsLoading, error: bucketsError } = useQuery<Bucket[]>({
    queryKey: ['/api/buckets', currentLab?.id],
    enabled: isAuthenticated && !!currentLab,
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

  // Form for bucket creation
  const form = useForm<BucketFormValues>({
    resolver: zodResolver(bucketFormSchema),
    defaultValues: {
      name: "",
      color: "#3b82f6",
    },
  });

  // Create bucket mutation
  const createBucketMutation = useMutation({
    mutationFn: async (data: BucketFormValues) => {
      if (!currentLab) {
        throw new Error("No lab selected");
      }
      const bucketData = {
        ...data,
        labId: currentLab.id,
      };
      return apiRequest('POST', '/api/buckets', bucketData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buckets', currentLab?.id] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Bucket created successfully",
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
        description: "Failed to create bucket",
        variant: "destructive",
      });
    },
  });

  // Get studies count for each bucket
  const { data: allStudies = [] } = useQuery<Study[]>({
    queryKey: ['/api/studies', currentLab?.id],
    enabled: isAuthenticated && !!currentLab,
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members', currentLab?.id],
    enabled: isAuthenticated && !!currentLab,
  });

  // Delete bucket mutation
  const deleteBucketMutation = useMutation({
    mutationFn: async (bucketId: string) => {
      return apiRequest('DELETE', `/api/buckets/${bucketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buckets', currentLab?.id] });
      toast({
        title: "Success",
        description: "Bucket deleted successfully",
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
        description: "Failed to delete bucket",
        variant: "destructive",
      });
    },
  });

  // Filter buckets - buckets are already filtered by lab on backend
  const filteredBuckets = buckets.filter(bucket => {
    const matchesSearch = bucket.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Form for study creation
  const studyForm = useForm<StudyFormValues>({
    resolver: zodResolver(studyFormSchema),
    defaultValues: {
      name: "",
      oraNumber: "",
      status: "PLANNING",
      studyType: "",
      assignees: [],
      funding: "",
      externalCollaborators: "",
      notes: "",
      priority: "MEDIUM",
      dueDate: "",
      bucketId: "",
    },
  });

  // Create study mutation
  const createStudyMutation = useMutation({
    mutationFn: async (data: StudyFormValues) => {
      if (!currentLab) {
        throw new Error("No lab selected");
      }
      const studyData = {
        ...data,
        labId: currentLab.id,
        assignees: data.assignees?.filter(Boolean) || [],
      };
      return apiRequest('POST', '/api/studies', studyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studies', currentLab?.id] });
      setIsStudyCreateOpen(false);
      setSelectedBucketForStudy(null);
      studyForm.reset();
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

  // Helper functions
  const getStudiesCount = (bucketId: string) => {
    return allStudies.filter(study => study.bucketId === bucketId).length;
  };

  const onSubmit = (data: BucketFormValues) => {
    createBucketMutation.mutate(data);
  };

  const onStudySubmit = (data: StudyFormValues) => {
    createStudyMutation.mutate(data);
  };

  const openStudyCreateDialog = (bucketId: string) => {
    setSelectedBucketForStudy(bucketId);
    studyForm.setValue('bucketId', bucketId);
    setIsStudyCreateOpen(true);
  };

  const getLabName = (labId: string) => {
    const lab = labs.find(l => l.id === labId);
    return lab?.name || 'Unknown Lab';
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
          <h1 className="text-2xl font-bold text-foreground">Project Buckets</h1>
          <p className="text-muted-foreground">Organize your studies into manageable project buckets</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-bucket">
              <Plus className="h-4 w-4 mr-2" />
              New Bucket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Bucket</DialogTitle>
              <DialogDescription>
                Create a new project bucket to organize your studies
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bucket Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter bucket name..." 
                          {...field} 
                          data-testid="input-bucket-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="color" 
                            {...field} 
                            className="w-16 h-10 p-1 rounded border"
                            data-testid="input-bucket-color"
                          />
                          <Input 
                            placeholder="#3b82f6" 
                            {...field}
                            className="flex-1"
                            data-testid="input-bucket-color-text"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setIsCreateOpen(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createBucketMutation.isPending}>
                    {createBucketMutation.isPending ? "Creating..." : "Create Bucket"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Study Creation Dialog */}
        <Dialog open={isStudyCreateOpen} onOpenChange={setIsStudyCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Study</DialogTitle>
              <DialogDescription>
                Add a new research study to this bucket
              </DialogDescription>
            </DialogHeader>
            <Form {...studyForm}>
              <form onSubmit={studyForm.handleSubmit(onStudySubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={studyForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Study Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter study name..." {...field} data-testid="input-study-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={studyForm.control}
                    name="oraNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ORA Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., ORA-2024-001" {...field} data-testid="input-ora-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={studyForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-study-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={studyForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-study-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="URGENT">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={studyForm.control}
                    name="studyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Study Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-study-type">
                              <SelectValue placeholder="Select study type..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="retrospective EHR data analysis">Retrospective EHR Data Analysis</SelectItem>
                            <SelectItem value="prospective cohort study">Prospective Cohort Study</SelectItem>
                            <SelectItem value="randomized controlled trial">Randomized Controlled Trial</SelectItem>
                            <SelectItem value="case-control study">Case-Control Study</SelectItem>
                            <SelectItem value="cross-sectional survey study">Cross-Sectional Survey Study</SelectItem>
                            <SelectItem value="longitudinal cohort study">Longitudinal Cohort Study</SelectItem>
                            <SelectItem value="quasi-RCT (pre-post design) non-inferiority trial">Quasi-RCT (Pre-Post Design) Non-Inferiority Trial</SelectItem>
                            <SelectItem value="qualitative interview study">Qualitative Interview Study</SelectItem>
                            <SelectItem value="systematic review">Systematic Review</SelectItem>
                            <SelectItem value="meta-analysis">Meta-Analysis</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={studyForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                data-testid="button-study-due-date"
                              >
                                {field.value ? (
                                  new Date(field.value).toLocaleDateString()
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                              disabled={(date) =>
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={studyForm.control}
                  name="funding"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funding Source</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., NIH, NSF, Internal..." {...field} data-testid="input-funding" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={studyForm.control}
                  name="externalCollaborators"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External Collaborators</FormLabel>
                      <FormControl>
                        <Input placeholder="List external collaborators..." {...field} data-testid="input-external-collaborators" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={studyForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional notes about the study..." 
                          className="min-h-[80px]"
                          {...field} 
                          data-testid="textarea-study-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setIsStudyCreateOpen(false);
                      setSelectedBucketForStudy(null);
                      studyForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createStudyMutation.isPending}>
                    {createStudyMutation.isPending ? "Creating..." : "Create Study"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search buckets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
          data-testid="input-search-buckets"
        />
        <Select value={selectedLab} onValueChange={setSelectedLab}>
          <SelectTrigger className="w-[200px]" data-testid="select-lab-filter">
            <SelectValue placeholder="All Labs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Labs</SelectItem>
            {labs.filter(lab => lab.id && lab.id.trim() !== "").map((lab) => (
              <SelectItem key={lab.id} value={lab.id!}>
                {lab.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Buckets Grid */}
      {bucketsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-3/4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
                    <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredBuckets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No buckets found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedLab 
                  ? "Try adjusting your filters" 
                  : "Create your first bucket to organize your studies"
                }
              </p>
              <Button 
                onClick={() => setIsCreateOpen(true)}
                data-testid="button-create-first-bucket"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Bucket
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBuckets.map((bucket) => (
            <Card key={bucket.id} className="hover:shadow-md transition-shadow" data-testid={`bucket-card-${bucket.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: bucket.color || '#3b82f6' }}
                      />
                      {bucket.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getLabName(bucket.labId)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`button-bucket-menu-${bucket.id}`}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Studies
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => deleteBucketMutation.mutate(bucket.id)}
                        disabled={deleteBucketMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Studies Count */}
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <FlaskConical className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">{getStudiesCount(bucket.id)}</p>
                      <p className="text-sm text-muted-foreground">Studies</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-bucket-${bucket.id}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1" 
                      onClick={() => openStudyCreateDialog(bucket.id)}
                      data-testid={`button-add-study-${bucket.id}`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Study
                    </Button>
                  </div>

                  {/* Created Date */}
                  <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    Created: {bucket.createdAt ? new Date(bucket.createdAt).toLocaleDateString() : 'Unknown'}
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