import { useState, useEffect } from 'react';
import { RefreshCw, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';

const ICON_SIZES = [
  { size: 72, label: '72x72', usage: 'Android Chrome' },
  { size: 96, label: '96x96', usage: 'Android Chrome' },
  { size: 128, label: '128x128', usage: 'Android Chrome' },
  { size: 144, label: '144x144', usage: 'Android Chrome, Windows' },
  { size: 152, label: '152x152', usage: 'iOS Safari' },
  { size: 192, label: '192x192', usage: 'Android Chrome, iOS Safari' },
  { size: 384, label: '384x384', usage: 'Android Chrome' },
  { size: 512, label: '512x512', usage: 'Android Chrome, Splash screen' },
];

const BACKGROUND_COLORS = [
  { name: 'White', color: '#FFFFFF', textColor: '#000000' },
  { name: 'Black', color: '#000000', textColor: '#FFFFFF' },
  { name: 'Light Gray', color: '#F3F4F6', textColor: '#000000' },
  { name: 'Dark Gray', color: '#374151', textColor: '#FFFFFF' },
  { name: 'Primary Brand', color: '#16a34a', textColor: '#FFFFFF' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [iconTimestamp, setIconTimestamp] = useState(Date.now());

  useEffect(() => {
    // Track page view
    trackView('page_view');
  }, []);

  const trackView = async (viewType: 'page_view' | 'refresh_click' | 'reinstall_click') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('icon_preview_views')
        .insert({
          user_id: user.id,
          view_type: viewType,
        } as any);
      
      if (error) {
        console.error('Error tracking view:', error);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await trackView('refresh_click');
    
    // Force reload icons by updating timestamp
    setTimeout(() => {
      setIconTimestamp(Date.now());
      setRefreshing(false);
      toast.success('Icon preview updated');
    }, 500);
  };

  const handleReinstall = async () => {
    await trackView('reinstall_click');

    // Check if beforeinstallprompt is available
    if ('BeforeInstallPromptEvent' in window) {
      // Try to trigger native install prompt
      const event = (window as any).deferredPrompt;
      if (event) {
        event.prompt();
        const { outcome } = await event.userChoice;
        if (outcome === 'accepted') {
          toast.success('App installed successfully!');
        }
      } else {
        showManualInstructions();
      }
    } else {
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    toast.info(
      'Please use your browser\'s menu to add BESTOLD to your home screen.',
      { duration: 5000 }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings & About</h1>
          <p className="text-muted-foreground">
            Preview and manage your BESTOLD app icon
          </p>
        </div>

        {/* Current Icon Preview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current App Icon</CardTitle>
            <CardDescription>
              This is how BESTOLD will appear on your home screen
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-6">
              <img
                src={`/icon-192x192.png?t=${iconTimestamp}`}
                alt="BESTOLD App Icon"
                className="w-32 h-32 rounded-2xl shadow-lg"
              />
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="mb-4"
            >
              {refreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Icon Preview
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* All Icon Sizes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>All Icon Sizes</CardTitle>
            <CardDescription>
              Different devices use different icon sizes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {ICON_SIZES.map((icon) => (
                <div key={icon.size} className="flex flex-col items-center text-center">
                  <img
                    src={`/icon-${icon.size}x${icon.size}.png?t=${iconTimestamp}`}
                    alt={`${icon.label} icon`}
                    className="w-20 h-20 rounded-lg shadow-md mb-2"
                  />
                  <p className="font-semibold text-sm">{icon.label}</p>
                  <p className="text-xs text-muted-foreground">{icon.usage}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Icon Visibility Test */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Icon Visibility Test</CardTitle>
            <CardDescription>
              Check how the icon looks on different backgrounds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {BACKGROUND_COLORS.map((bg) => (
                <div key={bg.name} className="flex flex-col items-center">
                  <div
                    className="w-full aspect-square rounded-lg flex items-center justify-center mb-2 p-4"
                    style={{ backgroundColor: bg.color }}
                  >
                    <img
                      src={`/icon-192x192.png?t=${iconTimestamp}`}
                      alt={`Icon on ${bg.name}`}
                      className="w-16 h-16 rounded-lg"
                    />
                  </div>
                  <p className="text-sm font-medium" style={{ color: bg.textColor === '#FFFFFF' ? '#000000' : bg.textColor }}>
                    {bg.name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How to Update Icon */}
        <Card className="mb-8">
          <CardHeader>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <div className="cursor-pointer">
                  <CardTitle className="flex items-center justify-between">
                    How to Update Your Icon
                    <span className="text-sm font-normal text-muted-foreground">
                      Click to expand
                    </span>
                  </CardTitle>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardDescription className="mt-4">
                  Follow these steps to update your home screen icon
                </CardDescription>
                <CardContent className="px-0 pt-4">
                  <ol className="list-decimal list-inside space-y-3 text-sm">
                    <li>
                      If you installed BESTOLD before today, your home screen icon may be outdated.
                    </li>
                    <li>
                      To update the icon, tap the <strong>Reinstall App</strong> button below.
                    </li>
                    <li>
                      Follow the prompts to add BESTOLD to your home screen again.
                    </li>
                    <li>
                      The new icon will replace the old one automatically.
                    </li>
                  </ol>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>

        {/* Reinstall Button */}
        <Card>
          <CardHeader>
            <CardTitle>Update to Latest Icon</CardTitle>
            <CardDescription>
              Reinstall the app to get the latest icon version
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleReinstall}
              size="lg"
              className="w-full md:w-auto"
            >
              <Download className="mr-2 h-5 w-5" />
              Reinstall App with Updated Icon
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              We want to ensure BESTOLD looks great on your home screen. Use this page to preview the icon, check visibility on different backgrounds, and update to the latest version if needed.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
