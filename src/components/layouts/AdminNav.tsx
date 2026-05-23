import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Store, Package, Star, Grid3x3, Image, CheckCircle, MapPin, Settings, Smartphone, UserPlus, TrendingUp, Mail, Database, MessageCircle, Award, Wallet, BarChart3, FileText, QrCode, Sparkles, Sliders, PackageCheck, Car, Bike, Send } from 'lucide-react';

const adminLinks = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/approvals', label: 'Store Approvals', icon: CheckCircle },
  { path: '/admin/product-approvals', label: 'Product Approvals', icon: PackageCheck },
  { path: '/admin/seller-applications', label: 'Seller Apps', icon: FileText },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/invites', label: 'Invites', icon: UserPlus },
  { path: '/admin/stores', label: 'Stores', icon: Store },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/reviews', label: 'Reviews', icon: Star },
  { path: '/admin/categories', label: 'Categories', icon: Grid3x3 },
  { path: '/admin/locations', label: 'Locations', icon: MapPin },
  { path: '/admin/banners', label: 'Banners', icon: Image },
  { path: '/admin/promotions', label: 'Promotions', icon: TrendingUp },
  { path: '/admin/franchise', label: 'Elite Partners', icon: Award },
  { path: '/admin/payouts', label: 'Payouts', icon: Wallet },
  { path: '/admin/franchise-analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin/payment-settings', label: 'Payment Settings', icon: QrCode },
  { path: '/admin/platform-settings', label: 'Platform Settings', icon: Sliders },
  { path: '/admin/featured-store-plans', label: 'Featured Plans', icon: Sparkles },
  { path: '/admin/featured-store-applications', label: 'Featured Apps', icon: TrendingUp },
  { path: '/admin/sell-phone', label: 'Sell Phone', icon: Smartphone },
  { path: '/admin/car-brands', label: 'Car Brands', icon: Car },
  { path: '/admin/bike-brands', label: 'Bike Brands', icon: Bike },
  { path: '/admin/phone-brands', label: 'Phone Brands', icon: Smartphone },
  { path: '/admin/feedback', label: 'Feedback', icon: MessageCircle },
  { path: '/admin/email-config', label: 'Email Config', icon: Mail },
  { path: '/admin/email-broadcast', label: 'Email Broadcast', icon: Send },
  { path: '/admin/backup', label: 'Backup', icon: Database },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminNav() {
  const location = useLocation();

  return (
    <nav className="border-b bg-card">
      <div className="container">
        <div className="flex items-center space-x-1 overflow-x-auto py-2">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
