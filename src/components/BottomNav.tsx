import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Grid3x3, Store, User, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleAccountClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Redirect based on user role
    if (profile?.role === 'seller') {
      navigate('/seller/dashboard');
    } else if (profile?.role === 'admin') {
      navigate('/admin/users');
    } else {
      navigate('/account');
    }
  };

  const handleFavoritesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/favorites');
  };

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      path: '/',
      onClick: undefined,
    },
    {
      label: 'Categories',
      icon: Grid3x3,
      path: '/categories',
      onClick: undefined,
    },
    {
      label: 'Favorites',
      icon: Heart,
      path: '/favorites',
      onClick: handleFavoritesClick,
    },
    {
      label: 'Stores',
      icon: Store,
      path: '/stores',
      onClick: undefined,
    },
    {
      label: 'Account',
      icon: User,
      path: '/account',
      onClick: handleAccountClick,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={item.onClick}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'fill-primary')} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
