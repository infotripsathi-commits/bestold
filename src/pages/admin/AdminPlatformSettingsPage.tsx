import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Settings, IndianRupee, Percent, ShoppingCart, Save } from 'lucide-react';
import { getAllPlatformSettings, updatePlatformSetting, type PlatformSetting } from '@/db/api';

export default function AdminPlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getAllPlatformSettings();
      setSettings(data);
      
      // Initialize form data
      const initialData: Record<string, string> = {};
      data.forEach(setting => {
        initialData[setting.key] = setting.value;
      });
      setFormData(initialData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    try {
      setSaving(true);
      const value = formData[key];
      
      // Validate numeric values
      if (['delivery_charge', 'platform_fee_percentage', 'min_order_amount'].includes(key)) {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          toast.error('Please enter a valid positive number');
          return;
        }
      }

      await updatePlatformSetting(key, value);
      toast.success('Setting updated successfully');
      loadSettings(); // Reload to get updated timestamp
    } catch (error: any) {
      toast.error(error.message || 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const getSettingIcon = (key: string) => {
    switch (key) {
      case 'delivery_charge':
        return <ShoppingCart className="h-5 w-5 text-primary" />;
      case 'platform_fee_percentage':
        return <Percent className="h-5 w-5 text-primary" />;
      case 'min_order_amount':
        return <IndianRupee className="h-5 w-5 text-primary" />;
      default:
        return <Settings className="h-5 w-5 text-primary" />;
    }
  };

  const getSettingLabel = (key: string) => {
    switch (key) {
      case 'delivery_charge':
        return 'Delivery Charge (₹)';
      case 'platform_fee_percentage':
        return 'Platform Fee (%)';
      case 'min_order_amount':
        return 'Minimum Order Amount (₹)';
      default:
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2 bg-muted" />
          <Skeleton className="h-4 w-96 bg-muted" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Platform Settings</h1>
        <p className="text-muted-foreground">
          Configure platform-wide settings and pricing
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settings.map(setting => (
          <Card key={setting.id} className="h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                {getSettingIcon(setting.key)}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    {getSettingLabel(setting.key)}
                  </CardTitle>
                  {setting.description && (
                    <CardDescription className="mt-1">
                      {setting.description}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={setting.key}>Value</Label>
                <Input
                  id={setting.key}
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData[setting.key] || ''}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="text-lg font-semibold"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Last updated: {new Date(setting.updated_at).toLocaleDateString()}
                </span>
              </div>

              <Button
                onClick={() => handleSave(setting.key)}
                disabled={saving || formData[setting.key] === setting.value}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>About Platform Settings</CardTitle>
          <CardDescription>
            Important information about these settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Delivery Charge
            </h3>
            <p className="text-sm text-muted-foreground">
              This is the standard delivery fee added to all orders. Customers will see this charge at checkout.
              The delivery charge is added on top of the product price.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Platform Fee
            </h3>
            <p className="text-sm text-muted-foreground">
              Percentage fee charged on each transaction. This fee is deducted from the seller's earnings.
              For example, a 2% fee on a ₹1000 order means ₹20 goes to the platform.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Minimum Order Amount
            </h3>
            <p className="text-sm text-muted-foreground">
              The minimum order value required to place an order. Orders below this amount will not be allowed.
              This helps ensure viable transactions for both buyers and sellers.
            </p>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-medium text-primary">
              ⚠️ Important: Changes to these settings take effect immediately for all new orders.
              Existing orders are not affected.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
