import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Save } from 'lucide-react';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@/db/notifications';
import { toast } from 'sonner';

const NOTIFICATION_TYPES = [
  {
    key: 'return_period_adjustment_enabled' as keyof NotificationPreferences,
    label: 'Return Period Adjustments',
    description: 'Get notified when new return period adjustment suggestions are generated',
  },
  {
    key: 'payout_request_enabled' as keyof NotificationPreferences,
    label: 'Payout Requests',
    description: 'Get notified when sellers submit new payout requests',
  },
  {
    key: 'order_update_enabled' as keyof NotificationPreferences,
    label: 'Order Updates',
    description: 'Get notified about important order status changes',
  },
  {
    key: 'system_enabled' as keyof NotificationPreferences,
    label: 'System Notifications',
    description: 'Get notified about system updates and maintenance',
  },
];

export default function NotificationPreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const data = await getNotificationPreferences();
      setPreferences(data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const success = await updateNotificationPreferences(preferences);
      if (success) {
        toast.success('Notification preferences saved successfully');
      } else {
        toast.error('Failed to save preferences');
      }
    } finally {
      setSaving(false);
    }
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

  if (!preferences) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Failed to load notification preferences
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notification Preferences</h1>
          <p className="text-muted-foreground">
            Manage your in-app notification settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          Save Preferences
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Types
          </CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {NOTIFICATION_TYPES.map((type) => (
            <div
              key={type.key}
              className="flex items-start justify-between gap-4 pb-6 border-b last:border-b-0 last:pb-0"
            >
              <div className="flex-1">
                <Label htmlFor={type.key} className="text-base font-medium cursor-pointer">
                  {type.label}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {type.description}
                </p>
              </div>
              <Switch
                id={type.key}
                checked={preferences[type.key] as boolean}
                onCheckedChange={() => handleToggle(type.key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Notifications appear in the notification bell icon in the header
          </p>
          <p>
            • You'll see a badge with the count of unread notifications
          </p>
          <p>
            • Click on a notification to mark it as read and navigate to the relevant page
          </p>
          <p>
            • Use "Mark all read" to clear all unread notifications at once
          </p>
          <p>
            • Notifications are delivered in real-time when you're logged in
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
