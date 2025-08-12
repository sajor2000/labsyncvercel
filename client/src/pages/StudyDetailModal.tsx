import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  Edit3, 
  Save, 
  Calendar,
  Users,
  Building,
  DollarSign,
  FileText,
  Folder,
  Eye,
  EyeOff
} from "lucide-react";
import { insertStudySchema, type Study, type InsertStudy, type Bucket } from "@shared/schema";

// Status color mapping
const statusColors: Record<string, string> = {
  "PLANNING": "bg-gray-500",
  "IRB_SUBMISSION": "bg-yellow-500",
  "IRB_APPROVED": "bg-blue-500",
  "DATA_COLLECTION": "bg-indigo-500",
  "ANALYSIS": "bg-green-500",
  "MANUSCRIPT": "bg-purple-500",
  "UNDER_REVIEW": "bg-orange-500",
  "PUBLISHED": "bg-emerald-500",
  "ON_HOLD": "bg-red-500",
  "CANCELLED": "bg-gray-400"
};

const statusLabels: Record<string, string> = {
  "PLANNING": "Planning",
  "IRB_SUBMISSION": "IRB Submission",
  "IRB_APPROVED": "IRB Approved",
  "DATA_COLLECTION": "Data Collection",
  "ANALYSIS": "Analysis phase",
  "MANUSCRIPT": "Manuscript phase",
  "UNDER_REVIEW": "Under Review",
  "PUBLISHED": "Published",
  "ON_HOLD": "On Hold",
  "CANCELLED": "Cancelled"
};

const fundingColors: Record<string, string> = {
  "NIH": "bg-blue-600",
  "NSF": "bg-purple-600",
  "INDUSTRY_SPONSORED": "bg-green-600",
  "INTERNAL": "bg-orange-600",
  "FOUNDATION": "bg-pink-600",
  "OTHER": "bg-gray-600"
};

interface StudyDetailModalProps {
  study: Study | null;
  isOpen: boolean;
  onClose: () => void;
  buckets: Bucket[];
}

