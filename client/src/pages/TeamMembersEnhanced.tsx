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
import { TeamMemberAvatarUpload } from "@/components/TeamMemberAvatarUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Plus, 
  Search,
  Users,
  Mail,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Building2,
  Phone,
  Globe,
  Badge as BadgeIcon
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Role options EXACTLY matching database teamMemberRoleEnum
const roleOptions = [
  { value: "PI", label: "PI" },
  { value: "CO_PRINCIPAL_INVESTIGATOR", label: "Co-Principal Investigator" },
  { value: "Data Scientist", label: "Data Scientist" },
  { value: "Data Analyst", label: "Data Analyst" },
  { value: "Regulatory Coordinator", label: "Regulatory Coordinator" },
  { value: "Coordinator", label: "Coordinator" },
  { value: "Lab Intern", label: "Lab Intern" },
  { value: "Summer Intern", label: "Summer Intern" },
  { value: "Principal Investigator", label: "Principal Investigator" },
  { value: "Clinical Research Coordinator", label: "Clinical Research Coordinator" },
  { value: "Staff Coordinator", label: "Staff Coordinator" },
  { value: "Fellow", label: "Fellow" },
  { value: "Medical Student", label: "Medical Student" },
  { value: "Volunteer Research Assistant", label: "Volunteer Research Assistant" },
  { value: "Research Assistant", label: "Research Assistant" },
];

// Create form schema for enhanced user model
const createMemberFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  email: z.string().email("Valid email is required"),
  role: z.string().min(1, "Role is required"),
  title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  capacity: z.string().default("40.00"),
  bio: z.string().optional(),
  linkedIn: z.string().optional(),
  orcid: z.string().optional(),
  expertise: z.string().optional(), // Will be converted to array
  skills: z.string().optional(), // Will be converted to array
  isExternal: z.boolean().default(false),
});

type CreateMemberFormData = z.infer<typeof createMemberFormSchema>;

// Enhanced User type for display
interface EnhancedUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  name?: string;
  initials?: string;
  role?: string;
  title?: string;
  department?: string;
  institution?: string;
  phone?: string;
  profileImageUrl?: string;
  avatar?: string;
  bio?: string;
  linkedIn?: string;
  orcid?: string;
  capacity?: string;
  expertise?: string[];
  skills?: string[];
  isActive?: boolean;
  isExternal?: boolean;
  lastActive?: string;
  createdAt?: string;
  updatedAt?: string;
  labs?: string[]; // Lab names for multi-lab display
}

