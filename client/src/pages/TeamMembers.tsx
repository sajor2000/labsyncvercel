import { useState } from "react";
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
import { 
  Plus, 
  Search,
  Users,
  Mail,
  UserCheck,
  UserX,
  Edit,
  Trash2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLabMemberSchema, type LabMember, type InsertLabMember, type Lab, type User } from "@shared/schema";
import { z } from "zod";

// Create form schema
const createLabMemberFormSchema = insertLabMemberSchema.extend({
  userEmail: z.string().email().optional(), // To find existing user by email
  userName: z.string().optional(), // To create new user if needed
});
type CreateLabMemberFormData = z.infer<typeof createLabMemberFormSchema>;

// Role options for lab members
const roleOptions = [
  { value: "PRINCIPAL_INVESTIGATOR", label: "Principal Investigator" },
  { value: "CO_PRINCIPAL_INVESTIGATOR", label: "Co-Principal Investigator" },
  { value: "DATA_SCIENTIST", label: "Data Scientist" },
  { value: "DATA_ANALYST", label: "Data Analyst" },
  { value: "CLINICAL_RESEARCH_COORDINATOR", label: "Clinical Research Coordinator" },
  { value: "REGULATORY_COORDINATOR", label: "Regulatory Coordinator" },
  { value: "STAFF_COORDINATOR", label: "Staff Coordinator" },
  { value: "LAB_ADMINISTRATOR", label: "Lab Administrator" },
  { value: "FELLOW", label: "Fellow" },
  { value: "MEDICAL_STUDENT", label: "Medical Student" },
  { value: "RESEARCH_ASSISTANT", label: "Research Assistant" },
  { value: "VOLUNTEER_RESEARCH_ASSISTANT", label: "Volunteer Research Assistant" },
  { value: "EXTERNAL_COLLABORATOR", label: "External Collaborator" },
  // Legacy values for backward compatibility
  { value: "PI", label: "PI" },
  { value: "RESEARCH_COORDINATOR", label: "Research Coordinator" },
  { value: "RESEARCHER", label: "Researcher" },
  { value: "STUDENT", label: "Student" },
  { value: "ADMIN", label: "Admin" }
];

