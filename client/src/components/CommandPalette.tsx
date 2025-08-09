import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLabContext } from "@/hooks/useLabContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Calendar, Users, Settings, FileText, BarChart3, Zap, Clock, Target, BookOpen } from "lucide-react";
import type { Study, Task, TeamMember } from "@shared/schema";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { isAuthenticated } = useAuth();
  const { selectedLab } = useLabContext();
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState("");

  // Fetch data for quick actions
  const { data: studies = [] } = useQuery<Study[]>({
    queryKey: ['/api/studies', selectedLab?.id],
    enabled: isAuthenticated && !!selectedLab,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    enabled: isAuthenticated,
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members', selectedLab?.id],
    enabled: isAuthenticated && !!selectedLab,
  });

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Navigation actions
  const navigationActions = [
    {
      id: 'nav-task-board',
      title: 'Research Project Board',
      subtitle: 'Manage tasks and projects',
      icon: Target,
      action: () => {
        window.location.hash = '/task-management';
        onOpenChange(false);
        toast({ title: "Navigated to Project Board" });
      }
    },
    {
      id: 'nav-studies',
      title: 'Studies & Projects',
      subtitle: 'View all research studies',
      icon: BookOpen,
      action: () => {
        window.location.hash = '/studies';
        onOpenChange(false);
        toast({ title: "Navigated to Studies" });
      }
    },
    {
      id: 'nav-standups',
      title: 'Standup Meetings',
      subtitle: 'AI-powered meeting transcription',
      icon: Calendar,
      action: () => {
        window.location.hash = '/standup-recording';
        onOpenChange(false);
        toast({ title: "Navigated to Standup Meetings" });
      }
    },
    {
      id: 'nav-team',
      title: 'Team Management',
      subtitle: 'Manage lab members and roles',
      icon: Users,
      action: () => {
        window.location.hash = '/team';
        onOpenChange(false);
        toast({ title: "Navigated to Team Management" });
      }
    }
  ];

  // Quick create actions
  const createActions = [
    {
      id: 'create-task',
      title: 'Create New Task',
      subtitle: 'Add a task to any project',
      icon: Plus,
      action: () => {
        window.location.hash = '/task-management';
        onOpenChange(false);
        // Trigger quick add
        setTimeout(() => {
          const quickAddButton = document.querySelector('[data-testid="button-toggle-quick-add"]') as HTMLButtonElement;
          if (quickAddButton) quickAddButton.click();
        }, 100);
        toast({ title: "Opening task creation" });
      }
    },
    {
      id: 'create-study',
      title: 'Create New Study',
      subtitle: 'Start a new research project',
      icon: FileText,
      action: () => {
        window.location.hash = '/studies';
        onOpenChange(false);
        toast({ title: "Navigate to Studies to create new project" });
      }
    },
    {
      id: 'create-meeting',
      title: 'Start Standup Meeting',
      subtitle: 'Begin AI-powered recording',
      icon: Zap,
      action: () => {
        window.location.hash = '/standup-recording';
        onOpenChange(false);
        toast({ title: "Navigate to start meeting recording" });
      }
    }
  ];

  // Filter studies and tasks based on input
  const filteredStudies = studies.filter((study: Study) => 
    study.name.toLowerCase().includes(inputValue.toLowerCase()) ||
    (study.notes && study.notes.toLowerCase().includes(inputValue.toLowerCase()))
  ).slice(0, 5);

  const filteredTasks = tasks.filter((task: Task) => 
    task.title.toLowerCase().includes(inputValue.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(inputValue.toLowerCase()))
  ).slice(0, 5);

  const filteredMembers = teamMembers.filter((member: TeamMember) => 
    member.user?.firstName?.toLowerCase().includes(inputValue.toLowerCase()) ||
    member.user?.lastName?.toLowerCase().includes(inputValue.toLowerCase()) ||
    member.user?.email?.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search or type a command..."
              value={inputValue}
              onValueChange={setInputValue}
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Badge variant="outline" className="ml-2 text-xs">⌘K</Badge>
          </div>
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty>No results found.</CommandEmpty>
            
            {/* Navigation Actions */}
            <CommandGroup heading="Navigation">
              {navigationActions.map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => action.action()}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <action.icon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{action.title}</span>
                    <span className="text-xs text-muted-foreground">{action.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {/* Quick Create Actions */}
            <CommandGroup heading="Create">
              {createActions.map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => action.action()}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <action.icon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{action.title}</span>
                    <span className="text-xs text-muted-foreground">{action.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {/* Studies */}
            {inputValue && filteredStudies.length > 0 && (
              <CommandGroup heading="Studies">
                {filteredStudies.map((study) => (
                  <CommandItem
                    key={study.id}
                    onSelect={() => {
                      window.location.hash = `/studies?selected=${study.id}`;
                      onOpenChange(false);
                      toast({ title: `Opened study: ${study.name}` });
                    }}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{study.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {study.studyType} • {study.status}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Tasks */}
            {inputValue && filteredTasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {filteredTasks.map((task) => (
                  <CommandItem
                    key={task.id}
                    onSelect={() => {
                      window.location.hash = `/task-management?task=${task.id}`;
                      onOpenChange(false);
                      toast({ title: `Opened task: ${task.title}` });
                    }}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <Target className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{task.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{task.status}</Badge>
                        <Badge variant="outline" className="text-xs">{task.priority}</Badge>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Team Members */}
            {inputValue && filteredMembers.length > 0 && (
              <CommandGroup heading="Team Members">
                {filteredMembers.map((member) => (
                  <CommandItem
                    key={member.userId}
                    onSelect={() => {
                      window.location.hash = `/team?member=${member.userId}`;
                      onOpenChange(false);
                      toast({ title: `Viewing member profile` });
                    }}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <Users className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {member.user?.firstName && member.user?.lastName 
                          ? `${member.user.firstName} ${member.user.lastName}` 
                          : member.user?.firstName || member.user?.email || member.userId}
                      </span>
                      <span className="text-xs text-muted-foreground">{member.role}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}