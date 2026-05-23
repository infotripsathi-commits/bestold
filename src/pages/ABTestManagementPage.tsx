import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Play, Pause, CheckCircle, Trash2, BarChart3, FlaskConical } from 'lucide-react';
import { getABTests, createABTest, updateABTestStatus, deleteABTest, type ABTest } from '@/db/abTesting';
import { getProductsByStore } from '@/db/api';
import type { Product } from '@/types';
import { toast } from 'sonner';

export default function ABTestManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<ABTest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [testName, setTestName] = useState('');
  const [testType, setTestType] = useState<'title' | 'description' | 'price' | 'images' | 'combined'>('title');
  const [controlTitle, setControlTitle] = useState('');
  const [controlDescription, setControlDescription] = useState('');
  const [controlPrice, setControlPrice] = useState('');
  const [variantATitle, setVariantATitle] = useState('');
  const [variantADescription, setVariantADescription] = useState('');
  const [variantAPrice, setVariantAPrice] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [testsData, productsData] = await Promise.all([
        getABTests(),
        getProductsByStore('', 100), // Get all products for the seller
      ]);
      setTests(testsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load A/B tests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async () => {
    if (!selectedProduct || !testName) {
      toast.error('Please fill in all required fields');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    setCreating(true);
    try {
      const variants = [
        {
          variant_name: 'Control',
          is_control: true,
          title: controlTitle || product.title,
          description: controlDescription || product.description,
          price: controlPrice ? parseFloat(controlPrice) : product.price,
          images: product.images,
        },
        {
          variant_name: 'Variant A',
          is_control: false,
          title: variantATitle || product.title,
          description: variantADescription || product.description,
          price: variantAPrice ? parseFloat(variantAPrice) : product.price,
          images: product.images,
        },
      ];

      const test = await createABTest(selectedProduct, testName, testType, variants);

      if (test) {
        toast.success('A/B test created successfully');
        setCreateDialogOpen(false);
        resetForm();
        loadData();
      } else {
        toast.error('Failed to create A/B test');
      }
    } catch (error) {
      console.error('Failed to create test:', error);
      toast.error('Failed to create A/B test');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct('');
    setTestName('');
    setTestType('title');
    setControlTitle('');
    setControlDescription('');
    setControlPrice('');
    setVariantATitle('');
    setVariantADescription('');
    setVariantAPrice('');
  };

  const handleStatusChange = async (testId: string, newStatus: ABTest['status']) => {
    const success = await updateABTestStatus(testId, newStatus);
    if (success) {
      toast.success(`Test ${newStatus}`);
      loadData();
    } else {
      toast.error('Failed to update test status');
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    const success = await deleteABTest(testId);
    if (success) {
      toast.success('Test deleted');
      loadData();
    } else {
      toast.error('Failed to delete test');
    }
  };

  const getStatusBadge = (status: ABTest['status']) => {
    const variants: Record<ABTest['status'], 'default' | 'secondary' | 'outline'> = {
      draft: 'outline',
      active: 'default',
      paused: 'secondary',
      completed: 'secondary',
    };
    return <Badge variant={variants[status]} className="capitalize">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-64 mb-8 bg-muted" />
        <div className="grid gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">A/B Testing</h1>
          <p className="text-muted-foreground">
            Test different product variants to optimize your listings
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create A/B Test</DialogTitle>
              <DialogDescription>
                Test different versions of your product to see which performs better
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testName">Test Name *</Label>
                <Input
                  id="testName"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g., Title Optimization Test"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="testType">Test Type</Label>
                <Select value={testType} onValueChange={(value: any) => setTestType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="combined">Combined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Control (Original)</h3>
                {(testType === 'title' || testType === 'combined') && (
                  <div className="space-y-2 mb-3">
                    <Label htmlFor="controlTitle">Title</Label>
                    <Input
                      id="controlTitle"
                      value={controlTitle}
                      onChange={(e) => setControlTitle(e.target.value)}
                      placeholder="Leave empty to use original"
                    />
                  </div>
                )}
                {(testType === 'description' || testType === 'combined') && (
                  <div className="space-y-2 mb-3">
                    <Label htmlFor="controlDescription">Description</Label>
                    <Textarea
                      id="controlDescription"
                      value={controlDescription}
                      onChange={(e) => setControlDescription(e.target.value)}
                      placeholder="Leave empty to use original"
                      rows={3}
                    />
                  </div>
                )}
                {(testType === 'price' || testType === 'combined') && (
                  <div className="space-y-2">
                    <Label htmlFor="controlPrice">Price (₹)</Label>
                    <Input
                      id="controlPrice"
                      type="number"
                      value={controlPrice}
                      onChange={(e) => setControlPrice(e.target.value)}
                      placeholder="Leave empty to use original"
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Variant A</h3>
                {(testType === 'title' || testType === 'combined') && (
                  <div className="space-y-2 mb-3">
                    <Label htmlFor="variantATitle">Title *</Label>
                    <Input
                      id="variantATitle"
                      value={variantATitle}
                      onChange={(e) => setVariantATitle(e.target.value)}
                      placeholder="Enter variant title"
                    />
                  </div>
                )}
                {(testType === 'description' || testType === 'combined') && (
                  <div className="space-y-2 mb-3">
                    <Label htmlFor="variantADescription">Description *</Label>
                    <Textarea
                      id="variantADescription"
                      value={variantADescription}
                      onChange={(e) => setVariantADescription(e.target.value)}
                      placeholder="Enter variant description"
                      rows={3}
                    />
                  </div>
                )}
                {(testType === 'price' || testType === 'combined') && (
                  <div className="space-y-2">
                    <Label htmlFor="variantAPrice">Price (₹) *</Label>
                    <Input
                      id="variantAPrice"
                      type="number"
                      value={variantAPrice}
                      onChange={(e) => setVariantAPrice(e.target.value)}
                      placeholder="Enter variant price"
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTest} disabled={creating}>
                {creating ? 'Creating...' : 'Create Test'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FlaskConical className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No A/B Tests Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first A/B test to start optimizing your product listings
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {tests.map(test => (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{test.test_name}</CardTitle>
                      {getStatusBadge(test.status)}
                    </div>
                    <CardDescription>
                      Testing: {test.test_type} • Created {new Date(test.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {test.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(test.id, 'active')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {test.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(test.id, 'paused')}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(test.id, 'completed')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      </>
                    )}
                    {test.status === 'paused' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(test.id, 'active')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <Link to={`/seller/ab-tests/${test.id}/results`}>
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Results
                      </Link>
                    </Button>
                    {test.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTest(test.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
