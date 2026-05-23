import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    // Check if this is a Paytm callback
    const orderId = searchParams.get('ORDERID');
    const status = searchParams.get('STATUS');
    
    // If Paytm parameters exist, handle Paytm payment
    if (orderId && status) {
      await verifyPaytmPayment();
      return;
    }

    // Otherwise, handle Stripe payment (legacy)
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      await verifyStripePayment(sessionId);
      return;
    }

    setError('No payment session found');
    setLoading(false);
  };

  const verifyPaytmPayment = async () => {
    try {
      // Collect all Paytm response parameters
      const paytmResponse: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        paytmResponse[key] = value;
      });

      const { data, error: verifyError } = await supabase.functions.invoke('verify-paytm-payment', {
        body: {
          orderId: paytmResponse.ORDERID,
          paytmResponse,
        },
      });

      if (verifyError) {
        const errorMsg = await verifyError?.context?.text();
        throw new Error(errorMsg || verifyError.message);
      }

      if (data?.success) {
        setVerified(true);
        toast.success('Payment successful! Your store is now promoted.');
      } else {
        setError(data?.message || 'Payment verification failed');
      }
    } catch (err: any) {
      console.error('Paytm payment verification error:', err);
      setError(err.message || 'Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const verifyStripePayment = async (sessionId: string) => {
    try {
      const { data, error: verifyError } = await supabase.functions.invoke('verify_stripe_payment', {
        body: { sessionId },
      });

      if (verifyError) throw verifyError;

      if (data?.data?.verified) {
        setVerified(true);
        toast.success('Payment successful! Your store is now promoted.');
      } else {
        setError('Payment verification failed');
      }
    } catch (err: any) {
      console.error('Stripe payment verification error:', err);
      setError(err.message || 'Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg">Verifying your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !verified) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-destructive" />
              <div>
                <CardTitle>Payment Failed</CardTitle>
                <CardDescription>There was an issue with your payment</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error || 'Payment could not be verified'}</p>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/seller/store-management')}>
                Back to Store Management
              </Button>
              <Button variant="outline" onClick={() => navigate('/seller/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <CardTitle>Payment Successful!</CardTitle>
              <CardDescription>Your store promotion is now active</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/5 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold">What happens next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                <span>Your store will appear at the top of search results</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                <span>A "Promoted" badge will be displayed on your store</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                <span>Increased visibility to potential customers</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => navigate('/seller/store-management')}>
              View My Store
            </Button>
            <Button variant="outline" onClick={() => navigate('/seller/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
