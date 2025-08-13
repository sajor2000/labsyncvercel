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
    <Card className="w-full max-w-2xl mx-auto overflow-hidden shadow-lg">
      {/* Email Header - Microsoft Planner Style */}
      <div className="bg-gradient-to-r from-[#6264A7] to-[#8B8CC7] text-white p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 6h12v1.5H4V6zm0 3h12v1.5H4V9zm0 3h8v1.5H4V12z" fill="white"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold">LabSync Tasks</h2>
            <p className="text-sm opacity-95 mt-1">Plan: {labName} Tasks</p>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="p-6 bg-white">
        {/* Assignment Notification Box */}
        <div className="bg-gray-50 border-l-4 border-[#6264A7] p-5 rounded-r">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <p className="text-gray-700 font-medium">
              {assignerName} assigned a task to you in {labName} Tasks
            </p>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-3">{taskTitle}</h3>

          {taskDescription && (
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              {taskDescription}
            </p>
          )}

          {dueDate && (
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <Calendar className="w-5 h-5 text-[#6264A7]" />
              <span className="text-gray-700 font-medium">
                {format(dueDate, "M/d/yyyy")}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button className="mt-6 bg-[#6264A7] text-white px-6 py-3 rounded font-medium hover:bg-[#5254A3] transition-colors">
          View Task in LabSync
        </button>
      </div>

      {/* Email Footer */}
      <div className="bg-gray-50 px-6 py-4 text-center text-xs text-gray-600">
        <p>This notification was sent from LabSync - {labName}</p>
        <p className="mt-1">© 2025 LabSync. All rights reserved.</p>
        <a href="#" className="text-[#6264A7] hover:underline mt-1 inline-block">
          Manage email preferences
        </a>
      </div>
    </Card>
  );
}