import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  getProfile, 
  updateProfile, 
  getReviewsByStore, 
  getStoreByUserId, 
  getFollowing, 
  unfollowSeller,
  createSellerApplication,
  resubmitSellerApplication,
  getSellerApplication,
  createProfileIfNotExists,
  getOrCreateLocation,
  type SellerApplication
} from '@/db/api';
import { supabase } from '@/db/supabase';
import { fetchLocations } from '@/lib/locations';
import { compressImage, isImageFile, formatFileSize } from '@/utils/imageCompression';
import type { Profile, Review, Follow, Store } from '@/types';
import { Star, UserCheck, X, Store as StoreIcon, CheckCircle, Clock, XCircle, Upload, MapPin, Image as ImageIcon, FileText, Search, Loader2, Youtube, Facebook, Instagram } from 'lucide-react';

export default function AccountPage() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);
  const [myStore, setMyStore] = useState<Store | null>(null);
  const [sellerApplication, setSellerApplication] = useState<SellerApplication | null>(null);
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    location: '',
  });
  const [applicationData, setApplicationData] = useState({
    business_name: '',
    business_description: '',
    phone_number: '',
    location: '',
    banner_image_url: '',
    shop_images: [] as string[],
    trade_license_url: '',
    latitude: null as number | null,
    longitude: null as number | null,
    business_type: 'retail' as 'retail' | 'wholesale' | 'both',
    youtube_url: '',
    facebook_url: '',
    instagram_url: '',
  });
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingShopImages, setUploadingShopImages] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);

  // Location search state for seller application
  const [appLocationQuery, setAppLocationQuery] = useState('');
  const [appLocationResults, setAppLocationResults] = useState<{
    place_id: string; display_name: string; lat: string; lon: string;
    address: { city?: string; town?: string; village?: string; state?: string; country?: string };
  }[]>([]);
  const [appSearchingLocation, setAppSearchingLocation] = useState(false);
  const [appShowLocationResults, setAppShowLocationResults] = useState(false);
  const appLocationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    if (user) {
      loadData();
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

  const loadData = async () => {
    if (!user) return;

    try {
      console.log('Loading profile for user:', user.id);
      let profileData = await getProfile(user.id);
      console.log('Profile Data:', profileData);
      
      if (!profileData) {
        console.log('Profile not found, creating profile...');
        // Profile doesn't exist, create it
        const result = await createProfileIfNotExists(user.id, user.email || '');
        console.log('Create profile result:', result);
        
        if (result.success && result.profile) {
          profileData = result.profile;
          toast.success('Profile created successfully');
        } else {
          console.error('Failed to create profile:', result.error);
          toast.error('Failed to create profile. Please contact support.');
          setLoading(false);
          return;
        }
      }
      
      setProfile(profileData);

      if (profileData) {
        setFormData({
          full_name: profileData.full_name || '',
          location: profileData.location || '',
        });

        // Load seller application if user is not a seller or admin
        console.log('User role:', profileData.role);
        if (profileData.role !== 'seller' && profileData.role !== 'admin') {
          console.log('Loading seller application...');
          try {
            const application = await getSellerApplication(user.id);
            console.log('Seller application:', application);
            setSellerApplication(application);
          } catch (appError) {
            console.error('Failed to load seller application:', appError);
            // Don't fail the whole page if application loading fails
          }
        }

        // Load reviews if user is a buyer
        if (profileData.role === 'buyer') {
          // Get user's store if they're also a seller
          const store = await getStoreByUserId(user.id);
          if (store) {
            const reviewsData = await getReviewsByStore(store.id);
            setReviews(reviewsData);
          }
        }

        // Load following
        const followingData = await getFollowing(user.id);
        setFollowing(followingData);
        
        // Load store if seller/admin
        if (profileData.role === 'seller' || profileData.role === 'admin') {
          const storeData = await getStoreByUserId(user.id);
          setMyStore(storeData);
        }
      }
    } catch (error: any) {
      console.error('Failed to load account data:', error);
      toast.error(`Failed to load profile: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await updateProfile(user.id, formData);
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Location search for seller application form
  const handleAppLocationSearch = (value: string) => {
    setAppLocationQuery(value);
    if (appLocationTimeoutRef.current) clearTimeout(appLocationTimeoutRef.current);
    if (value.trim().length < 2) {
      setAppLocationResults([]);
      setAppShowLocationResults(false);
      return;
    }
    setAppSearchingLocation(true);
    appLocationTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&addressdetails=1`,
          { headers: { 'User-Agent': 'BestOld-App/1.0' } }
        );
        const data = await response.json();
        setAppLocationResults(data);
        setAppShowLocationResults(true);
      } catch {
        toast.error('Failed to search location');
      } finally {
        setAppSearchingLocation(false);
      }
    }, 500);
  };

  const handleAppSelectLocation = async (result: typeof appLocationResults[0]) => {
    const cityName = result.address.city || result.address.town || result.address.village || result.address.state || 'Unknown';
    try {
      const location = await getOrCreateLocation({
        label: cityName,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      });
      await loadLocations();
      setApplicationData(prev => ({ ...prev, location: location.label, latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) }));
    } catch {
      setApplicationData(prev => ({ ...prev, location: cityName, latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) }));
    }
    setAppLocationQuery('');
    setAppLocationResults([]);
    setAppShowLocationResults(false);
    toast.success(`Location set to ${cityName}`);
  };

  const handleSellerApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await createSellerApplication({
        user_id: user.id,
        business_name: applicationData.business_name,
        business_description: applicationData.business_description,
        phone_number: applicationData.phone_number,
        location: applicationData.location,
        banner_image_url: applicationData.banner_image_url,
        shop_images: applicationData.shop_images,
        trade_license_url: applicationData.trade_license_url,
        latitude: applicationData.latitude ?? undefined,
        longitude: applicationData.longitude ?? undefined,
        business_type: applicationData.business_type,
        youtube_url: applicationData.youtube_url || undefined,
        facebook_url: applicationData.facebook_url || undefined,
        instagram_url: applicationData.instagram_url || undefined,
      });
      
      toast.success('Seller application submitted successfully! We will review it shortly.');
      setApplyDialogOpen(false);
      
      // Reload application data
      const application = await getSellerApplication(user.id);
      setSellerApplication(application);
      
      // Reset form
      setApplicationData({
        business_name: '',
        business_description: '',
        phone_number: '',
        location: '',
        banner_image_url: '',
        shop_images: [],
        trade_license_url: '',
        latitude: null,
        longitude: null,
        business_type: 'retail',
        youtube_url: '',
        facebook_url: '',
        instagram_url: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setSaving(false);
    }
  };

  const handleEditApplication = () => {
    if (!sellerApplication) return;
    // Pre-fill the form with existing application data
    setApplicationData({
      business_name: sellerApplication.business_name || '',
      business_description: sellerApplication.business_description || '',
      phone_number: sellerApplication.phone_number || '',
      location: sellerApplication.location || '',
      banner_image_url: sellerApplication.banner_image_url || '',
      shop_images: sellerApplication.shop_images || [],
      trade_license_url: sellerApplication.trade_license_url || '',
      latitude: sellerApplication.latitude,
      longitude: sellerApplication.longitude,
      business_type: sellerApplication.business_type || 'retail',
      youtube_url: sellerApplication.youtube_url || '',
      facebook_url: sellerApplication.facebook_url || '',
      instagram_url: sellerApplication.instagram_url || '',
    });
    setEditDialogOpen(true);
  };

  const handleResubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !sellerApplication) return;
    setSaving(true);
    try {
      await resubmitSellerApplication(sellerApplication.id, user.id, {
        business_name: applicationData.business_name,
        business_description: applicationData.business_description,
        phone_number: applicationData.phone_number,
        location: applicationData.location,
        banner_image_url: applicationData.banner_image_url,
        shop_images: applicationData.shop_images,
        trade_license_url: applicationData.trade_license_url,
        latitude: applicationData.latitude ?? undefined,
        longitude: applicationData.longitude ?? undefined,
        business_type: applicationData.business_type,
        youtube_url: applicationData.youtube_url || undefined,
        facebook_url: applicationData.facebook_url || undefined,
        instagram_url: applicationData.instagram_url || undefined,
      });
      toast.success('Application resubmitted! We will review it shortly.');
      setEditDialogOpen(false);
      const application = await getSellerApplication(user.id);
      setSellerApplication(application);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resubmit application');
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

    setUploadingBanner(true);
    try {
      // Show compression progress
      const originalSize = formatFileSize(file.size);
      toast.loading(`Compressing banner image (${originalSize})...`, { id: 'banner-compress' });

      // Compress image (auto-converts HEIC/HEIF → JPEG first)
      const compressedFile = await compressImage(file);
      
      const compressedSize = formatFileSize(compressedFile.size);
      const savings = Math.round((1 - compressedFile.size / file.size) * 100);
      
      toast.success(
        `Compressed: ${originalSize} → ${compressedSize} (${savings}% smaller)`,
        { id: 'banner-compress', duration: 2000 }
      );

      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${user?.id}-banner-${Date.now()}.${fileExt}`;
      const filePath = `store-banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('app-ahn8efyun8ch_products_images')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('app-ahn8efyun8ch_products_images')
        .getPublicUrl(filePath);

      setApplicationData({ ...applicationData, banner_image_url: publicUrl });
      toast.success('Banner image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload banner image');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleShopImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (applicationData.shop_images.length + files.length > 5) {
      toast.error('Maximum 5 shop images allowed');
      return;
    }

    // Validate each file
    for (const file of files) {
      if (!isImageFile(file)) {
        toast.error('Please upload only image files');
        return;
      }
    }

    setUploadingShopImages(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        // Show compression progress
        const originalSize = formatFileSize(file.size);
        toast.loading(`Compressing ${file.name} (${originalSize})...`, { id: file.name });

        try {
          // Compress image (auto-converts HEIC/HEIF → JPEG first)
          const compressedFile = await compressImage(file);

          const compressedSize = formatFileSize(compressedFile.size);
          const savings = Math.round((1 - compressedFile.size / file.size) * 100);

          toast.success(
            `${file.name}: ${originalSize} → ${compressedSize} (${savings}% smaller)`,
            { id: file.name, duration: 2000 }
          );

          const fileExt = compressedFile.name.split('.').pop();
          const fileName = `${user?.id}-shop-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `shop-images/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('app-ahn8efyun8ch_products_images')
            .upload(filePath, compressedFile);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('app-ahn8efyun8ch_products_images')
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
        } catch (fileError: any) {
          toast.error(
            `Failed to process ${file.name}: ${fileError.message || 'unsupported format'}`,
            { id: file.name }
          );
        }
      }

      setApplicationData({ 
        ...applicationData, 
        shop_images: [...applicationData.shop_images, ...uploadedUrls] 
      });
      toast.success(`${uploadedUrls.length} shop image(s) uploaded successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload shop images');
    } finally {
      setUploadingShopImages(false);
    }
  };

  const handleRemoveShopImage = (index: number) => {
    const newImages = applicationData.shop_images.filter((_, i) => i !== index);
    setApplicationData({ ...applicationData, shop_images: newImages });
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Trade license file must be less than 10MB');
      return;
    }

    // Validate file type (images and PDFs)
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF file');
      return;
    }

    setUploadingLicense(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-license-${Date.now()}.${fileExt}`;
      const filePath = `trade-licenses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('app-ahn8efyun8ch_products_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('app-ahn8efyun8ch_products_images')
        .getPublicUrl(filePath);

      setApplicationData({ ...applicationData, trade_license_url: publicUrl });
      toast.success('Trade license uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload trade license');
    } finally {
      setUploadingLicense(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.info('Getting your location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setApplicationData({
          ...applicationData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        toast.success('Location captured successfully');
      },
      (error) => {
        toast.error('Failed to get location: ' + error.message);
      }
    );
  };

  if (loading) {
    return <div className="container py-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="following">
              Following
              {following.length > 0 && (
                <Badge variant="secondary" className="ml-2">{following.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your account details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={profile?.email || ''} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input 
                        id="phone_number" 
                        value={profile?.phone_number || ''} 
                        disabled 
                        placeholder="Not provided"
                      />
                      <p className="text-xs text-muted-foreground">
                        Phone number cannot be changed after registration
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Select
                        value={formData.location || 'none'}
                        onValueChange={(value) => setFormData({ ...formData, location: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not specified</SelectItem>
                          {locations.map((location) => (
                            <SelectItem key={location.value} value={location.label}>
                              {location.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Account Type</Label>
                      <Input value={profile?.role || ''} disabled className="capitalize" />
                    </div>

                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                  <CardDescription>Access important features</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/settings">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Settings & App Icon Preview
                    </Link>
                  </Button>
                  {profile?.role === 'buyer' && (
                    <>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/favorites">
                          <Star className="mr-2 h-4 w-4" />
                          My Favorites
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/my-orders">
                          <FileText className="mr-2 h-4 w-4" />
                          My Orders
                        </Link>
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Become a Seller Section */}
              {profile && profile.role !== 'seller' && profile.role !== 'admin' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <StoreIcon className="h-5 w-5" />
                      Become a Seller
                    </CardTitle>
                    <CardDescription>
                      Start selling your second-hand goods on BESTOLD
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!sellerApplication ? (
                      <div className="space-y-4">
                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                          <h3 className="font-semibold">Benefits of becoming a seller:</h3>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-0.5">✓</span>
                              <span>Create your own store and list unlimited products</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-0.5">✓</span>
                              <span>Reach thousands of potential buyers</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-0.5">✓</span>
                              <span>Manage orders and communicate with customers</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-0.5">✓</span>
                              <span>Build your reputation with customer reviews</span>
                            </li>
                          </ul>
                        </div>

                        <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                          <DialogTrigger asChild>
                            <Button className="w-full">
                              <StoreIcon className="h-4 w-4 mr-2" />
                              Apply to Become a Seller
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Seller Application</DialogTitle>
                              <DialogDescription>
                                Complete all required fields to apply for a seller account
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSellerApplication} className="space-y-6">
                              {/* Basic Information */}
                              <div className="space-y-4">
                                <h3 className="font-semibold text-sm">Basic Information</h3>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="business_name">Business/Store Name *</Label>
                                  <Input
                                    id="business_name"
                                    value={applicationData.business_name}
                                    onChange={(e) => setApplicationData({ ...applicationData, business_name: e.target.value })}
                                    placeholder="Enter your store name"
                                    required
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="business_description">Business Description</Label>
                                  <Textarea
                                    id="business_description"
                                    value={applicationData.business_description}
                                    onChange={(e) => setApplicationData({ ...applicationData, business_description: e.target.value })}
                                    placeholder="Tell us about your business and what you plan to sell"
                                    rows={3}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="app_phone_number">Contact Phone Number</Label>
                                  <Input
                                    id="app_phone_number"
                                    value={applicationData.phone_number}
                                    onChange={(e) => setApplicationData({ ...applicationData, phone_number: e.target.value })}
                                    placeholder="e.g. 919876543210 (country code + number)"
                                  />
                                </div>
                              </div>

                              {/* Business Type */}
                              <div className="space-y-4 border-t pt-4">
                                <h3 className="font-semibold text-sm">Business Type *</h3>
                                <p className="text-xs text-muted-foreground">Select the type of business you operate</p>
                                <div className="grid grid-cols-1 gap-3">
                                  {([
                                    { value: 'retail', label: 'Retail Only', desc: 'Sell products directly to individual customers' },
                                    { value: 'wholesale', label: 'Wholesale Only', desc: 'Sell products in bulk to businesses and retailers' },
                                    { value: 'both', label: 'Retail & Wholesale', desc: 'Serve both individual customers and bulk buyers' },
                                  ] as const).map((type) => (
                                    <label
                                      key={type.value}
                                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                        applicationData.business_type === type.value
                                          ? 'border-primary bg-primary/5'
                                          : 'border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name="app_business_type"
                                        value={type.value}
                                        checked={applicationData.business_type === type.value}
                                        onChange={() => setApplicationData({ ...applicationData, business_type: type.value })}
                                        className="mt-1 accent-primary"
                                      />
                                      <div>
                                        <p className="font-medium text-sm">{type.label}</p>
                                        <p className="text-xs text-muted-foreground">{type.desc}</p>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Location */}
                              <div className="space-y-3 border-t pt-4">
                                <h3 className="font-semibold text-sm">Location (City/Region) *</h3>

                                {/* Location Search */}
                                <div className="relative">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Search for your city or location..."
                                      value={appLocationQuery}
                                      onChange={(e) => handleAppLocationSearch(e.target.value)}
                                      className="pl-9"
                                    />
                                    {appSearchingLocation && (
                                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                  </div>
                                  {appShowLocationResults && appLocationResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                      {appLocationResults.map((result) => {
                                        const city = result.address.city || result.address.town || result.address.village || result.address.state || 'Unknown';
                                        return (
                                          <button
                                            key={result.place_id}
                                            type="button"
                                            onClick={() => handleAppSelectLocation(result)}
                                            className="w-full px-3 py-2 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                                          >
                                            <p className="font-medium text-sm">{city}</p>
                                            <p className="text-xs text-muted-foreground truncate">{result.display_name}</p>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                <p className="text-xs text-muted-foreground">Search above, or select from existing locations below</p>

                                <Select
                                  value={applicationData.location || 'none'}
                                  onValueChange={(value) => setApplicationData({ ...applicationData, location: value === 'none' ? '' : value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Or select from existing locations" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Select a location</SelectItem>
                                    {locations.map((location) => (
                                      <SelectItem key={location.value} value={location.label}>
                                        {location.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {applicationData.latitude && applicationData.longitude && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    <span>GPS: {applicationData.latitude.toFixed(4)}, {applicationData.longitude.toFixed(4)}</span>
                                  </div>
                                )}

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleGetCurrentLocation}
                                  className="w-full"
                                >
                                  <MapPin className="h-4 w-4 mr-2" />
                                  Use My Current GPS Location
                                </Button>
                              </div>

                              {/* Store Images */}
                              <div className="space-y-4 border-t pt-4">
                                <h3 className="font-semibold text-sm">Store Images</h3>
                                
                                {/* Banner Image */}
                                <div className="space-y-2">
                                  <Label htmlFor="banner_image">Store Banner Image *</Label>
                                  <p className="text-xs text-muted-foreground">Recommended size: 1200×300px. Large images are automatically compressed.</p>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      id="banner_image"
                                      type="file"
                                      accept="image/*"
                                      onChange={handleBannerUpload}
                                      disabled={uploadingBanner}
                                      className="flex-1"
                                    />
                                    {uploadingBanner && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
                                  </div>
                                  {applicationData.banner_image_url && (
                                    <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                                      <img src={applicationData.banner_image_url} alt="Banner preview" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                </div>

                                {/* Shop Images */}
                                <div className="space-y-2">
                                  <Label htmlFor="shop_images">Shop Images (Max 5)</Label>
                                  <p className="text-xs text-muted-foreground">Upload photos of your shop or products</p>
                                  <Input
                                    id="shop_images"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleShopImagesUpload}
                                    disabled={uploadingShopImages || applicationData.shop_images.length >= 5}
                                  />
                                  {applicationData.shop_images.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                      {applicationData.shop_images.map((url, index) => (
                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border group">
                                          <img src={url} alt={`Shop ${index + 1}`} className="w-full h-full object-cover" />
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveShopImage(index)}
                                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Trade License */}
                              <div className="space-y-4 border-t pt-4">
                                <h3 className="font-semibold text-sm">Verification Documents</h3>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="trade_license">Trade License *</Label>
                                  <p className="text-xs text-muted-foreground">Upload your business license or registration document (image or PDF)</p>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      id="trade_license"
                                      type="file"
                                      accept="image/*,application/pdf"
                                      onChange={handleLicenseUpload}
                                      disabled={uploadingLicense}
                                      className="flex-1"
                                    />
                                    {uploadingLicense && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
                                  </div>
                                  {applicationData.trade_license_url && (
                                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                      <FileText className="h-4 w-4" />
                                      <span className="text-sm">License uploaded</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Social Media Links */}
                              <div className="space-y-4 border-t pt-4">
                                <h3 className="font-semibold text-sm">Social Media Links (Optional)</h3>
                                <p className="text-xs text-muted-foreground">Add your social media profiles to increase trust with buyers</p>

                                <div className="space-y-2">
                                  <Label htmlFor="app_youtube_url" className="flex items-center gap-2">
                                    <Youtube className="h-4 w-4 text-red-500" /> YouTube Channel
                                  </Label>
                                  <Input
                                    id="app_youtube_url"
                                    value={applicationData.youtube_url}
                                    onChange={(e) => setApplicationData({ ...applicationData, youtube_url: e.target.value })}
                                    placeholder="https://youtube.com/@yourchannel"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="app_facebook_url" className="flex items-center gap-2">
                                    <Facebook className="h-4 w-4 text-blue-500" /> Facebook Page
                                  </Label>
                                  <Input
                                    id="app_facebook_url"
                                    value={applicationData.facebook_url}
                                    onChange={(e) => setApplicationData({ ...applicationData, facebook_url: e.target.value })}
                                    placeholder="https://facebook.com/yourpage"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="app_instagram_url" className="flex items-center gap-2">
                                    <Instagram className="h-4 w-4 text-pink-500" /> Instagram Profile
                                  </Label>
                                  <Input
                                    id="app_instagram_url"
                                    value={applicationData.instagram_url}
                                    onChange={(e) => setApplicationData({ ...applicationData, instagram_url: e.target.value })}
                                    placeholder="https://instagram.com/yourprofile"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 pt-4">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setApplyDialogOpen(false)}
                                  disabled={saving}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={saving || uploadingBanner || uploadingShopImages || uploadingLicense} className="flex-1">
                                  {saving ? 'Submitting...' : 'Submit Application'}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>

                        {/* Edit & Resubmit Dialog is rendered in the sellerApplication block below */}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-lg border-2 ${
                          sellerApplication.status === 'pending' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                          sellerApplication.status === 'approved' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
                          'border-red-500 bg-red-50 dark:bg-red-950/20'
                        }`}>
                          <div className="flex items-center gap-3 mb-3">
                            {sellerApplication.status === 'pending' && (
                              <>
                                <Clock className="h-6 w-6 text-yellow-600" />
                                <div>
                                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                                    Application Pending
                                  </h3>
                                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    Your application is under review
                                  </p>
                                </div>
                              </>
                            )}
                            {sellerApplication.status === 'approved' && (
                              <>
                                <CheckCircle className="h-6 w-6 text-green-600" />
                                <div>
                                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                                    Application Approved
                                  </h3>
                                  <p className="text-sm text-green-700 dark:text-green-300">
                                    Congratulations! You are now a seller
                                  </p>
                                </div>
                              </>
                            )}
                            {sellerApplication.status === 'rejected' && (
                              <>
                                <XCircle className="h-6 w-6 text-red-600" />
                                <div>
                                  <h3 className="font-semibold text-red-900 dark:text-red-100">
                                    Application Rejected
                                  </h3>
                                  <p className="text-sm text-red-700 dark:text-red-300">
                                    Your application was not approved
                                  </p>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Business Name:</span>{' '}
                              {sellerApplication.business_name}
                            </div>
                            {sellerApplication.business_description && (
                              <div>
                                <span className="font-medium">Description:</span>{' '}
                                {sellerApplication.business_description}
                              </div>
                            )}
                            {sellerApplication.admin_notes && (
                              <div className="mt-3 pt-3 border-t">
                                <span className="font-medium">Admin Notes:</span>
                                <p className="mt-1 text-muted-foreground">
                                  {sellerApplication.admin_notes}
                                </p>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-2">
                              Applied on: {new Date(sellerApplication.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {sellerApplication.status === 'approved' && (
                          <Button asChild className="w-full">
                            <Link to="/seller/dashboard">
                              Go to Seller Dashboard
                            </Link>
                          </Button>
                        )}
                        {sellerApplication.status === 'rejected' && (
                          <Button
                            className="w-full"
                            onClick={handleEditApplication}
                          >
                            Edit & Resubmit Application
                          </Button>
                        )}

                        {/* Edit & Resubmit Dialog — must be in the same branch as the button */}
                        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit & Resubmit Application</DialogTitle>
                              <DialogDescription>
                                Update your application details and resubmit for review
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleResubmitApplication} className="space-y-6">
                              {/* Basic Information */}
                              <div className="space-y-4">
                                <h3 className="font-semibold text-sm">Basic Information</h3>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_business_name">Business/Store Name *</Label>
                                  <Input
                                    id="edit_business_name"
                                    value={applicationData.business_name}
                                    onChange={(e) => setApplicationData({ ...applicationData, business_name: e.target.value })}
                                    placeholder="Enter your store name"
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_business_description">Business Description</Label>
                                  <Textarea
                                    id="edit_business_description"
                                    value={applicationData.business_description}
                                    onChange={(e) => setApplicationData({ ...applicationData, business_description: e.target.value })}
                                    placeholder="Tell us about your business and what you plan to sell"
                                    rows={3}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_phone_number">Contact Phone Number</Label>
                                  <Input
                                    id="edit_phone_number"
                                    value={applicationData.phone_number}
                                    onChange={(e) => setApplicationData({ ...applicationData, phone_number: e.target.value })}
                                    placeholder="e.g. 919876543210 (country code + number)"
                                  />
                                </div>
                              </div>

                              {/* Business Type */}
                              <div className="space-y-4 border-t pt-4">
                                <h3 className="font-semibold text-sm">Business Type *</h3>
                                <p className="text-xs text-muted-foreground">Select the type of business you operate</p>
                                <div className="grid grid-cols-1 gap-3">
                                  {([
                                    { value: 'retail', label: 'Retail Only', desc: 'Sell products directly to individual customers' },
                                    { value: 'wholesale', label: 'Wholesale Only', desc: 'Sell products in bulk to businesses and retailers' },
                                    { value: 'both', label: 'Retail & Wholesale', desc: 'Serve both individual customers and bulk buyers' },
                                  ] as const).map((type) => (
                                    <label
                                      key={type.value}
                                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                        applicationData.business_type === type.value
                                          ? 'border-primary bg-primary/5'
                                          : 'border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name="edit_business_type"
                                        value={type.value}
                                        checked={applicationData.business_type === type.value}
                                        onChange={() => setApplicationData({ ...applicationData, business_type: type.value })}
                                        className="mt-1 accent-primary"
                                      />
                                      <div>
                                        <p className="font-medium text-sm">{type.label}</p>
                                        <p className="text-xs text-muted-foreground">{type.desc}</p>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Location */}
                              <div className="space-y-3 border-t pt-4">
                                <h3 className="font-semibold text-sm">Location (City/Region) *</h3>
                                <div className="relative">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Search for your city or location..."
                                      value={appLocationQuery}
                                      onChange={(e) => handleAppLocationSearch(e.target.value)}
                                      className="pl-9"
                                    />
                                    {appSearchingLocation && (
                                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                  </div>
                                  {appShowLocationResults && appLocationResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                      {appLocationResults.map((result) => {
                                        const city = result.address.city || result.address.town || result.address.village || result.address.state || 'Unknown';
                                        return (
                                          <button
                                            key={result.place_id}
                                            type="button"
                                            onClick={() => handleAppSelectLocation(result)}
                                            className="w-full px-3 py-2 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                                          >
                                            <p className="font-medium text-sm">{city}</p>
                                            <p className="text-xs text-muted-foreground truncate">{result.display_name}</p>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">Search above, or select from existing locations below</p>
                                <Select
                                  value={applicationData.location || 'none'}
                                  onValueChange={(value) => setApplicationData({ ...applicationData, location: value === 'none' ? '' : value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Or select from existing locations" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Select a location</SelectItem>
                                    {locations.map((location) => (
                                      <SelectItem key={location.value} value={location.label}>
                                        {location.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {applicationData.latitude && applicationData.longitude && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    <span>GPS: {applicationData.latitude.toFixed(4)}, {applicationData.longitude.toFixed(4)}</span>
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleGetCurrentLocation}
                                  className="w-full"
                                >
                                  <MapPin className="h-4 w-4 mr-2" />
                                  Use My Current GPS Location
                                </Button>
                              </div>

                              {/* Store Images */}
                              <div className="space-y-4 border-t pt-4">
                                <h3 className="font-semibold text-sm">Store Images</h3>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_banner_image">Store Banner Image</Label>
                                  <p className="text-xs text-muted-foreground">Recommended size: 1200×300px. Large images are automatically compressed.</p>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      id="edit_banner_image"
                                      type="file"
                                      accept="image/*"
                                      onChange={handleBannerUpload}
                                      disabled={uploadingBanner}
                                      className="flex-1"
                                    />
                                    {uploadingBanner && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
                                  </div>
                                  {applicationData.banner_image_url && (
                                    <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                                      <img src={applicationData.banner_image_url} alt="Banner preview" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_shop_images">Shop Images (Max 5)</Label>
                                  <p className="text-xs text-muted-foreground">Upload photos of your shop or products</p>
                                  <Input
                                    id="edit_shop_images"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleShopImagesUpload}
                                    disabled={uploadingShopImages || applicationData.shop_images.length >= 5}
                                  />
                                  {applicationData.shop_images.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                      {applicationData.shop_images.map((url, index) => (
                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border group">
                                          <img src={url} alt={`Shop ${index + 1}`} className="w-full h-full object-cover" />
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveShopImage(index)}
                                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Trade License */}
                              <div className="space-y-4 border-t pt-4">
                                <h3 className="font-semibold text-sm">Verification Documents</h3>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_trade_license">Trade License</Label>
                                  <p className="text-xs text-muted-foreground">Upload your business license or registration document (image or PDF)</p>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      id="edit_trade_license"
                                      type="file"
                                      accept="image/*,application/pdf"
                                      onChange={handleLicenseUpload}
                                      disabled={uploadingLicense}
                                      className="flex-1"
                                    />
                                    {uploadingLicense && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
                                  </div>
                                  {applicationData.trade_license_url && (
                                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                      <FileText className="h-4 w-4" />
                                      <span className="text-sm">License uploaded</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Social Media Links */}
                              <div className="space-y-4 border-t pt-4">
                                <h3 className="font-semibold text-sm">Social Media Links (Optional)</h3>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_youtube_url" className="flex items-center gap-2">
                                    <Youtube className="h-4 w-4 text-red-500" /> YouTube Channel
                                  </Label>
                                  <Input
                                    id="edit_youtube_url"
                                    value={applicationData.youtube_url}
                                    onChange={(e) => setApplicationData({ ...applicationData, youtube_url: e.target.value })}
                                    placeholder="https://youtube.com/@yourchannel"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_facebook_url" className="flex items-center gap-2">
                                    <Facebook className="h-4 w-4 text-blue-500" /> Facebook Page
                                  </Label>
                                  <Input
                                    id="edit_facebook_url"
                                    value={applicationData.facebook_url}
                                    onChange={(e) => setApplicationData({ ...applicationData, facebook_url: e.target.value })}
                                    placeholder="https://facebook.com/yourpage"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_instagram_url" className="flex items-center gap-2">
                                    <Instagram className="h-4 w-4 text-pink-500" /> Instagram Profile
                                  </Label>
                                  <Input
                                    id="edit_instagram_url"
                                    value={applicationData.instagram_url}
                                    onChange={(e) => setApplicationData({ ...applicationData, instagram_url: e.target.value })}
                                    placeholder="https://instagram.com/yourprofile"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 pt-4">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setEditDialogOpen(false)}
                                  disabled={saving}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={saving || uploadingBanner || uploadingShopImages || uploadingLicense}
                                  className="flex-1"
                                >
                                  {saving ? 'Resubmitting...' : 'Resubmit for Review'}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following">
            <Card>
              <CardHeader>
                <CardTitle>Following</CardTitle>
                <CardDescription>Sellers you're following</CardDescription>
              </CardHeader>
              <CardContent>
                {following.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">You're not following any sellers yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Follow sellers to stay updated with their listings
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {following.map((follow) => (
                      <Card key={follow.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{follow.following?.full_name}</p>
                              <p className="text-sm text-muted-foreground">{follow.following?.email}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await unfollowSeller(follow.following_id);
                                  setFollowing(following.filter(f => f.id !== follow.id));
                                  toast.success('Unfollowed seller');
                                } catch (error: any) {
                                  toast.error(error.message || 'Failed to unfollow');
                                }
                              }}
                            >
                              Unfollow
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>My Reviews</CardTitle>
                <CardDescription>Reviews you've submitted</CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">You haven't submitted any reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <Link
                            to={`/stores/${review.store_id}`}
                            className="font-semibold hover:text-primary"
                          >
                            {review.store?.name}
                          </Link>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-primary text-primary'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
