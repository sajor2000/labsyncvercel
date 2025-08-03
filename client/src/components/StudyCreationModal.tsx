import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StudyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudyCreationModal({ isOpen, onClose }: StudyCreationModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fundingType, setFundingType] = useState("FEDERAL");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createStudyMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/studies", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studies"] });
      toast({
        title: "Success",
        description: "Study created successfully",
      });
      onClose();
      setTitle("");
      setDescription("");
      setEstimatedDuration("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create study",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createStudyMutation.mutate({
      title,
      description,
      fundingType,
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Create New Study</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Study Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
              data-testid="input-study-title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 resize-none"
              data-testid="input-study-description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Funding Type</label>
            <select
              value={fundingType}
              onChange={(e) => setFundingType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              data-testid="select-funding-type"
            >
              <option value="FEDERAL">Federal</option>
              <option value="PRIVATE">Private</option>
              <option value="INSTITUTIONAL">Institutional</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Estimated Duration (months)</label>
            <input
              type="number"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              min="1"
              data-testid="input-duration"
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createStudyMutation.isPending || !title.trim()}
              data-testid="button-create-study"
            >
              {createStudyMutation.isPending ? "Creating..." : "Create Study"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}