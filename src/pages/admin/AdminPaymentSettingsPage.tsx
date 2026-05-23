import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCode, Upload, Save, Trash2 } from 'lucide-react';
import { getPaymentSettings, updatePaymentSettings, supabase } from '@/db/api';
import { toast } from 'sonner';
import type { PaymentSettings } from '@/types';

export default function AdminPaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getPaymentSettings();
      setSettings(data);
      if (data) {
        setUpiId(data.upi_id || '');
        setQrCodeUrl(data.qr_code_url || '');
      }
    } catch (error) {
      console.error('Failed to load payment settings:', error);
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleQrCodeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `payment_qr_${Date.now()}.${fileExt}`;
      const filePath = `payment/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setQrCodeUrl(urlData.publicUrl);
      toast.success('QR code uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload QR code');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveQrCode = () => {
    setQrCodeUrl('');
    toast.success('QR code removed');
  };

  const handleSave = async () => {
    if (!upiId.trim()) {
      toast.error('UPI ID is required');
      return;
    }

    setSaving(true);
    try {
      await updatePaymentSettings({
        upi_id: upiId.trim(),
        qr_code_url: qrCodeUrl || undefined,
      });
      
      toast.success('Payment settings saved successfully');
      await loadSettings();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save payment settings');
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Payment Settings</h1>
          <p className="text-muted-foreground">
            Configure payment QR code and UPI details for customer payments
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Payment Configuration
            </CardTitle>
            <CardDescription>
              Upload a payment QR code and set your UPI ID for receiving payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* UPI ID Field */}
            <div className="space-y-2">
              <Label htmlFor="upi-id">
                Platform UPI ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="upi-id"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This UPI ID will be displayed to customers for making payments
              </p>
            </div>

            {/* QR Code Upload */}
            <div className="space-y-2">
              <Label>Payment QR Code (Optional)</Label>
              
              {qrCodeUrl ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={qrCodeUrl}
                      alt="Payment QR Code"
                      className="w-64 h-64 object-contain border-2 border-border rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveQrCode}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove QR Code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('qr-upload')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Replace QR Code
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a QR code image for customers to scan and make payments
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('qr-upload')?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload QR Code'}
                  </Button>
                </div>
              )}

              <input
                id="qr-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrCodeUpload}
              />
              
              <p className="text-xs text-muted-foreground">
                Recommended: Square image, PNG or JPG format, max 2MB
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSave} disabled={saving || uploading}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {(qrCodeUrl || upiId) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Customer View Preview</CardTitle>
              <CardDescription>
                This is how customers will see the payment information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-6 rounded-lg">
                <h4 className="font-semibold text-sm mb-3">Secure Payment via Platform UPI</h4>
                
                {qrCodeUrl && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Scan QR Code to Pay</p>
                    <img
                      src={qrCodeUrl}
                      alt="Payment QR Code"
                      className="w-48 h-48 object-contain border border-border rounded-lg"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Platform UPI ID</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-background border rounded-md text-sm font-mono">
                      {upiId || 'platform@upi'}
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