export default function TeamMembersEnhanced() {
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedLab } = useLabContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<EnhancedUser | null>(null);

  // Fetch lab members with enhanced multi-lab support
  const { data: allMembers = [], isLoading: membersLoading } = useQuery<EnhancedUser[]>({
    queryKey: ['/api/lab-members', selectedLab?.id],
    enabled: isAuthenticated && !!selectedLab,
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

  // Create form
  const createForm = useForm<CreateMemberFormData>({
    resolver: zodResolver(createMemberFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
      role: "",
      title: "",
      department: "",
      phone: "",
      capacity: "40.00",
      bio: "",
      linkedIn: "",
      orcid: "",
      expertise: "",
      skills: "",
      isExternal: false,
    },
  });

  // Edit form
  const editForm = useForm<CreateMemberFormData>({
    resolver: zodResolver(createMemberFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
      role: "",
      title: "",
      department: "",
      phone: "",
      capacity: "40.00",
      bio: "",
      linkedIn: "",
      orcid: "",
      expertise: "",
      skills: "",
      isExternal: false,
    },
  });

  // Create member mutation - enhanced for new backend
  const createMemberMutation = useMutation({
    mutationFn: async (data: CreateMemberFormData) => {
      // Convert expertise and skills strings to arrays
      const memberData = {
        ...data,
        name: `${data.firstName} ${data.lastName}`.trim(),
        initials: `${data.firstName?.charAt(0) || ''}${data.lastName?.charAt(0) || ''}`,
        expertise: data.expertise ? data.expertise.split(',').map(s => s.trim()).filter(Boolean) : [],
        skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        institution: "Rush University Medical Center",
        labId: selectedLab?.id, // Include the selected lab ID
      };
      
      await apiRequest('/api/team-members', 'POST', memberData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Team Member Created",
        description: "New team member has been added successfully.",
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
        description: "Failed to create team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (data: CreateMemberFormData) => {
      if (!editingMember) throw new Error("No member selected for editing");
      
      const memberData = {
        ...data,
        name: `${data.firstName} ${data.lastName}`.trim(),
        initials: `${data.firstName?.charAt(0) || ''}${data.lastName?.charAt(0) || ''}`,
        expertise: data.expertise ? data.expertise.split(',').map(s => s.trim()).filter(Boolean) : [],
        skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        updatedAt: new Date().toISOString(),
      };
      
      await apiRequest(`/api/team-members/${editingMember.id}`, 'PUT', memberData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      setIsEditDialogOpen(false);
      setEditingMember(null);
      editForm.reset();
      toast({
        title: "Team Member Updated",
        description: "Team member has been updated successfully.",
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
        description: "Failed to update team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiRequest(`/api/team-members/${memberId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      toast({
        title: "Team Member Deleted",
        description: "Team member has been removed successfully.",
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
        description: "Failed to delete team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle edit member
  const handleEditMember = (member: EnhancedUser) => {
    setEditingMember(member);
    editForm.reset({
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      middleName: member.middleName || "",
      email: member.email || "",
      role: member.role || "",
      title: member.title || "",
      department: member.department || "",
      phone: member.phone || "",
      capacity: member.capacity || "40.00",
      bio: member.bio || "",
      linkedIn: member.linkedIn || "",
      orcid: member.orcid || "",
      expertise: member.expertise?.join(', ') || "",
      skills: member.skills?.join(', ') || "",
      isExternal: member.isExternal || false,
    });
    setIsEditDialogOpen(true);
  };

  // Filter members
  const filteredMembers = allMembers.filter((member) => {
    const matchesSearch = 
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !selectedRole || selectedRole === "all" || member.role === selectedRole;
    const matchesStatus = !selectedStatus || selectedStatus === "all" || 
      (selectedStatus === "active" && member.isActive) ||
      (selectedStatus === "inactive" && !member.isActive) ||
      (selectedStatus === "external" && member.isExternal);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-8">Please log in to view team members.</div>;
  }

  if (!selectedLab) {
    return <div className="p-8">Please select a lab to view team members.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="team-members-page">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-8 w-8 text-purple-600" />
            {selectedLab.shortName || selectedLab.name} Team
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage team members and their roles across research projects
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="button-add-member"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
              <DialogDescription>
                Add a new member to {selectedLab.shortName || selectedLab.name}
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit((data) => createMemberMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-middle-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-role">
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
                    control={createForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-department" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="linkedIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-linkedin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="orcid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ORCID</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-orcid" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="expertise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expertise (comma-separated)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Clinical Trials, Data Analysis, Statistics" data-testid="input-expertise" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Technical Skills (comma-separated)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Python, R, REDCap, SPSS" data-testid="input-skills" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-bio" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMemberMutation.isPending}
                    data-testid="button-submit-create"
                  >
                    {createMemberMutation.isPending ? "Creating..." : "Create Member"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-members"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-48" data-testid="select-filter-role">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roleOptions.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-32" data-testid="select-filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="external">External</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Members Grid */}
      {membersLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No team members found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || selectedRole || selectedStatus
                ? "No members match your current filters."
                : `Get started by adding your first team member to ${selectedLab.shortName || selectedLab.name}.`}
            </p>
            {!searchTerm && !selectedRole && !selectedStatus && (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                data-testid="button-add-first-member"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow" data-testid={`card-member-${member.id}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold text-lg">
                      {member.initials || (member.firstName?.charAt(0) || '') + (member.lastName?.charAt(0) || '')}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        {member.name || `${member.firstName} ${member.lastName}`}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {member.title || member.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditMember(member)}
                      data-testid={`button-edit-${member.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-delete-${member.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{member.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteMemberMutation.mutate(member.id)}
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
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4 mr-2" />
                    {member.email}
                  </div>
                  {member.phone && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4 mr-2" />
                      {member.phone}
                    </div>
                  )}
                  {member.department && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Building2 className="h-4 w-4 mr-2" />
                      {member.department}
                    </div>
                  )}
                  {member.linkedIn && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Globe className="h-4 w-4 mr-2" />
                      <a href={member.linkedIn} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">
                        LinkedIn
                      </a>
                    </div>
                  )}
                  {member.orcid && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <BadgeIcon className="h-4 w-4 mr-2" />
                      <a href={`https://orcid.org/${member.orcid}`} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">
                        ORCID
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={member.isActive ? "default" : "secondary"}
                      className={member.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {member.isActive ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
                      {member.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {member.isExternal && (
                      <Badge variant="outline" className="text-purple-600 border-purple-600">
                        External
                      </Badge>
                    )}
                  </div>

                  {member.labs && member.labs.length > 1 && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Also in: </span>
                      <span className="text-purple-600">{member.labs.filter(lab => lab !== selectedLab?.shortName).join(', ')}</span>
                    </div>
                  )}

                  {member.expertise && member.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {member.expertise.slice(0, 3).map((exp, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {exp}
                        </Badge>
                      ))}
                      {member.expertise.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{member.expertise.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog - Similar to Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member information
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => updateMemberMutation.mutate(data))} className="space-y-4">
              {/* Same form fields as create form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-edit-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-role">
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
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMemberMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateMemberMutation.isPending ? "Updating..." : "Update Member"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}