import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, Search, UserPlus, Mail, Phone, Building, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type TeamMember, type Study, type ProjectMember, type InsertProjectMember } from "@shared/schema";

interface ProjectTeamManagerProps {
  study: Study;
  children: React.ReactNode;
}

export function ProjectTeamManager({ study, children }: ProjectTeamManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch team members for the lab
  const { data: teamMembers = [], isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members', study.labId],
    enabled: isOpen,
  });

  // Fetch current project members
  const { data: projectMembers = [], isLoading: membersLoading } = useQuery<ProjectMember[]>({
    queryKey: ['/api/project-members', study.id],
    enabled: isOpen,
  });

  // Add member to project mutation
  const addMemberMutation = useMutation({
    mutationFn: async (member: InsertProjectMember) => {
      await apiRequest('/api/project-members', 'POST', member);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/project-members', study.id] });
      toast({
        title: "Team member added",
        description: "Successfully added team member to project.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add team member to project",
        variant: "destructive",
      });
    },
  });

  // Remove member from project mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      await apiRequest(`/api/project-members/${projectId}/${userId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/project-members', study.id] });
      toast({
        title: "Team member removed",
        description: "Successfully removed team member from project.",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to remove team member from project",
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'pi':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'data scientist':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'data analyst':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'regulatory coordinator':
      case 'coordinator':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'lab intern':
      case 'summer intern':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const filteredTeamMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRole === "all" || member.role.toLowerCase() === selectedRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const currentMemberIds = new Set(projectMembers.map(pm => pm.userId));
  const availableMembers = filteredTeamMembers.filter(member => !currentMemberIds.has(member.id));
  const assignedMembers = teamMembers.filter(member => currentMemberIds.has(member.id));

  const handleAddMember = (teamMember: TeamMember) => {
    addMemberMutation.mutate({
      labId: study.labId,
      projectId: study.id,
      userId: teamMember.id,
      role: teamMember.role,
    });
  };

  const handleRemoveMember = (userId: string) => {
    removeMemberMutation.mutate({
      projectId: study.id,
      userId,
    });
  };

  const isLoading = teamLoading || membersLoading;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Project Team - {study.name}
          </DialogTitle>
          <DialogDescription>
            Add or remove team members from this project. Members will have access to project tasks and updates.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {!isLoading && (
          <div className="space-y-6">
            {/* Current Project Team */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Current Project Team ({assignedMembers.length})
              </h3>
              {assignedMembers.length === 0 ? (
                <Card className="p-4 text-center text-muted-foreground">
                  <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No team members assigned to this project yet.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assignedMembers.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatarUrl || undefined} />
                              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{member.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getRoleBadgeColor(member.role)} variant="secondary">
                                  {member.role}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{member.email || 'No email'}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removeMemberMutation.isPending}
                            data-testid={`button-remove-member-${member.id}`}
                          >
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Add Team Members */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Team Members
              </h3>
              
              {/* Search and Filter */}
              <div className="flex gap-3 mb-4">
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
                  <SelectTrigger className="w-48" data-testid="select-role-filter">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="pi">PI</SelectItem>
                    <SelectItem value="data scientist">Data Scientist</SelectItem>
                    <SelectItem value="data analyst">Data Analyst</SelectItem>
                    <SelectItem value="regulatory coordinator">Regulatory Coordinator</SelectItem>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                    <SelectItem value="lab intern">Lab Intern</SelectItem>
                    <SelectItem value="summer intern">Summer Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Available Members */}
              {availableMembers.length === 0 ? (
                <Card className="p-4 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>
                    {filteredTeamMembers.length === 0 
                      ? "No team members found matching your search."
                      : "All matching team members are already assigned to this project."
                    }
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableMembers.map((member) => (
                    <Card key={member.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatarUrl || undefined} />
                              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{member.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getRoleBadgeColor(member.role)} variant="secondary">
                                  {member.role}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{member.email || 'No email'}</span>
                              </div>
                              {member.department && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Building className="h-3 w-3" />
                                  <span className="truncate">{member.department}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAddMember(member)}
                            disabled={addMemberMutation.isPending}
                            size="sm"
                            data-testid={`button-add-member-${member.id}`}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}