import { Card } from "@/components/ui/card";
import { CheckCircle2, Calendar } from "lucide-react";
import { format } from "date-fns";

interface EmailNotificationPreviewProps {
  assignerName: string;
  assigneeName: string;
  taskTitle: string;
  taskDescription?: string;
  dueDate?: Date;
  labName: string;
}

export function EmailNotificationPreview({
  assignerName,
  assigneeName,
  taskTitle,
  taskDescription,
  dueDate,
  labName,
}: EmailNotificationPreviewProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto overflow-hidden shadow-lg bg-[#2d2d2d] border-[#3d3d3d]">
      {/* Email Header - Microsoft Planner Dark Style */}
      <div className="bg-[#1a1a1a] text-white p-5 border-b border-[#3d3d3d]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gradient-to-br from-[#7B68EE] to-[#9370DB] rounded-md flex items-center justify-center">
            <div className="w-3.5 h-0.5 bg-white relative">
              <div className="absolute top-1.5 left-0 w-3.5 h-0.5 bg-white"></div>
              <div className="absolute top-3 left-0 w-3.5 h-0.5 bg-white"></div>
            </div>
          </div>
          <h2 className="text-lg font-normal">Plan: {labName} Tasks</h2>
        </div>
      </div>

      {/* Email Content */}
      <div className="p-6 bg-[#2d2d2d]">
        {/* Assignment Notification */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-5 h-5 bg-[#5B5FC7] rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
          <p className="text-[#d4d4d4] text-[15px]">
            {assignerName} assigned a task to you in{" "}
            <span className="text-[#7B68EE] underline cursor-pointer">
              {labName} Tasks
            </span>
          </p>
        </div>

        {/* Task Card */}
        <div className="bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg p-4">
          <h3 className="text-white text-base font-normal underline mb-3">{taskTitle}</h3>

          {taskDescription && (
            <p className="text-[#a0a0a0] text-sm mb-3 leading-relaxed">
              {taskDescription}
            </p>
          )}

          {dueDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#a0a0a0]" />
              <span className="text-[#a0a0a0] text-sm">
                {format(dueDate, "M/d/yyyy")}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button className="px-6 py-2.5 bg-[#5B5FC7] text-white rounded font-medium text-[15px] hover:bg-[#4A4EB6] transition-colors">
            Open in Browser
          </button>
          <button className="px-6 py-2.5 bg-transparent text-white border-2 border-[#4a4a4a] rounded font-medium text-[15px] hover:bg-[#3a3a3a] hover:border-[#5a5a5a] transition-all">
            Open in LabSync
          </button>
        </div>
      </div>

      {/* Email Footer */}
      <div className="bg-[#1a1a1a] px-6 py-4 text-center text-xs text-[#808080] border-t border-[#3d3d3d]">
        <p>This notification was sent from LabSync - {labName}</p>
        <p className="mt-1">
          © 2025 LabSync. All rights reserved. |{" "}
          <a href="#" className="text-[#7B68EE] hover:underline">
            Manage preferences
          </a>
        </p>
      </div>
    </Card>
  );
}