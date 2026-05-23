import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Save, Globe, Facebook, Instagram, Youtube, Twitter, MapPin, Phone, Mail, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getSiteSettings, updateMultipleSiteSettings } from '@/db/api';
import type { SiteSetting } from '@/types';

export default function AdminSiteSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSiteSettings();
      const settingsMap: Record<string, string> = {};
      data.forEach((setting: SiteSetting) => {
        settingsMap[setting.key] = setting.value || '';
      });
      setSettings(settingsMap);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await updateMultipleSiteSettings(updates);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-muted" />
        <Skeleton className="h-96 w-full bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage footer content, social links, and contact information
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="footer">
            <Settings className="h-4 w-4 mr-2" />
            Footer Content
          </TabsTrigger>
          <TabsTrigger value="pages">
            <FileText className="h-4 w-4 mr-2" />
            Page Content
          </TabsTrigger>
          <TabsTrigger value="social">
            <Facebook className="h-4 w-4 mr-2" />
            Social Links
          </TabsTrigger>
          <TabsTrigger value="contact">
            <Phone className="h-4 w-4 mr-2" />
            Contact Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic site information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  value={settings.site_name || ''}
                  onChange={(e) => handleChange('site_name', e.target.value)}
                  placeholder="BestOld"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_tagline">Site Tagline</Label>
                <Input
                  id="site_tagline"
                  value={settings.site_tagline || ''}
                  onChange={(e) => handleChange('site_tagline', e.target.value)}
                  placeholder="Buy & Sell Second-Hand Goods"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer_copyright">Copyright Text</Label>
                <Input
                  id="footer_copyright"
                  value={settings.footer_copyright || ''}
                  onChange={(e) => handleChange('footer_copyright', e.target.value)}
                  placeholder="© 2026 BestOld. All rights reserved."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Footer Content</CardTitle>
              <CardDescription>About us text and page links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="footer_about_us">About Us Description</Label>
                <Textarea
                  id="footer_about_us"
                  value={settings.footer_about_us || ''}
                  onChange={(e) => handleChange('footer_about_us', e.target.value)}
                  placeholder="Brief description about your platform"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  This text appears in the footer's "About Us" section
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="footer_about_page">About Page URL</Label>
                  <Input
                    id="footer_about_page"
                    value={settings.footer_about_page || ''}
                    onChange={(e) => handleChange('footer_about_page', e.target.value)}
                    placeholder="/about"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer_privacy_policy">Privacy Policy URL</Label>
                  <Input
                    id="footer_privacy_policy"
                    value={settings.footer_privacy_policy || ''}
                    onChange={(e) => handleChange('footer_privacy_policy', e.target.value)}
                    placeholder="/privacy-policy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer_terms_conditions">Terms & Conditions URL</Label>
                  <Input
                    id="footer_terms_conditions"
                    value={settings.footer_terms_conditions || ''}
                    onChange={(e) => handleChange('footer_terms_conditions', e.target.value)}
                    placeholder="/terms-conditions"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About Us Page</CardTitle>
              <CardDescription>
                Edit the content for the About Us page (/about)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="about_us_content">About Us Content</Label>
                <Textarea
                  id="about_us_content"
                  value={settings.about_us_content || ''}
                  onChange={(e) => handleChange('about_us_content', e.target.value)}
                  placeholder="# About BestOld&#10;&#10;Welcome to BestOld...&#10;&#10;## Our Mission&#10;..."
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use markdown-style formatting: # for headings, ## for subheadings, **bold**, - for lists
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy Policy Page</CardTitle>
              <CardDescription>
                Edit the content for the Privacy Policy page (/privacy)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="privacy_policy_content">Privacy Policy Content</Label>
                <Textarea
                  id="privacy_policy_content"
                  value={settings.privacy_policy_content || ''}
                  onChange={(e) => handleChange('privacy_policy_content', e.target.value)}
                  placeholder="# Privacy Policy&#10;&#10;**Last Updated: ...**&#10;&#10;## Introduction&#10;..."
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use markdown-style formatting: # for headings, ## for subheadings, **bold**, - for lists
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions Page</CardTitle>
              <CardDescription>
                Edit the content for the Terms & Conditions page (/terms)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terms_conditions_content">Terms & Conditions Content</Label>
                <Textarea
                  id="terms_conditions_content"
                  value={settings.terms_conditions_content || ''}
                  onChange={(e) => handleChange('terms_conditions_content', e.target.value)}
                  placeholder="# Terms and Conditions&#10;&#10;**Last Updated: ...**&#10;&#10;## Agreement to Terms&#10;..."
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use markdown-style formatting: # for headings, ## for subheadings, **bold**, - for lists
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Add your social media profile URLs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="footer_facebook" className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Label>
                <Input
                  id="footer_facebook"
                  value={settings.footer_facebook || ''}
                  onChange={(e) => handleChange('footer_facebook', e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer_instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <Input
                  id="footer_instagram"
                  value={settings.footer_instagram || ''}
                  onChange={(e) => handleChange('footer_instagram', e.target.value)}
                  placeholder="https://instagram.com/yourprofile"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer_youtube" className="flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  YouTube
                </Label>
                <Input
                  id="footer_youtube"
                  value={settings.footer_youtube || ''}
                  onChange={(e) => handleChange('footer_youtube', e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer_twitter" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter / X
                </Label>
                <Input
                  id="footer_twitter"
                  value={settings.footer_twitter || ''}
                  onChange={(e) => handleChange('footer_twitter', e.target.value)}
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Business address and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="footer_address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Business Address
                </Label>
                <Textarea
                  id="footer_address"
                  value={settings.footer_address || ''}
                  onChange={(e) => handleChange('footer_address', e.target.value)}
                  placeholder="123 Market Street, San Francisco, CA 94103"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="footer_phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="footer_phone"
                    value={settings.footer_phone || ''}
                    onChange={(e) => handleChange('footer_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer_email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="footer_email"
                    type="email"
                    value={settings.footer_email || ''}
                    onChange={(e) => handleChange('footer_email', e.target.value)}
                    placeholder="contact@bestold.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
}
