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
import { AvatarUpload } from "@/components/AvatarUpload";
import { TeamMemberAvatarUpload } from "@/components/TeamMemberAvatarUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search,
  Users,
  Mail,
  Phone,
  Building,
  UserCheck,
  UserX,
  Settings,
  Edit,
  Trash2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeamMemberSchema, type TeamMember, type InsertTeamMember, type Lab } from "@shared/schema";
import { z } from "zod";

// Create form schema
const createTeamMemberFormSchema = insertTeamMemberSchema;

type CreateTeamMemberFormData = z.infer<typeof createTeamMemberFormSchema>;

// Role options for team members
const roleOptions = [
  { value: "PI", label: "PI" },
  { value: "data_scientist", label: "Data Scientist" },
  { value: "intern", label: "Intern" },
  { value: "resident", label: "Resident" },
  { value: "fellow", label: "Fellow" },
  { value: "regulatory_coordinator", label: "Regulatory Coordinator" }
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
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Fetch team members
  const { data: allMembers = [], isLoading: membersLoading } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
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

  // Filter members by current lab context
  const labMembers = selectedLab ? allMembers.filter(member => member.labId === selectedLab.id) : allMembers;

  // Filter members based on search and filters
  const filteredMembers = labMembers.filter(member => {
    const roleLabel = roleOptions.find(opt => opt.value === member.role)?.label || member.role;
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         roleLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || selectedRole === "ALL" || member.role === selectedRole;
    const matchesStatus = !selectedStatus || selectedStatus === "ALL" || 
                         (selectedStatus === "ACTIVE" && member.isActive) ||
                         (selectedStatus === "INACTIVE" && !member.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Create member form
  const createMemberForm = useForm<CreateTeamMemberFormData>({
    resolver: zodResolver(createTeamMemberFormSchema),
    defaultValues: {
      name: "",
      initials: "",
      email: "",
      role: "PI" as const,
      avatarUrl: "",
      labId: selectedLab?.id || "",
      isActive: true,
    },
  });

  // Edit member form
  const editMemberForm = useForm<CreateTeamMemberFormData>({
    resolver: zodResolver(createTeamMemberFormSchema),
    defaultValues: {
      name: "",
      initials: "",
      email: "",
      role: "PI" as const,
      avatarUrl: "",
      labId: selectedLab?.id || "",
      isActive: true,
    },
  });

  // Create member mutation
  const createMemberMutation = useMutation({
    mutationFn: async (data: CreateTeamMemberFormData) => {
      const memberData = {
        ...data,
        labId: selectedLab?.id || "",
      };
      return apiRequest('POST', '/api/team-members', memberData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      setIsCreateDialogOpen(false);
      createMemberForm.reset();
      toast({
        title: "Success",
        description: "Team member created successfully",
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
        description: "Failed to create team member",
        variant: "destructive",
      });
    },
  });

  // Toggle member status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ memberId, isActive }: { memberId: string; isActive: boolean }) => {
      return apiRequest('PUT', `/api/team-members/${memberId}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTeamMemberFormData> }) => {
      return apiRequest('PUT', `/api/team-members/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Team member updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
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
      console.error("Error updating team member:", error);
      toast({ 
        title: "Error updating member", 
        description: "Please try again.", 
        variant: "destructive" 
      });
    },
  });

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return apiRequest('DELETE', `/api/team-members/${memberId}`);
    },
    onSuccess: () => {
      toast({ title: "Team member deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
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
      console.error("Error deleting team member:", error);
      toast({ 
        title: "Error deleting member", 
        description: "Please try again.", 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: CreateTeamMemberFormData) => {
    createMemberMutation.mutate(data);
  };

  const onEditSubmit = (data: CreateTeamMemberFormData) => {
    if (editingMember) {
      updateMemberMutation.mutate({ id: editingMember.id, data });
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    editMemberForm.reset({
      name: member.name,
      initials: member.initials || "",
      email: member.email || "",
      role: member.role,
      avatarUrl: member.avatarUrl || "",
      labId: member.labId,
      isActive: member.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (memberId: string) => {
    deleteMemberMutation.mutate(memberId);
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
            Team Members
          </h1>
          <p className="text-muted-foreground">
            Manage lab personnel and their assignments in {selectedLab.name}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-member">
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
              <DialogDescription>
                Add a new team member to {selectedLab.name} lab.
              </DialogDescription>
            </DialogHeader>
            <Form {...createMemberForm}>
              <form onSubmit={createMemberForm.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createMemberForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-member-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createMemberForm.control}
                    name="initials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initials</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="e.g., JS" maxLength={10} data-testid="input-member-initials" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createMemberForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={field.value || ""} data-testid="input-member-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createMemberForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-member-role">
                            <SelectValue placeholder="Select role" />
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
                <FormField
                  control={createMemberForm.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar (PNG/JPG)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <TeamMemberAvatarUpload
                            currentAvatarUrl={field.value || undefined}
                            userName={createMemberForm.watch('name') || 'New Member'}
                            size="lg"
                            showUploadButton={true}
                            className="flex-shrink-0"
                            onAvatarChange={(avatarUrl) => field.onChange(avatarUrl)}
                          />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                              Upload a PNG or JPG image, or use initials as fallback
                            </p>
                            <Input 
                              {...field} 
                              value={field.value || ""} 
                              placeholder="Or paste image URL..." 
                              className="mt-2"
                              data-testid="input-member-avatar" 
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMemberMutation.isPending} data-testid="button-submit-member">
                    {createMemberMutation.isPending ? "Creating..." : "Create Member"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Member Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update team member information for {selectedLab.name} lab.
              </DialogDescription>
            </DialogHeader>
            <Form {...editMemberForm}>
              <form onSubmit={editMemberForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editMemberForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-member-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editMemberForm.control}
                    name="initials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initials</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="e.g., JS" maxLength={10} data-testid="input-edit-member-initials" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editMemberForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="email" data-testid="input-edit-member-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editMemberForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-member-role">
                            <SelectValue placeholder="Select role" />
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
                <FormField
                  control={editMemberForm.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar (PNG/JPG)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <TeamMemberAvatarUpload
                            currentAvatarUrl={field.value || undefined}
                            userName={editMemberForm.watch('name') || 'Team Member'}
                            size="lg"
                            showUploadButton={true}
                            className="flex-shrink-0"
                            onAvatarChange={(avatarUrl) => field.onChange(avatarUrl)}
                          />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                              Upload a PNG or JPG image, or use initials as fallback
                            </p>
                            <Input 
                              {...field} 
                              value={field.value || ""} 
                              placeholder="Or paste image URL..." 
                              className="mt-2"
                              data-testid="input-edit-member-avatar" 
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={updateMemberMutation.isPending} data-testid="button-submit-edit-member">
                    {updateMemberMutation.isPending ? "Updating..." : "Update Member"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-members"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[200px]" data-testid="select-role-filter">
            <SelectValue placeholder="All Roles" />
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
          <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Members Grid */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TeamMemberAvatarUpload
                      currentAvatarUrl={member.avatarUrl || undefined}
                      userName={member.name}
                      size="md"
                      showUploadButton={false}
                      className="flex-shrink-0"
                    />
                    <div>
                      <CardTitle className="text-base">{member.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {roleOptions.find(opt => opt.value === member.role)?.label || member.role}
                      </p>
                    </div>
                  </div>
                  <Badge variant={member.isActive ? "default" : "secondary"}>
                    {member.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {member.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                {member.initials && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {member.initials}
                    </span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatusMutation.mutate({
                      memberId: member.id,
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
                    onClick={() => handleDelete(member.id)}
                    disabled={deleteMemberMutation.isPending}
                    data-testid={`button-delete-${member.id}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No team members found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedRole || selectedStatus 
                ? "No members match your current filters." 
                : "Get started by adding your first team member."}
            </p>
            {!searchTerm && !selectedRole && !selectedStatus && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}