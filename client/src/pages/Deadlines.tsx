import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLabContext } from "@/hooks/useLabContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Calendar, 
  Edit, 
  Trash2,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  ExternalLink,
  User,
  Calendar as CalendarIcon
} from "lucide-react";
import type { Deadline, InsertDeadline } from "@shared/schema";

const deadlineFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["GRANT_APPLICATION", "PAPER_SUBMISSION", "ABSTRACT_SUBMISSION", "IRB_SUBMISSION", "CONFERENCE_DEADLINE", "MILESTONE", "OTHER"]),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  assignedTo: z.string().optional(),
  relatedStudyId: z.string().optional(),
  submissionUrl: z.string().optional(),
  notes: z.string().optional(),
});

type DeadlineFormValues = z.infer<typeof deadlineFormSchema>;

const typeLabels = {
  GRANT_APPLICATION: "Grant Application",
  PAPER_SUBMISSION: "Paper Submission", 
  ABSTRACT_SUBMISSION: "Abstract Submission",
  IRB_SUBMISSION: "IRB Submission",
  CONFERENCE_DEADLINE: "Conference Deadline",
  MILESTONE: "Milestone",
  OTHER: "Other"
};

const statusLabels = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  MISSED: "Missed"
};

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
};

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  MISSED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
};

const typeColors = {
  GRANT_APPLICATION: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  PAPER_SUBMISSION: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  ABSTRACT_SUBMISSION: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  IRB_SUBMISSION: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  CONFERENCE_DEADLINE: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  MILESTONE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
};

