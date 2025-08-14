import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Download, AlertTriangle, CheckCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface BulkUploadResult {
  success: boolean;
  message: string;
  results: Array<{ row: number; id: string; title: string }>;
  errors: Array<{ row: number; error?: string; warning?: string }>;
  summary: {
    total: number;
    created: number;
    failed: number;
  };
}

export function BulkDeadlineUpload() {
  const [csvData, setCsvData] = useState("");
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const uploadMutation = useMutation({
    mutationFn: async (deadlines: any[]) => {
      return await apiRequest("/api/deadlines/bulk-upload", "POST", { deadlines });
    },
    onSuccess: (result) => {
      setUploadResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/deadlines"] });
      
      if (result.summary.created > 0) {
        toast({
          title: "Bulk Upload Completed",
          description: `${result.summary.created} deadlines created successfully`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const parseCsvData = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const deadlines = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const deadline: any = {};

      headers.forEach((header, index) => {
        if (values[index]) {
          switch (header.toLowerCase()) {
            case 'title':
              deadline.title = values[index];
              break;
            case 'description':
              deadline.description = values[index];
              break;
            case 'type':
              deadline.type = values[index].toUpperCase().replace(/ /g, '_');
              break;
            case 'duedate':
            case 'due_date':
              deadline.dueDate = values[index];
              break;
            case 'priority':
              deadline.priority = values[index].toUpperCase();
              break;
            case 'status':
              deadline.status = values[index].toUpperCase();
              break;
            case 'assignedto':
            case 'assigned_to':
              deadline.assignedTo = values[index];
              break;
            case 'relatedstudy':
            case 'related_study':
              deadline.relatedStudy = values[index];
              break;
            case 'submissionurl':
            case 'submission_url':
              deadline.submissionUrl = values[index];
              break;
            case 'notes':
              deadline.notes = values[index];
              break;
          }
        }
      });

      if (deadline.title && deadline.dueDate && deadline.type) {
        deadlines.push(deadline);
      }
    }

    return deadlines;
  };

  const handleUpload = () => {
    if (!csvData.trim()) {
      toast({
        title: "No Data",
        description: "Please enter CSV data or paste from Excel",
        variant: "destructive",
      });
      return;
    }

    const deadlines = parseCsvData(csvData);
    if (deadlines.length === 0) {
      toast({
        title: "Invalid Data",
        description: "No valid deadline rows found. Check your data format.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(deadlines);
  };

  const generateSampleCsv = () => {
    const sample = `title,description,type,dueDate,priority,status,assignedTo,relatedStudy,notes
"Grant Application Deadline","NIH R01 Application Due","GRANT_APPLICATION","2025-03-15","HIGH","PENDING","notifications@labsync.clif-icu.org","Sepsis Study","Final submission"
"Paper Submission","NEJM Manuscript Deadline","PAPER_SUBMISSION","2025-02-28","HIGH","PENDING","","Cardiac Study","First draft complete"
"IRB Renewal","Annual IRB Review","IRB_SUBMISSION","2025-04-01","MEDIUM","PENDING","coordinator@lab.com","","Annual renewal required"
"Abstract Deadline","AHA Conference Abstract","ABSTRACT_SUBMISSION","2025-01-30","MEDIUM","PENDING","student@university.edu","Heart Study","250 word limit"`;
    
    setCsvData(sample);
    setShowInstructions(false);
  };

  const downloadTemplate = () => {
    const template = `title,description,type,dueDate,priority,status,assignedTo,relatedStudy,submissionUrl,notes`;
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deadline_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Deadline Upload
          </CardTitle>
          <CardDescription>
            Upload multiple deadlines at once using CSV format or paste directly from Excel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showInstructions && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>CSV Format Requirements:</strong><br />
                • Required columns: title, dueDate, type<br />
                • Optional columns: description, priority, status, assignedTo, relatedStudy, submissionUrl, notes<br />
                • Date format: YYYY-MM-DD (e.g., 2025-03-15)<br />
                • Types: GRANT_APPLICATION, PAPER_SUBMISSION, ABSTRACT_SUBMISSION, IRB_SUBMISSION, etc.<br />
                • Priority: LOW, MEDIUM, HIGH<br />
                • Status: PENDING, IN_PROGRESS, COMPLETED, MISSED
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              data-testid="button-download-template"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button
              variant="outline"
              onClick={generateSampleCsv}
              data-testid="button-load-sample"
            >
              Load Sample Data
            </Button>
            {showInstructions && (
              <Button
                variant="ghost"
                onClick={() => setShowInstructions(false)}
                data-testid="button-hide-instructions"
              >
                <X className="h-4 w-4 mr-2" />
                Hide Instructions
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-data">CSV Data (or paste from Excel)</Label>
            <Textarea
              id="csv-data"
              placeholder="Paste your CSV data here..."
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              data-testid="textarea-csv-data"
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending || !csvData.trim()}
            className="w-full"
            data-testid="button-upload-deadlines"
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload Deadlines"}
          </Button>
        </CardContent>
      </Card>

      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{uploadResult.summary.total}</div>
                <div className="text-sm text-gray-600">Total Rows</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{uploadResult.summary.created}</div>
                <div className="text-sm text-gray-600">Created</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{uploadResult.summary.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            {uploadResult.results.length > 0 && (
              <div>
                <h4 className="font-medium text-green-600 mb-2">Successfully Created:</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {uploadResult.results.map((result, index) => (
                    <div key={index} className="text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      Row {result.row}: {result.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-2">Errors & Warnings:</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {uploadResult.errors.map((error, index) => (
                    <div 
                      key={index} 
                      className={`text-sm p-2 rounded ${
                        error.error 
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700' 
                          : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700'
                      }`}
                    >
                      Row {error.row}: {error.error || error.warning}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}