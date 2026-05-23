import { Badge } from '@/components/ui/badge';
import { Store, ShoppingCart, Building2 } from 'lucide-react';

type BusinessType = 'retail' | 'wholesale' | 'both';

interface BusinessTypeBadgeProps {
  businessType: BusinessType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function BusinessTypeBadge({ 
  businessType, 
  size = 'md',
  showIcon = true 
}: BusinessTypeBadgeProps) {
  const getBusinessTypeConfig = () => {
    switch (businessType) {
      case 'retail':
        return {
          label: 'Retail Only',
          icon: ShoppingCart,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
        };
      case 'wholesale':
        return {
          label: 'Wholesale Only',
          icon: Building2,
          className: 'bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-300',
        };
      case 'both':
        return {
          label: 'Retail & Wholesale',
          icon: Store,
          className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300',
        };
      default:
        return {
          label: 'Retail Only',
          icon: ShoppingCart,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
        };
    }
  };

  const config = getBusinessTypeConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge 
      variant="secondary" 
      className={`${config.className} ${sizeClasses[size]} font-medium inline-flex items-center gap-1.5`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.label}</span>
    </Badge>
  );
}
