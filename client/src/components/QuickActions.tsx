import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudyCreationModal } from "./StudyCreationModal";

export default function QuickActions() {
  const [showStudyModal, setShowStudyModal] = useState(false);

  const handleCreateStudy = () => {
    setShowStudyModal(true);
  };

  const handleScheduleStandup = () => {
    // TODO: Implement standup scheduling
    console.log("Schedule standup clicked");
  };

  const handleGenerateReport = () => {
    // TODO: Implement report generation
    console.log("Generate report clicked");
  };

  return (
    <>
      <Card className="shadow-sm border border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900" data-testid="text-quick-actions-title">
            Quick Actions
          </h3>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <Button 
            className="w-full bg-primary-600 hover:bg-primary-700 text-white"
            onClick={handleCreateStudy}
            data-testid="button-create-study"
          >
            <i className="fas fa-plus text-sm mr-2"></i>
            Create New Study
          </Button>
          <Button 
            variant="outline"
            className="w-full"
            onClick={handleScheduleStandup}
            data-testid="button-schedule-standup"
          >
            <i className="fas fa-calendar-plus text-sm mr-2"></i>
            Schedule Standup
          </Button>
          <Button 
            variant="outline"
            className="w-full"
            onClick={handleGenerateReport}
            data-testid="button-generate-report"
          >
            <i className="fas fa-chart-line text-sm mr-2"></i>
            Generate Report
          </Button>
        </CardContent>
      </Card>

      <StudyCreationModal 
        isOpen={showStudyModal}
        onClose={() => setShowStudyModal(false)}
      />
    </>
  );
}
