import { useState, useMemo, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLabContext } from "@/hooks/useLabContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Lightbulb, 
  Edit, 
  Trash2,
  Search,
  Filter,
  Tag,
  Calendar,
  User,
  TrendingUp,
  Clock,
  MoreVertical,
  FileText,
  Paperclip,
  X,
  Sparkles
} from "lucide-react";
import type { Idea, InsertIdea } from "@shared/schema";
import { FileUploader } from "@/components/FileUploader";
import { AttachmentList } from "@/components/AttachmentList";
import { AttachmentViewer } from "@/components/AttachmentViewer";
import { cn } from "@/lib/utils";

const ideaFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["RESEARCH_PROPOSAL", "METHODOLOGY", "COLLABORATION", "FUNDING_OPPORTUNITY", "TOOL_OR_PLATFORM", "GENERAL"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  estimatedEffort: z.enum(["Small", "Medium", "Large"]).optional(),
  potentialImpact: z.enum(["Low", "Medium", "High"]).optional(),
  tags: z.array(z.string()).optional(),
});

type IdeaFormValues = z.infer<typeof ideaFormSchema>;

const categoryLabels = {
  RESEARCH_PROPOSAL: "Research Proposal",
  METHODOLOGY: "Methodology",
  COLLABORATION: "Collaboration",
  FUNDING_OPPORTUNITY: "Funding",
  TOOL_OR_PLATFORM: "Tool/Platform",
  GENERAL: "General"
};

const statusLabels = {
  BRAINSTORMING: "Brainstorming",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  IN_DEVELOPMENT: "In Development",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  REJECTED: "Rejected"
};

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
};

const statusColors = {
  BRAINSTORMING: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  IN_DEVELOPMENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  ON_HOLD: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
};

// Helper function for fuzzy search
function fuzzyMatch(text: string, searchTerm: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedSearch = searchTerm.toLowerCase();
  
  // Direct substring match
  if (normalizedText.includes(normalizedSearch)) return true;
  
  // Word-by-word matching
  const searchWords = normalizedSearch.split(/\s+/).filter(Boolean);
  return searchWords.every(word => normalizedText.includes(word));
}

