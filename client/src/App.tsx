import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/Dashboard";
import Landing from "@/pages/Landing";
import Studies from "@/pages/Studies";
import KanbanBoard from "@/pages/KanbanBoard";
import Labs from "@/pages/Labs";
import Buckets from "@/pages/Buckets";
import StackedView from "@/pages/StackedView";
import TeamMembers from "@/pages/TeamMembers";
import Ideas from "@/pages/Ideas";
import Deadlines from "@/pages/Deadlines";
import Standups from "@/pages/Standups";
import Calendar from "@/pages/Calendar";
import Analytics from "@/pages/Analytics";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";
import { LabProvider } from "@/components/LabProvider";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <LabProvider>
          <Route path="/" component={() => <Layout><Dashboard /></Layout>} />
          <Route path="/studies" component={() => <Layout><Studies /></Layout>} />
          <Route path="/kanban" component={() => <Layout><KanbanBoard /></Layout>} />
          <Route path="/stacked" component={() => <Layout><StackedView /></Layout>} />
          <Route path="/team-members" component={() => <Layout><TeamMembers /></Layout>} />
          <Route path="/ideas" component={() => <Layout><Ideas /></Layout>} />
          <Route path="/deadlines" component={() => <Layout><Deadlines /></Layout>} />
          <Route path="/labs" component={() => <Layout><Labs /></Layout>} />
          <Route path="/buckets" component={() => <Layout><Buckets /></Layout>} />
          <Route path="/standups" component={() => <Layout><Standups /></Layout>} />
          <Route path="/calendar" component={() => <Layout><Calendar /></Layout>} />
          <Route path="/analytics" component={() => <Layout><Analytics /></Layout>} />
          <Route path="/profile" component={() => <Layout><Profile /></Layout>} />
          <Route path="/settings" component={() => <Layout><Settings /></Layout>} />
        </LabProvider>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
