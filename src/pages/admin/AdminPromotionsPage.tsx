import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Tag, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  getPromotionCoupons,
  createPromotionCoupon,
  updatePromotionCoupon,
  deletePromotionCoupon,
  getStorePromotions,
  updatePromotionStatus,
} from '@/db/api';
import type { PromotionCoupon, StorePromotion } from '@/types';

export default function AdminPromotionsPage() {
  const [coupons, setCoupons] = useState<PromotionCoupon[]>([]);
  const [promotions, setPromotions] = useState<StorePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<PromotionCoupon | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [couponsData, promotionsData] = await Promise.all([
        getPromotionCoupons(),
        getStorePromotions(),
      ]);
      setCoupons(couponsData);
      setPromotions(promotionsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || !discountValue || !validFrom || !validUntil) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingCoupon) {
        await updatePromotionCoupon(editingCoupon.id, {
          discount_value: parseFloat(discountValue),
          valid_until: validUntil,
          usage_limit: usageLimit ? parseInt(usageLimit) : undefined,
        });
        toast.success('Coupon updated successfully');
      } else {
        await createPromotionCoupon({
          code,
          discount_type: discountType,
          discount_value: parseFloat(discountValue),
          valid_from: validFrom,
          valid_until: validUntil,
          usage_limit: usageLimit ? parseInt(usageLimit) : undefined,
        });
        toast.success('Coupon created successfully');
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save coupon');
    }
  };

  const handleEdit = (coupon: PromotionCoupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discount_type);
    setDiscountValue(coupon.discount_value.toString());
    setValidFrom(coupon.valid_from.split('T')[0]);
    setValidUntil(coupon.valid_until.split('T')[0]);
    setUsageLimit(coupon.usage_limit?.toString() || '');
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await deletePromotionCoupon(id);
      toast.success('Coupon deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete coupon');
    }
  };

  const handleToggleActive = async (coupon: PromotionCoupon) => {
    try {
      await updatePromotionCoupon(coupon.id, { active: !coupon.active });
      toast.success(`Coupon ${coupon.active ? 'deactivated' : 'activated'}`);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update coupon');
    }
  };

  const handlePromotionStatusChange = async (promotionId: string, status: 'active' | 'cancelled') => {
    try {
      await updatePromotionStatus(promotionId, status);
      toast.success(`Promotion ${status === 'active' ? 'activated' : 'cancelled'}`);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update promotion');
    }
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setValidFrom('');
    setValidUntil('');
    setUsageLimit('');
  };

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Store Promotions Management</h1>
        <p className="text-muted-foreground">Manage promotion coupons and store promotions</p>
      </div>

      <Tabs defaultValue="coupons">
        <TabsList>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="promotions">Active Promotions</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Promotion Coupons
                  </CardTitle>
                  <CardDescription>Create and manage discount coupons for store promotions</CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Coupon
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
                      <DialogDescription>
                        {editingCoupon ? 'Update coupon details' : 'Create a discount coupon for store promotions'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="code">Coupon Code *</Label>
                        <Input
                          id="code"
                          value={code}
                          onChange={(e) => setCode(e.target.value.toUpperCase())}
                          placeholder="SAVE20"
                          disabled={!!editingCoupon}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="discountType">Discount Type *</Label>
                          <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)} disabled={!!editingCoupon}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="discountValue">
                            {discountType === 'percentage' ? 'Percentage (%)' : 'Amount ($)'} *
                          </Label>
                          <Input
                            id="discountValue"
                            type="number"
                            step="0.01"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="validFrom">Valid From *</Label>
                          <Input
                            id="validFrom"
                            type="date"
                            value={validFrom}
                            onChange={(e) => setValidFrom(e.target.value)}
                            disabled={!!editingCoupon}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="validUntil">Valid Until *</Label>
                          <Input
                            id="validUntil"
                            type="date"
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="usageLimit">Usage Limit (Optional)</Label>
                        <Input
                          id="usageLimit"
                          type="number"
                          value={usageLimit}
                          onChange={(e) => setUsageLimit(e.target.value)}
                          placeholder="Leave empty for unlimited"
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                      <TableCell>
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}%`
                          : `$${coupon.discount_value}`}
                      </TableCell>
                      <TableCell>{new Date(coupon.valid_until).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {coupon.used_count} / {coupon.usage_limit || '∞'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.active ? 'default' : 'secondary'}>
                          {coupon.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(coupon)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant={coupon.active ? 'secondary' : 'default'}
                            onClick={() => handleToggleActive(coupon)}
                          >
                            {coupon.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(coupon.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Active Store Promotions
              </CardTitle>
              <CardDescription>Manage and monitor store promotion campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell className="font-medium">{promotion.store?.name || 'N/A'}</TableCell>
                      <TableCell>{promotion.duration_days} days</TableCell>
                      <TableCell>₹{promotion.final_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            promotion.status === 'active'
                              ? 'default'
                              : promotion.status === 'pending'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {promotion.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            promotion.payment_status === 'completed'
                              ? 'default'
                              : promotion.payment_status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {promotion.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {promotion.end_date ? new Date(promotion.end_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {promotion.status === 'pending' && promotion.payment_status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handlePromotionStatusChange(promotion.id, 'active')}
                          >
                            Activate
                          </Button>
                        )}
                        {promotion.status === 'active' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handlePromotionStatusChange(promotion.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
