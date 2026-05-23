import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Award, Check, AlertCircle, Loader2 } from 'lucide-react';
import { getFranchisePlans, getStoreByUserId, submitFranchiseApplication, getFranchiseApplications } from '@/db/api';
import { toast } from 'sonner';
import type { FranchisePlan, Store, FranchiseApplication } from '@/types';

export default function BecomeFranchisePage() {
  const [plans, setPlans] = useState<FranchisePlan[]>([]);
  const [myStore, setMyStore] = useState<Store | null>(null);
  const [existingApplication, setExistingApplication] = useState<FranchiseApplication | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!user) {
      toast.error('Please login to apply as an Elite Partner');
      navigate('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!user) return;
      
      const [plansData, storeData] = await Promise.all([
        getFranchisePlans(),
        getStoreByUserId(user.id)
      ]);

      setPlans(plansData);
      setMyStore(storeData);

      if (!storeData) {
        toast.error('You need to create a store first');
        navigate('/seller/store-management');
        return;
      }

      if (storeData.is_franchise) {
        toast.info('Your store is already an Elite Partner');
        navigate('/seller/dashboard');
        return;
      }

      // Check for existing application
      const applications = await getFranchiseApplications({ store_id: storeData.id });
      const pending = applications.find(app => app.approval_status === 'pending');
      if (pending) {
        setExistingApplication(pending);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load Elite Partner plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan) {
      toast.error('Please select an Elite Partner plan');
      return;
    }

    if (!paymentReference.trim()) {
      toast.error('Please enter payment reference/UPI transaction ID');
      return;
    }

    if (!myStore) {
      toast.error('Store not found');
      return;
    }

    try {
      setSubmitting(true);
      await submitFranchiseApplication({
        store_id: myStore.id,
        plan_id: selectedPlan,
        payment_reference: paymentReference
      });

      toast.success('Elite Partner application submitted successfully!');
      toast.info('Your application is pending admin approval');
      navigate('/seller/dashboard');
    } catch (error) {
      console.error('Failed to submit application:', error);
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (existingApplication) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
                <CardTitle>Application Pending</CardTitle>
              </div>
              <CardDescription>
                Your Elite Partner application is currently under review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Plan</Label>
                  <p className="text-lg font-semibold">{existingApplication.franchise_plans?.name}</p>
                </div>
                <div>
                  <Label>Amount Paid</Label>
                  <p className="text-lg font-semibold">₹{existingApplication.franchise_plans?.price}</p>
                </div>
                <div>
                  <Label>Payment Reference</Label>
                  <p className="text-sm text-muted-foreground">{existingApplication.payment_reference}</p>
                </div>
                <div>
                  <Label>Applied On</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(existingApplication.applied_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Please wait for admin approval. You will be notified once your application is reviewed.
                  </p>
                </div>
                <Button onClick={() => navigate('/seller/dashboard')} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <Award className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Become an Elite Partner</h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Join our network of authorized elite partner stores and start selling online with full platform support
          </p>
        </div>
      </div>

      {/* Application Form */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Store Info */}
          {myStore && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your Store</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Store Name</Label>
                    <p className="font-semibold">{myStore.name}</p>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <p className="font-semibold">{myStore.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plans */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Select an Elite Partner Plan</CardTitle>
              <CardDescription>Choose the plan that best fits your business needs</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`cursor-pointer transition-all ${
                        selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <RadioGroupItem value={plan.id} />
                        </div>
                        <div className="text-3xl font-bold text-primary">
                          ₹{plan.price}
                        </div>
                        <CardDescription>{plan.duration_days} days</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Complete the payment and enter your transaction reference
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label>Platform UPI ID</Label>
                  <Input
                    value="platform@upi"
                    readOnly
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Make payment to this UPI ID
                  </p>
                </div>

                <div>
                  <Label htmlFor="payment-ref">Payment Reference / UPI Transaction ID *</Label>
                  <Input
                    id="payment-ref"
                    placeholder="Enter UPI transaction ID"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter the transaction ID from your payment app
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Important Notes:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Complete the payment before submitting this form</li>
                    <li>Your application will be reviewed by admin within 24-48 hours</li>
                    <li>Once approved, you can start selling online</li>
                    <li>All payments go through platform for buyer protection</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={submitting || !selectedPlan}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
