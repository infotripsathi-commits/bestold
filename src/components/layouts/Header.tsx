import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, LogOut, MessageSquare, Settings, Shield, Search, MapPin, Navigation, Grid3x3, Store as StoreIcon, Package, Award, Bell, ShoppingBag, Truck } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { UnreadBadge } from '@/components/UnreadBadge';
import NotificationBell from '@/components/NotificationBell';
import { fetchLocations, detectUserLocation } from '@/lib/locations';
import SellPhoneButton from '@/components/SellPhoneButton';
import { InstallAppButton } from '@/components/InstallAppButton';
import { getStoreByUserId } from '@/db/api';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      checkUserStore();
    }
  }, [user]);

  // Auto-focus search input when opened from PWA shortcut
  useEffect(() => {
    const fromShortcut = searchParams.get('from');
    if (fromShortcut === 'shortcut' && location.pathname === '/search' && searchInputRef.current) {
      // Delay to ensure the input is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [location.pathname, searchParams]);

  const checkUserStore = async () => {
    if (!user) return;
    try {
      const store = await getStoreByUserId(user.id);
      setHasStore(!!store);
    } catch (error) {
      console.error('Failed to check user store:', error);
    }
  };

  useEffect(() => {
    loadLocations();
    loadStoredLocation();
    
    // Define pages where search bar should NOT be shown
    const pagesWithoutSearch = [
      '/',
      '/search',
      '/stores',
      '/categories',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
      '/about',
      '/privacy',
      '/terms',
      '/account',
      '/seller/dashboard',
      '/seller/store',
      '/seller/products',
      '/admin'
    ];
    
    // Check if current path matches any of the excluded pages
    const shouldHideSearch = pagesWithoutSearch.some(path => 
      location.pathname === path || 
      location.pathname.startsWith(path + '/') ||
      location.pathname.startsWith('/seller/') ||
      location.pathname.startsWith('/admin/')
    );
    
    setShowSearchBar(!shouldHideSearch);
  }, [location.pathname]);

  const loadLocations = async () => {
    try {
      const locs = await fetchLocations();
      setLocations(locs);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const loadStoredLocation = () => {
    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation && storedLocation !== 'all') {
      setSelectedLocation(storedLocation);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('q', searchQuery);
    }
    if (selectedLocation && selectedLocation !== 'all') {
      params.set('location', selectedLocation);
    }
    navigate(`/search?${params.toString()}`);
  };

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const location = await detectUserLocation();
      if (location) {
        setSelectedLocation(location);
        // Store location and timestamp
        localStorage.setItem('userLocation', location);
        localStorage.setItem('locationTimestamp', Date.now().toString());
        toast.success('Location detected successfully');
      } else {
        toast.info('Unable to detect location. Please select manually.');
      }
    } catch (error) {
      toast.error('Failed to detect location');
    } finally {
      setDetectingLocation(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container">
        {/* Main Header Row */}
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo />
          </Link>

          {/* Search Bar - OLX Style (shown on all pages except homepage) */}
          {showSearchBar && (
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl gap-2">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Find Products, Stores and more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>

              {/* Search Button */}
              <Button type="submit" size="sm" className="h-10 px-6">
                Search
              </Button>
            </form>
          )}

          {/* Right Side Navigation */}
          <nav className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
            {!showSearchBar && (
              <SellPhoneButton 
                trigger={
                  <Button asChild variant="ghost" className="text-sm font-medium hover:text-primary transition-colors hidden md:block">
                    <span>Sell Your Phone</span>
                  </Button>
                }
              />
            )}
            
            {/* Install App Button - ALWAYS VISIBLE ON ALL PAGES */}
            <InstallAppButton variant="outline" size="sm" showIcon={false} className="flex" />
            
            {user ? (
              <>
                {profile?.role === 'seller' || profile?.role === 'admin' ? (
                  <Link to="/seller/dashboard" className="text-sm font-medium hover:text-primary transition-colors hidden md:block">
                    My Store
                  </Link>
                ) : null}
                
                <Link to="/chat" className="text-sm font-medium hover:text-primary transition-colors relative inline-flex items-center">
                  <MessageSquare className="h-5 w-5" />
                  <UnreadBadge />
                </Link>

                {profile?.role === 'admin' && <NotificationBell />}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{profile?.email || ''}</p>
                        <p className="text-xs text-primary capitalize">{profile?.role || ''}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/my-orders')}>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/account')}>
                      <Settings className="mr-2 h-4 w-4" />
                      My Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/notification-preferences')}>
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </DropdownMenuItem>
                    {hasStore && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/seller/online-orders')}>
                          <Truck className="mr-2 h-4 w-4" />
                          Online Orders
                        </DropdownMenuItem>
                      </>
                    )}
                    {profile?.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button variant="default" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </nav>
        </div>

        {/* Mobile Search Bar (shown below main header on mobile) */}
        {showSearchBar && (
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Find Products, Stores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>
              <Button type="submit" size="sm" className="h-10 px-6">
                Search
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Navigation Links Bar - Desktop Only */}
      <div className="border-t bg-background hidden md:block">
        <div className="container">
          <nav className="flex items-center justify-start gap-6 h-12">
            <Link
              to="/categories"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
            >
              <Grid3x3 className="h-4 w-4" />
              Categories
            </Link>
            <Link
              to="/stores"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
            >
              <StoreIcon className="h-4 w-4" />
              All Stores
            </Link>
            <Link
              to="/elite-partners"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
            >
              <Award className="h-4 w-4" />
              Our Elite Partners
            </Link>
            <Link
              to="/search"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
            >
              <Package className="h-4 w-4" />
              All Products
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
