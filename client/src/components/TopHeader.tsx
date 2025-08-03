import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LabSwitcher } from "@/components/LabSwitcher";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

interface TopHeaderProps {
  onMenuClick?: () => void;
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  const { user } = useAuth() as { user?: User };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left side - Menu and Search */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
          data-testid="button-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search studies, tasks, or documents..."
            className="pl-10 pr-4 py-2 w-80 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            data-testid="input-search"
          />
        </div>
        
        {/* Lab Switcher */}
        <LabSwitcher />
      </div>

      {/* Right side - Notifications, Theme Toggle and User */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
        </Button>

        {/* User Avatar */}
        {user && (
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.email
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}