export default function TeamMembers() {
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedLab } = useLabContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<LabMember & { user?: User; lab?: Lab } | null>(null);

  // Fetch lab members for current lab or all labs if user is admin
  const { data: labMembers = [], isLoading: membersLoading } = useQuery<(LabMember & { user?: User; lab?: Lab })[]>({
    queryKey: selectedLab ? ['/api/lab-members/lab', selectedLab.id] : ['/api/lab-members/current-user/labs'],
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

  // Also fetch all labs for display purposes
  const { data: allLabs = [] } = useQuery<Lab[]>({
    queryKey: ['/api/labs'],
    enabled: isAuthenticated,
  });

  // Filter members based on search and filters
  const filteredMembers = labMembers.filter(member => {
    const roleLabel = roleOptions.find(opt => opt.value === member.labRole)?.label || member.labRole || 'Unknown Role';
    const userName = member.user?.name || 'Unknown User';
    const userEmail = member.user?.email || '';
    const labName = member.lab?.name || allLabs.find(lab => lab.id === member.labId)?.name || 'Unknown Lab';
    
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         labName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         roleLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || selectedRole === "ALL" || member.labRole === selectedRole;
    const matchesStatus = !selectedStatus || selectedStatus === "ALL" || 
                         (selectedStatus === "ACTIVE" && member.isActive) ||
                         (selectedStatus === "INACTIVE" && !member.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Create member form
  const createMemberForm = useForm<CreateLabMemberFormData>({
    resolver: zodResolver(createLabMemberFormSchema),
    defaultValues: {
      userId: "",
      labId: selectedLab?.id || "",
      labRole: "RESEARCH_ASSISTANT" as const,
      isActive: true,
      userEmail: "",
      userName: "",
    },
  });

  // Edit member form
  const editMemberForm = useForm<CreateLabMemberFormData>({
    resolver: zodResolver(createLabMemberFormSchema),
    defaultValues: {
      userId: "",
      labId: selectedLab?.id || "",
      labRole: "RESEARCH_ASSISTANT" as const,
      isActive: true,
      userEmail: "",
      userName: "",
    },
  });

  // Create member mutation
  const createMemberMutation = useMutation({
    mutationFn: async (data: CreateLabMemberFormData) => {
      // First, we need to find or create the user
      let userId = data.userId;
      
      if (!userId && data.userEmail) {
        // Try to find existing user by email
        try {
          const existingUser = await apiRequest('/api/users/by-email', 'POST', { email: data.userEmail }) as any;
          userId = existingUser?.id;
        } catch (error) {
          // User doesn't exist, create new one if name provided
          if (data.userName) {
            const newUser = await apiRequest('/api/users', 'POST', {
              email: data.userEmail,
              name: data.userName,
            }) as any;
            userId = newUser?.id;
          } else {
            throw new Error('User not found and no name provided for creating new user');
          }
        }
      }
      
      if (!userId) {
        throw new Error('Unable to determine user ID');
      }
      
      const memberData = {
        userId,
        labId: selectedLab?.id || "",
        labRole: data.labRole,
        isActive: data.isActive,
        // Include basic permissions for the role
        canCreateProjects: data.labRole === 'PRINCIPAL_INVESTIGATOR' || data.labRole === 'CO_PRINCIPAL_INVESTIGATOR',
        canAssignTasks: ['PRINCIPAL_INVESTIGATOR', 'CO_PRINCIPAL_INVESTIGATOR', 'LAB_ADMINISTRATOR'].includes(data.labRole || ''),
        canManageMembers: data.labRole === 'PRINCIPAL_INVESTIGATOR' || data.labRole === 'CO_PRINCIPAL_INVESTIGATOR',
      };
      return apiRequest('/api/lab-members', 'POST', memberData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-members'] });
      setIsCreateDialogOpen(false);
      createMemberForm.reset();
      toast({
        title: "Success",
        description: "Lab member added successfully",
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
      console.error('Error adding lab member:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add lab member",
        variant: "destructive",
      });
    },
  });

  // Toggle member status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, labId, isActive }: { userId: string; labId: string; isActive: boolean }) => {
      return apiRequest(`/api/lab-members/${userId}/${labId}`, 'PUT', { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-members/current-user/labs'] });
      if (selectedLab) {
        queryClient.invalidateQueries({ queryKey: ['/api/lab-members/lab', selectedLab.id] });
      }
      toast({
        title: "Success",
        description: "Member status updated successfully",
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
        description: "Failed to update member status",
        variant: "destructive",
      });
    },
  });

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async ({ userId, labId, data }: { userId: string; labId: string; data: Partial<CreateLabMemberFormData> }) => {
      return apiRequest(`/api/lab-members/${userId}/${labId}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({ title: "Lab member updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-members/current-user/labs'] });
      if (selectedLab) {
        queryClient.invalidateQueries({ queryKey: ['/api/lab-members/lab', selectedLab.id] });
      }
      setIsEditDialogOpen(false);
      setEditingMember(null);
      editMemberForm.reset();
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
      console.error("Error updating lab member:", error);
      toast({ 
        title: "Error updating member", 
        description: "Please try again.", 
        variant: "destructive" 
      });
    },
  });

  // Remove member from lab mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ userId, labId }: { userId: string; labId: string }) => {
      return apiRequest(`/api/lab-members/${userId}/${labId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({ title: "Member removed from lab successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-members/current-user/labs'] });
      if (selectedLab) {
        queryClient.invalidateQueries({ queryKey: ['/api/lab-members/lab', selectedLab.id] });
      }
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
      console.error("Error removing lab member:", error);
      toast({ 
        title: "Error removing member", 
        description: "Please try again.", 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: CreateLabMemberFormData) => {
    createMemberMutation.mutate(data);
  };

  const onEditSubmit = (data: CreateLabMemberFormData) => {
    if (editingMember) {
      updateMemberMutation.mutate({ 
        userId: editingMember.userId, 
        labId: editingMember.labId, 
        data 
      });
    }
  };

  const handleEdit = (member: LabMember & { user?: User; lab?: Lab }) => {
    setEditingMember(member);
    editMemberForm.reset({
      userId: member.userId,
      labId: member.labId,
      labRole: member.labRole,
      isActive: member.isActive,
      userEmail: member.user?.email || "",
      userName: member.user?.name || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleRemove = (userId: string, labId: string) => {
    removeMemberMutation.mutate({ userId, labId });
  };

  if (isLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!selectedLab) {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No Lab Selected</h3>
          <p className="text-muted-foreground">Please select a lab to manage team members.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            Lab Members
          </h1>
          <p className="text-muted-foreground">
            {selectedLab 
              ? `Manage lab members and their roles in ${selectedLab.name}` 
              : "Manage lab members across all your labs"}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-member">
                <Plus className="h-4 w-4 mr-2" />
                Add Lab Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Lab Member</DialogTitle>
                <DialogDescription>
                  Add an existing user to {selectedLab.name} lab or invite a new user.
                </DialogDescription>
              </DialogHeader>
              <Form {...createMemberForm}>
                <form onSubmit={createMemberForm.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={createMemberForm.control}
                    name="userEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} value={field.value || ""} placeholder="Enter existing user's email" data-testid="input-member-email" />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground">
                          Enter the email of an existing user to add them to this lab.
                        </p>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createMemberForm.control}
                    name="userName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Name (if creating new user)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Full name for new user" data-testid="input-member-name" />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground">
                          Only fill this if creating a new user account.
                        </p>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createMemberForm.control}
                    name="labRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lab Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-member-role">
                              <SelectValue placeholder="Select lab role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roleOptions.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createMemberMutation.isPending} data-testid="button-submit-member">
                      {createMemberMutation.isPending ? "Adding..." : "Add to Lab"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-members"
            />
          </div>
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-role">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            {roleOptions.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lab Members Grid */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const userName = member.user?.name || 'Unknown User';
            const userEmail = member.user?.email || '';
            const labName = member.lab?.name || allLabs.find(lab => lab.id === member.labId)?.name || 'Unknown Lab';
            const roleLabel = roleOptions.find(r => r.value === member.labRole)?.label || member.labRole;
            
            return (
              <Card key={`${member.userId}-${member.labId}`} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{userName}</CardTitle>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {labName}
                          </Badge>
                          <Badge variant="secondary">
                            {roleLabel}
                          </Badge>
                        </div>
                        {member.joinedAt && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            Joined: {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={member.isActive ? "default" : "secondary"}>
                      {member.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {userEmail && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{userEmail}</span>
                    </div>
                  )}
                  
                  {/* Show key permissions */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.canManageMembers && (
                      <Badge variant="outline" className="text-xs">Can Manage Members</Badge>
                    )}
                    {member.canCreateProjects && (
                      <Badge variant="outline" className="text-xs">Can Create Projects</Badge>
                    )}
                    {member.canAssignTasks && (
                      <Badge variant="outline" className="text-xs">Can Assign Tasks</Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatusMutation.mutate({
                        userId: member.userId,
                        labId: member.labId,
                        isActive: !member.isActive
                      })}
                      disabled={toggleStatusMutation.isPending}
                      data-testid={`button-toggle-status-${member.id}`}
                    >
                      {member.isActive ? (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(member)}
                      data-testid={`button-edit-${member.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRemove(member.userId, member.labId)}
                      disabled={removeMemberMutation.isPending}
                      data-testid={`button-remove-${member.id}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No lab members found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedRole || selectedStatus 
                ? "No members match your current filters." 
                : "Get started by adding your first lab member."}
            </p>
            {!searchTerm && !selectedRole && !selectedStatus && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lab Member
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lab Member</DialogTitle>
            <DialogDescription>
              Update lab member role and permissions for {selectedLab?.name} lab.
            </DialogDescription>
          </DialogHeader>
          <Form {...editMemberForm}>
            <form onSubmit={editMemberForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">User: {editingMember?.user?.name || 'Unknown User'}</p>
                  <p className="text-sm text-muted-foreground">{editingMember?.user?.email}</p>
                  <p className="text-sm text-muted-foreground">Lab: {editingMember?.lab?.name || selectedLab?.name}</p>
                </div>
              </div>
              <FormField
                control={editMemberForm.control}
                name="labRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lab Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-member-role">
                          <SelectValue placeholder="Select lab role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateMemberMutation.isPending} data-testid="button-submit-edit-member">
                  {updateMemberMutation.isPending ? "Updating..." : "Update Lab Member"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
}