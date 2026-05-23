import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { X, Upload, AlertCircle, Car, Bike, GripVertical, Smartphone } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getStoreByUserId,
  getProduct,
  createProduct,
  updateProduct,
  getCategories,
  getSubcategories,
  uploadProductImage,
  deleteProductImage,
  checkProductLimit,
  getCarBrands,
  getBikeBrands,
  getPhoneBrands,
} from '@/db/api';
import { compressImage, isImageFile, formatFileSize } from '@/utils/imageCompression';
import type { Store, Category, Subcategory, ProductCondition, CarDetails, CarBrand, BikeDetails, BikeBrand, PhoneBrand, PhoneDetails } from '@/types';

const FUEL_OPTIONS = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG'];
const CURRENT_YEAR = new Date().getFullYear();

function isCarCategory(categoryName?: string) {
  if (!categoryName) return false;
  return categoryName.toLowerCase().includes('car');
}

function isBikeCategory(categoryName?: string) {
  if (!categoryName) return false;
  return categoryName.toLowerCase().includes('bike') || categoryName.toLowerCase().includes('motor');
}

function isPhoneCategory(categoryName?: string) {
  if (!categoryName) return false;
  const n = categoryName.toLowerCase();
  return n.includes('mobile') || n.includes('phone') || n.includes('smartphone');
}

function isPhoneAccessorySubcategory(subcategoryName?: string) {
  if (!subcategoryName) return false;
  const n = subcategoryName.toLowerCase();
  return n.includes('accessor') || n.includes('case') || n.includes('charger') || n.includes('cable') || n.includes('screen guard');
}

const DEFAULT_CAR_DETAILS: CarDetails = {
  brand: '',
  year: CURRENT_YEAR,
  fuel: '',
  transmission: 'manual',
  km_driven: 0,
  no_of_owners: undefined,
};

const DEFAULT_BIKE_DETAILS: BikeDetails = {
  brand: '',
  year: CURRENT_YEAR,
  km_driven: 0,
  engine_cc: undefined,
  fuel: '',
  no_of_owners: undefined,
};

const DEFAULT_PHONE_DETAILS: PhoneDetails = {
  brand: '',
  storage: '',
  ram: '',
};

// ── Sortable image thumbnail ──────────────────────────────────────────────────
interface SortableImageItemProps {
  url: string;
  index: number;
  isCover: boolean;
  onRemove: (url: string) => void;
}