export default function Deadlines() {
  const { selectedLab } = useLabContext();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);

  const { data: deadlines = [], isLoading } = useQuery({
    queryKey: ["/api/deadlines", selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: studies = [] } = useQuery({
    queryKey: ["/api/studies", selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/team-members"],
  });

  const form = useForm<DeadlineFormValues>({
    resolver: zodResolver(deadlineFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "OTHER",
      dueDate: "",
      priority: "MEDIUM",
      assignedTo: "unassigned",
      relatedStudyId: "none",
      submissionUrl: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DeadlineFormValues) => {
      const deadlineData: InsertDeadline = {
        ...data,
        dueDate: new Date(data.dueDate),
        labId: selectedLab!.id,
        assignedTo: data.assignedTo === "unassigned" ? undefined : data.assignedTo,
        relatedStudyId: data.relatedStudyId === "none" ? undefined : data.relatedStudyId,
      };
      return apiRequest("POST", "/api/deadlines", deadlineData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deadlines"] });
      setIsCreateOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DeadlineFormValues> }) => {
      const updateData = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        assignedTo: data.assignedTo === "unassigned" ? undefined : data.assignedTo,
        relatedStudyId: data.relatedStudyId === "none" ? undefined : data.relatedStudyId,
      };
      return apiRequest("PUT", `/api/deadlines/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deadlines"] });
      setEditingDeadline(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/deadlines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deadlines"] });
    },
  });

  const statusUpdateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PUT", `/api/deadlines/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deadlines"] });
    },
  });

  const onSubmit = (data: DeadlineFormValues) => {
    if (editingDeadline) {
      updateMutation.mutate({ id: editingDeadline.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (deadline: Deadline) => {
    setEditingDeadline(deadline);
    form.reset({
      title: deadline.title,
      description: deadline.description || "",
      type: deadline.type,
      dueDate: new Date(deadline.dueDate).toISOString().split('T')[0],
      priority: deadline.priority || "MEDIUM",
      assignedTo: deadline.assignedTo || "unassigned",
      relatedStudyId: deadline.relatedStudyId || "none",
      submissionUrl: deadline.submissionUrl || "",
      notes: deadline.notes || "",
    });
  };

  const getDaysUntilDue = (dueDate: string | Date) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyIcon = (daysUntil: number, status: string) => {
    if (status === "COMPLETED") return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === "MISSED" || daysUntil < 0) return <XCircle className="h-4 w-4 text-red-600" />;
    if (daysUntil <= 3) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (daysUntil <= 7) return <Clock className="h-4 w-4 text-orange-600" />;
    return <Target className="h-4 w-4 text-blue-600" />;
  };

  const filteredDeadlines = (deadlines as Deadline[]).filter((deadline: Deadline) => {
    const matchesSearch = deadline.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deadline.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || deadline.type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || deadline.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedDeadlines = filteredDeadlines.sort((a: Deadline, b: Deadline) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  if (!selectedLab) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a lab to view deadlines</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="deadlines-title">Deadlines</h1>
          <p className="text-muted-foreground">
            Track upcoming grants, submissions, and important deadlines for {selectedLab.name}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-deadline">
              <Plus className="h-4 w-4 mr-2" />
              Add Deadline
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Deadline</DialogTitle>
              <DialogDescription>
                Add an important deadline to track and manage
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
                        <Input placeholder="Enter deadline title..." {...field} data-testid="input-deadline-title" />
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
                          placeholder="Describe the deadline requirements..." 
                          className="min-h-[80px]"
                          {...field} 
                          data-testid="textarea-deadline-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-deadline-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(typeLabels).map(([value, label]) => (
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
                                data-testid="button-deadline-due-date"
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
                            <CalendarComponent
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-deadline-priority">
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

                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned To</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-deadline-assignee">
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {(teamMembers as any[])
                              .filter((member: any) => member?.id && member?.name)
                              .map((member: any) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
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
                    control={form.control}
                    name="relatedStudyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Study (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-deadline-study">
                              <SelectValue placeholder="Select study" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No related study</SelectItem>
                            {(studies as any[])
                              .filter((study: any) => study?.id && study?.name)
                              .map((study: any) => (
                              <SelectItem key={study.id} value={study.id}>
                                {study.name}
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
                    name="submissionUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Submission URL (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://..." 
                            {...field} 
                            data-testid="input-deadline-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes or requirements..." 
                          className="min-h-[60px]"
                          {...field} 
                          data-testid="textarea-deadline-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateOpen(false);
                    setEditingDeadline(null);
                    form.reset();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingDeadline ? "Update" : "Create"} Deadline
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deadlines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-deadlines"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {Object.entries(typeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Deadlines List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedDeadlines.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Deadlines Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || typeFilter !== "ALL" || statusFilter !== "ALL"
              ? "Try adjusting your filters to see more deadlines."
              : "Start by adding your first deadline to stay on track!"}
          </p>
          {(!searchTerm && typeFilter === "ALL" && statusFilter === "ALL") && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Deadline
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedDeadlines.map((deadline: Deadline) => {
            const daysUntil = getDaysUntilDue(deadline.dueDate);
            const assignedMember = (teamMembers as any[]).find((m: any) => m.id === deadline.assignedTo);
            const relatedStudy = (studies as any[]).find((s: any) => s.id === deadline.relatedStudyId);
            
            return (
              <Card 
                key={deadline.id} 
                className={`hover:shadow-lg transition-shadow ${
                  daysUntil < 0 && deadline.status !== "COMPLETED" ? "border-red-200 bg-red-50 dark:bg-red-950" :
                  daysUntil <= 3 && deadline.status !== "COMPLETED" ? "border-orange-200 bg-orange-50 dark:bg-orange-950" :
                  daysUntil <= 7 && deadline.status !== "COMPLETED" ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-950" :
                  ""
                }`}
                data-testid={`card-deadline-${deadline.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getUrgencyIcon(daysUntil, deadline.status)}
                        <CardTitle className="text-lg">{deadline.title}</CardTitle>
                        {deadline.submissionUrl && (
                          <a 
                            href={deadline.submissionUrl || "#"} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {deadline.description || "No description provided"}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditDialog(deadline)}
                        data-testid={`button-edit-deadline-${deadline.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-deadline-${deadline.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Deadline</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{deadline.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate(deadline.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant="outline" className={priorityColors[deadline.priority || "MEDIUM"]}>
                      {deadline.priority || "MEDIUM"}
                    </Badge>
                    <Badge variant="secondary" className={typeColors[deadline.type || "OTHER"]}>
                      {typeLabels[deadline.type || "OTHER"]}
                    </Badge>
                    <Select 
                      value={deadline.status || "PENDING"} 
                      onValueChange={(status) => statusUpdateMutation.mutate({ id: deadline.id, status })}
                    >
                      <SelectTrigger className="w-auto h-auto p-0 border-0 text-xs bg-transparent">
                        <Badge className={statusColors[deadline.status as keyof typeof statusColors || "PENDING"]}>
                          {statusLabels[deadline.status as keyof typeof statusLabels || "PENDING"]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(deadline.dueDate).toLocaleDateString()}
                      <span className="ml-2">
                        ({daysUntil >= 0 ? `${daysUntil} days` : `${Math.abs(daysUntil)} days overdue`})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      {assignedMember && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {assignedMember.name}
                        </div>
                      )}
                      {relatedStudy && (
                        <div className="flex items-center">
                          <Target className="h-4 w-4 mr-1" />
                          {relatedStudy.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {deadline.notes && (
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      {deadline.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingDeadline} onOpenChange={(open) => !open && setEditingDeadline(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Deadline</DialogTitle>
            <DialogDescription>
              Update the deadline details and status
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
                      <Input placeholder="Enter deadline title..." {...field} />
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
                        placeholder="Describe the deadline requirements..." 
                        className="min-h-[80px]"
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
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(typeLabels).map(([value, label]) => (
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
                              data-testid="button-edit-deadline-due-date"
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
                          <CalendarComponent
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

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setEditingDeadline(null);
                  form.reset();
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  Update Deadline
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}