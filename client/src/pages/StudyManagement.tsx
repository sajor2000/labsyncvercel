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
import { Separator } from "@/components/ui/separator";
import { Plus, Filter, Search, Edit, Trash2, ChevronDown, Grid3x3, List, Columns, Eye, Settings, Users, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Study, Lab, Bucket, TeamMember } from "@shared/schema";
import { insertStudySchema } from "@shared/schema";

// View modes for the management interface
type ViewMode = 'kanban' | 'grid' | 'list';

// Study status colors matching the professional theme
const studyStatusColors = {
  PLANNING: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  IRB_SUBMISSION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400", 
  IRB_APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  DATA_COLLECTION: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  ANALYSIS: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  MANUSCRIPT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
  UNDER_REVIEW: "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400",
  PUBLISHED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  ON_HOLD: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

const fundingColors = {
  NIH: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  NSF: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  INDUSTRY_SPONSORED: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400", 
  INTERNAL: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  FOUNDATION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
};

// Sortable Study Card Component
function SortableStudyCard({ study, teamMembers }: { study: Study; teamMembers: TeamMember[] }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: study.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  // Get assigned team members
  const assignedMembers = teamMembers.filter(member => 
    study.assignees?.includes(member.id)
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-move ${isDragging ? 'z-50' : ''}`}
    >
      <Card className="mb-3 hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20 bg-gradient-to-r from-background via-background to-background/95 backdrop-blur-sm" data-testid={`study-card-${study.id}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground line-clamp-2">
            {study.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge className={`text-xs ${studyStatusColors[study.status || 'PLANNING']}`}>
                {study.status?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
          </div>

          {/* Study Type */}
          {study.studyType && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Study Type</p>
              <p className="text-xs text-foreground">{study.studyType}</p>
            </div>
          )}

          {/* Assignees */}
          {assignedMembers.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Assignee</p>
              <div className="flex flex-wrap gap-1">
                {assignedMembers.slice(0, 3).map(member => (
                  <span key={member.id} className="text-xs text-foreground">
                    {member.name || member.email?.split('@')[0] || 'Unknown'}
                    {assignedMembers.indexOf(member) < assignedMembers.length - 1 && assignedMembers.length > 1 && ", "}
                  </span>
                ))}
                {assignedMembers.length > 3 && (
                  <span className="text-xs text-muted-foreground">+{assignedMembers.length - 3} more</span>
                )}
              </div>
            </div>
          )}

          {/* Funding */}
          {study.funding && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Funding</p>
              <Badge className={`text-xs ${fundingColors[study.funding as keyof typeof fundingColors] || fundingColors.OTHER}`}>
                {study.fundingSource || study.funding.replace('_', ' ')}
              </Badge>
            </div>
          )}

          {/* External Collaborators */}
          {study.externalCollaborators && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">External Collaborators</p>
              <p className="text-xs text-foreground">{study.externalCollaborators}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Study Form Schema
const studyFormSchema = insertStudySchema.extend({
  assignees: z.array(z.string()).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true, position: true });

export default function StudyManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedLab } = useLabContext();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingStudy, setEditingStudy] = useState<Study | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Fetch data
  const { data: buckets = [], isLoading: bucketsLoading } = useQuery<Bucket[]>({
    queryKey: ["/api/buckets", selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: studies = [], isLoading: studiesLoading } = useQuery<Study[]>({
    queryKey: ["/api/studies", selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: teamMembers = [], isLoading: teamMembersLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members", selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  // Form setup
  const form = useForm<z.infer<typeof studyFormSchema>>({
    resolver: zodResolver(studyFormSchema),
    defaultValues: {
      name: "",
      studyType: null,
      status: "PLANNING",
      funding: "OTHER",
      fundingSource: null,
      externalCollaborators: null,
      assignees: [],
      bucketId: "",
      labId: selectedLab?.id || "",
    },
  });

  const editForm = useForm<z.infer<typeof studyFormSchema>>({
    resolver: zodResolver(studyFormSchema),
    defaultValues: {
      name: "",
      studyType: null,
      status: "PLANNING", 
      funding: "OTHER",
      fundingSource: null,
      externalCollaborators: null,
      assignees: [],
      bucketId: "",
      labId: selectedLab?.id || "",
    },
  });

  // Mutations
  const createStudyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof studyFormSchema>) => {
      if (!selectedLab?.id) throw new Error("No lab selected");
      // Ensure we have a valid bucketId
      const firstBucket = buckets[0];
      if (!firstBucket) throw new Error("No buckets available");
      
      return apiRequest('/api/studies', {
        method: 'POST',
        body: { 
          ...data, 
          labId: selectedLab.id,
          bucketId: data.bucketId || firstBucket.id
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studies"] });
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Success", description: "Study created successfully" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create study",
        variant: "destructive",
      });
    },
  });

  const updateStudyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof studyFormSchema>) => {
      if (!editingStudy?.id) throw new Error("No study selected");
      return apiRequest(`/api/studies/${editingStudy.id}`, {
        method: 'PUT',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studies"] });
      setShowEditDialog(false);
      setEditingStudy(null);
      editForm.reset();
      toast({ title: "Success", description: "Study updated successfully" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized", 
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update study",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreateStudy = (data: z.infer<typeof studyFormSchema>) => {
    createStudyMutation.mutate(data);
  };

  const handleUpdateStudy = (data: z.infer<typeof studyFormSchema>) => {
    updateStudyMutation.mutate(data);
  };

  const handleEditStudy = (study: Study) => {
    setEditingStudy(study);
    editForm.reset({
      name: study.name,
      studyType: study.studyType,
      status: study.status || "PLANNING",
      funding: study.funding || "OTHER",
      fundingSource: study.fundingSource,
      externalCollaborators: study.externalCollaborators,
      assignees: study.assignees || [],
      bucketId: study.bucketId,
      labId: study.labId,
    });
    setShowEditDialog(true);
  };

  // Drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Handle study reordering logic here
    // This would involve updating study positions and bucket assignments
  };

  // Filter studies
  const filteredStudies = studies.filter(study => {
    const matchesSearch = study.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || study.status === selectedStatus;
    const matchesLab = study.labId === selectedLab?.id;
    return matchesSearch && matchesStatus && matchesLab;
  });

  // Group studies by bucket for Kanban view
  const studiesByBucket = buckets.reduce((acc, bucket) => {
    acc[bucket.id] = filteredStudies.filter(study => study.bucketId === bucket.id);
    return acc;
  }, {} as Record<string, Study[]>);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!selectedLab) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center max-w-md">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Lab Selected</h3>
          <p className="text-sm text-muted-foreground">Please select a lab from the header to manage studies.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-64 bg-card border-r border-border/40 flex flex-col">
        <div className="p-4 border-b border-border/40">
          <h2 className="text-lg font-semibold text-foreground mb-4">Table 1</h2>
          
          {/* Add New Study Button */}
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="w-full mb-4 bg-primary hover:bg-primary/90 text-primary-foreground"
            data-testid="button-create-study"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add or import
          </Button>

          {/* View Options */}
          <div className="space-y-2">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setViewMode('grid')}
              data-testid="button-grid-view"
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              Grid view
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setViewMode('kanban')}
              data-testid="button-kanban-view"
            >
              <Columns className="h-4 w-4 mr-2" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setViewMode('list')}
              data-testid="button-list-view"
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Find a view"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-studies"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="p-4 border-b border-border/40 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-foreground">Studies</h1>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  Sort
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Color
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                Share view
              </Button>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {viewMode === 'kanban' && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="flex space-x-6 h-full">
                {buckets.map((bucket) => (
                  <div key={bucket.id} className="flex-shrink-0 w-80">
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: bucket.color || '#3b82f6' }}
                        />
                        <h3 className="font-medium text-foreground">{bucket.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {studiesByBucket[bucket.id]?.length || 0}
                        </Badge>
                      </div>
                    </div>

                    {/* Studies Column */}
                    <div className="space-y-0 min-h-[500px]">
                      <SortableContext 
                        items={studiesByBucket[bucket.id]?.map(s => s.id) || []}
                        strategy={verticalListSortingStrategy}
                      >
                        {studiesByBucket[bucket.id]?.map((study) => (
                          <SortableStudyCard
                            key={study.id}
                            study={study}
                            teamMembers={teamMembers}
                          />
                        ))}
                      </SortableContext>
                      
                      {studiesByBucket[bucket.id]?.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">No studies</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {buckets.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-foreground mb-2">No buckets found</h3>
                      <p className="text-sm text-muted-foreground">Create buckets to organize your studies</p>
                    </div>
                  </div>
                )}
              </div>
            </DndContext>
          )}

          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStudies.map((study) => (
                <SortableStudyCard
                  key={study.id}
                  study={study}
                  teamMembers={teamMembers}
                />
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="space-y-2">
              {filteredStudies.map((study) => (
                <Card key={study.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{study.name}</h4>
                      <p className="text-sm text-muted-foreground">{study.studyType}</p>
                    </div>
                    <Badge className={studyStatusColors[study.status || 'PLANNING']}>
                      {study.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Study Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Study</DialogTitle>
            <DialogDescription>Add a new research study to your lab.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateStudy)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Study Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter study name" {...field} value={field.value || ""} data-testid="input-study-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="studyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Study Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., retrospective EHR data analysis" {...field} value={field.value || ""} data-testid="input-study-type" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""} data-testid="select-study-status">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PLANNING">Planning</SelectItem>
                        <SelectItem value="IRB_SUBMISSION">IRB Submission</SelectItem>
                        <SelectItem value="IRB_APPROVED">IRB Approved</SelectItem>
                        <SelectItem value="DATA_COLLECTION">Data Collection</SelectItem>
                        <SelectItem value="ANALYSIS">Analysis Phase</SelectItem>
                        <SelectItem value="MANUSCRIPT">Manuscript Phase</SelectItem>
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
                name="funding"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""} data-testid="select-study-funding">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select funding type" />
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

              <FormField
                control={form.control}
                name="fundingSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Source</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Abbott Laboratories" {...field} value={field.value || ""} data-testid="input-funding-source" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="externalCollaborators"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External Collaborators</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., University of Wisconsin- Madison" {...field} value={field.value || ""} data-testid="textarea-external-collaborators" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel-create-study">
                  Cancel
                </Button>
                <Button type="submit" disabled={createStudyMutation.isPending} data-testid="button-confirm-create-study">
                  {createStudyMutation.isPending ? "Creating..." : "Create Study"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}