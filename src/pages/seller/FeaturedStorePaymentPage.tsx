import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Copy, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { getSellerFeaturedStoreApplications, getPaymentSettings, updateFeaturedStoreApplication } from '@/db/api';
import { toast } from 'sonner';
import type { FeaturedStoreApplication, PaymentSettings } from '@/types';

export default function FeaturedStorePaymentPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState<FeaturedStoreApplication | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, applicationId, navigate]);

  const loadData = async () => {
    try {
      const [applicationsData, settingsData] = await Promise.all([
        getSellerFeaturedStoreApplications(user!.id),
        getPaymentSettings(),
      ]);
      
      const app = applicationsData.find(a => a.id === applicationId);
      if (!app) {
        toast.error('Application not found');
        navigate('/seller/store');
        return;
      }

      if (app.status !== 'pending') {
        toast.info('Payment already submitted for this application');
        navigate('/seller/store');
        return;
      }

      setApplication(app);
      setPaymentSettings(settingsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUpi = () => {
    const upiId = paymentSettings?.upi_id || 'platform@upi';
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentReference.trim()) {
      toast.error('Please enter the UPI transaction ID');
      return;
    }

    setSubmitting(true);
    try {
      await updateFeaturedStoreApplication(applicationId!, {
        payment_reference: paymentReference.trim(),
        status: 'payment_submitted',
      });

      toast.success('Payment submitted successfully! Awaiting admin approval.');
      navigate('/seller/store');
    } catch (error: any) {
      console.error('Failed to submit payment:', error);
      toast.error(error.message || 'Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
        <p className="text-muted-foreground">
          Make payment to activate your featured store advertising
        </p>
      </div>

      <div className="space-y-6">
        {/* Application Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Store:</span>
              <span className="font-medium">{application.store?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan:</span>
              <span className="font-medium">{application.plan?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{application.plan?.duration_days} days</span>
            </div>
            {application.location && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Store Location:</span>
                <span className="font-medium">{application.location.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coverage:</span>
              <span className="font-medium">50km radius</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold text-lg">Amount to Pay:</span>
              <span className="font-bold text-2xl text-primary">
                ₹{application.payment_amount.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
            <CardDescription>
              All payments are processed through platform UPI for secure transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Secure Payment via Platform UPI</h4>
                    <p className="text-sm text-muted-foreground">
                      Make payment to our platform UPI ID. Your application will be reviewed after payment verification.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* QR Code Section */}
                  {paymentSettings?.qr_code_url && (
                    <div className="flex flex-col items-center p-4 bg-background rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode className="h-4 w-4 text-primary" />
                        <Label className="text-sm font-semibold">Scan QR Code to Pay</Label>
                      </div>
                      <img
                        src={paymentSettings.qr_code_url}
                        alt="Payment QR Code"
                        className="w-48 h-48 object-contain border-2 border-border rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Scan with any UPI app to make payment of ₹{application.payment_amount.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* UPI ID Section */}
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {paymentSettings?.qr_code_url ? 'Or Pay Manually to UPI ID' : 'Platform UPI ID'}
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={paymentSettings?.upi_id || 'platform@upi'}
                        readOnly
                        className="font-mono text-base"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={handleCopyUpi}
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Transaction ID Input */}
                  <div>
                    <Label htmlFor="payment-ref">UPI Transaction ID *</Label>
                    <Input
                      id="payment-ref"
                      placeholder="Enter UPI transaction ID after payment"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      required
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Complete the UPI payment and enter the transaction ID here
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  After submitting payment proof, your application will be reviewed by our admin team. 
                  You will be notified once your featured store advertising is activated.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/seller/store')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Payment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
