import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LabToggleHeader } from "@/components/LabToggleHeader";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center">
            <i className="fas fa-microscope text-white text-2xl"></i>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">LabManage</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Medical Research Lab Management System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-gray-600 space-y-2">
            <p>Streamline your research workflow with:</p>
            <ul className="space-y-1">
              <li>• Study lifecycle management</li>
              <li>• AI-powered standup meetings</li>
              <li>• Real-time collaboration</li>
              <li>• Task and progress tracking</li>
            </ul>
          </div>
          <Button 
            className="w-full bg-primary-600 hover:bg-primary-700" 
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-login"
          >
            <i className="fas fa-sign-in-alt mr-2"></i>
            Sign In to Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
