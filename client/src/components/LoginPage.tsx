import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we were redirected here due to auth failure
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'unauthorized') {
      setError('You must be a registered team member to access LabSync.');
    }
  }, []);

  const handleLogin = () => {
    setIsLoading(true);
    setError(null);
    // Redirect to login endpoint
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.svg" alt="LabSync" className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl text-center">Welcome to LabSync</CardTitle>
          <CardDescription className="text-center">
            Sign in with your Replit account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <Button 
            onClick={handleLogin} 
            disabled={isLoading}
            className="w-full"
            size="lg"
            data-testid="button-sign-in"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to Replit...
              </>
            ) : (
              'Sign in with Replit'
            )}
          </Button>
          
          <div className="text-center text-sm text-gray-600">
            <p>Access restricted to registered lab members only.</p>
            <p className="mt-2">
              Contact <strong>Dr. J.C. Rojas</strong> for access.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}