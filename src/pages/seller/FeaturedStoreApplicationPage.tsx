import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Info, ArrowRight } from 'lucide-react';
import { getSellerStores, getFeaturedStorePlans, createFeaturedStoreApplication, getLocations } from '@/db/api';
import { toast } from 'sonner';
import type { Store, FeaturedStorePlan, Location } from '@/types';

export default function FeaturedStoreApplicationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [plans, setPlans] = useState<FeaturedStorePlan[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<FeaturedStorePlan | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [storesData, plansData, locationsData] = await Promise.all([
        getSellerStores(user!.id),
        getFeaturedStorePlans(),
        getLocations(),
      ]);
      
      // Only show approved stores with location set
      const validStores = storesData.filter((s: Store) => 
        s.approval_status === 'approved' && s.location
      );
      
      console.log('Featured Store Application - Loaded data:', {
        validStores: validStores.length,
        plans: plansData.length,
        locations: locationsData.length,
      });
      
      setStores(validStores);
      setPlans(plansData);
      setLocations(locationsData);
      
      // Auto-select first store if only one available
      if (validStores.length === 1) {
        setSelectedStore(validStores[0].id);
        console.log('Auto-selected store:', validStores[0].name);
      }
      
      // Auto-select first plan if available
      if (plansData.length > 0) {
        setSelectedPlan(plansData[0]);
        console.log('Auto-selected plan:', plansData[0].name);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load application data');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedStoreData = () => {
    return stores.find(s => s.id === selectedStore);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Submit clicked:', { selectedStore, selectedPlan: selectedPlan?.id });

    if (!selectedStore || !selectedPlan) {
      toast.error('Please select a store and plan');
      return;
    }

    const storeData = getSelectedStoreData();
    console.log('Store data:', storeData);
    
    if (!storeData?.location) {
      toast.error('Selected store does not have a location set');
      return;
    }

    // Find the location_id by matching the location name (case-insensitive and trimmed)
    const storeLocationName = storeData.location.trim().toLowerCase();
    const locationRecord = locations.find(
      loc => loc.name.trim().toLowerCase() === storeLocationName
    );

    console.log('Location matching:', {
      storeLocation: storeData.location,
      storeLocationNormalized: storeLocationName,
      locationRecord: locationRecord?.name,
      locationId: locationRecord?.id,
    });

    if (!locationRecord) {
      console.error('Location matching failed:', {
        storeLocation: storeData.location,
        availableLocations: locations.map(l => l.name),
      });
      toast.error(`Location "${storeData.location}" not found in the system. Please contact admin to add this location.`);
      return;
    }

    setSubmitting(true);
    try {
      console.log('Creating application with:', {
        store_id: selectedStore,
        seller_id: user!.id,
        plan_id: selectedPlan.id,
        location_id: locationRecord.id,
        payment_amount: selectedPlan.price,
      });
      
      const application = await createFeaturedStoreApplication({
        store_id: selectedStore,
        seller_id: user!.id,
        plan_id: selectedPlan.id,
        location_id: locationRecord.id,
        payment_amount: selectedPlan.price,
      });

      console.log('Application created:', application);
      toast.success('Application created successfully');
      navigate(`/seller/featured-store-payment/${application.id}`);
    } catch (error: any) {
      console.error('Failed to create application:', error);
      toast.error(error.message || 'Failed to create application');
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

  if (stores.length === 0) {
    return (
      <div className="container py-8">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You need to have an approved store with a location set to apply for featured advertising.
            <Button variant="link" className="ml-2" onClick={() => navigate('/seller/store')}>
              Manage Store
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const storeData = getSelectedStoreData();

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Apply for Featured Store</h1>
        <p className="text-muted-foreground">
          Advertise your store to customers within 50km radius
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Store */}
        <Card>
          <CardHeader>
            <CardTitle>Select Store</CardTitle>
            <CardDescription>Choose which store you want to feature</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedStore} onValueChange={setSelectedStore} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {storeData && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Store Location: {storeData.location}</p>
                    <p className="text-sm text-muted-foreground">
                      Your store will be advertised to customers within 50km of this location
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        {plans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Duration</CardTitle>
              <CardDescription>Choose how long you want to advertise</CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedPlan?.id || ''} 
                onValueChange={(id) => setSelectedPlan(plans.find(p => p.id === id) || null)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.duration_days} days - ₹{plan.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedPlan && selectedPlan.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedPlan.description}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong> Your store will appear in the featured banner for customers 
            within 50km of your store location. Stores are displayed in order of distance - nearest stores 
            appear first.
          </AlertDescription>
        </Alert>

        {/* Summary */}
        {selectedPlan && storeData && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Application Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Store:</span>
                <span className="font-medium">{storeData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{selectedPlan.duration_days} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coverage:</span>
                <span className="font-medium">50km radius from store</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-bold text-lg text-primary">₹{selectedPlan.price.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {(!selectedStore || !selectedPlan) && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Please select a store and duration plan to proceed with the application.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/seller/store')}>
            Cancel
          </Button>
          <Button type="submit" disabled={!selectedStore || !selectedPlan || submitting}>
            {submitting ? 'Processing...' : 'Proceed to Payment'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
}
