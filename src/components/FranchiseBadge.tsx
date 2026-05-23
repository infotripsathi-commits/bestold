import { Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FranchiseBadgeProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export default function FranchiseBadge({ variant = 'default', className = '' }: FranchiseBadgeProps) {
  if (variant === 'compact') {
    return (
      <Badge variant="default" className={`bg-primary text-primary-foreground ${className}`}>
        <Award className="h-3 w-3 mr-1" />
        Elite Partner
      </Badge>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium ${className}`}>
      <Award className="h-4 w-4" />
      <span>Authorized Elite Partner</span>
    </div>
  );
}
