import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { supabase } from '@/db/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Check for cooldown on mount
  useEffect(() => {
    const lastSentTime = localStorage.getItem('password_reset_last_sent');
    if (lastSentTime) {
      const elapsed = Date.now() - parseInt(lastSentTime);
      const cooldownMs = 60000; // 1 minute cooldown
      if (elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
        setCooldownSeconds(remaining);
      }
    }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (cooldownSeconds > 0) {
      toast.error(`Please wait ${cooldownSeconds} seconds before trying again`);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        // Handle rate limit error specifically
        if (error.message.includes('rate limit') || error.message.includes('Email rate limit exceeded')) {
          toast.error('Too many reset attempts. Please wait a few minutes and try again.', {
            duration: 5000,
          });
          setCooldownSeconds(300); // 5 minute cooldown
          localStorage.setItem('password_reset_last_sent', Date.now().toString());
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      // Set cooldown
      localStorage.setItem('password_reset_last_sent', Date.now().toString());
      setCooldownSeconds(60); // 1 minute cooldown

      setEmailSent(true);
      toast.success('Password reset link sent! Please check your email.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset link');
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Logo height={48} showText={false} />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a password reset link to your email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-primary/20 bg-primary/5">
              <CheckCircle className="h-4 w-4 text-primary" />
              <AlertDescription>
                A password reset link has been sent to <strong>{email}</strong>.
                Please check your inbox and click the link to reset your password.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Didn't receive the email?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>Wait a few minutes for the email to arrive</li>
                <li>Note: You can only request a reset link once per minute</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEmailSent(false);
                  setLoading(false);
                }}
                className="w-full"
              >
                Try Another Email
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link to="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
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
            <Logo height={48} showText={false} />
          </div>
          <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {cooldownSeconds > 0 && (
              <Alert className="border-orange-500/20 bg-orange-500/5">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <AlertDescription>
                  To prevent spam, there's a cooldown between reset requests. Please wait {cooldownSeconds} seconds.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                disabled={cooldownSeconds > 0}
              />
              {cooldownSeconds > 0 && (
                <p className="text-xs text-muted-foreground">
                  Please wait {cooldownSeconds} seconds before sending another request
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || cooldownSeconds > 0}
            >
              {loading ? 'Sending...' : cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : 'Send Reset Link'}
            </Button>

            <Button variant="ghost" asChild className="w-full">
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
