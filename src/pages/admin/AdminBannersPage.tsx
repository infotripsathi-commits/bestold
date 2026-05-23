import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { getAllBanners, createBanner, updateBanner, deleteBanner } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { StoreBanner, Store } from '@/types';
import { toast } from 'sonner';
import { compressImage, isImageFile, formatFileSize } from '@/utils/imageCompression';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<StoreBanner[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<StoreBanner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    store_id: '',
    banner_image_url: '',
    title: '',
    description: '',
    display_order: 0,
    is_active: true,
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bannersData, storesData] = await Promise.all([
        getAllBanners(),
        loadStores(),
      ]);
      setBanners(bannersData);
      setStores(storesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name');

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      toast.error('Please upload a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB before compression');
      return;
    }

    setUploading(true);
    try {
      // Show compression message
      toast.info(`Compressing image (${formatFileSize(file.size)})...`);

      // Compress image to 80KB max with WebP support for 92% compression
      const compressedFile = await compressImage(file, {
        maxSizeMB: 0.08, // 80KB max for 92% compression
        maxWidthOrHeight: 1920,
        outputFormat: 'auto', // Auto-detect WebP support
      });

      // Show compression result
      const format = compressedFile.type === 'image/webp' ? 'WebP' : 'JPEG';
      toast.success(
        `Image compressed from ${formatFileSize(file.size)} to ${formatFileSize(compressedFile.size)} (${format})`
      );

      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData({ ...formData, banner_image_url: urlData.publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.store_id || !formData.banner_image_url) {
      toast.error('Store and banner image are required');
      return;
    }

    try {
      if (editingBanner) {
        const updated = await updateBanner(editingBanner.id, formData);
        setBanners(banners.map(b => b.id === updated.id ? updated : b));
        toast.success('Banner updated successfully');
      } else {
        const created = await createBanner(formData);
        setBanners([created, ...banners]);
        toast.success('Banner created successfully');
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save banner');
    }
  };

  const handleEdit = (banner: StoreBanner) => {
    setEditingBanner(banner);
    setFormData({
      store_id: banner.store_id,
      banner_image_url: banner.banner_image_url,
      title: banner.title || '',
      description: banner.description || '',
      display_order: banner.display_order,
      is_active: banner.is_active,
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      await deleteBanner(bannerId);
      setBanners(banners.filter(b => b.id !== bannerId));
      toast.success('Banner deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete banner');
    }
  };

  const resetForm = () => {
    setFormData({
      store_id: '',
      banner_image_url: '',
      title: '',
      description: '',
      display_order: 0,
      is_active: true,
      start_date: '',
      end_date: '',
    });
    setEditingBanner(null);
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Store Banners</h1>
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Store Banners</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</DialogTitle>
                <DialogDescription>
                  Create advertising banners for featured stores
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store_id">Store *</Label>
                  <Select
                    value={formData.store_id}
                    onValueChange={(value) => setFormData({ ...formData, store_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner_image">Banner Image *</Label>
                  <Input
                    id="banner_image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {formData.banner_image_url && (
                    <div className="mt-2">
                      <img
                        src={formData.banner_image_url}
                        alt="Banner preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Banner title (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Banner description (optional)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="is_active">Active</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is_active" className="cursor-pointer">
                        {formData.is_active ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? 'Uploading...' : editingBanner ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {banners.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground mb-4">No banners yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {banners.map((banner) => (
              <Card key={banner.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {banner.store?.name}
                        {banner.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Order: {banner.display_order}
                        {banner.start_date && ` • Starts: ${new Date(banner.start_date).toLocaleDateString()}`}
                        {banner.end_date && ` • Ends: ${new Date(banner.end_date).toLocaleDateString()}`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(banner)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(banner.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="aspect-[21/6] rounded-lg overflow-hidden">
                      <img
                        src={banner.banner_image_url}
                        alt={banner.title || banner.store?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {banner.title && (
                      <h3 className="font-semibold text-lg">{banner.title}</h3>
                    )}
                    {banner.description && (
                      <p className="text-sm text-muted-foreground">{banner.description}</p>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/stores/${banner.store_id}`}>
                        View Store
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
