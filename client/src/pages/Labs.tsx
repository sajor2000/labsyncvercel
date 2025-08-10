import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, FlaskConical, Folder, Settings, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Lab, Study, Bucket, InsertLab, TeamMember } from "@shared/schema";
import { insertLabSchema } from "@shared/schema";

// Predefined color options for labs
const LAB_COLOR_OPTIONS = [
  { name: "Blue", value: "#3b82f6", class: "bg-blue-500" },
  { name: "Teal", value: "#4C9A92", class: "bg-teal-600" },
  { name: "Green", value: "#10b981", class: "bg-green-500" },
  { name: "Purple", value: "#8b5cf6", class: "bg-purple-500" },
  { name: "Pink", value: "#ec4899", class: "bg-pink-500" },
  { name: "Orange", value: "#f59e0b", class: "bg-orange-500" },
  { name: "Red", value: "#ef4444", class: "bg-red-500" },
  { name: "Indigo", value: "#6366f1", class: "bg-indigo-500" },
  { name: "Cyan", value: "#5DD5E6", class: "bg-cyan-400" },
  { name: "Yellow", value: "#eab308", class: "bg-yellow-500" },
  { name: "Rose", value: "#f43f5e", class: "bg-rose-500" },
  { name: "Emerald", value: "#059669", class: "bg-emerald-600" },
];

