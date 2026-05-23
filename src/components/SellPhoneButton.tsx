import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Smartphone, Upload, X, MapPin, Navigation, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getPhoneBrands, 
  getPhoneModelsByBrand, 
  getPhoneConditions, 
  getPhoneAgeOptions,
  getPhoneVariants,
  createPhoneSubmission,
  getSiteSetting,
  getLocations
} from '@/db/api';
import { supabase } from '@/db/supabase';
import type { PhoneBrand, PhoneModel, PhoneCondition, PhoneAgeOption, PhoneVariant, Location } from '@/types';

interface ImageUpload {
  file: File | null;
  preview: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
}

interface SellPhoneButtonProps {
  trigger?: React.ReactNode;
}

export default function SellPhoneButton({ trigger }: SellPhoneButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  
  // Form data
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedAge, setSelectedAge] = useState('');
  const [images, setImages] = useState<ImageUpload[]>(Array(6).fill({ file: null, preview: '' }));
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  
  // Options
  const [brands, setBrands] = useState<PhoneBrand[]>([]);
  const [models, setModels] = useState<PhoneModel[]>([]);
  const [variants, setVariants] = useState<PhoneVariant[]>([]);
  const [conditions, setConditions] = useState<PhoneCondition[]>([]);
  const [ageOptions, setAgeOptions] = useState<PhoneAgeOption[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Filter locations to only show those with pickup available
  const pickupLocations = locations.filter(loc => loc.phone_pickup_available && loc.is_active);

  useEffect(() => {
    if (open) {
      loadOptions();
      loadWhatsAppNumber();
    }
  }, [open]);

  useEffect(() => {
    if (selectedBrand) {
      loadModels(selectedBrand);
      setSelectedModel('');
    }
  }, [selectedBrand]);

  const loadOptions = async () => {
    try {
      const [brandsData, variantsData, conditionsData, ageOptionsData, locationsData] = await Promise.all([
        getPhoneBrands(),
        getPhoneVariants(),
        getPhoneConditions(),
        getPhoneAgeOptions(),
        getLocations(),
      ]);
      setBrands(brandsData);
      setVariants(variantsData);
      setConditions(conditionsData);
      setAgeOptions(ageOptionsData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Failed to load options:', error);
      toast.error('Failed to load form options');
    }
  };

  const loadModels = async (brandId: string) => {
    try {
      const modelsData = await getPhoneModelsByBrand(brandId);
      setModels(modelsData);
    } catch (error) {
      console.error('Failed to load models:', error);
      toast.error('Failed to load phone models');
    }
  };

  const loadWhatsAppNumber = async () => {
    try {
      const setting = await getSiteSetting('whatsapp_number');
      if (setting?.value) {
        setWhatsappNumber(setting.value);
      }
    } catch (error) {
      console.error('Failed to load WhatsApp number:', error);
    }
  };

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    toast.info('Detecting your location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
              },
            }
          );
          
          const data = await response.json();
          
          const locationData: LocationData = {
            latitude,
            longitude,
            address: data.display_name || 'Unknown address',
            city: data.address?.city || data.address?.town || data.address?.village || 'Unknown city',
            country: data.address?.country || 'Unknown country',
          };
          
          setLocation(locationData);
          toast.success('Location detected successfully!');
        } catch (error) {
          console.error('Failed to get address:', error);
          // Still save coordinates even if reverse geocoding fails
          setLocation({
            latitude,
            longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            city: 'Unknown',
            country: 'Unknown',
          });
          toast.success('Location detected (coordinates only)');
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setDetectingLocation(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location permission denied. Please enable location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information unavailable.');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out.');
            break;
          default:
            toast.error('Failed to detect location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const newImages = [...images];
    newImages[index] = {
      file,
      preview: URL.createObjectURL(file)
    };
    setImages(newImages);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    if (newImages[index].preview) {
      URL.revokeObjectURL(newImages[index].preview);
    }
    newImages[index] = { file: null, preview: '' };
    setImages(newImages);
  };

  const uploadImage = async (file: File, fileName: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `phone-submissions/${Date.now()}-${fileName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('phone-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('phone-images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const sendToWhatsApp = (data: {
    brandName: string;
    modelName: string;
    variantName?: string;
    conditionName: string;
    ageName: string;
    imageUrls: string[];
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    submissionId?: string;
  }) => {
    const imageLabels = ['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom'];
    
    // Message 1: Main details
    const mainMessage = `🔔 *New Phone Submission*

📱 *Phone Details*
• Brand: ${data.brandName}
• Model: ${data.modelName}${data.variantName ? `\n• Variant: ${data.variantName}` : ''}
• Condition: ${data.conditionName}
• Age: ${data.ageName}

👤 *Customer Contact*
• Name: ${data.customerName || 'Not provided'}
• Phone: ${data.customerPhone || 'Not provided'}
• Email: ${data.customerEmail || 'Not provided'}

📸 *Images*: ${data.imageUrls.length} photo(s) uploaded
🆔 ID: ${data.submissionId || 'N/A'}
⏰ ${new Date().toLocaleString()}

_Image links will be sent in next messages..._`;

    const encodedMainMessage = encodeURIComponent(mainMessage);
    const mainWhatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMainMessage}`;
    
    // Open main message
    window.open(mainWhatsappUrl, '_blank');
    
    // Send images in batches (2 images per message to avoid URL length limits)
    const batchSize = 2;
    const batches = [];
    
    for (let i = 0; i < data.imageUrls.length; i += batchSize) {
      const batchUrls = data.imageUrls.slice(i, i + batchSize);
      const batchMessages = batchUrls.map((url, index) => {
        const globalIndex = i + index;
        return `📷 *${imageLabels[globalIndex]}*\n${url}`;
      }).join('\n\n');
      batches.push(batchMessages);
    }
    
    // Send each batch with a delay
    batches.forEach((batchMessage, index) => {
      setTimeout(() => {
        const encodedBatchMessage = encodeURIComponent(batchMessage);
        const batchWhatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedBatchMessage}`;
        window.open(batchWhatsappUrl, '_blank');
      }, (index + 1) * 2000); // 2 second delay between each batch
    });
    
    // Show info toast
    toast.info(`Opening ${batches.length + 1} WhatsApp windows with all details and images`, {
      duration: 5000,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if pickup locations are available
    if (pickupLocations.length === 0) {
      toast.error('Phone pickup service is currently unavailable. Please check back later.');
      return;
    }

    // Validation
    if (!selectedBrand || !selectedModel || !selectedCondition || !selectedAge) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check location (mandatory - either GPS or dropdown)
    if (!location && !selectedLocationId) {
      toast.error('Please select your location or detect using GPS');
      return;
    }

    // Check if at least one image is uploaded
    const uploadedImages = images.filter(img => img.file !== null);
    if (uploadedImages.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    if (!customerPhone || customerPhone.trim() === '') {
      toast.error('Please provide your phone number');
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      // Upload images
      toast.info(`Uploading ${uploadedImages.length} image(s)...`);
      const imageUrls: string[] = [];
      
      for (let i = 0; i < images.length; i++) {
        if (images[i].file) {
          const url = await uploadImage(images[i].file!, `image-${i + 1}`);
          imageUrls.push(url);
        }
      }

      // Get selected option names
      const brandName = brands.find(b => b.id === selectedBrand)?.name || '';
      const modelName = models.find(m => m.id === selectedModel)?.name || '';
      const variantName = selectedVariant ? variants.find(v => v.id === selectedVariant)?.name : undefined;
      const conditionName = conditions.find(c => c.id === selectedCondition)?.name || '';
      const ageName = ageOptions.find(a => a.id === selectedAge)?.name || '';

      // Save to database with location
      const submission = await createPhoneSubmission({
        brand_name: brandName,
        model_name: modelName,
        variant_name: variantName,
        condition_name: conditionName,
        age_name: ageName,
        front_image_url: imageUrls[0] || '',
        back_image_url: imageUrls[1] || '',
        image_1_url: imageUrls[0],
        image_2_url: imageUrls[1],
        image_3_url: imageUrls[2],
        image_4_url: imageUrls[3],
        image_5_url: imageUrls[4],
        image_6_url: imageUrls[5],
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        latitude: location?.latitude,
        longitude: location?.longitude,
        location_address: location?.address,
        location_city: location?.city || (selectedLocationId ? locations.find(l => l.id === selectedLocationId)?.label : undefined),
        location_country: location?.country,
      });

      // Send to WhatsApp
      sendToWhatsApp({
        brandName,
        modelName,
        variantName,
        conditionName,
        ageName,
        imageUrls,
        customerName,
        customerPhone,
        customerEmail,
        submissionId: submission.id,
      });

      toast.success('Phone details submitted successfully! Redirecting to chat...');
      
      // Automatically redirect to chat page with admin
      setTimeout(() => {
        window.location.href = `/phone-submission-chat/${submission.id}`;
      }, 1500);
      
      // Reset form
      setSelectedBrand('');
      setSelectedModel('');
      setSelectedVariant('');
      setSelectedCondition('');
      setSelectedAge('');
      setImages(Array(6).fill({ file: null, preview: '' }));
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setOpen(false);
    } catch (error: any) {
      console.error('Failed to submit phone details:', error);
      toast.error(error.message || 'Failed to submit phone details');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const imageLabels = ['Front', 'Back', 'Left Side', 'Right Side', 'Top', 'Bottom'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="gap-2">
            <Smartphone className="h-5 w-5" />
            Sell Your Phone
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Sell Your Phone
          </DialogTitle>
          <DialogDescription>
            Fill in the details below and we'll get back to you with the best offer
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Brand Selection */}
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger id="brand">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Select 
                value={selectedModel} 
                onValueChange={setSelectedModel}
                disabled={!selectedBrand || models.length === 0}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder={selectedBrand ? "Select model" : "Select brand first"} />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Variant Selection */}
            <div className="space-y-2">
              <Label htmlFor="variant">Variant (RAM/Storage)</Label>
              <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                <SelectTrigger id="variant">
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Condition Selection */}
            <div className="space-y-2">
              <Label htmlFor="condition">Condition *</Label>
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((condition) => (
                    <SelectItem key={condition.id} value={condition.id}>
                      <div>
                        <div className="font-medium">{condition.name}</div>
                        {condition.description && (
                          <div className="text-xs text-muted-foreground">{condition.description}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Age Selection */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="age">How Old *</Label>
              <Select value={selectedAge} onValueChange={setSelectedAge}>
                <SelectTrigger id="age">
                  <SelectValue placeholder="Select age" />
                </SelectTrigger>
                <SelectContent>
                  {ageOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image Uploads - 6 images */}
          <div className="space-y-3">
            <Label>Phone Images * (Upload at least 1 image, up to 6)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div key={index} className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{imageLabels[index]}</Label>
                  {image.preview ? (
                    <div className="relative">
                      <img 
                        src={image.preview} 
                        alt={`${imageLabels[index]} preview`} 
                        className="w-full h-32 object-cover rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(e, index)}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Location Selection - MANDATORY */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Your Location *
            </h3>
            
            <div className="space-y-3">
              {/* Location Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="location">Select Pickup Location</Label>
                <p className="text-xs text-muted-foreground">
                  We currently offer phone pickup service in the following locations. Please select your location to proceed.
                </p>
                <Select 
                  value={selectedLocationId} 
                  onValueChange={(value) => {
                    setSelectedLocationId(value);
                    // Clear GPS location when dropdown is used
                    if (value) {
                      setLocation(null);
                    }
                  }}
                  disabled={pickupLocations.length === 0}
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder={
                      pickupLocations.length === 0 
                        ? "No pickup locations available" 
                        : "Select your location"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {pickupLocations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pickupLocations.length === 0 && (
                  <p className="text-xs text-destructive">
                    Phone pickup service is currently unavailable. Please check back later.
                  </p>
                )}
              </div>

              {/* OR Divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t"></div>
                <span className="text-sm text-muted-foreground">OR</span>
                <div className="flex-1 border-t"></div>
              </div>

              {/* GPS Detection Button */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    // Clear dropdown selection when GPS is used
                    setSelectedLocationId('');
                    handleDetectLocation();
                  }}
                  disabled={detectingLocation}
                  className="flex-1 h-12"
                  variant={location ? "outline" : "default"}
                >
                  {detectingLocation ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Detecting Location...
                    </>
                  ) : location ? (
                    <>
                      <Navigation className="h-5 w-5 mr-2" />
                      Update GPS Location
                    </>
                  ) : (
                    <>
                      <Navigation className="h-5 w-5 mr-2" />
                      Detect My Location (GPS)
                    </>
                  )}
                </Button>
              </div>

              {location && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">
                        {location.city}, {location.country}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        {location.address}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!location && !selectedLocationId && (
                <p className="text-sm text-muted-foreground">
                  📍 Please select your location from the dropdown or detect using GPS.
                </p>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Your Contact Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Name</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Your phone number"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Your email address"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {uploading ? 'Uploading...' : loading ? 'Submitting...' : 'SUBMIT'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
