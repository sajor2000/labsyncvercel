import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logoUrl from "@assets/Xnip2025-08-08_14-04-18_1754679867710.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <img 
              src={logoUrl} 
              alt="LabSync Logo" 
              className="h-36 w-auto mx-auto"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-gray-600 space-y-2">
            <p>Streamline your research workflow with:</p>
            <ul className="space-y-1">
              <li>• Advanced workflow automation</li>
              <li>• AI-powered standup meetings</li>
              <li>• Real-time collaboration tools</li>
              <li>• Intelligent task scheduling</li>
              <li>• Study lifecycle management</li>
            </ul>
          </div>
          <div className="space-y-3">
            <Button 
              className="w-full bg-teal-700 hover:bg-teal-800 text-white" 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Sign In to Get Started
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => window.location.href = '/register'}
              data-testid="button-register"
            >
              <i className="fas fa-user-plus mr-2"></i>
              Request Lab Access
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
