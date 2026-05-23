import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, X, Image as ImageIcon, MapPin, Phone, Navigation, Search, Loader2, TrendingUp, Store as StoreIcon, QrCode, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { getStoreByUserId, createStore, updateStore, uploadProductImage, deleteProductImage, getOrCreateLocation, toggleStorePickup } from '@/db/api';
import { fetchLocations } from '@/lib/locations';
import { compressImage, isImageFile, formatFileSize } from '@/utils/imageCompression';
import ShareStoreButton from '@/components/ShareStoreButton';
import StoreQRCodeCard from '@/components/StoreQRCodeCard';
import { supabase } from '@/db/supabase';
import type { Store } from '@/types';

interface LocationSearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

export default function StoreManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bannerImage, setBannerImage] = useState<string>('');
  const [shopImages, setShopImages] = useState<string[]>([]);
  const [tradeLicense, setTradeLicense] = useState<string>('');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  
  // Location search state
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState<LocationSearchResult[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [showLocationSearchResults, setShowLocationSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pickup payment state
  const [pickupUpiId, setPickupUpiId] = useState('');
  const [pickupQrUrl, setPickupQrUrl] = useState('');
  const [uploadingPickupQr, setUploadingPickupQr] = useState(false);
  const [savingPickupPayment, setSavingPickupPayment] = useState(false);
  const pickupQrInputRef = useRef<HTMLInputElement>(null);

  // Log component version for debugging
  useEffect(() => {
    console.log('🔄 StoreManagementPage loaded - Version with Social Media Links v1.0');
    console.log('✅ Social Media section should be visible after Phone Number field');
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    contact_info: '',
    phone_number: '',
    youtube_url: '',
    facebook_url: '',
    instagram_url: '',
    business_type: 'retail' as 'retail' | 'wholesale' | 'both',
  });

  useEffect(() => {
    if (user) {
      loadStore();
    }
    loadLocations();
  }, [user]);

  const loadLocations = async () => {
    try {
      const locs = await fetchLocations();
      setLocations(locs);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const loadStore = async () => {
    if (!user) return;

    try {
      const storeData = await getStoreByUserId(user.id);
      if (storeData) {
        console.log('Store data loaded:', storeData);
        setStore(storeData);
        setBannerImage(storeData.banner_image_url || '');
        setShopImages(storeData.shop_images || []);
        setTradeLicense(storeData.trade_license_url || '');
        if (storeData.latitude && storeData.longitude) {
          setGpsLocation({ lat: storeData.latitude, lng: storeData.longitude });
        }
        setPickupUpiId(storeData.pickup_upi_id || '');
        setPickupQrUrl(storeData.pickup_qr_code_url || '');
        setFormData({
          name: storeData.name,
          description: storeData.description || '',
          location: storeData.location,
          contact_info: storeData.contact_info || '',
          phone_number: storeData.phone_number || '',
          youtube_url: storeData.youtube_url || '',
          facebook_url: storeData.facebook_url || '',
          instagram_url: storeData.instagram_url || '',
          business_type: storeData.business_type || 'retail',
        });
      }
    } catch (error) {
      console.error('Failed to load store:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for required fields
    if (!formData.name || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validation for new store creation - banner and trade license are mandatory
    if (!store) {
      if (!bannerImage) {
        toast.error('Store banner image is required');
        return;
      }
      if (!tradeLicense) {
        toast.error('Trade license document is required');
        return;
      }
    }

    setSaving(true);

    try {
      const storeData = {
        ...formData,
        banner_image_url: bannerImage || undefined,
        shop_images: shopImages,
        trade_license_url: tradeLicense || undefined,
        latitude: gpsLocation?.lat,
        longitude: gpsLocation?.lng,
        youtube_url: formData.youtube_url || undefined,
        facebook_url: formData.facebook_url || undefined,
        instagram_url: formData.instagram_url || undefined,
      };

      console.log('Saving store data:', storeData);

      if (store) {
        // If store was rejected, reset to pending status for resubmission
        if (store.approval_status === 'rejected') {
          await updateStore(store.id, {
            ...storeData,
            approval_status: 'pending',
            rejection_reason: undefined,
            resubmission_count: (store.resubmission_count || 0) + 1,
            last_resubmitted_at: new Date().toISOString(),
          });
          toast.success('Store resubmitted for review! Admin will review your updated information.', {
            duration: 6000,
          });
        } else {
          await updateStore(store.id, storeData);
          toast.success('Store updated successfully');
        }
      } else {
        await createStore(storeData);
        toast.success('Store created successfully! Your store will be live after admin verification.', {
          duration: 6000,
        });

        // Fire-and-forget: send welcome email to the seller
        if (user?.email) {
          supabase.functions
            .invoke('send-store-welcome-email', {
              body: {
                email: user.email,
                storeName: formData.name,
                sellerName: user.user_metadata?.full_name || user.email.split('@')[0],
              },
            })
            .then(({ error }) => {
              if (error) console.warn('[StoreManagement] Welcome email failed:', error);
            });
        }

        navigate('/seller/dashboard');
      }
      await loadStore();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save store');
    } finally {
      setSaving(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isImageFile(file)) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      // Show compression message for large files
      if (file.size > 1024 * 1024) {
        toast.info(`Compressing image (${formatFileSize(file.size)})...`);
      }

      // Compress image (auto-converts HEIC/HEIF → JPEG first)
      const compressedFile = await compressImage(file, {
        maxSizeMB: 0.08, // 80KB max for 92% compression
        maxWidthOrHeight: 1920,
        outputFormat: 'auto', // Auto-detect WebP support
      });

      // Show compression result
      if (compressedFile.size < file.size) {
        const format = compressedFile.type === 'image/webp' ? 'WebP' : 'JPEG';
        toast.success(
          `Image compressed from ${formatFileSize(file.size)} to ${formatFileSize(compressedFile.size)} (${format})`
        );
      }

      const imageUrl = await uploadProductImage(compressedFile);
      setBannerImage(imageUrl);
      toast.success('Banner image uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveBanner = async () => {
    if (!bannerImage) return;

    try {
      await deleteProductImage(bannerImage);
      setBannerImage('');
      toast.success('Banner image removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove image');
    }
  };

  const handleShopImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (shopImages.length >= 5) {
      toast.error('Maximum 5 shop images allowed');
      return;
    }

    if (!isImageFile(file)) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      // Show compression message for large files
      if (file.size > 1024 * 1024) {
        toast.info(`Compressing image (${formatFileSize(file.size)})...`);
      }

      // Compress image (auto-converts HEIC/HEIF → JPEG first)
      const compressedFile = await compressImage(file, {
        maxSizeMB: 0.08, // 80KB max for 92% compression
        maxWidthOrHeight: 1920,
        outputFormat: 'auto', // Auto-detect WebP support
      });

      // Show compression result
      if (compressedFile.size < file.size) {
        const format = compressedFile.type === 'image/webp' ? 'WebP' : 'JPEG';
        toast.success(
          `Image compressed from ${formatFileSize(file.size)} to ${formatFileSize(compressedFile.size)} (${format})`
        );
      }

      const imageUrl = await uploadProductImage(compressedFile);
      setShopImages([...shopImages, imageUrl]);
      toast.success('Shop image uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveShopImage = async (imageUrl: string) => {
    try {
      await deleteProductImage(imageUrl);
      setShopImages(shopImages.filter(img => img !== imageUrl));
      toast.success('Shop image removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove image');
    }
  };

  const handleTradeLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      // Show compression message for large files
      if (file.size > 1024 * 1024) {
        toast.info(`Compressing image (${formatFileSize(file.size)})...`);
      }

      // Compress image (auto-converts HEIC/HEIF → JPEG first)
      const compressedFile = await compressImage(file, {
        maxSizeMB: 0.08, // 80KB max for 92% compression
        maxWidthOrHeight: 1920,
        outputFormat: 'auto', // Auto-detect WebP support
      });

      // Show compression result
      if (compressedFile.size < file.size) {
        const format = compressedFile.type === 'image/webp' ? 'WebP' : 'JPEG';
        toast.success(
          `Image compressed from ${formatFileSize(file.size)} to ${formatFileSize(compressedFile.size)} (${format})`
        );
      }

      const imageUrl = await uploadProductImage(compressedFile);
      setTradeLicense(imageUrl);
      toast.success('Trade license uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveTradeLicense = async () => {
    if (!tradeLicense) return;

    try {
      await deleteProductImage(tradeLicense);
      setTradeLicense('');
      toast.success('Trade license removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove image');
    }
  };

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setGpsLocation({ lat, lng });
        
        // Use reverse geocoding to get city name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'BestOld-App/1.0'
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

            if (city) {
              // Try to match with available locations
              const matchedLocation = locations.find(loc => 
                loc.label.toLowerCase().includes(city.toLowerCase()) ||
                city.toLowerCase().includes(loc.label.toLowerCase())
              );

              if (matchedLocation) {
                setFormData({ ...formData, location: matchedLocation.label });
                toast.success('Location detected and set successfully', {
                  description: `${matchedLocation.label} - GPS coordinates captured`,
                });
              } else {
                toast.success('GPS location captured', {
                  description: `Detected: ${city}. Please select the closest location from dropdown.`,
                });
              }
            } else {
              toast.success('GPS location captured', {
                description: 'Please select your city from the dropdown.',
              });
            }
          } else {
            toast.success('GPS coordinates captured', {
              description: 'Please select your city from the dropdown.',
            });
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          toast.success('GPS coordinates captured', {
            description: 'Please select your city from the dropdown.',
          });
        }
        
        setDetectingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to detect location. Please enable location services.');
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Location search functions
  const handleLocationSearchInputChange = (value: string) => {
    setLocationSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length < 2) {
      setLocationSearchResults([]);
      setShowLocationSearchResults(false);
      return;
    }

    setSearchingLocation(true);
    searchTimeoutRef.current = setTimeout(() => {
      handleSearchLocation(value);
    }, 500);
  };

  const handleSearchLocation = async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'BestOld-App/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setLocationSearchResults(data);
      setShowLocationSearchResults(true);
    } catch (error) {
      console.error('Location search error:', error);
      toast.error('Failed to search location');
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleSelectLocationSearchResult = async (result: LocationSearchResult) => {
    const cityName = result.address.city || 
                     result.address.town || 
                     result.address.village || 
                     result.address.state || 
                     'Unknown';

    try {
      // Try to auto-create location if it doesn't exist
      const location = await getOrCreateLocation({
        label: cityName,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      });

      // Reload locations to include the new one
      await loadLocations();

      // Set the location in form
      setFormData({ ...formData, location: location.label });
      
      // Set GPS coordinates
      setGpsLocation({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      });

      // Clear search
      setLocationSearchQuery('');
      setLocationSearchResults([]);
      setShowLocationSearchResults(false);

      toast.success('Location selected', {
        description: `${cityName} has been added to your store`,
      });
    } catch (error) {
      console.error('Failed to create location:', error);
      
      // Fallback: Check if location exists in current list
      const existingLocation = locations.find(loc => 
        loc.label.toLowerCase().includes(cityName.toLowerCase()) ||
        cityName.toLowerCase().includes(loc.label.toLowerCase())
      );

      if (existingLocation) {
        // Use existing location
        setFormData({ ...formData, location: existingLocation.label });
        setGpsLocation({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        });
        
        setLocationSearchQuery('');
        setLocationSearchResults([]);
        setShowLocationSearchResults(false);
        
        toast.success('Location selected', {
          description: `Using existing location: ${existingLocation.label}`,
        });
      } else {
        // Allow manual entry
        setFormData({ ...formData, location: cityName });
        setGpsLocation({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        });
        
        setLocationSearchQuery('');
        setLocationSearchResults([]);
        setShowLocationSearchResults(false);
        
        toast.success('Location set', {
          description: `${cityName} will be used for your store`,
        });
      }
    }
  };

  const handleTogglePickup = async () => {
    if (!store) return;
    const newValue = !(store.store_pickup_enabled !== false);
    try {
      await toggleStorePickup(store.id, newValue);
      setStore({ ...store, store_pickup_enabled: newValue });
      toast.success(newValue ? 'Store pickup enabled' : 'Store pickup disabled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update store pickup setting');
    }
  };

  const handlePickupQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;
    if (!isImageFile(file)) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    try {
      setUploadingPickupQr(true);
      const compressed = await compressImage(file);
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `pickup-qr/${store.id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('app-ahn8efyun8ch_products_images')
        .upload(fileName, compressed, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('app-ahn8efyun8ch_products_images')
        .getPublicUrl(fileName);
      setPickupQrUrl(urlData.publicUrl);
      toast.success('QR code image uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload QR image');
    } finally {
      setUploadingPickupQr(false);
      if (pickupQrInputRef.current) pickupQrInputRef.current.value = '';
    }
  };

  const handleSavePickupPayment = async () => {
    if (!store) return;
    try {
      setSavingPickupPayment(true);
      await updateStore(store.id, {
        pickup_qr_code_url: pickupQrUrl || null as any,
        pickup_upi_id: pickupUpiId.trim() || null as any,
      });
      setStore({ ...store, pickup_qr_code_url: pickupQrUrl || undefined, pickup_upi_id: pickupUpiId.trim() || undefined });
      toast.success('Pickup payment details saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save pickup payment details');
    } finally {
      setSavingPickupPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container max-w-2xl">
        {/* Show approval status banner if store exists */}
        {store && store.approval_status === 'pending' && (
          <Card className="mb-6 border-yellow-500 bg-yellow-500/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-yellow-500 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">Store Pending Approval</h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                    Your store is currently under review by our admin team. You'll be notified once it's approved and goes live.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {store && store.approval_status === 'rejected' && (
          <Card className="mb-6 border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-destructive p-2">
                  <X className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive">Store Application Rejected</h3>
                  <p className="text-sm text-destructive/80 mt-1">
                    <strong>Reason:</strong> {store.rejection_reason || 'Your store application was rejected. Please contact support for more information.'}
                  </p>
                  <div className="mt-3 p-3 bg-background/50 rounded-lg border border-destructive/20">
                    <p className="text-sm font-medium text-foreground">📝 How to Resubmit:</p>
                    <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                      <li>Review the rejection reason above</li>
                      <li>Update the incorrect information in the form below</li>
                      <li>Click "Update Store" to resubmit for admin review</li>
                    </ol>
                    <p className="text-sm text-primary font-medium mt-2">
                      ✓ Your store will be automatically resubmitted to admin for approval
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {store && store.approval_status === 'approved' && (
          <Card className="mb-6 border-green-500 bg-green-500/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-500 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-700 dark:text-green-400">Store Approved & Live</h3>
                  <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    Your store is approved and visible to customers. Start adding products to begin selling!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{store ? 'Manage Store' : 'Create Store'}</CardTitle>
                <CardDescription>
                  {store
                    ? 'Update your store information'
                    : 'Set up your store to start selling. Your store will be reviewed by our admin team before going live.'}
                </CardDescription>
              </div>
              {store && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/seller/featured-store-apply')}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Apply for Featured Store
                  </Button>
                  <ShareStoreButton store={store} variant="outline" size="sm" />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Banner Image Upload */}
              <div className="space-y-2">
                <Label>
                  Store Banner Image {!store && <span className="text-destructive">*</span>}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {!store 
                    ? 'Upload a banner image for your store (Required, recommended size: 1200x300px). Large images will be automatically compressed.'
                    : 'Upload a banner image for your store (recommended size: 1200x300px). Large images will be automatically compressed.'}
                </p>
                
                {bannerImage ? (
                  <div className="relative w-full aspect-[4/1] rounded-lg overflow-hidden border border-border">
                    <img
                      src={bannerImage}
                      alt="Store banner"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveBanner}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                      id="banner-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="banner-upload"
                      className="flex flex-col items-center justify-center w-full aspect-[4/1] border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      {uploading ? (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm font-medium">Click to upload banner image</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG, WEBP (any size - auto-compressed)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Store Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Tell buyers about your store..."
                />
              </div>

              {/* Business Type Selection */}
              <div className="space-y-3">
                <Label>Business Type *</Label>
                <p className="text-sm text-muted-foreground">
                  Select the type of business you operate
                </p>
                <div className="grid gap-3">
                  <label
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.business_type === 'retail'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="business_type"
                      value="retail"
                      checked={formData.business_type === 'retail'}
                      onChange={(e) => setFormData({ ...formData, business_type: e.target.value as 'retail' | 'wholesale' | 'both' })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Retail Only</div>
                      <p className="text-sm text-muted-foreground">
                        Sell products directly to individual customers
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.business_type === 'wholesale'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="business_type"
                      value="wholesale"
                      checked={formData.business_type === 'wholesale'}
                      onChange={(e) => setFormData({ ...formData, business_type: e.target.value as 'retail' | 'wholesale' | 'both' })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Wholesale Only</div>
                      <p className="text-sm text-muted-foreground">
                        Sell products in bulk to businesses and retailers
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.business_type === 'both'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="business_type"
                      value="both"
                      checked={formData.business_type === 'both'}
                      onChange={(e) => setFormData({ ...formData, business_type: e.target.value as 'retail' | 'wholesale' | 'both' })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Retail & Wholesale</div>
                      <p className="text-sm text-muted-foreground">
                        Serve both individual customers and bulk buyers
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (City/Region) *</Label>
                
                {/* Location Search */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for your city or location..."
                      value={locationSearchQuery}
                      onChange={(e) => handleLocationSearchInputChange(e.target.value)}
                      className="pl-9"
                    />
                    {searchingLocation && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {showLocationSearchResults && locationSearchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {locationSearchResults.map((result) => {
                        const cityName = result.address.city || 
                                       result.address.town || 
                                       result.address.village || 
                                       result.address.state || 
                                       'Unknown';
                        return (
                          <button
                            key={result.place_id}
                            type="button"
                            onClick={() => handleSelectLocationSearchResult(result)}
                            className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                          >
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{cityName}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {result.display_name}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Search for your location above, or select from existing locations below
                </p>

                {/* Existing Location Dropdown */}
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Or select from existing locations" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.value} value={location.label}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* GPS Location */}
              <div className="space-y-2">
                <Label>GPS Location</Label>
                <p className="text-sm text-muted-foreground">
                  Capture your exact store location for better visibility
                </p>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    className="flex-1"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {detectingLocation ? 'Detecting...' : 'Detect My Location'}
                  </Button>
                </div>
                
                {gpsLocation && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p className="font-medium mb-1">Location Captured:</p>
                    <p className="text-muted-foreground">
                      Latitude: {gpsLocation.lat.toFixed(6)}
                    </p>
                    <p className="text-muted-foreground">
                      Longitude: {gpsLocation.lng.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This number will be visible to customers when they click "Contact Seller"
                </p>
              </div>

              {/* Social Media Links Section */}
              <div className="space-y-4 pt-4 border-t" data-version="v1.0">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Social Media Links
                    <span className="ml-2 text-xs font-normal text-muted-foreground">(Optional)</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add your social media profiles to help customers connect with you
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube_url">YouTube Channel</Label>
                  <Input
                    id="youtube_url"
                    type="url"
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook_url">Facebook Page</Label>
                  <Input
                    id="facebook_url"
                    type="url"
                    value={formData.facebook_url}
                    onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram_url">Instagram Profile</Label>
                  <Input
                    id="instagram_url"
                    type="url"
                    value={formData.instagram_url}
                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/yourprofile"
                  />
                </div>
              </div>

              {/* Trade License Upload */}
              <div className="space-y-2">
                <Label>
                  Trade License Document {!store && <span className="text-destructive">*</span>}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {!store 
                    ? 'Upload your trade license or business registration document (Required, PDF or image). Large images will be automatically compressed.'
                    : 'Upload your trade license or business registration document (PDF or image). Large images will be automatically compressed.'}
                </p>
                
                {tradeLicense ? (
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Trade License Uploaded</p>
                          <a 
                            href={tradeLicense} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View Document
                          </a>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveTradeLicense}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleTradeLicenseUpload}
                      className="hidden"
                      id="trade-license-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="trade-license-upload"
                      className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      {uploading ? (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm font-medium">Click to upload trade license</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, PNG, JPG (any size - auto-compressed)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Shop Images Upload */}
              <div className="space-y-2">
                <Label>
                  Shop Photos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Upload photos of your shop (Optional, up to 5 images). Large images will be automatically compressed.
                </p>
                
                {/* Display uploaded shop images */}
                {shopImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {shopImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Shop ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveShopImage(img)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                {shopImages.length < 5 && (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleShopImageUpload}
                      className="hidden"
                      id="shop-images-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="shop-images-upload"
                      className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      {uploading ? (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm font-medium">Click to upload shop photos</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG (any size - auto-compressed) ({shopImages.length}/5 uploaded)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_info">Additional Contact Information</Label>
                <Input
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  placeholder="Phone or email"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving 
                    ? 'Saving...' 
                    : store 
                      ? store.approval_status === 'rejected' 
                        ? 'Resubmit for Review' 
                        : 'Update Store'
                      : 'Create Store'}
                </Button>
                {store && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/seller/dashboard')}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Store Pickup Setting — only shown for existing stores */}
        {store && (
          <Card className={`border-2 ${store.store_pickup_enabled !== false ? 'border-amber-300 dark:border-amber-700' : 'border-border'}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${store.store_pickup_enabled !== false ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-muted'}`}>
                  <StoreIcon className={`h-5 w-5 ${store.store_pickup_enabled !== false ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">Store Pickup Option</CardTitle>
                  <CardDescription className="text-pretty">
                    Allow customers to pay a ₹500 non-refundable advance and collect items from your store within 3 days.
                  </CardDescription>
                </div>
                <div className="shrink-0 ml-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${store.store_pickup_enabled !== false ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                    {store.store_pickup_enabled !== false ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground text-pretty">
                  {store.store_pickup_enabled !== false
                    ? 'Customers can currently choose "Store Pickup" when buying your products. They pay ₹500 in advance and collect within 3 days.'
                    : 'Store pickup is currently disabled. Customers can only choose home delivery for your products.'}
                </p>
                <Button
                  type="button"
                  variant={store.store_pickup_enabled !== false ? 'default' : 'outline'}
                  onClick={handleTogglePickup}
                  className={`shrink-0 ${store.store_pickup_enabled !== false ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent' : ''}`}
                >
                  {store.store_pickup_enabled !== false ? 'Disable Pickup' : 'Enable Pickup'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pickup Payment Details — only visible when pickup is ON, admin-enabled */}
        {store && store.store_pickup_enabled !== false && (
          <Card className="border-2 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-amber-100 dark:bg-amber-900/30">
                  <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">Pickup Advance Payment Details</CardTitle>
                  <CardDescription className="text-pretty">
                    Add your payment QR code and UPI ID so customers can pay the ₹500 pickup advance directly to you.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Code Upload */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-amber-600" />
                  Payment QR Code
                </Label>
                <p className="text-xs text-muted-foreground">
                  Upload your UPI / Google Pay / PhonePe / Paytm QR code image. Customers will scan this to pay ₹500 advance.
                </p>

                {/* Current QR preview */}
                {pickupQrUrl && (
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-white dark:bg-card w-fit">
                    <img
                      src={pickupQrUrl}
                      alt="Payment QR code"
                      className="w-44 h-44 object-contain rounded"
                    />
                    <p className="text-xs text-muted-foreground">Current QR code</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setPickupQrUrl('')}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    ref={pickupQrInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePickupQrUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => pickupQrInputRef.current?.click()}
                    disabled={uploadingPickupQr}
                    className="flex-1"
                  >
                    {uploadingPickupQr ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" />{pickupQrUrl ? 'Replace QR Image' : 'Upload QR Image'}</>
                    )}
                  </Button>
                </div>
              </div>

              {/* UPI ID */}
              <div className="space-y-2">
                <Label htmlFor="pickup-upi-id" className="text-sm font-medium">
                  UPI ID / Payment ID
                </Label>
                <p className="text-xs text-muted-foreground">
                  Your UPI ID (e.g. yourname@upi, 9876543210@paytm). Shown to customers as an alternative to scanning the QR.
                </p>
                <Input
                  id="pickup-upi-id"
                  placeholder="e.g. yourname@upi or 9876543210@paytm"
                  value={pickupUpiId}
                  onChange={(e) => setPickupUpiId(e.target.value)}
                  className="font-mono"
                />
              </div>

              {/* Status indicator */}
              {(store.pickup_qr_code_url || store.pickup_upi_id) && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Your payment details are saved and shown to customers on the pickup checkout page.
                  </p>
                </div>
              )}

              {!store.pickup_qr_code_url && !store.pickup_upi_id && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    No payment details saved yet. Customers will see the platform default payment until you add yours.
                  </p>
                </div>
              )}

              <Button
                type="button"
                onClick={handleSavePickupPayment}
                disabled={savingPickupPayment}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white border-transparent"
              >
                {savingPickupPayment ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                ) : (
                  'Save Payment Details'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Store QR Code — only shown for existing stores */}
        {store && <StoreQRCodeCard store={store} />}
      </div>
    </div>
  );
}
