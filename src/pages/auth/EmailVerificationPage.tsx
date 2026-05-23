import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { supabase } from '@/db/api';
import Logo from '@/components/Logo';

export default function EmailVerificationPage() {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');
  const [isWaitingForVerification, setIsWaitingForVerification] = useState(!!emailParam);

  useEffect(() => {
    // Only verify if we have a token in the URL (user clicked email link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    
    if (accessToken) {
      setIsWaitingForVerification(false);
      verifyEmail();
    }
  }, []);

  const verifyEmail = async () => {
    setVerifying(true);
    try {
      // Check if user is authenticated (email verification link auto-signs in)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User is verified and signed in
        setVerified(true);
        toast.success('Email verified successfully!');
        
        // Redirect to home after 2 seconds
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError('Invalid or expired verification link');
        toast.error('Email verification failed. Please try again.');
      }
    } catch (err) {
      console.error('Error verifying email:', err);
      setError('Failed to verify email');
      toast.error('Email verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!emailParam) {
      toast.error('Email address not found');
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailParam,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Verification email sent! Please check your inbox.');
      }
    } catch (err) {
      console.error('Error resending email:', err);
      toast.error('Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  // Waiting for verification screen
  if (isWaitingForVerification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Logo height={48} showText={false} />
            </div>
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{emailParam}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Please check your email inbox and click the verification link to activate your account. 
                The email is from <strong>BestOld</strong> and includes our logo.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Didn't receive the email?
              </p>
              <Button 
                onClick={handleResendEmail} 
                variant="outline"
                className="w-full"
                disabled={resending}
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </Button>
              <Button 
                onClick={() => navigate('/login')} 
                variant="ghost"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Verifying your email...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Verification Failed</CardTitle>
            <CardDescription>
              Unable to verify your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/login')} 
                className="w-full"
              >
                Go to Login
              </Button>
              <Button 
                onClick={() => navigate('/register')} 
                variant="outline"
                className="w-full"
              >
                Register Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
          <CardDescription>
            Your email has been successfully verified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              You can now access all features of your account. Redirecting you to the home page...
            </AlertDescription>
          </Alert>

          <Button 
            onClick={() => navigate('/')} 
            className="w-full"
          >
            Go to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
