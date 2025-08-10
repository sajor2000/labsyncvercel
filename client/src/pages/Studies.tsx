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
import { Plus, Filter, Search, Eye, Edit, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Study, Lab, Bucket, TeamMember } from "@shared/schema";

// Pretty labels for status display
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

// Form schema for study creation/editing
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

type StudyFormValues = z.infer<typeof studyFormSchema>;

export default function Studies() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedLab: contextLab } = useLabContext();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLab, setSelectedLab] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState<Study | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ study: Study; taskCount: number } | null>(null);

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
    queryKey: ['/api/studies', contextLab?.id],
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

  const { data: buckets = [], isLoading: bucketsLoading } = useQuery<Bucket[]>({
    queryKey: ['/api/buckets', contextLab?.id],
    enabled: isAuthenticated && !!contextLab,
  });

  const { data: teamMembers = [], isLoading: teamMembersLoading } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
    enabled: isAuthenticated,
  });

  // Form for study creation/editing
  const form = useForm<StudyFormValues>({
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
      const studyData = {
        ...data,
        labId: contextLab?.id || "",
        assignees: data.assignees || [],
      };
      return apiRequest('/api/studies', 'POST', studyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studies'] });
      setIsCreateOpen(false);
      setEditingStudy(null);
      form.reset();
      toast({
        title: "Success",
        description: editingStudy ? "Study updated successfully" : "Study created successfully",
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
        description: editingStudy ? "Failed to update study" : "Failed to create study",
        variant: "destructive",
      });
    },
  });

  // Update study mutation
  const updateStudyMutation = useMutation({
    mutationFn: async (data: StudyFormValues) => {
      if (!editingStudy) throw new Error("No study to update");
      const studyData = {
        ...data,
        assignees: data.assignees || [],
      };
      return apiRequest(`/api/studies/${editingStudy.id}`, 'PUT', studyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studies'] });
      setIsCreateOpen(false);
      setEditingStudy(null);
      form.reset();
      toast({
        title: "Success",
        description: "Study updated successfully",
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
        description: "Failed to update study",
        variant: "destructive",
      });
    },
  });

  // Delete study mutation
  const deleteStudyMutation = useMutation({
    mutationFn: async ({ studyId, cascade = false }: { studyId: string; cascade?: boolean }) => {
      const url = cascade ? `/api/studies/${studyId}?cascade=true` : `/api/studies/${studyId}`;
      return apiRequest(url, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studies'] });
      toast({
        title: "Success",
        description: "Study deleted successfully",
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
      
      const errorMessage = (error as Error).message;
      if (errorMessage.includes("Cannot delete study. It contains") && errorMessage.includes("task")) {
        // This should not happen anymore with the new confirmation flow, but keep as fallback
        toast({
          title: "Error",
          description: "Failed to delete study",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete study",
          variant: "destructive",
        });
      }
    },
  });

  // Helper functions
  const onSubmit = (data: StudyFormValues) => {
    if (editingStudy) {
      updateStudyMutation.mutate(data);
    } else {
      createStudyMutation.mutate(data);
    }
  };

  const openEditDialog = (study: Study) => {
    setEditingStudy(study);
    form.reset({
      name: study.name || "",
      oraNumber: study.oraNumber || "",
      status: study.status || "PLANNING",
      studyType: study.studyType || "",
      assignees: study.assignees || [],
      funding: study.funding || "",
      externalCollaborators: study.externalCollaborators || "",
      notes: study.notes || "",
      priority: study.priority || "MEDIUM",
      dueDate: study.dueDate ? new Date(study.dueDate).toISOString().split('T')[0] : "",
      bucketId: study.bucketId || "",
    });
    setIsCreateOpen(true);
  };

  const handleDeleteStudy = async (study: Study) => {
    try {
      // First try to delete without cascade
      await apiRequest(`/api/studies/${study.id}`, 'DELETE');
      queryClient.invalidateQueries({ queryKey: ['/api/studies'] });
      toast({
        title: "Success",
        description: "Study deleted successfully",
      });
    } catch (error: any) {
      // Check if error response contains task count information
      if (error.message.includes("Cannot delete study. It contains") && error.message.includes("task")) {
        try {
          // Try to parse task count from error message
          const match = error.message.match(/(\d+) task\(s\)/);
          const taskCount = match ? parseInt(match[1]) : 1;
          
          // Show confirmation dialog
          setConfirmDelete({ study, taskCount });
        } catch (e) {
          toast({
            title: "Cannot Delete Study",
            description: "This study has associated tasks. Please delete or reassign them first.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error", 
          description: "Failed to delete study",
          variant: "destructive",
        });
      }
    }
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    
    // Delete with cascade option
    deleteStudyMutation.mutate({ studyId: confirmDelete.study.id, cascade: true });
    setConfirmDelete(null);
  };

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
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-study">
              <Plus className="h-4 w-4 mr-2" />
              New Study
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStudy ? "Edit Study" : "Create New Study"}</DialogTitle>
              <DialogDescription>
                {editingStudy ? "Update the study details" : "Add a new research study to your lab"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
                    name="bucketId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bucket</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-study-bucket">
                              <SelectValue placeholder="Select bucket" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {buckets.map((bucket) => (
                              <SelectItem key={bucket.id} value={bucket.id}>
                                {bucket.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="funding"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funding Source</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-study-funding">
                              <SelectValue placeholder="Select funding" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NIH">NIH</SelectItem>
                            <SelectItem value="NSF">NSF</SelectItem>
                            <SelectItem value="INDUSTRY_SPONSORED">Industry Sponsored</SelectItem>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
                      setIsCreateOpen(false);
                      setEditingStudy(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createStudyMutation.isPending || updateStudyMutation.isPending}>
                    {(createStudyMutation.isPending || updateStudyMutation.isPending) 
                      ? "Saving..." 
                      : editingStudy ? "Update Study" : "Create Study"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
              <Button 
                onClick={() => setIsCreateOpen(true)}
                data-testid="button-create-first-study"
              >
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
                    {study.status ? statusLabels[study.status] || study.status : statusLabels.PLANNING}
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
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(study)}
                        data-testid={`button-edit-study-${study.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(study)}
                        data-testid={`button-view-study-${study.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-study-${study.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Study</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{study.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteStudy(study)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for Cascade Delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Study and Associated Tasks?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>
                <strong>Warning:</strong> This study has {confirmDelete?.taskCount} associated task{confirmDelete?.taskCount !== 1 ? 's' : ''}.
              </div>
              <div>
                Deleting "{confirmDelete?.study.name}" will also permanently delete all associated tasks. This action cannot be undone.
              </div>
              <div className="text-sm text-muted-foreground">
                Alternative: You can go to the Tasks page to reassign these tasks to another study first.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Study & Tasks
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}