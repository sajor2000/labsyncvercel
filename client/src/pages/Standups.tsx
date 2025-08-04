import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Mic, Calendar, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLabContext } from "@/hooks/useLabContext";

interface Standup {
  id: string;
  title: string;
  description?: string;
  scheduledDate: string;
  status: "scheduled" | "in_progress" | "completed";
  facilitatorId?: string;
  labId: string;
  participantIds: string[];
  notes?: string;
  actionItems?: string[];
  createdAt: string;
  updatedAt: string;
}

const standupSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  facilitatorId: z.string().optional(),
});

type StandupFormData = z.infer<typeof standupSchema>;

export default function Standups() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const { selectedLab } = useLabContext();

  const { data: standups = [], isLoading } = useQuery<Standup[]>({
    queryKey: ['/api/standups', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['/api/team-members'],
  });

  const form = useForm<StandupFormData>({
    resolver: zodResolver(standupSchema),
    defaultValues: {
      title: "",
      description: "",
      scheduledDate: "",
      facilitatorId: "",
    },
  });

  const createStandupMutation = useMutation({
    mutationFn: async (data: StandupFormData) => {
      return apiRequest('/api/standups', {
        method: 'POST',
        body: {
          ...data,
          labId: selectedLab?.id,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/standups'] });
      toast({
        title: "Success",
        description: "Standup created successfully",
      });
      setIsCreateDialogOpen(false);
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

  const updateStandupStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/standups/${id}`, {
        method: 'PUT',
        body: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/standups'] });
      toast({
        title: "Success",
        description: "Standup status updated",
      });
    },
  });

  const onSubmit = (data: StandupFormData) => {
    createStandupMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-500";
      case "in_progress": return "bg-yellow-500";
      case "completed": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  if (!selectedLab) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a lab to view standups.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Standups</h1>
          <p className="text-muted-foreground">Manage daily standup meetings and track progress</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-standup">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Standup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Standup</DialogTitle>
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
                        <Input {...field} data-testid="input-standup-title" />
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
                        <Textarea {...field} data-testid="textarea-standup-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-standup-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="facilitatorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facilitator (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-facilitator">
                            <SelectValue placeholder="Select a facilitator" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teamMembers.map((member: any) => (
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
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-standup"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createStandupMutation.isPending}
                    data-testid="button-submit-standup"
                  >
                    {createStandupMutation.isPending ? "Creating..." : "Create Standup"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

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
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : standups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mic className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Standups Scheduled</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by scheduling your first standup meeting for the team.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-standup">
              <Plus className="mr-2 h-4 w-4" />
              Schedule First Standup
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {standups.map((standup) => (
            <Card key={standup.id} data-testid={`card-standup-${standup.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{standup.title}</CardTitle>
                    {standup.description && (
                      <CardDescription>{standup.description}</CardDescription>
                    )}
                  </div>
                  <Badge className={`${getStatusColor(standup.status)} text-white`}>
                    {standup.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    {new Date(standup.scheduledDate).toLocaleString()}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    {standup.participantIds.length} participants
                  </div>
                  <div className="flex space-x-2">
                    {standup.status === "scheduled" && (
                      <Button
                        size="sm"
                        onClick={() => updateStandupStatusMutation.mutate({ 
                          id: standup.id, 
                          status: "in_progress" 
                        })}
                        data-testid={`button-start-standup-${standup.id}`}
                      >
                        Start Meeting
                      </Button>
                    )}
                    {standup.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={() => updateStandupStatusMutation.mutate({ 
                          id: standup.id, 
                          status: "completed" 
                        })}
                        data-testid={`button-complete-standup-${standup.id}`}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}