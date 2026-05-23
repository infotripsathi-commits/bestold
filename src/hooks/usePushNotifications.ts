import { useState, useEffect, useCallback } from 'react';
import { savePushSubscription, deletePushSubscription, updatePushPreferences } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export interface UsePushNotificationsReturn {
  permission: PushPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<void>;
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check current state on mount
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission as PushPermission);

    if (!user) return;

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      (reg as unknown as { pushManager: PushManager }).pushManager
        .getSubscription()
        .then((sub: PushSubscription | null) => {
          setIsSubscribed(!!sub);
        });
    });
  }, [user]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    setIsLoading(true);
    try {
      // 1. Request permission
      const result = await Notification.requestPermission();
      setPermission(result as PushPermission);
      if (result !== 'granted') return false;

      // 2. Wait for service worker
      const registration = await navigator.serviceWorker.ready;
      const pm = (registration as unknown as { pushManager: PushManager }).pushManager;

      // 3. Subscribe to push
      const subscription = await pm.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      // 4. Save to Supabase
      await savePushSubscription(subscription);
      await updatePushPreferences({ push_enabled: true });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('[usePushNotifications] subscribe error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!user) return;
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const pm = (registration as unknown as { pushManager: PushManager }).pushManager;
      const subscription = await pm.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await deletePushSubscription(subscription.endpoint);
      }
      await updatePushPreferences({ push_enabled: false });
      setIsSubscribed(false);
    } catch (err) {
      console.error('[usePushNotifications] unsubscribe error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
