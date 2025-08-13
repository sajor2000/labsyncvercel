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
  Brain,
  FileText,
  LayoutGrid,
  Users,
  Lightbulb,
  Clock,
  Eye,
  Mail
} from "lucide-react";
import logoUrl from "@assets/FullLogo_1754662799020.png";
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
  { name: "Study Board", href: "/study-management", icon: LayoutGrid },
  { name: "Stacked by Bucket", href: "/stacked", icon: Eye },
  { name: "Task Management", href: "/tasks", icon: CheckSquare },
  { name: "Ideas Board", href: "/ideas", icon: Lightbulb },
  { name: "Deadlines", href: "/deadlines", icon: Clock },
  { name: "File Management", href: "/files", icon: FileText },
  { name: "Team Members", href: "/team-members", icon: Users },
  { name: "Standup Recording", href: "/standups", icon: Mic },
  { name: "Meeting Preview", href: "/meeting-preview", icon: Eye },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const userActions = [
  { name: "Profile", href: "/profile", icon: UserIcon },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Email Notifications", href: "/email-settings", icon: Mail },
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
    <div className="flex flex-col h-full bg-gradient-to-b from-sidebar via-sidebar-background to-sidebar border-r border-sidebar-border backdrop-blur-xl">
      {/* Logo and Title */}
      <div className="px-4 py-4 border-b border-sidebar-border/50">
        <div className="flex items-center justify-center">
          <div className="relative group">
            <img 
              src={logoUrl} 
              alt="LabSync Logo" 
              className="h-16 w-auto max-w-full transition-all duration-200 hover:scale-105"
            />
          </div>
        </div>
      </div>

      {/* Lab Switcher */}
      <div className="px-4 py-3 border-b border-sidebar-border/50">
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
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer group relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-sidebar-primary to-sidebar-accent text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent"
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
      <div className="border-t border-sidebar-border/50 p-4 bg-gradient-to-t from-sidebar-background/80 to-transparent">
        {/* User Info */}
        {user && (
          <div className="flex items-center space-x-3 mb-4">
            <AvatarUpload
              currentAvatarUrl={user?.profileImageUrl || undefined}
              userName={user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.email || undefined
              }
              userId={user?.id}
              size="sm"
              showUploadButton={true}
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.email
                }
              </p>
              <p className="text-xs text-sidebar-accent/80 font-medium truncate">
                Making Science Easier
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
            className="w-full justify-start px-3 py-2 h-auto text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
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