import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Plus, Pencil, Trash2, GripVertical, Navigation, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from '@/db/api';
import type { Location } from '@/types';

interface LocationSearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    value: '',
    label: '',
    display_order: 0,
    is_active: true,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    radius_km: undefined as number | undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await getAllLocations();
      setLocations(data);
    } catch (error) {
      console.error('Failed to load locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.value.trim() || !formData.label.trim()) {
      toast.error('Value and label are required');
      return;
    }

    // Validate value format (lowercase, hyphenated)
    const valueRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!valueRegex.test(formData.value)) {
      toast.error('Value must be lowercase with hyphens only (e.g., "new-york-ny")');
      return;
    }

    try {
      setSubmitting(true);
      await createLocation(formData);
      toast.success('Location created successfully');
      setCreateDialogOpen(false);
      resetForm();
      loadLocations();
    } catch (error: any) {
      console.error('Failed to create location:', error);
      if (error.message?.includes('duplicate')) {
        toast.error('A location with this value already exists');
      } else {
        toast.error('Failed to create location');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedLocation || !formData.value.trim() || !formData.label.trim()) {
      toast.error('Value and label are required');
      return;
    }

    // Validate value format
    const valueRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!valueRegex.test(formData.value)) {
      toast.error('Value must be lowercase with hyphens only (e.g., "new-york-ny")');
      return;
    }

    try {
      setSubmitting(true);
      await updateLocation(selectedLocation.id, formData);
      toast.success('Location updated successfully');
      setEditDialogOpen(false);
      setSelectedLocation(null);
      resetForm();
      loadLocations();
    } catch (error: any) {
      console.error('Failed to update location:', error);
      if (error.message?.includes('duplicate')) {
        toast.error('A location with this value already exists');
      } else {
        toast.error('Failed to update location');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLocation) return;

    try {
      setSubmitting(true);
      await deleteLocation(selectedLocation.id);
      toast.success('Location deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedLocation(null);
      loadLocations();
    } catch (error) {
      console.error('Failed to delete location:', error);
      toast.error('Failed to delete location. It may be in use by stores or products.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (location: Location) => {
    try {
      await updateLocation(location.id, { is_active: !location.is_active });
      toast.success(`Location ${location.is_active ? 'deactivated' : 'activated'}`);
      loadLocations();
    } catch (error) {
      console.error('Failed to toggle location status:', error);
      toast.error('Failed to update location status');
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openEditDialog = (location: Location) => {
    setSelectedLocation(location);
    setFormData({
      value: location.value,
      label: location.label,
      display_order: location.display_order,
      is_active: location.is_active,
      latitude: location.latitude,
      longitude: location.longitude,
      radius_km: location.radius_km,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (location: Location) => {
    setSelectedLocation(location);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      value: '',
      label: '',
      display_order: locations.length * 10,
      is_active: true,
      latitude: undefined,
      longitude: undefined,
      radius_km: undefined,
    });
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleDetectGPS = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    
    // Show loading toast
    const loadingToast = toast.loading('Detecting GPS location...', {
      description: 'This may take a few seconds'
    });
    
    try {
      // Try with high accuracy first, with longer timeout
      let position: GeolocationPosition | null = null;
      
      try {
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 30000, // Increased to 30 seconds
            maximumAge: 60000, // Accept cached position up to 1 minute old
          });
        });
      } catch (highAccuracyError: any) {
        console.log('High accuracy failed, trying with lower accuracy...', highAccuracyError);
        
        // If high accuracy fails, try with lower accuracy (faster)
        if (highAccuracyError.code === 3) { // Timeout
          position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false, // Lower accuracy, faster response
              timeout: 15000,
              maximumAge: 300000, // Accept cached position up to 5 minutes old
            });
          });
        } else {
          throw highAccuracyError;
        }
      }

      if (!position) {
        throw new Error('Unable to get location');
      }

      const { latitude, longitude } = position.coords;
      const accuracy = position.coords.accuracy;
      
      console.log('GPS coordinates obtained:', latitude, longitude, 'Accuracy:', accuracy, 'meters');
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Update form with GPS coordinates
      setFormData({
        ...formData,
        latitude,
        longitude,
      });

      // Try to get city name from reverse geocoding
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'BestOld-Admin/1.0'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const city = data.address?.city || 
                      data.address?.town || 
                      data.address?.village || 
                      data.address?.county ||
                      data.address?.state;

          if (city && !formData.label) {
            // Auto-fill label if empty
            setFormData(prev => ({
              ...prev,
              latitude,
              longitude,
              label: city,
              value: prev.value || city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            }));
            toast.success('GPS location detected! 📍', {
              description: `${city} - Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}${accuracy > 1000 ? ' (approximate)' : ''}`,
            });
          } else {
            toast.success('GPS coordinates captured! 📍', {
              description: `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}${accuracy > 1000 ? ' (approximate)' : ''}`,
            });
          }
        } else {
          toast.success('GPS coordinates captured! 📍', {
            description: `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}${accuracy > 1000 ? ' (approximate)' : ''}`,
          });
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        toast.success('GPS coordinates captured! 📍', {
          description: `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}${accuracy > 1000 ? ' (approximate)' : ''}`,
        });
      }
    } catch (error: any) {
      console.error('GPS detection error:', error);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (error.code === 1) {
        toast.error('Location permission denied', {
          description: 'Please enable location permissions in your browser settings',
          duration: 5000,
        });
      } else if (error.code === 2) {
        toast.error('Location unavailable', {
          description: 'Unable to determine your location. Please check your GPS settings.',
          duration: 5000,
        });
      } else if (error.code === 3) {
        toast.error('Location detection timeout', {
          description: 'Please ensure GPS is enabled and try again, or enter coordinates manually.',
          duration: 5000,
        });
      } else {
        toast.error('Failed to detect GPS location', {
          description: 'Please enter coordinates manually or try again',
          duration: 5000,
        });
      }
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSearchLocation = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'BestOld-Admin/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowSearchResults(true);
      } else {
        toast.error('Failed to search location');
      }
    } catch (error) {
      console.error('Location search error:', error);
      toast.error('Failed to search location');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearchLocation(value);
    }, 500);
  };

  const handleSelectSearchResult = (result: LocationSearchResult) => {
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    
    // Extract city name from address
    const cityName = result.address.city || 
                    result.address.town || 
                    result.address.village || 
                    result.address.state ||
                    result.display_name.split(',')[0];

    // Generate value from city name
    const value = cityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    setFormData({
      ...formData,
      label: cityName,
      value: value,
      latitude,
      longitude,
    });

    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);

    toast.success('Location selected', {
      description: `${cityName} - Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Locations Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage location options for stores and products
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              All Locations
            </CardTitle>
            <CardDescription>
              {locations.length} location{locations.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-muted" />
                ))}
              </div>
            ) : locations.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No locations configured yet</p>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Location
                </Button>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead className="w-24">Radius</TableHead>
                      <TableHead className="w-32">Display Order</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead className="w-32 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell>
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {location.value}
                        </TableCell>
                        <TableCell className="font-medium">
                          {location.label}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {location.radius_km || 10} km
                          </Badge>
                        </TableCell>
                        <TableCell>{location.display_order}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={location.is_active}
                              onCheckedChange={() => handleToggleActive(location)}
                            />
                            <Badge variant={location.is_active ? 'default' : 'secondary'}>
                              {location.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(location)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(location)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>
                Create a new location option for stores and products
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Location Search Section */}
              <div className="space-y-2">
                <Label>Search Location on Map</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Search for any location (city, country, address) to auto-fill details
                </p>
                
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for India, Mumbai, Aurangabad, etc..."
                      value={searchQuery}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      className="pl-9"
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={result.place_id}
                          type="button"
                          onClick={() => handleSelectSearchResult(result)}
                          className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b last:border-b-0"
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {result.address.city || result.address.town || result.address.village || result.display_name.split(',')[0]}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {result.display_name}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {showSearchResults && searchResults.length === 0 && !searching && searchQuery.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-3">
                      <p className="text-sm text-muted-foreground text-center">
                        No locations found for "{searchQuery}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or enter manually
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Value *</Label>
                <Input
                  id="value"
                  placeholder="e.g., new-york-ny"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value.toLowerCase() })}
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase with hyphens only (e.g., "new-york-ny", "london-uk")
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label *</Label>
                <Input
                  id="label"
                  placeholder="e.g., New York, NY"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Display name shown to users
                </p>
              </div>
              
              {/* GPS Location Section */}
              <div className="space-y-2">
                <Label>GPS Coordinates (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Pinpoint the exact location using GPS for better accuracy
                </p>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDetectGPS}
                  disabled={detectingLocation}
                  className="w-full"
                >
                  {detectingLocation ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Detecting GPS...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4 mr-2" />
                      Detect GPS Location
                    </>
                  )}
                </Button>
                
                {(typeof formData.latitude === 'number' && typeof formData.longitude === 'number') && (
                  <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                    <p className="font-medium">GPS Coordinates Captured:</p>
                    <p className="text-muted-foreground">
                      Latitude: {formData.latitude.toFixed(6)}
                    </p>
                    <p className="text-muted-foreground">
                      Longitude: {formData.longitude.toFixed(6)}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, latitude: undefined, longitude: undefined })}
                      className="mt-2"
                    >
                      Clear GPS
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Coverage Radius Section */}
              <div className="space-y-2">
                <Label htmlFor="radius_km">Coverage Radius (km)</Label>
                <Input
                  id="radius_km"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Enter radius in km (e.g., 10, 25, 50)"
                  value={formData.radius_km ?? ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    radius_km: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Set the coverage radius for this location. Customers within this distance will see products from this location.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Location'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Location</DialogTitle>
              <DialogDescription>
                Update location details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Location Search Section */}
              <div className="space-y-2">
                <Label>Search Location on Map</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Search for any location (city, country, address) to auto-fill details
                </p>
                
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for India, Mumbai, Aurangabad, etc..."
                      value={searchQuery}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      className="pl-9"
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={result.place_id}
                          type="button"
                          onClick={() => handleSelectSearchResult(result)}
                          className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b last:border-b-0"
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {result.address.city || result.address.town || result.address.village || result.display_name.split(',')[0]}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {result.display_name}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {showSearchResults && searchResults.length === 0 && !searching && searchQuery.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-3">
                      <p className="text-sm text-muted-foreground text-center">
                        No locations found for "{searchQuery}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or enter manually
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-value">Value *</Label>
                <Input
                  id="edit-value"
                  placeholder="e.g., new-york-ny"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value.toLowerCase() })}
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase with hyphens only
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-label">Label *</Label>
                <Input
                  id="edit-label"
                  placeholder="e.g., New York, NY"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                />
              </div>
              
              {/* GPS Location Section */}
              <div className="space-y-2">
                <Label>GPS Coordinates (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Pinpoint the exact location using GPS for better accuracy
                </p>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDetectGPS}
                  disabled={detectingLocation}
                  className="w-full"
                >
                  {detectingLocation ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Detecting GPS...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4 mr-2" />
                      Detect GPS Location
                    </>
                  )}
                </Button>
                
                {(typeof formData.latitude === 'number' && typeof formData.longitude === 'number') && (
                  <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                    <p className="font-medium">GPS Coordinates Captured:</p>
                    <p className="text-muted-foreground">
                      Latitude: {formData.latitude.toFixed(6)}
                    </p>
                    <p className="text-muted-foreground">
                      Longitude: {formData.longitude.toFixed(6)}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, latitude: undefined, longitude: undefined })}
                      className="mt-2"
                    >
                      Clear GPS
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Coverage Radius Section */}
              <div className="space-y-2">
                <Label htmlFor="edit-radius_km">Coverage Radius (km)</Label>
                <Input
                  id="edit-radius_km"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Enter radius in km (e.g., 10, 25, 50)"
                  value={formData.radius_km ?? ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    radius_km: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Set the coverage radius for this location. Customers within this distance will see products from this location.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-display_order">Display Order</Label>
                <Input
                  id="edit-display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit-is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Location</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedLocation?.label}"? This action cannot be undone.
                {' '}This may fail if the location is currently in use by stores or products.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={submitting}>
                {submitting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}
