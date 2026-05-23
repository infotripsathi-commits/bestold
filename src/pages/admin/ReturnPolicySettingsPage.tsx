import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plus, Trash2, Save, AlertCircle, Shield } from 'lucide-react';
import {
  getReturnPolicySettings,
  updateGlobalDefaultDays,
  updateCategorySettings,
  updateSellerException,
  removeSellerException,
  updateProductException,
  removeProductException,
  getAllSellers,
  getAllProducts,
  type ReturnPolicySettings,
} from '@/db/returnPolicy';
import { toast } from 'sonner';

const COMMON_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Furniture',
  'Books',
  'Toys',
  'Sports',
  'Home & Garden',
  'Automotive',
  'Jewelry',
  'Other',
];

const RETURN_PERIOD_OPTIONS = [
  { value: 0, label: 'No Returns' },
  { value: 7, label: '7 Days' },
  { value: 14, label: '14 Days' },
  { value: 30, label: '30 Days' },
  { value: 60, label: '60 Days' },
  { value: 90, label: '90 Days' },
];

export default function ReturnPolicySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ReturnPolicySettings | null>(null);
  const [globalDays, setGlobalDays] = useState(7);
  const [categorySettings, setCategorySettings] = useState<Record<string, number>>({});
  const [sellers, setSellers] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; category: string }[]>([]);
  
  // Dialog states
  const [sellerDialogOpen, setSellerDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [exceptionDays, setExceptionDays] = useState(7);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, sellersData, productsData] = await Promise.all([
        getReturnPolicySettings(),
        getAllSellers(),
        getAllProducts(),
      ]);

      if (settingsData) {
        setSettings(settingsData);
        setGlobalDays(settingsData.global_default_days);
        setCategorySettings(settingsData.category_settings || {});
      }
      setSellers(sellersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load return policy settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGlobalDefault = async () => {
    setSaving(true);
    try {
      const success = await updateGlobalDefaultDays(globalDays);
      if (success) {
        toast.success('Global default updated successfully');
        loadData();
      } else {
        toast.error('Failed to update global default');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async (category: string, days: number) => {
    const updated = { ...categorySettings, [category]: days };
    setCategorySettings(updated);
  };

  const handleSaveCategorySettings = async () => {
    setSaving(true);
    try {
      const success = await updateCategorySettings(categorySettings);
      if (success) {
        toast.success('Category settings updated successfully');
        loadData();
      } else {
        toast.error('Failed to update category settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddSellerException = async () => {
    if (!selectedSeller) {
      toast.error('Please select a seller');
      return;
    }

    setSaving(true);
    try {
      const success = await updateSellerException(selectedSeller, exceptionDays);
      if (success) {
        toast.success('Seller exception added successfully');
        setSellerDialogOpen(false);
        setSelectedSeller('');
        setExceptionDays(7);
        loadData();
      } else {
        toast.error('Failed to add seller exception');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSellerException = async (sellerId: string) => {
    setSaving(true);
    try {
      const success = await removeSellerException(sellerId);
      if (success) {
        toast.success('Seller exception removed successfully');
        loadData();
      } else {
        toast.error('Failed to remove seller exception');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddProductException = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    setSaving(true);
    try {
      const success = await updateProductException(selectedProduct, exceptionDays);
      if (success) {
        toast.success('Product exception added successfully');
        setProductDialogOpen(false);
        setSelectedProduct('');
        setExceptionDays(7);
        loadData();
      } else {
        toast.error('Failed to add product exception');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveProductException = async (productId: string) => {
    setSaving(true);
    try {
      const success = await removeProductException(productId);
      if (success) {
        toast.success('Product exception removed successfully');
        loadData();
      } else {
        toast.error('Failed to remove product exception');
      }
    } finally {
      setSaving(false);
    }
  };

  const getSellerName = (sellerId: string) => {
    const seller = sellers.find(s => s.id === sellerId);
    return seller ? `${seller.full_name} (${seller.email})` : sellerId;
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : productId;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-64 mb-8 bg-muted" />
        <div className="grid gap-6">
          <Skeleton className="h-96 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Return Policy Settings</h1>
          <p className="text-muted-foreground">
            Configure return periods for orders and payouts
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          <Shield className="mr-2 h-4 w-4" />
          Admin Only
        </Badge>
      </div>

      <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                How Return Policy Works
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                When an order is delivered, the platform holds the payment for the configured return period. 
                After the return period expires, the funds become available for seller payout. 
                Priority: Product Exception → Seller Exception → Category Setting → Global Default.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="global" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="global">Global Default</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="sellers">Seller Exceptions</TabsTrigger>
          <TabsTrigger value="products">Product Exceptions</TabsTrigger>
        </TabsList>

        {/* Global Default Tab */}
        <TabsContent value="global">
          <Card>
            <CardHeader>
              <CardTitle>Global Default Return Period</CardTitle>
              <CardDescription>
                Default return period applied to all orders unless overridden by category, seller, or product settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="global-days">Return Period (Days)</Label>
                <Select
                  value={globalDays.toString()}
                  onValueChange={(value) => setGlobalDays(parseInt(value))}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RETURN_PERIOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Current: {globalDays === 0 ? 'No returns allowed' : `${globalDays} days`}
                </p>
              </div>
              <Button onClick={handleSaveGlobalDefault} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                Save Global Default
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Category-Specific Return Periods</CardTitle>
              <CardDescription>
                Set different return periods for different product categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {COMMON_CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center gap-4">
                    <Label className="w-40">{category}</Label>
                    <Select
                      value={(categorySettings[category] || globalDays).toString()}
                      onValueChange={(value) => handleUpdateCategory(category, parseInt(value))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RETURN_PERIOD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveCategorySettings} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                Save Category Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seller Exceptions Tab */}
        <TabsContent value="sellers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Seller Exceptions</CardTitle>
                  <CardDescription>
                    Set custom return periods for specific sellers
                  </CardDescription>
                </div>
                <Dialog open={sellerDialogOpen} onOpenChange={setSellerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Exception
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Seller Exception</DialogTitle>
                      <DialogDescription>
                        Set a custom return period for a specific seller
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Seller</Label>
                        <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select seller" />
                          </SelectTrigger>
                          <SelectContent>
                            {sellers.map((seller) => (
                              <SelectItem key={seller.id} value={seller.id}>
                                {seller.full_name} ({seller.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Return Period</Label>
                        <Select
                          value={exceptionDays.toString()}
                          onValueChange={(value) => setExceptionDays(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RETURN_PERIOD_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSellerDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddSellerException} disabled={saving}>
                        Add Exception
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(settings?.seller_exceptions || {}).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No seller exceptions configured
                </div>
              ) : (
                <div className="w-full max-w-full overflow-x-auto bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Seller</TableHead>
                        <TableHead className="whitespace-nowrap">Return Period</TableHead>
                        <TableHead className="whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(settings?.seller_exceptions || {}).map(([sellerId, days]) => (
                        <TableRow key={sellerId}>
                          <TableCell className="whitespace-nowrap">
                            {getSellerName(sellerId)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline">
                              {days === 0 ? 'No Returns' : `${days} days`}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveSellerException(sellerId)}
                              disabled={saving}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Exceptions Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Exceptions</CardTitle>
                  <CardDescription>
                    Set custom return periods for specific products
                  </CardDescription>
                </div>
                <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Exception
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Product Exception</DialogTitle>
                      <DialogDescription>
                        Set a custom return period for a specific product
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Product</Label>
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Return Period</Label>
                        <Select
                          value={exceptionDays.toString()}
                          onValueChange={(value) => setExceptionDays(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RETURN_PERIOD_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddProductException} disabled={saving}>
                        Add Exception
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(settings?.product_exceptions || {}).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No product exceptions configured
                </div>
              ) : (
                <div className="w-full max-w-full overflow-x-auto bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Product</TableHead>
                        <TableHead className="whitespace-nowrap">Return Period</TableHead>
                        <TableHead className="whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(settings?.product_exceptions || {}).map(([productId, days]) => (
                        <TableRow key={productId}>
                          <TableCell className="whitespace-nowrap">
                            {getProductName(productId)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline">
                              {days === 0 ? 'No Returns' : `${days} days`}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveProductException(productId)}
                              disabled={saving}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
