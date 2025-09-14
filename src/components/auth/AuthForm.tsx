import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await resetPassword(email);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Password reset email sent! Please check your inbox.');
          setIsForgotPassword(false);
        }
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Logged in successfully!');
        }
      } else {
        if (!name.trim()) {
          toast.error('Name is required');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, name);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Account created successfully! Please check your email to confirm.');
        }
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
          <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
            {isForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {isForgotPassword 
              ? 'Enter your email to receive a password reset link'
              : (isLogin 
                ? 'Sign in to your medication tracker' 
                : 'Sign up to start tracking your medications'
              )
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && !isForgotPassword && (
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="h-12 text-base sm:text-sm px-4 bg-background border-input hover:border-ring transition-colors"
                />
              </div>
            )}
            
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 text-base sm:text-sm px-4 bg-background border-input hover:border-ring transition-colors"
              />
            </div>
            
            {!isForgotPassword && (
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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
            )}

            {isLogin && !isForgotPassword && (
              <div className="text-right pt-1">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm px-0 h-auto font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Button>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 active:scale-95" 
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isForgotPassword ? 'Send Reset Email' : (isLogin ? 'Sign In' : 'Sign Up'))}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            {isForgotPassword ? (
              <Button 
                variant="link" 
                onClick={() => setIsForgotPassword(false)}
                className="text-sm h-auto p-2 font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to sign in
              </Button>
            ) : (
              <Button 
                variant="link" 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm h-auto p-2 font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};