export default function StudyDetailModal({ study, isOpen, onClose, buckets }: StudyDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showHiddenFields, setShowHiddenFields] = useState(false);

  const form = useForm<InsertStudy>({
    resolver: zodResolver(insertStudySchema),
    defaultValues: study ? {
      name: study.name,
      oraNumber: study.oraNumber || "",
      status: study.status,
      studyType: study.studyType || "",
      projectType: study.projectType || "study",
      assignees: study.assignees || [],
      funding: study.funding,
      fundingSource: study.fundingSource || "",
      externalCollaborators: study.externalCollaborators || "",
      notes: study.notes || "",
      priority: study.priority,
      dueDate: study.dueDate || null,
      protocolLink: study.protocolLink || "",
      dataLink: study.dataLink || "",
      position: study.position || "0",
      isActive: study.isActive ?? true,
      bucketId: study.bucketId,
      labId: study.labId,
      createdBy: study.createdBy,
    } : {
      name: "",
      oraNumber: "",
      status: "PLANNING",
      studyType: "",
      projectType: "study",
      assignees: [],
      funding: "OTHER",
      fundingSource: "",
      externalCollaborators: "",
      notes: "",
      priority: "MEDIUM",
      dueDate: null,
      protocolLink: "",
      dataLink: "",
      position: "0",
      isActive: true,
      bucketId: "",
      labId: "",
      createdBy: "",
    },
  });

  const updateStudyMutation = useMutation({
    mutationFn: async (data: Partial<Study>) => {
      if (!study) throw new Error("No study to update");
      return apiRequest(`/api/studies/${study.id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studies'] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Study updated successfully",
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
        description: "Failed to update study",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertStudy) => {
    const processedData = {
      ...data,
      assignees: data.assignees && Array.isArray(data.assignees) 
        ? data.assignees 
        : typeof data.assignees === 'string' 
          ? (data.assignees as string).split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0)
          : [],
      updatedAt: new Date(),
    };
    updateStudyMutation.mutate(processedData);
  };

  const currentBucket = buckets.find(b => b.id === study?.bucketId);

  if (!study) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">Study Details</DialogTitle>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                data-testid="button-edit-study"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={updateStudyMutation.isPending}
                  data-testid="button-save-study"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateStudyMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Study Name */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Name
                </div>
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="text-lg font-medium"
                            data-testid="input-study-name-edit"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <h2 className="text-lg font-medium bg-muted/50 rounded-lg p-3" data-testid="text-study-name">
                    {study.name}
                  </h2>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-current" />
                  Status
                </div>
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "PLANNING"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className={`w-2 h-2 rounded-full ${statusColors[value] || 'bg-gray-500'}`}
                                  />
                                  {label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <Badge 
                      className={`${statusColors[study.status || 'PLANNING'] || 'bg-gray-500'} text-white border-0`}
                    >
                      {statusLabels[study.status || 'PLANNING'] || study.status}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Study Type */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  study type
                </div>
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="studyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""} 
                            placeholder="e.g., retrospective EHR data analysis"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="bg-muted/50 rounded-lg p-3" data-testid="text-study-type">
                    {study.studyType || "Not specified"}
                  </div>
                )}
              </div>

              {/* Assignees */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Assignee
                </div>
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="assignees"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="e.g., JC, Mia, Nag, Cherise" 
                            className="border-2 border-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="bg-muted/50 rounded-lg p-3 border-2 border-blue-500" data-testid="text-assignees">
                    {study.assignees?.join(', ') || "Not assigned"}
                  </div>
                )}
              </div>

              {/* Funding */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Funding
                </div>
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="funding"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "OTHER"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NIH">NIH</SelectItem>
                            <SelectItem value="NSF">NSF</SelectItem>
                            <SelectItem value="INDUSTRY_SPONSORED">Industry-sponsored</SelectItem>
                            <SelectItem value="INTERNAL">Internal</SelectItem>
                            <SelectItem value="FOUNDATION">Foundation</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <Badge 
                      className={`${fundingColors[study.funding || 'OTHER'] || 'bg-gray-600'} text-white border-0`}
                    >
                      {study.funding === 'INDUSTRY_SPONSORED' ? 'Industry-sponsored' : (study.funding || 'Other')}
                    </Badge>
                  </div>
                )}
              </div>

              {/* External Collaborators */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  External Collaborators
                </div>
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="externalCollaborators"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""} 
                            placeholder="e.g., Abbott Laboratories, University of Wisconsin"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="bg-muted/50 rounded-lg p-3" data-testid="text-external-collaborators">
                    {study.externalCollaborators || "None"}
                  </div>
                )}
              </div>

              {/* Toggle Hidden Fields */}
              <div className="flex items-center justify-between py-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHiddenFields(!showHiddenFields)}
                  className="text-muted-foreground"
                >
                  {showHiddenFields ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showHiddenFields ? "Hide" : "Show"} {isEditing ? "5" : "3"} hidden fields
                </Button>
              </div>

              {showHiddenFields && (
                <div className="space-y-6">
                  <Separator />

                  {/* Bucket */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Folder className="h-4 w-4" />
                      Bucket
                    </div>
                    {isEditing ? (
                      <FormField
                        control={form.control}
                        name="bucketId"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select bucket" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {buckets.filter(bucket => bucket.id && bucket.id.trim() !== "").map((bucket) => (
                                  <SelectItem key={bucket.id} value={bucket.id}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: bucket.color || '#3b82f6' }}
                                      />
                                      {bucket.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-3">
                        {currentBucket ? (
                          <Badge 
                            style={{ backgroundColor: currentBucket.color || '#3b82f6' }}
                            className="text-white border-0"
                          >
                            {currentBucket.name}
                          </Badge>
                        ) : (
                          "No bucket assigned"
                        )}
                      </div>
                    )}
                  </div>

                  {/* ORA Number */}
                  {isEditing && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        ORA#
                      </div>
                      <FormField
                        control={form.control}
                        name="oraNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="ORA Number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Notes
                    </div>
                    {isEditing ? (
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                value={field.value || ""} 
                                placeholder="Additional notes..."
                                rows={4}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-3 min-h-[80px]">
                        {study.notes || "No notes"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}