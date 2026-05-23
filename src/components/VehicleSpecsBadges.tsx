import { Car, Bike, Gauge, Calendar, Fuel, Zap, Smartphone, HardDrive, Cpu } from 'lucide-react';
import type { Product } from '@/types';

interface VehicleSpecsBadgesProps {
  product: Product;
}

/**
 * Compact horizontal specs strip for car/bike/phone listings.
 * Renders nothing when the product has no vehicle or phone details.
 */
export default function VehicleSpecsBadges({ product }: VehicleSpecsBadgesProps) {
  // ── Phone specs ──────────────────────────────────────────────────────────────
  if (product.phone_details && (product.phone_details.brand || product.phone_details.storage || product.phone_details.ram)) {
    const pd = product.phone_details;
    return (
      <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
        <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded px-1.5 py-0.5">
          <Smartphone className="h-3 w-3" />
          Mobile
        </span>

        {pd.brand && (
          <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-medium">
            {pd.brand}
          </span>
        )}

        {pd.storage && (
          <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
            <HardDrive className="h-3 w-3 shrink-0" />
            {pd.storage}
          </span>
        )}

        {pd.ram && (
          <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
            <Cpu className="h-3 w-3 shrink-0" />
            {pd.ram} RAM
          </span>
        )}
      </div>
    );
  }

  // ── Vehicle specs ─────────────────────────────────────────────────────────────
  if (!product.car_details && !product.bike_details) return null;

  const isCar = !!product.car_details;
  const specs = product.car_details ?? product.bike_details!;
  const VehicleIcon = isCar ? Car : Bike;

  return (
    <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
      <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded px-1.5 py-0.5">
        <VehicleIcon className="h-3 w-3" />
        {isCar ? 'Car' : 'Bike'}
      </span>

      {specs.brand && (
        <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-medium">
          {specs.brand}
        </span>
      )}

      {specs.year && (
        <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
          <Calendar className="h-3 w-3 shrink-0" />
          {specs.year}
        </span>
      )}

      {specs.km_driven != null && (
        <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
          <Gauge className="h-3 w-3 shrink-0" />
          {specs.km_driven.toLocaleString('en-IN')} km
        </span>
      )}

      {!isCar && product.bike_details?.engine_cc && (
        <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
          <Zap className="h-3 w-3 shrink-0" />
          {product.bike_details.engine_cc} cc
        </span>
      )}

      {isCar && product.car_details?.fuel && (
        <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
          <Fuel className="h-3 w-3 shrink-0" />
          {product.car_details.fuel}
        </span>
      )}

      {isCar && product.car_details?.transmission && (
        <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5 capitalize">
          {product.car_details.transmission}
        </span>
      )}
    </div>
  );
}
