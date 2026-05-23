import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, TrendingUp } from 'lucide-react';
import { getAllFeaturedStorePlans, createFeaturedStorePlan, updateFeaturedStorePlan, deleteFeaturedStorePlan } from '@/db/api';
import { toast } from 'sonner';
import type { FeaturedStorePlan, FeaturedStoreTargetType } from '@/types';

export default function AdminFeaturedStorePlansPage() {
  const [plans, setPlans] = useState<FeaturedStorePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FeaturedStorePlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    target_type: 'location' as FeaturedStoreTargetType,
    duration_days: 30,
    price: 0,
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await getAllFeaturedStorePlans();
      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans:', error);
      toast.error('Failed to load pricing plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan?: FeaturedStorePlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        target_type: plan.target_type,
        duration_days: plan.duration_days,
        price: plan.price,
        description: plan.description || '',
        is_active: plan.is_active,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        target_type: 'location',
        duration_days: 30,
        price: 0,
        description: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.price <= 0 || formData.duration_days <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingPlan) {
        await updateFeaturedStorePlan(editingPlan.id, formData);
        toast.success('Plan updated successfully');
      } else {
        await createFeaturedStorePlan(formData);
        toast.success('Plan created successfully');
      }
      setDialogOpen(false);
      await loadPlans();
    } catch (error: any) {
      console.error('Failed to save plan:', error);
      toast.error(error.message || 'Failed to save plan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      await deleteFeaturedStorePlan(id);
      toast.success('Plan deleted successfully');
      await loadPlans();
    } catch (error: any) {
      console.error('Failed to delete plan:', error);
      toast.error(error.message || 'Failed to delete plan');
    }
  };

  const getTargetTypeBadge = (type: FeaturedStoreTargetType) => {
    const variants = {
      location: 'default',
      state: 'secondary',
      nationwide: 'destructive',
    } as const;
    
    const labels = {
      location: 'Location',
      state: 'State Wide',
      nationwide: 'Nationwide',
    };

    return <Badge variant={variants[type]}>{labels[type]}</Badge>;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Featured Store Pricing Plans</h1>
          <p className="text-muted-foreground">
            Manage pricing plans for featured store advertising
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                <DialogDescription>
                  Configure pricing and duration for featured store advertising
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Location Specific - 30 Days"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-type">Target Type *</Label>
                  <Select
                    value={formData.target_type}
                    onValueChange={(value: FeaturedStoreTargetType) =>
                      setFormData({ ...formData, target_type: value })
                    }
                  >
                    <SelectTrigger id="target-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="location">Location Specific</SelectItem>
                      <SelectItem value="state">State Wide</SelectItem>
                      <SelectItem value="nationwide">Nationwide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (Days) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.duration_days}
                      onChange={(e) =>
                        setFormData({ ...formData, duration_days: parseInt(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this plan offers..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is-active" className="cursor-pointer">
                    Active (visible to sellers)
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pricing Plans
          </CardTitle>
          <CardDescription>
            Manage pricing for different advertising scopes and durations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Target Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No pricing plans found. Create your first plan to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{getTargetTypeBadge(plan.target_type)}</TableCell>
                      <TableCell>{plan.duration_days} days</TableCell>
                      <TableCell className="font-semibold">₹{plan.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(plan.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
