import { Link, useLocation } from "wouter";
import { 
  FlaskConical, 
  FolderOpen, 
  Calendar, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  User as UserIcon,
  LogOut,
  Building2,
  Mic,
  FileText,
  KanbanSquare,
  LayoutGrid,
  Users,
  Lightbulb,
  Clock
} from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLabContext } from "@/hooks/useLabContext";
import { useQuery } from "@tanstack/react-query";
import type { User, Lab } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AvatarUpload } from "@/components/AvatarUpload";
import { LabSwitcher } from "@/components/LabSwitcher";

const navigationItems = [
  { name: "Overview", href: "/", icon: BarChart3 },
  { name: "Labs", href: "/labs", icon: Building2 },
  { name: "Buckets", href: "/buckets", icon: FolderOpen },
  { name: "Studies", href: "/studies", icon: FlaskConical },
  { name: "Stacked by Bucket", href: "/stacked", icon: LayoutGrid },
  { name: "Task Board", href: "/kanban", icon: KanbanSquare },
  { name: "Ideas Board", href: "/ideas", icon: Lightbulb },
  { name: "Deadlines", href: "/deadlines", icon: Clock },
  { name: "Team Members", href: "/team-members", icon: Users },
  { name: "Standups", href: "/standups", icon: Mic },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const userActions = [
  { name: "Profile", href: "/profile", icon: UserIcon },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth() as { user?: User; isAuthenticated: boolean };
  const { setAllLabs } = useLabContext();

  // Fetch labs and populate lab context
  const { data: labs = [] } = useQuery<Lab[]>({
    queryKey: ['/api/labs'],
    enabled: isAuthenticated,
  });

  // Update lab context when labs are loaded
  useEffect(() => {
    if (labs.length > 0 && setAllLabs) {
      setAllLabs(labs);
    }
  }, [labs, setAllLabs]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Logo and Title */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary rounded-lg">
            <FlaskConical className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">LabManage</h1>
            <p className="text-sm text-muted-foreground">Research Hub</p>
          </div>
        </div>
      </div>

      {/* Lab Switcher */}
      <div className="px-4 py-3 border-b border-border">
        <LabSwitcher />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Section */}
      <div className="border-t border-border p-4">
        {/* User Info */}
        {user && (
          <div className="flex items-center space-x-3 mb-4">
            <AvatarUpload
              currentAvatarUrl={user?.profileImageUrl}
              userName={user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.email
              }
              userId={user?.id}
              size="sm"
              showUploadButton={true}
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.email
                }
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Research Member
              </p>
            </div>
          </div>
        )}

        {/* User Actions */}
        <div className="space-y-1">
          {userActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.name} href={action.href}>
                <div
                  className="flex items-center px-3 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  data-testid={`user-${action.name.toLowerCase()}`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {action.name}
                </div>
              </Link>
            );
          })}
          
          <Button
            variant="ghost"
            className="w-full justify-start px-3 py-2 h-auto text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}