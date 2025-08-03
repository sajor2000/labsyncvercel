import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, FlaskConical, Folder, Settings, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Lab, Study, Bucket } from "@shared/schema";

export default function Labs() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect if not authenticated
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

  // Fetch data
  const { data: labs = [], isLoading: labsLoading, error: labsError } = useQuery<Lab[]>({
    queryKey: ['/api/labs'],
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

  // Get studies count for each lab
  const { data: allStudies = [] } = useQuery<Study[]>({
    queryKey: ['/api/studies'],
    enabled: isAuthenticated,
  });

  // Get buckets for each lab
  const { data: allBuckets = [] } = useQuery<Bucket[]>({
    queryKey: ['/api/buckets'],
    enabled: isAuthenticated,
  });

  // Filter labs
  const filteredLabs = labs.filter(lab =>
    lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lab.description && lab.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper functions
  const getStudiesCount = (labId: string) => {
    return allStudies.filter(study => study.labId === labId).length;
  };

  const getBucketsCount = (labId: string) => {
    return allBuckets.filter(bucket => bucket.labId === labId).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Research Labs</h1>
          <p className="text-muted-foreground">Manage your research laboratories and teams</p>
        </div>
        <Button data-testid="button-create-lab">
          <Plus className="h-4 w-4 mr-2" />
          New Lab
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search labs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
          data-testid="input-search-labs"
        />
      </div>

      {/* Labs Grid */}
      {labsLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-3/4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded"></div>
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
                    <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLabs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">No labs found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search" : "Create your first lab to get started"}
              </p>
              <Button data-testid="button-create-first-lab">
                <Plus className="h-4 w-4 mr-2" />
                Create Lab
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLabs.map((lab) => (
            <Card key={lab.id} className="hover:shadow-md transition-shadow" data-testid={`lab-card-${lab.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: lab.color || '#3b82f6' }}
                      />
                      {lab.name}
                    </CardTitle>
                    {lab.piName && (
                      <p className="text-sm text-muted-foreground mt-1">PI: {lab.piName}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" data-testid={`button-lab-settings-${lab.id}`}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lab.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {lab.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <FlaskConical className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-sm font-medium">{getStudiesCount(lab.id)}</p>
                      <p className="text-xs text-muted-foreground">Studies</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <Folder className="h-4 w-4 text-orange-500" />
                      </div>
                      <p className="text-sm font-medium">{getBucketsCount(lab.id)}</p>
                      <p className="text-xs text-muted-foreground">Buckets</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <Users className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-sm font-medium">5</p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-lab-${lab.id}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" data-testid={`button-manage-lab-${lab.id}`}>
                      <Folder className="h-3 w-3 mr-1" />
                      Buckets
                    </Button>
                  </div>

                  {/* Created Date */}
                  <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    Created: {lab.createdAt ? new Date(lab.createdAt).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}