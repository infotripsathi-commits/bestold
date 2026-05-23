import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get the session from the URL hash
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        toast.error('Authentication failed: ' + error.message);
        navigate('/login');
        return;
      }

      if (!session) {
        toast.error('No session found');
        navigate('/login');
        return;
      }

      // Check if user has a phone number in their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('phone, role')
        .eq('id', session.user.id)
        .maybeSingle() as { data: { phone?: string; role?: string } | null; error: any };

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Get the pending role from localStorage (set during registration)
      const pendingRole = localStorage.getItem('pending_role');
      if (pendingRole) {
        localStorage.removeItem('pending_role');
      }

      // If phone number is missing, show phone input form
      if (!profile || !profile.phone) {
        setNeedsPhone(true);
        setUserId(session.user.id);
        setLoading(false);
        return;
      }

      // Phone number exists, redirect to home
      toast.success('Login successful!');
      navigate('/');
    } catch (error: any) {
      console.error('Auth callback error:', error);
      toast.error('Authentication failed');
      navigate('/login');
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.trim() === '') {
      toast.error('Phone number is required');
      return;
    }

    if (!userId) {
      toast.error('User ID not found');
      return;
    }

    setSubmitting(true);

    try {
      // Update profile with phone number
      // @ts-ignore - Supabase types issue
      const { error } = await supabase.from('profiles').update({ phone: phoneNumber }).eq('id', userId);

      if (error) {
        toast.error('Failed to update phone number: ' + error.message);
        setSubmitting(false);
        return;
      }

      toast.success('Registration complete!');
      navigate('/');
    } catch (error: any) {
      toast.error('Failed to update phone number');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Completing authentication...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (needsPhone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Logo height={48} showText={false} />
            </div>
            <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
            <CardDescription>
              Please provide your phone number to complete registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  This is required for sellers to contact you
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Completing...' : 'Complete Registration'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
