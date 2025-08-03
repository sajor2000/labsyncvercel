import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import StatsCards from "@/components/StatsCards";
import RecentStudies from "@/components/RecentStudies";
import UpcomingStandups from "@/components/UpcomingStandups";
import { ActionItems } from "@/components/ActionItems";
import QuickActions from "@/components/QuickActions";
import ActivityFeed from "@/components/ActivityFeed";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Stats Cards */}
      <StatsCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Recent Studies */}
        <div className="lg:col-span-2">
          <RecentStudies />
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          <UpcomingStandups />
          <ActionItems />
          <QuickActions />
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="mt-8">
        <ActivityFeed />
      </div>
    </main>
  );
}
