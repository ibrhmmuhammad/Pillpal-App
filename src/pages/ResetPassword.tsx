import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { updatePassword } = useAuth();
  const history = useHistory();

  useEffect(() => {
    // Check if we have the recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Invalid or expired reset link');
        history.push('/');
      }
    };
    
    checkSession();
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password updated successfully!');
        history.push('/');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-safe-top pb-safe-bottom px-safe-left pr-safe-right">
      <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => history.push('/')}
              className="absolute left-4 top-4 p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 text-base sm:text-sm px-4 pr-12 bg-background border-input hover:border-ring transition-colors"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-10 w-10 p-0 hover:bg-muted/50 rounded-md transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 text-base sm:text-sm px-4 pr-12 bg-background border-input hover:border-ring transition-colors"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-10 w-10 p-0 hover:bg-muted/50 rounded-md transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 active:scale-95" 
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;