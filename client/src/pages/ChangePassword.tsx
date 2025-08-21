import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

export function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  const [, navigate] = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Check if this is a required password change (temp password)
    if (user?.requiresPasswordChange) {
      setIsFirstLogin(true);
    }
  }, [user]);

  // Real-time password validation
  useEffect(() => {
    if (!newPassword) {
      setPasswordErrors([]);
      return;
    }

    const errors = [];
    
    if (newPassword.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(newPassword)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(newPassword)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(newPassword)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>?]/.test(newPassword)) {
      errors.push('Password must contain at least one special character');
    }
    
    if (/(.)\\1{2,}/.test(newPassword)) {
      errors.push('Password cannot contain repeated characters (more than 2 in a row)');
    }
    
    setPasswordErrors(errors);
  }, [newPassword]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordErrors.length > 0) {
      setError('Please fix the password requirements below');
      return;
    }

    // For first-time login, current password might not be required
    if (!isFirstLogin && !currentPassword) {
      setError('Current password is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          currentPassword: isFirstLogin ? '' : currentPassword, 
          newPassword 
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to change password');
        if (data.errors) {
          setPasswordErrors(data.errors);
        }
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Password Updated Successfully</CardTitle>
            <CardDescription className="text-center">
              Your password has been changed and you're ready to use LabSync
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-gray-600">
              Redirecting to dashboard...
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Lock className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {isFirstLogin ? 'Set Your Password' : 'Change Password'}
          </CardTitle>
          <CardDescription className="text-center">
            {isFirstLogin 
              ? 'Welcome! Please set a secure password to access your account'
              : 'Update your current password'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isFirstLogin && (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                For security, you must set a new password before accessing LabSync.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            {!isFirstLogin && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required={!isFirstLogin}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={isLoading}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {isFirstLogin ? 'New Password' : 'New Password'}
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isLoading}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Password requirements */}
              {newPassword && (
                <div className="space-y-1">
                  <div className="text-xs text-gray-600">Password requirements:</div>
                  {[
                    { check: newPassword.length >= 8, text: 'At least 8 characters' },
                    { check: /[a-z]/.test(newPassword), text: 'One lowercase letter' },
                    { check: /[A-Z]/.test(newPassword), text: 'One uppercase letter' },
                    { check: /\d/.test(newPassword), text: 'One number' },
                    { check: /[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>?]/.test(newPassword), text: 'One special character' },
                    { check: !/(.)\\1{2,}/.test(newPassword), text: 'No repeated characters (3+ in a row)' },
                  ].map((req, index) => (
                    <div key={index} className={`text-xs flex items-center space-x-1 ${req.check ? 'text-green-600' : 'text-gray-500'}`}>
                      <span>{req.check ? '✓' : '○'}</span>
                      <span>{req.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {confirmPassword && newPassword !== confirmPassword && (
                <div className="text-xs text-red-500">Passwords do not match</div>
              )}
            </div>

            <Button 
              type="submit"
              disabled={isLoading || passwordErrors.length > 0 || newPassword !== confirmPassword}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isFirstLogin ? 'Setting Password...' : 'Changing Password...'}
                </>
              ) : (
                isFirstLogin ? 'Set Password' : 'Change Password'
              )}
            </Button>
          </form>

          {!isFirstLogin && (
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={handleLogout}
                className="text-sm"
              >
                Cancel and Logout
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}