// Helper function to calculate relevance score
function calculateRelevance(idea: Idea, searchTerm: string): number {
  if (!searchTerm) return 0;
  
  const normalizedSearch = searchTerm.toLowerCase();
  let score = 0;
  
  // Title match (highest weight)
  if (idea.title?.toLowerCase().includes(normalizedSearch)) {
    score += 10;
    // Exact match bonus
    if (idea.title?.toLowerCase() === normalizedSearch) score += 5;
    // Starts with bonus
    if (idea.title?.toLowerCase().startsWith(normalizedSearch)) score += 3;
  }
  
  // Description match
  if (idea.description?.toLowerCase().includes(normalizedSearch)) score += 5;
  
  // Tags match
  if (idea.tags?.some(tag => tag.toLowerCase().includes(normalizedSearch))) score += 3;
  
  // Category match
  if (idea.category && categoryLabels[idea.category]?.toLowerCase().includes(normalizedSearch)) score += 2;
  
  // Recent items get a small boost
  const daysSinceCreated = idea.createdAt ? (Date.now() - new Date(idea.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 999;
  if (daysSinceCreated < 7) score += 1;
  
  return score;
}

// Helper function to highlight search matches
function highlightMatch(text: string, searchTerm: string): JSX.Element {
  if (!searchTerm || !text) return <>{text}</>;
  
  const regex = new RegExp(`(${searchTerm.split(/\s+/).join('|')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function Ideas() {
  const { selectedLab } = useLabContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "recent" | "priority">("relevance");

  // Debounce search term for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ["/api/ideas", selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const form = useForm<IdeaFormValues>({
    resolver: zodResolver(ideaFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "GENERAL",
      priority: "MEDIUM",
      estimatedEffort: "Medium",
      potentialImpact: "Medium",
      tags: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: IdeaFormValues) => {
      const ideaData: InsertIdea = {
        ...data,
        labId: selectedLab!.id,
        tags: data.tags?.filter(tag => tag.trim()) || [],
      };
      return apiRequest("POST", "/api/ideas", ideaData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      setIsCreateOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IdeaFormValues> }) => {
      return apiRequest("PUT", `/api/ideas/${id}`, {
        ...data,
        tags: data.tags?.filter(tag => tag.trim()) || [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      setEditingIdea(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/ideas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
    },
  });

  const statusUpdateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PUT", `/api/ideas/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
    },
  });

  const onSubmit = (data: IdeaFormValues) => {
    if (editingIdea) {
      updateMutation.mutate({ id: editingIdea.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (idea: Idea) => {
    setEditingIdea(idea);
    form.reset({
      title: idea.title,
      description: idea.description || "",
      category: idea.category || "GENERAL",
      priority: idea.priority || "MEDIUM", 
      estimatedEffort: (idea.estimatedEffort as "Small" | "Medium" | "Large") || "Medium",
      potentialImpact: (idea.potentialImpact as "Low" | "Medium" | "High") || "Medium",
      tags: idea.tags || [],
    });
  };

  // Advanced filtering and sorting
  const filteredAndSortedIdeas = useMemo(() => {
    // First, filter ideas
    let filtered = ideas.filter((idea: Idea) => {
      // Search matching
      const matchesSearch = !debouncedSearchTerm || 
        fuzzyMatch(idea.title || '', debouncedSearchTerm) ||
        fuzzyMatch(idea.description || '', debouncedSearchTerm) ||
        idea.tags?.some(tag => fuzzyMatch(tag, debouncedSearchTerm)) ||
        (idea.category && fuzzyMatch(categoryLabels[idea.category] || '', debouncedSearchTerm));
      
      const matchesCategory = categoryFilter === "ALL" || idea.category === categoryFilter;
      const matchesStatus = statusFilter === "ALL" || idea.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Calculate relevance scores if searching
    if (debouncedSearchTerm) {
      filtered = filtered.map(idea => ({
        ...idea,
        relevanceScore: calculateRelevance(idea, debouncedSearchTerm)
      }));
    }

    // Sort based on selected criteria
    filtered.sort((a: any, b: any) => {
      if (sortBy === "relevance" && debouncedSearchTerm) {
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      } else if (sortBy === "recent") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      } else if (sortBy === "priority") {
        const priorityOrder: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }
      return 0;
    });

    return filtered;
  }, [ideas, debouncedSearchTerm, categoryFilter, statusFilter, sortBy]);

  // Quick filter suggestions based on current ideas
  const quickFilters = useMemo(() => {
    const categories = [...new Set(ideas.map((idea: Idea) => idea.category).filter(Boolean))];
    const tags = [...new Set(ideas.flatMap((idea: Idea) => idea.tags || []))];
    return { categories, tags: tags.slice(0, 8) }; // Limit tags for UI
  }, [ideas]);

  if (!selectedLab) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a lab to view ideas</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="ideas-title">Ideas Board</h1>
          <p className="text-muted-foreground">
            Brainstorm and track innovative ideas for {selectedLab.name}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-idea">
              <Plus className="h-4 w-4 mr-2" />
              Add Idea
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Idea</DialogTitle>
              <DialogDescription>
                Add a new idea to the board for discussion and development
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter idea title..." {...field} data-testid="input-idea-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your idea in detail..." 
                          className="min-h-[100px]"
                          {...field} 
                          data-testid="textarea-idea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-idea-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(categoryLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
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
                            <SelectTrigger data-testid="select-idea-priority">
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
                    name="estimatedEffort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Effort</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-idea-effort">
                              <SelectValue placeholder="Select effort" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Small">Small</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="potentialImpact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Potential Impact</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-idea-impact">
                              <SelectValue placeholder="Select impact" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* File Attachments Section - Available for both create and edit */}
                <div className="space-y-4">
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      File Attachments {!editingIdea && "(Available after creating idea)"}
                    </div>
                    {editingIdea && (
                      <FileUploader
                        entityType="IDEA"
                        entityId={editingIdea.id}
                        onComplete={() => {
                          toast({
                            title: "File uploaded successfully",
                            description: "File has been attached to the idea.",
                          });
                        }}
                      >
                        <Button variant="outline" size="sm">
                          <Paperclip className="h-4 w-4 mr-2" />
                          Attach Files
                        </Button>
                      </FileUploader>
                    )}
                  </div>
                  {editingIdea && (
                    <AttachmentList
                      entityType="IDEA"
                      entityId={editingIdea.id}
                      onAttachmentUpdate={() => {
                        // Handle attachment updates if needed
                      }}
                    />
                  )}
                  {!editingIdea && (
                    <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                      💡 Files can be attached after the idea is created. Create the idea first, then edit it to add attachments.
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateOpen(false);
                    setEditingIdea(null);
                    form.reset();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingIdea ? "Update" : "Create"} Idea
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Google-like Search Interface */}
      <div className="space-y-4">
        {/* Main Search Bar */}
        <div className="relative">
          <div className="relative flex items-center">
            <div className="relative flex-1 max-w-3xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search ideas instantly..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-24 py-6 text-lg border-2 rounded-full hover:border-teal-400 focus:border-teal-500 transition-colors"
                data-testid="input-search-ideas"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-16 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearchFilters(!showSearchFilters)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
            </div>
            
            {/* Sort Options */}
            {searchTerm && (
              <div className="ml-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Search Results Count */}
          {searchTerm && (
            <div className="mt-2 text-sm text-muted-foreground ml-4">
              <Sparkles className="inline h-3 w-3 mr-1" />
              Found {filteredAndSortedIdeas.length} {filteredAndSortedIdeas.length === 1 ? 'idea' : 'ideas'}
              {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
            </div>
          )}
        </div>

        {/* Quick Filters & Advanced Filters */}
        {showSearchFilters && (
          <Card className="p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
            <div className="flex gap-3 items-center">
              <Label className="text-sm font-medium">Category:</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={categoryFilter === "ALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter("ALL")}
                  className="h-7"
                >
                  All
                </Button>
                {quickFilters.categories.map((cat: any) => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter(cat)}
                    className="h-7"
                  >
                    {categoryLabels[cat]}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <Label className="text-sm font-medium">Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-7">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {quickFilters.tags.length > 0 && (
              <div className="flex gap-3 items-center">
                <Label className="text-sm font-medium">Quick tags:</Label>
                <div className="flex gap-2 flex-wrap">
                  {quickFilters.tags.map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-900"
                      onClick={() => setSearchTerm(tag)}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Ideas Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAndSortedIdeas.length === 0 ? (
        <Card className="p-12 text-center">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Ideas Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || categoryFilter !== "ALL" || statusFilter !== "ALL"
              ? "Try adjusting your filters to see more ideas."
              : "Start by creating your first idea to get the innovation flowing!"}
          </p>
          {(!searchTerm && categoryFilter === "ALL" && statusFilter === "ALL") && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Idea
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedIdeas.map((idea: Idea) => (
            <Card key={idea.id} className="hover:shadow-lg transition-shadow" data-testid={`card-idea-${idea.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {debouncedSearchTerm ? highlightMatch(idea.title, debouncedSearchTerm) : idea.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {debouncedSearchTerm && idea.description 
                        ? highlightMatch(idea.description, debouncedSearchTerm)
                        : (idea.description || "No description provided")}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`menu-trigger-idea-${idea.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => openEditDialog(idea)}
                        data-testid={`menu-edit-idea-${idea.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        data-testid={`menu-attach-idea-${idea.id}`}
                      >
                        <FileUploader
                          entityType="IDEA"
                          entityId={idea.id}
                          onComplete={() => {
                            toast({
                              title: "File uploaded successfully",
                              description: "File has been attached to the idea.",
                            });
                          }}
                        >
                          <div className="flex items-center w-full">
                            <Paperclip className="h-4 w-4 mr-2" />
                            Attach Files
                          </div>
                        </FileUploader>
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive focus:text-destructive"
                            data-testid={`menu-delete-idea-${idea.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Idea</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{idea.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate(idea.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={priorityColors[idea.priority || "MEDIUM"]}>
                    {idea.priority || "MEDIUM"}
                  </Badge>
                  <Badge variant="secondary">
                    {categoryLabels[idea.category || "GENERAL"]}
                  </Badge>
                  <Select 
                    value={idea.status || "BRAINSTORMING"} 
                    onValueChange={(status) => statusUpdateMutation.mutate({ id: idea.id, status })}
                  >
                    <SelectTrigger className="w-auto h-auto p-0 border-0 text-xs bg-transparent">
                      <Badge className={statusColors[idea.status || "BRAINSTORMING"]}>
                        {statusLabels[idea.status || "BRAINSTORMING"]}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {idea.tags && idea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {idea.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className={cn(
                          "text-xs cursor-pointer",
                          debouncedSearchTerm && fuzzyMatch(tag, debouncedSearchTerm) 
                            ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500" 
                            : ""
                        )}
                        onClick={() => setSearchTerm(tag)}
                      >
                        {debouncedSearchTerm ? highlightMatch(tag, debouncedSearchTerm) : tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* File Attachments Compact View */}
                <AttachmentViewer
                  entityType="IDEA"
                  entityId={idea.id}
                  compact={true}
                  showHeader={false}
                />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    {idea.estimatedEffort && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {idea.estimatedEffort}
                      </div>
                    )}
                    {idea.potentialImpact && (
                      <div className="flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {idea.potentialImpact}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(idea.createdAt || new Date()).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingIdea} onOpenChange={(open) => !open && setEditingIdea(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Idea</DialogTitle>
            <DialogDescription>
              Update the idea details and status
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Same form fields as create dialog */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter idea title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your idea in detail..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(categoryLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
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

              {/* File Attachments Section for Edit Dialog */}
              {editingIdea && (
                <div className="space-y-4">
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      File Attachments
                    </div>
                    <FileUploader
                      entityType="IDEA"
                      entityId={editingIdea.id}
                      onComplete={() => {
                        toast({
                          title: "File uploaded successfully",
                          description: "File has been attached to the idea.",
                        });
                      }}
                    >
                      <Button variant="outline" size="sm">
                        <Paperclip className="h-4 w-4 mr-2" />
                        Attach Files
                      </Button>
                    </FileUploader>
                  </div>
                  <AttachmentList
                    entityType="IDEA"
                    entityId={editingIdea.id}
                    onAttachmentUpdate={() => {
                      // Handle attachment updates if needed
                    }}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setEditingIdea(null);
                  form.reset();
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  Update Idea
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}