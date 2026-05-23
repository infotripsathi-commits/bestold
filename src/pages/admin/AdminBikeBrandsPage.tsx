import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Bike } from 'lucide-react';
import { getAllBikeBrands, createBikeBrand, updateBikeBrand, deleteBikeBrand } from '@/db/api';
import type { BikeBrand } from '@/types';

export default function AdminBikeBrandsPage() {
  const [brands, setBrands] = useState<BikeBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BikeBrand | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', display_order: 0, is_active: true });

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const data = await getAllBikeBrands();
      setBrands(data);
    } catch {
      toast.error('Failed to load bike brands');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingBrand(null);
    setFormData({ name: '', display_order: brands.length + 1, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (brand: BikeBrand) => {
    setEditingBrand(brand);
    setFormData({ name: brand.name, display_order: brand.display_order, is_active: brand.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Brand name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingBrand) {
        await updateBikeBrand(editingBrand.id, formData);
        toast.success('Brand updated');
      } else {
        await createBikeBrand(formData);
        toast.success('Brand created');
      }
      setDialogOpen(false);
      loadBrands();
    } catch {
      toast.error('Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brand: BikeBrand) => {
    try {
      await deleteBikeBrand(brand.id);
      toast.success(`"${brand.name}" deleted`);
      loadBrands();
    } catch {
      toast.error('Failed to delete brand');
    }
  };

  const handleToggleActive = async (brand: BikeBrand) => {
    try {
      await updateBikeBrand(brand.id, { is_active: !brand.is_active });
      setBrands(brands.map(b => b.id === brand.id ? { ...b, is_active: !b.is_active } : b));
    } catch {
      toast.error('Failed to update brand status');
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bike className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Bike Brands</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Manage bike brands available for sellers to select when listing a bike.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Brand
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Bike Brands</CardTitle>
          <CardDescription>
            {brands.length} brand{brands.length !== 1 ? 's' : ''} total ·{' '}
            {brands.filter(b => b.is_active).length} active
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : brands.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bike className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No bike brands yet. Add your first brand.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{brand.name}</span>
                      {!brand.is_active && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Order: {brand.display_order}</p>
                  </div>
                  <Switch
                    checked={brand.is_active}
                    onCheckedChange={() => handleToggleActive(brand)}
                    aria-label="Toggle active"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => openEdit(brand)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{brand.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this bike brand. Existing listings that used this brand will keep their stored value.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(brand)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Edit Bike Brand' : 'Add Bike Brand'}</DialogTitle>
            <DialogDescription>
              {editingBrand
                ? 'Update brand details.'
                : 'Add a new bike brand for sellers to choose from.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name *</Label>
              <Input
                id="brand-name"
                placeholder="e.g. Hero, Honda, Royal Enfield"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-order">Display Order</Label>
              <Input
                id="brand-order"
                type="number"
                min={0}
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">Lower number = appears first in the list.</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="brand-active" className="cursor-pointer">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive brands won't appear in seller forms.
                </p>
              </div>
              <Switch
                id="brand-active"
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingBrand ? 'Save Changes' : 'Add Brand'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
