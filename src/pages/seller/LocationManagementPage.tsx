import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Star,
  Phone,
  Mail,
  Clock,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

interface StoreLocation {
  id: string;
  store_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  is_primary: boolean;
  is_active: boolean;
  business_hours?: any;
  manager_name?: string;
  manager_phone?: string;
  manager_email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function LocationManagementPage() {
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState<StoreLocation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [storeId, setStoreId] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'US',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    is_primary: false,
    is_active: true,
    manager_name: '',
    manager_phone: '',
    manager_email: '',
    notes: '',
  });

  useEffect(() => {
    loadStoreAndLocations();
  }, []);

  const loadStoreAndLocations = async () => {
    try {
      // Get user's store
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('seller_id', user.id)
        .single();

      if (storeError) throw storeError;
      if (!store) {
        toast.error('No store found. Please create a store first.');
        return;
      }

      setStoreId((store as any).id);

      // Load locations
      const result: any = await (supabase as any)
        .from('store_locations')
        .select('*')
        .eq('store_id', (store as any).id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (result.error) throw result.error;
      setLocations(result.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const locationData: any = {
        store_id: storeId,
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        country: formData.country,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        phone: formData.phone || null,
        email: formData.email || null,
        is_primary: formData.is_primary,
        is_active: formData.is_active,
        manager_name: formData.manager_name || null,
        manager_phone: formData.manager_phone || null,
        manager_email: formData.manager_email || null,
        notes: formData.notes || null,
      };

      if (editingLocation) {
        // Update existing location
        const result: any = await (supabase as any)
          .from('store_locations')
          .update(locationData)
          .eq('id', editingLocation.id);

        if (result.error) throw result.error;
        toast.success('Location updated successfully!');
      } else {
        // Create new location
        const result: any = await (supabase as any)
          .from('store_locations')
          .insert([locationData]);

        if (result.error) throw result.error;
        toast.success('Location created successfully!');
      }

      setIsDialogOpen(false);
      resetForm();
      loadStoreAndLocations();
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to save location');
    }
  };

  const handleEdit = (location: StoreLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      zip_code: location.zip_code,
      country: location.country,
      latitude: location.latitude?.toString() || '',
      longitude: location.longitude?.toString() || '',
      phone: location.phone || '',
      email: location.email || '',
      is_primary: location.is_primary,
      is_active: location.is_active,
      manager_name: location.manager_name || '',
      manager_phone: location.manager_phone || '',
      manager_email: location.manager_email || '',
      notes: location.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const result: any = await (supabase as any)
        .from('store_locations')
        .delete()
        .eq('id', locationId);

      if (result.error) throw result.error;
      toast.success('Location deleted successfully!');
      loadStoreAndLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    }
  };

  const resetForm = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'US',
      latitude: '',
      longitude: '',
      phone: '',
      email: '',
      is_primary: false,
      is_active: true,
      manager_name: '',
      manager_phone: '',
      manager_email: '',
      notes: '',
    });
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading locations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Location Management</h1>
          <p className="text-muted-foreground">
            Manage multiple physical locations for your store
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </DialogTitle>
              <DialogDescription>
                {editingLocation
                  ? 'Update location information'
                  : 'Add a new physical location for your store'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Basic Information</h3>

                <div>
                  <Label htmlFor="name">Location Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Downtown Branch, Mall Location"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main Street"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="New York"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="NY"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="zip_code">ZIP Code *</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      placeholder="10001"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="40.7128"
                    />
                  </div>

                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="-74.0060"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(212) 555-0123"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="location@store.com"
                    />
                  </div>
                </div>
              </div>

              {/* Manager Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Manager Information</h3>

                <div>
                  <Label htmlFor="manager_name">Manager Name</Label>
                  <Input
                    id="manager_name"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="manager_phone">Manager Phone</Label>
                    <Input
                      id="manager_phone"
                      type="tel"
                      value={formData.manager_phone}
                      onChange={(e) =>
                        setFormData({ ...formData, manager_phone: e.target.value })
                      }
                      placeholder="(212) 555-0124"
                    />
                  </div>

                  <div>
                    <Label htmlFor="manager_email">Manager Email</Label>
                    <Input
                      id="manager_email"
                      type="email"
                      value={formData.manager_email}
                      onChange={(e) =>
                        setFormData({ ...formData, manager_email: e.target.value })
                      }
                      placeholder="manager@store.com"
                    />
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold">Settings</h3>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_primary}
                      onChange={(e) =>
                        setFormData({ ...formData, is_primary: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Primary Location</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this location..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingLocation ? 'Update Location' : 'Create Location'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Locations List */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first physical location to start managing multiple stores.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((location) => (
            <Card key={location.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{location.name}</CardTitle>
                      {location.is_primary && (
                        <Badge variant="default">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                      {!location.is_active && <Badge variant="destructive">Inactive</Badge>}
                    </div>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {location.address}, {location.city}, {location.state} {location.zip_code}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-3">
                {/* Contact Info */}
                <div className="space-y-1">
                  {location.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <a href={`tel:${location.phone}`} className="text-primary hover:underline">
                        {location.phone}
                      </a>
                    </div>
                  )}
                  {location.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <a
                        href={`mailto:${location.email}`}
                        className="text-primary hover:underline"
                      >
                        {location.email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Manager Info */}
                {location.manager_name && (
                  <div className="space-y-1 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">Manager:</span>
                      <span>{location.manager_name}</span>
                    </div>
                    {location.manager_phone && (
                      <div className="text-sm text-muted-foreground pl-5">
                        {location.manager_phone}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(location)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(location.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Alert */}
      {locations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Tip:</strong> Set one location as "Primary" to show it by default on your
            store page. Customers can choose other locations when viewing products.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
