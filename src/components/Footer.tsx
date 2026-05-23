import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Twitter, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { getSiteSettingsByCategory } from '@/db/api';
import type { SiteSetting } from '@/types';
import FeedbackDialog from '@/components/FeedbackDialog';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSiteSettingsByCategory('footer');
      const generalData = await getSiteSettingsByCategory('general');
      const allData = [...data, ...generalData];
      
      const settingsMap: Record<string, string> = {};
      allData.forEach((setting: SiteSetting) => {
        settingsMap[setting.key] = setting.value || '';
      });
      setSettings(settingsMap);
    } catch (error) {
      console.error('Failed to load footer settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  const socialLinks = [
    { 
      name: 'Facebook', 
      url: settings.footer_facebook, 
      icon: Facebook,
      color: 'hover:text-blue-600'
    },
    { 
      name: 'Instagram', 
      url: settings.footer_instagram, 
      icon: Instagram,
      color: 'hover:text-pink-600'
    },
    { 
      name: 'YouTube', 
      url: settings.footer_youtube, 
      icon: Youtube,
      color: 'hover:text-red-600'
    },
    { 
      name: 'Twitter', 
      url: settings.footer_twitter, 
      icon: Twitter,
      color: 'hover:text-blue-400'
    },
  ].filter(link => link.url && link.url.trim() !== '');

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {settings.site_name || 'BestOld'}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {settings.footer_about_us || 'Your trusted marketplace for buying and selling quality second-hand goods.'}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              {settings.footer_about_page && (
                <li>
                  <Link 
                    to={settings.footer_about_page} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    About Us
                  </Link>
                </li>
              )}
              {settings.footer_privacy_policy && (
                <li>
                  <Link 
                    to={settings.footer_privacy_policy} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
              )}
              {settings.footer_terms_conditions && (
                <li>
                  <Link 
                    to={settings.footer_terms_conditions} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Terms & Conditions
                  </Link>
                </li>
              )}
            </ul>
            
            {/* Modern Feedback Button */}
            <div className="pt-2">
              <FeedbackDialog>
                <Button 
                  variant="default" 
                  size="sm"
                  className="w-full gap-2 shadow-md hover:shadow-lg transition-all"
                  asChild
                >
                  <button>
                    <MessageCircle className="h-4 w-4" />
                    Send Feedback
                  </button>
                </Button>
              </FeedbackDialog>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <ul className="space-y-3">
              {settings.footer_address && (
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{settings.footer_address}</span>
                </li>
              )}
              {settings.footer_phone && (
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a 
                    href={`tel:${settings.footer_phone.replace(/\s/g, '')}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {settings.footer_phone}
                  </a>
                </li>
              )}
              {settings.footer_email && (
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a 
                    href={`mailto:${settings.footer_email}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {settings.footer_email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Follow Us</h3>
              <div className="flex flex-wrap items-center gap-4">
                {socialLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-muted-foreground transition-colors ${link.color}`}
                      aria-label={link.name}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            {settings.footer_copyright || `© ${new Date().getFullYear()} ${settings.site_name || 'BestOld'}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
