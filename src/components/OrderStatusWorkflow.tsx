import { CheckCircle, Clock, Package, Truck, Home, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';

interface OrderStatusWorkflowProps {
  currentStatus: OrderStatus;
  createdAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  compact?: boolean;
}

interface StatusStep {
  status: OrderStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const statusSteps: StatusStep[] = [
  {
    status: 'pending',
    label: 'Order Placed',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  {
    status: 'confirmed',
    label: 'Confirmed',
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    status: 'shipped',
    label: 'Shipped',
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    status: 'delivered',
    label: 'Delivered',
    icon: Home,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
];

export default function OrderStatusWorkflow({
  currentStatus,
  createdAt,
  confirmedAt,
  shippedAt,
  deliveredAt,
  cancelledAt,
  compact = false,
}: OrderStatusWorkflowProps) {
  const getStatusIndex = (status: OrderStatus): number => {
    return statusSteps.findIndex(step => step.status === status);
  };

  const currentIndex = getStatusIndex(currentStatus);
  const isCancelled = currentStatus === 'cancelled';

  const getEstimatedTime = (stepIndex: number): string | null => {
    if (isCancelled) return null;
    
    const now = new Date();
    const created = new Date(createdAt);
    
    // If step is completed, show actual time
    if (stepIndex === 0) {
      return formatDate(created);
    }
    if (stepIndex === 1 && confirmedAt) {
      return formatDate(new Date(confirmedAt));
    }
    if (stepIndex === 2 && shippedAt) {
      return formatDate(new Date(shippedAt));
    }
    if (stepIndex === 3 && deliveredAt) {
      return formatDate(new Date(deliveredAt));
    }
    
    // If step is current or future, estimate time
    if (stepIndex > currentIndex) {
      const baseTime = confirmedAt ? new Date(confirmedAt) : 
                       shippedAt ? new Date(shippedAt) : created;
      
      // Estimated times from order creation
      const estimatedHours = {
        1: 24,  // Confirm within 24 hours
        2: 48,  // Ship within 48 hours of confirmation
        3: 120, // Deliver within 5 days of shipping
      };
      
      const hoursToAdd = estimatedHours[stepIndex as keyof typeof estimatedHours] || 0;
      const estimated = new Date(baseTime.getTime() + hoursToAdd * 60 * 60 * 1000);
      
      return `Est. ${formatDate(estimated)}`;
    }
    
    return null;
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const isStepCompleted = (stepIndex: number): boolean => {
    return stepIndex < currentIndex || (stepIndex === currentIndex && currentStatus !== 'pending');
  };

  const isStepCurrent = (stepIndex: number): boolean => {
    return stepIndex === currentIndex && !isCancelled;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {statusSteps.map((step, index) => {
          const Icon = step.icon;
          const completed = isStepCompleted(index);
          const current = isStepCurrent(index);
          
          return (
            <div key={step.status} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
                  completed || current ? step.bgColor : 'bg-muted',
                  current && 'ring-2 ring-offset-2',
                  current && step.color.replace('text-', 'ring-')
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4',
                    completed || current ? step.color : 'text-muted-foreground'
                  )}
                />
              </div>
              {index < statusSteps.length - 1 && (
                <div
                  className={cn(
                    'w-8 h-0.5 mx-1',
                    completed ? step.color.replace('text-', 'bg-') : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
        {isCancelled && (
          <Badge variant="destructive" className="ml-2">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isCancelled ? (
        <div className="flex items-center justify-center p-6 bg-red-50 rounded-lg border border-red-200">
          <XCircle className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <p className="font-semibold text-red-900">Order Cancelled</p>
            {cancelledAt && (
              <p className="text-sm text-red-700">
                Cancelled on {new Date(cancelledAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            const completed = isStepCompleted(index);
            const current = isStepCurrent(index);
            const estimatedTime = getEstimatedTime(index);
            const isPending = index > currentIndex;

            return (
              <div key={step.status} className="flex gap-4">
                {/* Icon and connector line */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full transition-all',
                      completed && step.bgColor,
                      current && `${step.bgColor} ring-2 ring-offset-2`,
                      current && step.color.replace('text-', 'ring-'),
                      isPending && 'bg-muted'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-colors',
                        completed && step.color,
                        current && step.color,
                        isPending && 'text-muted-foreground'
                      )}
                    />
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={cn(
                        'w-0.5 h-12 transition-colors',
                        completed ? step.color.replace('text-', 'bg-') : 'bg-muted'
                      )}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between mb-1">
                    <h4
                      className={cn(
                        'font-semibold transition-colors',
                        (completed || current) && 'text-foreground',
                        isPending && 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </h4>
                    {current && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  {estimatedTime && (
                    <p
                      className={cn(
                        'text-sm transition-colors',
                        (completed || current) && 'text-muted-foreground',
                        isPending && 'text-muted-foreground italic'
                      )}
                    >
                      {estimatedTime}
                    </p>
                  )}
                  {current && index === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Waiting for seller confirmation
                    </p>
                  )}
                  {current && index === 1 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Preparing for shipment
                    </p>
                  )}
                  {current && index === 2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      In transit to delivery address
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