export default function Labs() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [viewingLab, setViewingLab] = useState<Lab | null>(null);

  // Form for creating new lab
  const form = useForm<InsertLab>({
    resolver: zodResolver(insertLabSchema),
    defaultValues: {
      name: "",
      description: "",
      department: "",
      primaryColor: "#3b82f6",
    },
  });

  // Form for editing existing lab
  const editForm = useForm<InsertLab>({
    resolver: zodResolver(insertLabSchema),
    defaultValues: {
      name: "",
      description: "",
      department: "",
      primaryColor: "#3b82f6",
    },
  });

  // Mutation for creating lab
  const createLabMutation = useMutation({
    mutationFn: async (data: InsertLab) => {
      return apiRequest('/api/labs', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/labs'] });
      toast({
        title: "Success",
        description: "Lab created successfully",
      });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating lab
  const updateLabMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertLab }) => {
      return apiRequest(`/api/labs/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/labs'] });
      toast({
        title: "Success",
        description: "Lab updated successfully",
      });
      setShowEditDialog(false);
      setEditingLab(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateLab = (data: InsertLab) => {
    createLabMutation.mutate(data);
  };

  const handleUpdateLab = (data: InsertLab) => {
    if (editingLab) {
      updateLabMutation.mutate({ id: editingLab.id, data });
    }
  };

  const handleOpenCreateDialog = () => {
    setShowCreateDialog(true);
    form.reset();
  };

  const handleOpenEditDialog = (lab: Lab) => {
    setEditingLab(lab);
    editForm.reset({
      name: lab.name,
      description: lab.description || "",
      department: lab.department || "",
      primaryColor: lab.primaryColor || "#3b82f6",
    });
    setShowEditDialog(true);
  };

  const handleViewLab = (lab: Lab) => {
    setViewingLab(lab);
    setShowViewDialog(true);
  };

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
  const { data: labs = [], isLoading: labsLoading, error: labsError } = useQuery<Lab[]>({
    queryKey: ['/api/labs'],
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

  // Get studies count for each lab
  const { data: allStudies = [] } = useQuery<Study[]>({
    queryKey: ['/api/studies'],
    enabled: isAuthenticated,
  });

  // Get buckets for each lab
  const { data: allBuckets = [] } = useQuery<Bucket[]>({
    queryKey: ['/api/buckets'],
    enabled: isAuthenticated,
  });

  // Get team members for each lab
  const { data: allTeamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
    enabled: isAuthenticated,
  });

  // Filter labs
  const filteredLabs = labs.filter(lab =>
    lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lab.description && lab.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper functions
  const getStudiesCount = (labId: string) => {
    return allStudies.filter(study => study.labId === labId).length;
  };

  const getBucketsCount = (labId: string) => {
    return allBuckets.filter(bucket => bucket.labId === labId).length;
  };

  const getTeamMembersCount = (labId: string) => {
    return allTeamMembers.filter(member => member.labId === labId && member.isActive).length;
  };

  const getLabTeamMembers = (labId: string) => {
    return allTeamMembers.filter(member => member.labId === labId && member.isActive);
  };

  const getLabStudies = (labId: string) => {
    return allStudies.filter(study => study.labId === labId);
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
          <h1 className="text-2xl font-bold text-foreground">Research Labs</h1>
          <p className="text-muted-foreground">Manage your research laboratories and teams</p>
        </div>
        <Button onClick={handleOpenCreateDialog} data-testid="button-create-lab">
          <Plus className="h-4 w-4 mr-2" />
          New Lab
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search labs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
          data-testid="input-search-labs"
        />
      </div>

      {/* Labs Grid */}
      {labsLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-3/4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded"></div>
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
                    <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLabs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">No labs found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search" : "Create your first lab to get started"}
              </p>
              <Button onClick={handleOpenCreateDialog} data-testid="button-create-first-lab">
                <Plus className="h-4 w-4 mr-2" />
                Create Lab
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLabs.map((lab) => (
            <Card key={lab.id} className="hover:shadow-md transition-shadow" data-testid={`lab-card-${lab.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: lab.primaryColor || '#3b82f6' }}
                      />
                      {lab.name}
                    </CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleOpenEditDialog(lab)}
                    data-testid={`button-lab-settings-${lab.id}`}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lab.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {lab.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <FlaskConical className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-sm font-medium">{getStudiesCount(lab.id)}</p>
                      <p className="text-xs text-muted-foreground">Studies</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <Folder className="h-4 w-4 text-orange-500" />
                      </div>
                      <p className="text-sm font-medium">{getBucketsCount(lab.id)}</p>
                      <p className="text-xs text-muted-foreground">Buckets</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <Users className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-sm font-medium">{getTeamMembersCount(lab.id)}</p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1" 
                      onClick={() => handleViewLab(lab)}
                      data-testid={`button-view-lab-${lab.id}`}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" data-testid={`button-manage-lab-${lab.id}`}>
                      <Folder className="h-3 w-3 mr-1" />
                      Buckets
                    </Button>
                  </div>

                  {/* Created Date */}
                  <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    Created: {lab.createdAt ? new Date(lab.createdAt).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Lab Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Lab</DialogTitle>
            <DialogDescription>
              Add a new research laboratory to your organization.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateLab)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lab Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter lab name" 
                        {...field} 
                        data-testid="input-lab-name"
                      />
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
                        placeholder="Describe the lab's focus and purpose" 
                        className="resize-none" 
                        {...field}
                        value={field.value || ""} 
                        data-testid="textarea-lab-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Internal Medicine - Critical Care" 
                        {...field}
                        value={field.value || ""}
                        data-testid="input-lab-department" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lab Color</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value || "#3b82f6"} 
                        onValueChange={field.onChange}
                        data-testid="select-lab-color"
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border" 
                                style={{ backgroundColor: field.value || "#3b82f6" }}
                              />
                              {LAB_COLOR_OPTIONS.find(c => c.value === field.value)?.name || "Custom Color"}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {LAB_COLOR_OPTIONS.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full border" 
                                  style={{ backgroundColor: color.value }}
                                />
                                {color.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  data-testid="button-cancel-create-lab"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createLabMutation.isPending}
                  data-testid="button-confirm-create-lab"
                >
                  {createLabMutation.isPending ? "Creating..." : "Create Lab"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Lab Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Lab</DialogTitle>
            <DialogDescription>
              Update the details for {editingLab?.name}.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateLab)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lab Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter lab name" 
                        {...field} 
                        data-testid="input-edit-lab-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the lab's focus and purpose" 
                        className="resize-none" 
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-edit-lab-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Internal Medicine - Critical Care" 
                        {...field}
                        value={field.value || ""}
                        data-testid="input-edit-lab-department" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lab Color</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value || "#3b82f6"} 
                        onValueChange={field.onChange}
                        data-testid="select-edit-lab-color"
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border" 
                                style={{ backgroundColor: field.value || "#3b82f6" }}
                              />
                              {LAB_COLOR_OPTIONS.find(c => c.value === field.value)?.name || "Custom Color"}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {LAB_COLOR_OPTIONS.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full border" 
                                  style={{ backgroundColor: color.value }}
                                />
                                {color.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  data-testid="button-cancel-edit-lab"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateLabMutation.isPending}
                  data-testid="button-confirm-edit-lab"
                >
                  {updateLabMutation.isPending ? "Updating..." : "Update Lab"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Lab Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: viewingLab?.primaryColor || "#3b82f6" }}
              />
              {viewingLab?.name}
            </DialogTitle>
            <DialogDescription>
              Lab overview and statistics
            </DialogDescription>
          </DialogHeader>
          
          {viewingLab && (
            <div className="space-y-6">
              {/* Lab Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Department</h4>
                  <p className="text-sm">{viewingLab.department || "Not specified"}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                  <p className="text-sm">
                    {viewingLab.createdAt ? new Date(viewingLab.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {viewingLab.description && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{viewingLab.description}</p>
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{getStudiesCount(viewingLab.id)}</div>
                  <div className="text-xs text-muted-foreground">Studies</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{getBucketsCount(viewingLab.id)}</div>
                  <div className="text-xs text-muted-foreground">Buckets</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{getTeamMembersCount(viewingLab.id)}</div>
                  <div className="text-xs text-muted-foreground">Team Members</div>
                </div>
              </div>

              {/* Team Members Preview */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Team Members</h4>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {getLabTeamMembers(viewingLab.id).slice(0, 10).map(member => (
                    <Badge key={member.id} variant="secondary" className="text-xs">
                      {member.name || member.email} ({member.role})
                    </Badge>
                  ))}
                  {getLabTeamMembers(viewingLab.id).length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{getLabTeamMembers(viewingLab.id).length - 10} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Recent Studies */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Recent Studies</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {getLabStudies(viewingLab.id).slice(0, 5).map(study => (
                    <div key={study.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                      <span className="font-medium">{study.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {study.status}
                      </Badge>
                    </div>
                  ))}
                  {getLabStudies(viewingLab.id).length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No studies yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowViewDialog(false)}
              data-testid="button-close-view-lab"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowViewDialog(false);
                if (viewingLab) {
                  handleOpenEditDialog(viewingLab);
                }
              }}
              data-testid="button-edit-from-view"
            >
              <Settings className="h-4 w-4 mr-1" />
              Edit Lab
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}