function SortableImageItem({ url, index, isCover, onRemove }: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
      <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" draggable={false} />

      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 h-6 w-6 rounded bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(url)}
        className="absolute top-1 right-1 h-6 w-6 rounded bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove image"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Cover badge */}
      {isCover && (
        <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white rounded px-1 py-0.5 leading-none pointer-events-none">
          Cover
        </span>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [carBrands, setCarBrands] = useState<CarBrand[]>([]);
  const [bikeBrands, setBikeBrands] = useState<BikeBrand[]>([]);
  const [phoneBrands, setPhoneBrands] = useState<PhoneBrand[]>([]);
  const [productLimit, setProductLimit] = useState<{ canAdd: boolean; currentCount: number; limit: number; isSubscribed: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeDragUrl, setActiveDragUrl] = useState<string | null>(null);

  // dnd-kit sensors — activate after 8 px movement (avoids accidental drags on tap/click)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragUrl(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragUrl(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFormData((prev) => {
      const oldIndex = prev.images.indexOf(String(active.id));
      const newIndex = prev.images.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      return { ...prev, images: arrayMove(prev.images, oldIndex, newIndex) };
    });
  }, []);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'good' as ProductCondition,
    category_id: '',
    subcategory_id: '',
    images: [] as string[],
  });
  const [carDetails, setCarDetails] = useState<CarDetails>(DEFAULT_CAR_DETAILS);
  const [bikeDetails, setBikeDetails] = useState<BikeDetails>(DEFAULT_BIKE_DETAILS);
  const [phoneDetails, setPhoneDetails] = useState<PhoneDetails>(DEFAULT_PHONE_DETAILS);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, id]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [storeData, categoriesData, subcategoriesData, carBrandsData, bikeBrandsData, phoneBrandsData] = await Promise.all([
        getStoreByUserId(user.id),
        getCategories(),
        getSubcategories(),
        getCarBrands(),
        getBikeBrands(),
        getPhoneBrands(),
      ]);

      setStore(storeData);
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
      setCarBrands(carBrandsData);
      setBikeBrands(bikeBrandsData);
      setPhoneBrands(phoneBrandsData as PhoneBrand[]);

      // Check product limit for new products
      if (!id && storeData) {
        const limitData = await checkProductLimit(storeData.id);
        setProductLimit(limitData);
      }

      if (id) {
        const productData = await getProduct(id);
        if (productData) {
          setFormData({
            title: productData.title,
            description: productData.description || '',
            price: productData.price.toString(),
            condition: productData.condition,
            category_id: productData.category_id || '',
            subcategory_id: productData.subcategory_id || '',
            images: productData.images || [],
          });

          if (productData.car_details) {
            setCarDetails({ ...DEFAULT_CAR_DETAILS, ...productData.car_details });
          }
          if (productData.bike_details) {
            setBikeDetails({ ...DEFAULT_BIKE_DETAILS, ...productData.bike_details });
          }
          if (productData.phone_details) {
            setPhoneDetails({ ...DEFAULT_PHONE_DETAILS, ...productData.phone_details });
          }
          
          // Filter subcategories based on loaded category
          if (productData.category_id) {
            setFilteredSubcategories(
              subcategoriesData.filter(sub => sub.category_id === productData.category_id)
            );
          }
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formData.images.length + files.length > 12) {
      toast.error('Maximum 12 images allowed per product');
      return;
    }

    setUploading(true);
    try {
      const compressedFiles: File[] = [];
      
      // Validate and compress each image
      for (const file of Array.from(files)) {
        // Validate file
        if (!isImageFile(file)) {
          toast.error(`${file.name} is not a valid image file`);
          continue;
        }

        // Show compression progress
        const originalSize = formatFileSize(file.size);
        toast.loading(`Compressing ${file.name} (${originalSize})...`, { id: file.name });

        try {
          // Compress image (auto-converts HEIC/HEIF → JPEG first)
          const compressedFile = await compressImage(file, {
            outputFormat: 'auto', // Auto-detect WebP support
          });

          const compressedSize = formatFileSize(compressedFile.size);
          const savings = Math.round((1 - compressedFile.size / file.size) * 100);
          const format = compressedFile.type === 'image/webp' ? 'WebP' : 'JPEG';

          toast.success(
            `${file.name}: ${originalSize} → ${compressedSize} (${savings}% smaller, ${format})`,
            { id: file.name, duration: 3000 }
          );
          compressedFiles.push(compressedFile);
        } catch (fileError: any) {
          // Dismiss the stuck loading toast and show a per-file error
          toast.error(
            `Failed to process ${file.name}: ${fileError.message || 'unsupported format'}`,
            { id: file.name }
          );
        }
      }

      if (compressedFiles.length === 0) {
        setUploading(false);
        return;
      }

      // Upload compressed images
      const uploadPromises = compressedFiles.map(file => uploadProductImage(file));
      const urls = await Promise.all(uploadPromises);
      setFormData({ ...formData, images: [...formData.images, ...urls] });
      toast.success(`${compressedFiles.length} image(s) uploaded successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      await deleteProductImage(imageUrl);
      setFormData({
        ...formData,
        images: formData.images.filter(img => img !== imageUrl),
      });
      toast.success('Image removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) {
      toast.error('Store not found');
      return;
    }

    const selectedCat = categories.find(c => c.id === formData.category_id);
    const selectedSub = subcategories.find(s => s.id === formData.subcategory_id);
    const isCar = isCarCategory(selectedCat?.name);
    const isBike = isBikeCategory(selectedCat?.name);
    const isPhone = isPhoneCategory(selectedCat?.name) && !isPhoneAccessorySubcategory(selectedSub?.name);

    if (isCar) {
      if (!carDetails.brand.trim()) { toast.error('Brand is required'); return; }
      if (!carDetails.year || carDetails.year < 1900 || carDetails.year > CURRENT_YEAR + 1) {
        toast.error(`Year must be between 1900 and ${CURRENT_YEAR + 1}`); return;
      }
      if (!carDetails.fuel) { toast.error('Fuel type is required'); return; }
      if (!carDetails.km_driven && carDetails.km_driven !== 0) {
        toast.error('KM driven is required'); return;
      }
    }

    if (isBike) {
      if (!bikeDetails.brand.trim()) { toast.error('Brand is required'); return; }
      if (!bikeDetails.year || bikeDetails.year < 1900 || bikeDetails.year > CURRENT_YEAR + 1) {
        toast.error(`Year must be between 1900 and ${CURRENT_YEAR + 1}`); return;
      }
      if (!bikeDetails.km_driven && bikeDetails.km_driven !== 0) {
        toast.error('KM driven is required'); return;
      }
    }

    if (isPhone) {
      if (!phoneDetails.brand.trim()) { toast.error('Brand is required'); return; }
    }

    setSaving(true);
    try {
      const productData = {
        store_id: store.id,
        title: formData.title,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        condition: formData.condition,
        category_id: formData.category_id && formData.category_id !== 'none' ? formData.category_id : undefined,
        subcategory_id: formData.subcategory_id && formData.subcategory_id !== 'none' ? formData.subcategory_id : undefined,
        images: formData.images,
        car_details: isCar ? carDetails : null,
        bike_details: isBike ? bikeDetails : null,
        phone_details: isPhone ? phoneDetails : null,
      };

      if (id) {
        await updateProduct(id, productData);
        toast.success('Product updated successfully');
      } else {
        await createProduct(productData);
        toast.success('Product submitted for approval! Admin will review it shortly.');
      }

      navigate('/seller/products');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container py-8">Loading...</div>;
  }

  if (!store) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground mb-4">Please create a store first</p>
        <Button onClick={() => navigate('/seller/store')}>Create Store</Button>
      </div>
    );
  }

  if (!id && store.approval_status !== 'approved') {
    return (
      <div className="container py-16 text-center max-w-md mx-auto">
        <div className="rounded-full bg-yellow-500/10 p-4 w-fit mx-auto mb-4">
          <svg className="h-10 w-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Store Not Yet Approved</h2>
        <p className="text-muted-foreground mb-6">
          {store.approval_status === 'pending'
            ? "Your store is under review by our admin team. You'll be able to add products once it's approved."
            : 'Your store application was not approved. Please contact support or resubmit your application.'}
        </p>
        <Button variant="outline" onClick={() => navigate('/seller/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const selectedCategoryName = categories.find(c => c.id === formData.category_id)?.name;
  const selectedSubcategoryName = subcategories.find(s => s.id === formData.subcategory_id)?.name;
  const isCar = isCarCategory(selectedCategoryName);
  const isBike = isBikeCategory(selectedCategoryName);
  const isPhone = isPhoneCategory(selectedCategoryName) && !isPhoneAccessorySubcategory(selectedSubcategoryName);

  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container max-w-2xl">
        {/* Product Limit Warning */}
        {!id && productLimit && !productLimit.canAdd && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Product Limit Reached</p>
              <p className="text-sm mb-3">
                You have reached the maximum limit of {productLimit.limit} products.
                You currently have {productLimit.currentCount} active products.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{id ? 'Edit Product' : 'Add New Product'}</CardTitle>
              {isCar && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  Cars
                </Badge>
              )}
              {isBike && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Bike className="h-3 w-3" />
                  Bikes
                </Badge>
              )}
              {isPhone && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  Mobiles
                </Badge>
              )}
            </div>
            <CardDescription>
              {id ? 'Update product information' : 'Add a new product to your store'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Category — first so car fields appear contextually */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, category_id: value, subcategory_id: '' });
                    setFilteredSubcategories(
                      subcategories.filter(sub => sub.category_id === value)
                    );
                    // Reset category-specific details when category changes
                    setCarDetails(DEFAULT_CAR_DETAILS);
                    setBikeDetails(DEFAULT_BIKE_DETAILS);
                    setPhoneDetails(DEFAULT_PHONE_DETAILS);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.category_id && filteredSubcategories.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory (Optional)</Label>
                  <Select
                    value={formData.subcategory_id}
                    onValueChange={(value) => setFormData({ ...formData, subcategory_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No subcategory</SelectItem>
                      {filteredSubcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* ── Car-specific fields ── */}
              {isCar && (
                <div className="space-y-6 rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Car Details</span>
                    <span className="text-xs text-muted-foreground ml-auto">* Required</span>
                  </div>

                  {/* Brand */}
                  <div className="space-y-2">
                    <Label htmlFor="car-brand">Brand *</Label>
                    <Select
                      value={carDetails.brand}
                      onValueChange={(value) => setCarDetails({ ...carDetails, brand: value })}
                    >
                      <SelectTrigger id="car-brand">
                        <SelectValue placeholder="Select car brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {carBrands.length === 0 ? (
                          <SelectItem value="__none__" disabled>No brands available</SelectItem>
                        ) : (
                          carBrands.map((b) => (
                            <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Year */}
                  <div className="space-y-2">
                    <Label htmlFor="car-year">Year *</Label>
                    <Input
                      id="car-year"
                      type="number"
                      min={1900}
                      max={CURRENT_YEAR + 1}
                      placeholder={`e.g. ${CURRENT_YEAR}`}
                      value={carDetails.year || ''}
                      onChange={(e) => setCarDetails({ ...carDetails, year: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  {/* Fuel */}
                  <div className="space-y-2">
                    <Label htmlFor="car-fuel">Fuel *</Label>
                    <Select
                      value={carDetails.fuel}
                      onValueChange={(value) => setCarDetails({ ...carDetails, fuel: value })}
                    >
                      <SelectTrigger id="car-fuel">
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_OPTIONS.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Transmission */}
                  <div className="space-y-2">
                    <Label>Transmission</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['automatic', 'manual'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setCarDetails({ ...carDetails, transmission: t })}
                          className={`h-12 rounded-lg border-2 text-sm font-medium capitalize transition-colors ${
                            carDetails.transmission === t
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background text-foreground hover:border-primary/50'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* KM Driven */}
                  <div className="space-y-1">
                    <Label htmlFor="car-km">KM Driven *</Label>
                    <Input
                      id="car-km"
                      type="number"
                      min={0}
                      maxLength={6}
                      placeholder="e.g. 45000"
                      value={carDetails.km_driven || ''}
                      onChange={(e) => {
                        const val = e.target.value.slice(0, 6);
                        setCarDetails({ ...carDetails, km_driven: parseInt(val) || 0 });
                      }}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {String(carDetails.km_driven || '').length}/6
                    </p>
                  </div>

                  {/* No. of Owners */}
                  <div className="space-y-2">
                    <Label htmlFor="car-owners">No. of Owners</Label>
                    <Input
                      id="car-owners"
                      type="number"
                      min={1}
                      max={10}
                      placeholder="e.g. 1"
                      value={carDetails.no_of_owners || ''}
                      onChange={(e) => setCarDetails({ ...carDetails, no_of_owners: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                </div>
              )}

              {/* ── Bike-specific fields ── */}
              {isBike && (
                <div className="space-y-6 rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bike className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Bike Details</span>
                    <span className="text-xs text-muted-foreground ml-auto">* Required</span>
                  </div>

                  {/* Brand */}
                  <div className="space-y-2">
                    <Label htmlFor="bike-brand">Brand *</Label>
                    <Select
                      value={bikeDetails.brand}
                      onValueChange={(value) => setBikeDetails({ ...bikeDetails, brand: value })}
                    >
                      <SelectTrigger id="bike-brand">
                        <SelectValue placeholder="Select bike brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {bikeBrands.length === 0 ? (
                          <SelectItem value="__none__" disabled>No brands available</SelectItem>
                        ) : (
                          bikeBrands.map((b) => (
                            <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Year */}
                  <div className="space-y-2">
                    <Label htmlFor="bike-year">Year *</Label>
                    <Input
                      id="bike-year"
                      type="number"
                      min={1900}
                      max={CURRENT_YEAR + 1}
                      placeholder={`e.g. ${CURRENT_YEAR}`}
                      value={bikeDetails.year || ''}
                      onChange={(e) => setBikeDetails({ ...bikeDetails, year: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  {/* KM Driven */}
                  <div className="space-y-1">
                    <Label htmlFor="bike-km">KM Driven *</Label>
                    <Input
                      id="bike-km"
                      type="number"
                      min={0}
                      placeholder="e.g. 12000"
                      value={bikeDetails.km_driven || ''}
                      onChange={(e) => {
                        const val = e.target.value.slice(0, 6);
                        setBikeDetails({ ...bikeDetails, km_driven: parseInt(val) || 0 });
                      }}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {String(bikeDetails.km_driven || '').length}/6
                    </p>
                  </div>

                  {/* Engine CC */}
                  <div className="space-y-2">
                    <Label htmlFor="bike-cc">Engine CC</Label>
                    <Input
                      id="bike-cc"
                      type="number"
                      min={50}
                      max={2500}
                      placeholder="e.g. 150"
                      value={bikeDetails.engine_cc || ''}
                      onChange={(e) => setBikeDetails({ ...bikeDetails, engine_cc: parseInt(e.target.value) || undefined })}
                    />
                  </div>

                  {/* Fuel */}
                  <div className="space-y-2">
                    <Label htmlFor="bike-fuel">Fuel</Label>
                    <Select
                      value={bikeDetails.fuel || ''}
                      onValueChange={(value) => setBikeDetails({ ...bikeDetails, fuel: value })}
                    >
                      <SelectTrigger id="bike-fuel">
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_OPTIONS.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* No. of Owners */}
                  <div className="space-y-2">
                    <Label htmlFor="bike-owners">No. of Owners</Label>
                    <Input
                      id="bike-owners"
                      type="number"
                      min={1}
                      max={10}
                      placeholder="e.g. 1"
                      value={bikeDetails.no_of_owners || ''}
                      onChange={(e) => setBikeDetails({ ...bikeDetails, no_of_owners: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                </div>
              )}

              {/* ── Phone-specific fields ── */}
              {isPhone && (
                <div className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Mobile Details</span>
                    <span className="text-xs text-muted-foreground ml-auto">* Required</span>
                  </div>

                  {/* Brand */}
                  <div className="space-y-2">
                    <Label htmlFor="phone-brand">Brand *</Label>
                    <Select
                      value={phoneDetails.brand}
                      onValueChange={(value) => setPhoneDetails({ ...phoneDetails, brand: value })}
                    >
                      <SelectTrigger id="phone-brand">
                        <SelectValue placeholder="Select phone brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {phoneBrands.length === 0 ? (
                          <SelectItem value="__none__" disabled>No brands available</SelectItem>
                        ) : (
                          phoneBrands.map((b) => (
                            <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Storage & RAM side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="phone-storage">Storage</Label>
                      <Select
                        value={phoneDetails.storage || ''}
                        onValueChange={(value) => setPhoneDetails({ ...phoneDetails, storage: value })}
                      >
                        <SelectTrigger id="phone-storage">
                          <SelectValue placeholder="e.g. 128 GB" />
                        </SelectTrigger>
                        <SelectContent>
                          {['8 GB', '16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone-ram">RAM</Label>
                      <Select
                        value={phoneDetails.ram || ''}
                        onValueChange={(value) => setPhoneDetails({ ...phoneDetails, ram: value })}
                      >
                        <SelectTrigger id="phone-ram">
                          <SelectValue placeholder="e.g. 8 GB" />
                        </SelectTrigger>
                        <SelectContent>
                          {['1 GB', '2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB'].map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Ad title / general title */}
              <div className="space-y-1">
                <Label htmlFor="title">{(isCar || isBike || isPhone) ? 'Ad title *' : 'Title *'}</Label>
                {(isCar || isBike || isPhone) && (
                  <p className="text-xs text-muted-foreground">
                    Mention the key features of your item (e.g. brand, model, age, type)
                  </p>
                )}
                <div className="relative">
                  <Input
                    id="title"
                    value={formData.title}
                    maxLength={(isCar || isBike || isPhone) ? 70 : undefined}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    disabled={!id && !!productLimit && !productLimit.canAdd}
                  />
                  {(isCar || isBike || isPhone) && (
                    <span className="absolute right-2 bottom-2 text-xs text-muted-foreground pointer-events-none">
                      {formData.title.length}/70
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label htmlFor="description">{(isCar || isBike || isPhone) ? 'Describe what you are selling *' : 'Description'}</Label>
                {(isCar || isBike || isPhone) && (
                  <p className="text-xs text-muted-foreground">
                    Include condition, features and reason for selling
                  </p>
                )}
                <div className="relative">
                  <Textarea
                    id="description"
                    value={formData.description}
                    maxLength={(isCar || isBike || isPhone) ? 4096 : undefined}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={(isCar || isBike || isPhone) ? 5 : 4}
                    required={(isCar || isBike || isPhone)}
                    disabled={!id && !!productLimit && !productLimit.canAdd}
                  />
                  {(isCar || isBike || isPhone) && (
                    <span className="absolute right-2 bottom-2 text-xs text-muted-foreground pointer-events-none">
                      {formData.description.length}/4096
                    </span>
                  )}
                </div>
              </div>

              {/* Price & Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    placeholder="Enter price in INR"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition *</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) =>
                      setFormData({ ...formData, condition: value as ProductCondition })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like_new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Images (Max 12)</Label>
                  <span className="text-xs text-muted-foreground">{formData.images.length}/12</span>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={formData.images} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {formData.images.map((image, index) => (
                        <SortableImageItem
                          key={image}
                          url={image}
                          index={index}
                          isCover={index === 0}
                          onRemove={handleRemoveImage}
                        />
                      ))}

                      {/* Upload slot — always last, outside sortable items */}
                      {formData.images.length < 12 && (
                        <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex items-center justify-center cursor-pointer transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploading}
                          />
                          <div className="text-center">
                            <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                            <p className="text-xs text-muted-foreground">
                              {uploading ? 'Uploading...' : 'Add photo'}
                            </p>
                          </div>
                        </label>
                      )}
                    </div>
                  </SortableContext>

                  {/* Drag overlay — shows a floating copy of the dragged image */}
                  <DragOverlay>
                    {activeDragUrl && (
                      <div className="aspect-square rounded-lg overflow-hidden shadow-2xl ring-2 ring-primary w-24 h-24">
                        <img src={activeDragUrl} alt="Dragging" className="w-full h-full object-cover" draggable={false} />
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>

                <p className="text-xs text-muted-foreground">
                  Drag photos to reorder · First image is the cover photo.
                </p>
              </div>

              {(isCar || isBike || isPhone) && (
                <p className="text-xs text-muted-foreground">* Required Fields</p>
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={saving || uploading || (!id && !!productLimit && !productLimit.canAdd)}
                  className="flex-1"
                >
                  {saving ? 'Saving...' : id ? 'Update Product' : 'Create Product'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/seller/products')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
