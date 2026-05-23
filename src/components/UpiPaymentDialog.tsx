import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, Smartphone, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import QRCodeDataUrl from './ui/qrcodedataurl';

interface UpiPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  paymentData: {
    promotionId: string;
    orderReference: string;
    upiId: string;
    upiPayeeName: string;
    amount: number;
    upiLink: string;
    qrCodeData: string;
  };
}

export default function UpiPaymentDialog({ open, onClose, paymentData }: UpiPaymentDialogProps) {
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(paymentData.upiId);
    setCopied(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayNow = () => {
    // Open UPI link in new window (will trigger UPI apps on mobile)
    window.location.href = paymentData.upiLink;
  };

  const handleSubmitProof = async () => {
    if (!upiTransactionId.trim()) {
      toast.error('Please enter UPI Transaction ID');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-upi-proof', {
        body: {
          promotionId: paymentData.promotionId,
          upiTransactionId: upiTransactionId.trim(),
        },
      });

      if (error) {
        const errorMsg = await error?.context?.text();
        throw new Error(errorMsg || error.message);
      }

      if (data?.success) {
        toast.success('Payment proof submitted successfully! We will verify within 24 hours.');
        onClose();
      } else {
        throw new Error(data?.error || 'Failed to submit payment proof');
      }
    } catch (error: any) {
      console.error('Submit proof error:', error);
      toast.error(error.message || 'Failed to submit payment proof');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Complete UPI Payment
          </DialogTitle>
          <DialogDescription>
            Pay ₹{paymentData.amount.toFixed(2)} using any UPI app
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Reference */}
          <Alert>
            <AlertDescription>
              <div className="text-sm">
                <strong>Order Reference:</strong> {paymentData.orderReference}
              </div>
            </AlertDescription>
          </Alert>

          {/* QR Code */}
          <Card>
            <CardContent className="pt-6 flex flex-col items-center">
              <div className="mb-4">
                <QRCodeDataUrl text={paymentData.qrCodeData} width={200} />
              </div>
              <p className="text-sm text-muted-foreground text-center mb-3">
                Scan this QR code with any UPI app
              </p>
              <Button onClick={handlePayNow} className="w-full" size="lg">
                <Smartphone className="mr-2 h-4 w-4" />
                Pay with UPI App
              </Button>
            </CardContent>
          </Card>

          {/* UPI ID */}
          <div className="space-y-2">
            <Label>Or pay manually to this UPI ID:</Label>
            <div className="flex gap-2">
              <Input value={paymentData.upiId} readOnly className="font-mono" />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyUpiId}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Payee: {paymentData.upiPayeeName}
            </p>
          </div>

          {/* Amount */}
          <div className="bg-primary/5 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Amount to Pay:</span>
              <span className="text-2xl font-bold text-primary">
                ₹{paymentData.amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Transaction ID Input */}
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="txnId">
              After payment, enter UPI Transaction ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="txnId"
              value={upiTransactionId}
              onChange={(e) => setUpiTransactionId(e.target.value)}
              placeholder="e.g., 123456789012"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              You can find this in your UPI app's transaction history
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmitProof}
            disabled={submitting || !upiTransactionId.trim()}
            className="w-full"
            size="lg"
          >
            {submitting ? 'Submitting...' : 'Submit Payment Proof'}
          </Button>

          <Alert>
            <AlertDescription className="text-xs">
              Your payment will be verified by our admin within 24 hours. You will receive a notification once your store is promoted.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
