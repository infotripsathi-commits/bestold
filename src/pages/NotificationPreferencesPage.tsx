import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Bell, BellRing, Mail, Wallet, Package, Megaphone, ArrowLeft,
  MessageSquare, ShoppingBag, SmartphoneIcon, CheckCircle, XCircle, AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { getNotificationPreferences, updateNotificationPreferences, updatePushPreferences } from '@/db/api';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

interface EmailPreferences {
  order_updates: boolean;
  payout_notifications: boolean;
  return_reminders: boolean;
  promotional_emails: boolean;
}

interface PushPrefs {
  push_new_messages: boolean;
  push_order_updates: boolean;
  push_new_orders: boolean;
  push_return_requests: boolean;
}

// ─── Push Notification Card ──────────────────────────────────────────────────
function PushNotificationCard({ isSeller }: { isSeller: boolean }) {
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();
  const [pushPrefs, setPushPrefs] = useState<PushPrefs>({
    push_new_messages: true,
    push_order_updates: true,
    push_new_orders: true,
    push_return_requests: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (ok) {
      toast.success('Push notifications enabled! You\'ll be notified about messages and orders.');
    } else if (permission === 'denied') {
      toast.error('Notifications are blocked. Please allow them in your browser settings.');
    } else {
      toast.error('Could not enable push notifications. Please try again.');
    }
  };

  const handleUnsubscribe = async () => {
    await unsubscribe();
    toast.info('Push notifications disabled.');
  };

  const handlePrefToggle = async (key: keyof PushPrefs) => {
    const updated = { ...pushPrefs, [key]: !pushPrefs[key] };
    setPushPrefs(updated);
    setSavingPrefs(true);
    try {
      await updatePushPreferences(updated);
    } catch {
      toast.error('Failed to update push preferences');
      setPushPrefs(pushPrefs); // rollback
    } finally {
      setSavingPrefs(false);
    }
  };

  const statusBadge = () => {
    if (permission === 'unsupported') {
      return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" />Not supported</Badge>;
    }
    if (permission === 'denied') {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Blocked</Badge>;
    }
    if (isSubscribed) {
      return <Badge className="gap-1 bg-primary"><CheckCircle className="h-3 w-3" />Active</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><BellRing className="h-3 w-3" />Not enabled</Badge>;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <SmartphoneIcon className="h-5 w-5 text-primary" />
            Push Notifications
          </CardTitle>
          {statusBadge()}
        </div>
        <CardDescription>
          Receive instant notifications on your device — even when the app is closed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {permission === 'unsupported' ? (
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <AlertCircle className="inline h-4 w-4 mr-1.5 align-text-bottom" />
            Push notifications are not supported in this browser. Try Chrome, Edge, or Samsung Internet.
          </div>
        ) : permission === 'denied' ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
            <p className="text-sm font-medium text-destructive">Notifications are blocked</p>
            <p className="text-sm text-muted-foreground">
              To enable push notifications, click the lock icon in your browser&apos;s address bar and
              allow notifications for this site, then refresh the page.
            </p>
          </div>
        ) : isSubscribed ? (
          <>
            {/* Per-type toggles */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <Label htmlFor="push_messages" className="font-semibold cursor-pointer">
                      New Messages
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Get notified when someone sends you a message</p>
                </div>
                <Switch
                  id="push_messages"
                  checked={pushPrefs.push_new_messages}
                  onCheckedChange={() => handlePrefToggle('push_new_messages')}
                  disabled={savingPrefs}
                />
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    <Label htmlFor="push_orders" className="font-semibold cursor-pointer">
                      Order Updates
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Get notified when your order status changes</p>
                </div>
                <Switch
                  id="push_orders"
                  checked={pushPrefs.push_order_updates}
                  onCheckedChange={() => handlePrefToggle('push_order_updates')}
                  disabled={savingPrefs}
                />
              </div>

              {/* Seller-only toggles */}
              {isSeller && (
                <>
                  <Separator />
                  <div className="pt-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      Seller Alerts
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <ShoppingBag className="h-4 w-4 text-primary" />
                            <Label htmlFor="push_new_orders" className="font-semibold cursor-pointer">
                              New Orders
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Get notified the moment a buyer places an order in your store
                          </p>
                        </div>
                        <Switch
                          id="push_new_orders"
                          checked={pushPrefs.push_new_orders}
                          onCheckedChange={() => handlePrefToggle('push_new_orders')}
                          disabled={savingPrefs}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <RotateCcw className="h-4 w-4 text-primary" />
                            <Label htmlFor="push_return_requests" className="font-semibold cursor-pointer">
                              Return Requests
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Get notified when a buyer requests a return on one of your orders
                          </p>
                        </div>
                        <Switch
                          id="push_return_requests"
                          checked={pushPrefs.push_return_requests}
                          onCheckedChange={() => handlePrefToggle('push_return_requests')}
                          disabled={savingPrefs}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4 pt-1">
              <p className="text-sm text-muted-foreground">Push notifications are active on this device</p>
              <Button variant="outline" size="sm" onClick={handleUnsubscribe} disabled={isLoading}>
                Disable
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">What you&apos;ll receive:</p>
              <ul className="space-y-2">
                {[
                  { icon: MessageSquare, text: 'Instant alerts when buyers or sellers message you' },
                  { icon: ShoppingBag, text: 'Order confirmations, shipping & delivery updates' },
                  ...(isSeller ? [
                    { icon: ShoppingBag, text: 'New order alerts the moment a buyer checks out' },
                    { icon: RotateCcw, text: 'Return request alerts so you can respond quickly' },
                  ] : []),
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <Button className="w-full" onClick={handleSubscribe} disabled={isLoading}>
              <BellRing className="h-4 w-4 mr-2" />
              {isLoading ? 'Enabling…' : 'Enable Push Notifications'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You can turn these off at any time
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function NotificationPreferencesPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<EmailPreferences>({
    order_updates: true,
    payout_notifications: true,
    return_reminders: true,
    promotional_emails: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadPreferences();
  }, [user, navigate]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await getNotificationPreferences();
      setPreferences({
        order_updates: data.order_updates,
        payout_notifications: data.payout_notifications,
        return_reminders: data.return_reminders,
        promotional_emails: data.promotional_emails,
      });
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof EmailPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateNotificationPreferences(preferences);
      toast.success('Email preferences saved');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <Skeleton className="h-8 w-64 mb-8" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-balance">Notification Preferences</h1>
          <p className="text-muted-foreground">
            Manage how BESTOLD notifies you about messages, orders, and updates.
          </p>
        </div>

        <div className="space-y-6">
          {/* ── Push Notifications ── */}
          <PushNotificationCard isSeller={profile?.role === 'seller' || profile?.role === 'admin'} />

          {/* ── Email Notifications ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Control which email notifications you receive from BESTOLD
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-5 w-5 text-primary" />
                    <Label htmlFor="order_updates" className="text-base font-semibold cursor-pointer">
                      Order Updates
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive emails when your order status changes (confirmed, shipped, delivered)
                  </p>
                </div>
                <Switch
                  id="order_updates"
                  checked={preferences.order_updates}
                  onCheckedChange={() => handleToggle('order_updates')}
                />
              </div>

              <Separator />

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-5 w-5 text-primary" />
                    <Label htmlFor="payout_notifications" className="text-base font-semibold cursor-pointer">
                      Payout Notifications
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get notified when payouts become eligible and when they are released
                  </p>
                </div>
                <Switch
                  id="payout_notifications"
                  checked={preferences.payout_notifications}
                  onCheckedChange={() => handleToggle('payout_notifications')}
                />
              </div>

              <Separator />

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-5 w-5 text-primary" />
                    <Label htmlFor="return_reminders" className="text-base font-semibold cursor-pointer">
                      Return Period Reminders
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders when return periods are about to expire
                  </p>
                </div>
                <Switch
                  id="return_reminders"
                  checked={preferences.return_reminders}
                  onCheckedChange={() => handleToggle('return_reminders')}
                />
              </div>

              <Separator />

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Megaphone className="h-5 w-5 text-primary" />
                    <Label htmlFor="promotional_emails" className="text-base font-semibold cursor-pointer">
                      Promotional Emails
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features, special offers, and announcements
                  </p>
                </div>
                <Switch
                  id="promotional_emails"
                  checked={preferences.promotional_emails}
                  onCheckedChange={() => handleToggle('promotional_emails')}
                />
              </div>

              <Separator />

              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={saving} size="lg">
                  {saving ? 'Saving...' : 'Save Email Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Critical security and account notifications are always sent
                regardless of your preferences to ensure account safety.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
