import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Upload, X, GripVertical, Check, FolderTree } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  uploadProductImage, 
  deleteProductImage 
} from '@/db/api';
import { CATEGORY_IMAGES } from '@/lib/category-images';
import type { Category, Subcategory } from '@/types';
import AdminNav from '@/components/layouts/AdminNav';
import { compressImage, isImageFile, formatFileSize } from '@/utils/imageCompression';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
    display_order: 0,
  });
  const [subFormData, setSubFormData] = useState({
    name: '',
    category_id: '',
    display_order: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesData, subcategoriesData] = await Promise.all([
        getCategories(),
        getSubcategories()
      ]);
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        image_url: category.image_url || '',
        display_order: category.display_order || 0,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        image_url: '',
        display_order: categories.length,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', image_url: '', display_order: 0 });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      toast.error('Please upload a valid image file');
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

      const url = await uploadProductImage(compressedFile);
      setFormData({ ...formData, image_url: url });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (formData.image_url) {
      try {
        await deleteProductImage(formData.image_url);
        setFormData({ ...formData, image_url: '' });
        toast.success('Image removed');
      } catch (error: any) {
        toast.error(error.message || 'Failed to remove image');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        toast.success('Category updated successfully');
      } else {
        await createCategory(formData);
        toast.success('Category created successfully');
      }
      handleCloseDialog();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category');
    }
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSubcategory) {
        await updateSubcategory(editingSubcategory.id, {
          name: subFormData.name,
          display_order: subFormData.display_order,
        });
        toast.success('Subcategory updated successfully');
      } else {
        await createSubcategory(subFormData);
        toast.success('Subcategory created successfully');
      }
      handleCloseSubDialog();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save subcategory');
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      toast.success('Category deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category');
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    try {
      await deleteSubcategory(subcategoryId);
      toast.success('Subcategory deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete subcategory');
    }
  };

  const handleCloseSubDialog = () => {
    setSubDialogOpen(false);
    setEditingSubcategory(null);
    setSubFormData({
      name: '',
      category_id: '',
      display_order: 0,
    });
  };

  const openSubDialog = (categoryId: string, subcategory?: Subcategory) => {
    if (subcategory) {
      setEditingSubcategory(subcategory);
      setSubFormData({
        name: subcategory.name,
        category_id: subcategory.category_id,
        display_order: subcategory.display_order,
      });
    } else {
      setSubFormData({
        name: '',
        category_id: categoryId,
        display_order: 0,
      });
    }
    setSubDialogOpen(true);
  };

  if (loading) {
    return (
      <>
        <AdminNav />
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 bg-muted" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNav />
      <div className="min-h-screen py-8">
        <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Category Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage product categories with images
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCategory
                      ? 'Update category information'
                      : 'Create a new product category'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Category Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category Image</Label>
                    <Tabs defaultValue="gallery" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="gallery">Select from Gallery</TabsTrigger>
                        <TabsTrigger value="upload">Upload New</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="gallery" className="space-y-4">
                        <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-2">
                          {CATEGORY_IMAGES.map((img) => (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, image_url: img.url })}
                              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                formData.image_url === img.url
                                  ? 'border-primary ring-2 ring-primary'
                                  : 'border-muted hover:border-primary/50'
                              }`}
                            >
                              <img
                                src={img.url}
                                alt={img.name}
                                className="w-full h-full object-cover"
                              />
                              {formData.image_url === img.url && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <Check className="h-8 w-8 text-primary-foreground" />
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                                {img.name}
                              </div>
                            </button>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="upload" className="space-y-4">
                        {formData.image_url ? (
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                            <img
                              src={formData.image_url}
                              alt="Category"
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8"
                              onClick={handleRemoveImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex items-center justify-center cursor-pointer transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={uploading}
                            />
                            <div className="text-center">
                              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">
                                {uploading ? 'Uploading...' : 'Upload Image'}
                              </p>
                            </div>
                          </label>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {editingCategory ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card key={category.id} className="overflow-hidden">
                <div className="aspect-video bg-muted relative">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GripVertical className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{category.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Order: {category.display_order}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Subcategories: {subcategories.filter(sub => sub.category_id === category.id).length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedCategoryForSub(category.id);
                        const categoryElement = document.getElementById(`category-${category.id}`);
                        if (categoryElement) {
                          categoryElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                      }}
                    >
                      <FolderTree className="mr-2 h-4 w-4" />
                      Subs
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenDialog(category)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Category</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this category? Products in this
                            category will have their category unset.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(category.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <GripVertical className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Categories Yet</h2>
              <p className="text-muted-foreground mb-6">
                Start by creating your first product category
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Subcategory Management Section */}
        {selectedCategoryForSub && (
          <div className="mt-12" id={`category-${selectedCategoryForSub}`}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Subcategories for {categories.find(c => c.id === selectedCategoryForSub)?.name}
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      Manage subcategories under this category
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => openSubDialog(selectedCategoryForSub)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Subcategory
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedCategoryForSub('')}>
                      Close
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subcategories
                    .filter(sub => sub.category_id === selectedCategoryForSub)
                    .map((subcategory) => (
                      <Card key={subcategory.id}>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">{subcategory.name}</h3>
                          <p className="text-xs text-muted-foreground mb-4">
                            Order: {subcategory.display_order}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => openSubDialog(selectedCategoryForSub, subcategory)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this subcategory? Products in this
                                    subcategory will have their subcategory unset.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSubcategory(subcategory.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {subcategories.filter(sub => sub.category_id === selectedCategoryForSub).length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No subcategories yet. Click "Add Subcategory" to create one.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subcategory Dialog */}
        <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
                </DialogTitle>
                <DialogDescription>
                  {editingSubcategory
                    ? 'Update subcategory information'
                    : 'Create a new subcategory'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="sub_name">Subcategory Name *</Label>
                  <Input
                    id="sub_name"
                    value={subFormData.name}
                    onChange={(e) => setSubFormData({ ...subFormData, name: e.target.value })}
                    placeholder="e.g., Smartphones, Laptops"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sub_display_order">Display Order</Label>
                  <Input
                    id="sub_display_order"
                    type="number"
                    value={subFormData.display_order}
                    onChange={(e) => setSubFormData({ ...subFormData, display_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower numbers appear first
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseSubDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSubcategory ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </>
  );
}
