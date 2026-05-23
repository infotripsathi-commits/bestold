import { getLocations } from '@/db/api';
import type { Location } from '@/types';

// Legacy: Static locations array (deprecated - use fetchLocations() instead)
// This is kept for backward compatibility but will be empty by default
export const LOCATIONS: { value: string; label: string }[] = [];

// Fetch locations from database
export async function fetchLocations(): Promise<{ value: string; label: string; latitude?: number; longitude?: number; radius_km?: number }[]> {
  try {
    const locations = await getLocations();
    return locations.map(loc => ({
      value: loc.value,
      label: loc.label,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radius_km: loc.radius_km,
    }));
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return [];
  }
}

export function getLocationLabel(value: string, locations: { value: string; label: string }[]): string {
  const location = locations.find(loc => loc.value === value);
  return location ? location.label : value;
}

// Calculate distance between two GPS coordinates using Haversine formula
// Returns distance in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export async function detectUserLocation(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported by browser');
      resolve(null);
      return;
    }

    console.log('Requesting geolocation permission...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log('✓ User GPS coordinates obtained:', latitude, longitude);
          
          // Fetch all locations with GPS coordinates from database
          const allLocations = await getLocations();
          const locationsWithGPS = allLocations.filter(
            loc => loc.latitude !== null && 
                   loc.latitude !== undefined && 
                   loc.longitude !== null && 
                   loc.longitude !== undefined
          );

          console.log(`✓ Found ${locationsWithGPS.length} locations with GPS coordinates`);

          if (locationsWithGPS.length === 0) {
            console.log('⚠ No locations with GPS coordinates in database, trying city name matching...');
            await fallbackToCityMatching(latitude, longitude, resolve);
            return;
          }

          // Calculate distance to each location
          const locationsWithDistance = locationsWithGPS.map(loc => {
            const distance = calculateDistance(
              latitude, 
              longitude, 
              loc.latitude!, 
              loc.longitude!
            );
            const radius = loc.radius_km || 50; // Increased default to 50km for better matching
            return {
              location: loc,
              distance,
              radius,
              withinRadius: distance <= radius
            };
          });

          // Sort by distance (closest first)
          locationsWithDistance.sort((a, b) => a.distance - b.distance);

          console.log('📍 Distance calculations (top 5):');
          locationsWithDistance.slice(0, 5).forEach(l => {
            console.log(`  - ${l.location.label}: ${l.distance.toFixed(2)}km (radius: ${l.radius}km) ${l.withinRadius ? '✓' : '✗'}`);
          });

          // Find the closest location within its radius
          const matchedLocation = locationsWithDistance.find(l => l.withinRadius);

          if (matchedLocation) {
            console.log(`✓ Matched location: ${matchedLocation.location.label} (${matchedLocation.distance.toFixed(2)}km away)`);
            resolve(matchedLocation.location.value);
          } else {
            // No location within radius, use closest location if within 100km
            const closest = locationsWithDistance[0];
            if (closest && closest.distance <= 100) {
              console.log(`⚠ No exact match, using closest location: ${closest.location.label} (${closest.distance.toFixed(2)}km away)`);
              resolve(closest.location.value);
            } else {
              console.log(`⚠ Closest location is ${closest?.distance.toFixed(2)}km away, trying city name matching...`);
              await fallbackToCityMatching(latitude, longitude, resolve);
            }
          }
        } catch (error) {
          console.error('❌ Failed to detect location:', error);
          resolve(null);
        }
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          console.log('⚠ User denied geolocation permission');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          console.log('⚠ Location information unavailable');
        } else if (error.code === error.TIMEOUT) {
          console.log('⚠ Geolocation request timed out');
        }
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  });
}

// Fallback function: Try to match by city name
async function fallbackToCityMatching(
  latitude: number, 
  longitude: number, 
  resolve: (value: string | null) => void
): Promise<void> {
  try {
    console.log('Attempting city name matching fallback...');
    
    // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'BestOld-App/1.0'
        }
      }
    );

    if (!response.ok) {
      console.error('Reverse geocoding failed:', response.statusText);
      resolve(null);
      return;
    }

    const data = await response.json();
    
    // Extract city/town name from the response
    const city = data.address?.city || 
                data.address?.town || 
                data.address?.village || 
                data.address?.county ||
                data.address?.state;

    console.log('Detected city from reverse geocoding:', city);

    if (city) {
      // Fetch available locations from database
      const locations = await fetchLocations();
      
      // Try to find a matching location in the database
      const matchedLocation = locations.find(loc => 
        loc.label.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(loc.label.toLowerCase())
      );

      if (matchedLocation) {
        console.log('Matched location by city name:', matchedLocation.label);
        resolve(matchedLocation.value);
      } else {
        console.log('No matching location found for city:', city);
        resolve(null);
      }
    } else {
      console.log('Could not extract city name from reverse geocoding');
      resolve(null);
    }
  } catch (error) {
    console.error('Fallback city matching failed:', error);
    resolve(null);
  }
}
