# Location Management System

## Overview
BestOld now features a fully dynamic location management system where administrators can customize location options through the admin panel instead of relying on hardcoded values.

## Features

### Admin Interface
- **Access**: Navigate to `/admin/locations` in the admin panel
- **Full CRUD Operations**:
  - ✅ Create new locations
  - ✅ Edit existing locations
  - ✅ Delete locations
  - ✅ Toggle active/inactive status
  - ✅ Manage display order

### Location Properties
Each location has the following properties:
- **Value**: Unique identifier (lowercase with hyphens, e.g., "new-york-ny")
- **Label**: Display name shown to users (e.g., "New York, NY")
- **Display Order**: Numeric value for sorting (lower numbers appear first)
- **Active Status**: Toggle to show/hide from public-facing pages

### Validation Rules
- **Value Format**: Must be lowercase letters, numbers, and hyphens only
  - ✅ Valid: `new-york-ny`, `los-angeles-ca`, `london-uk`
  - ❌ Invalid: `New York`, `new_york`, `new york ny`
- **Uniqueness**: Location values must be unique across the system
- **Required Fields**: Both value and label are required

## Database Schema

```sql
create table locations (
  id uuid primary key default gen_random_uuid(),
  value text not null unique,
  label text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index idx_locations_display_order on locations(display_order);
create index idx_locations_is_active on locations(is_active);

-- RLS Policies
-- Public can view active locations
create policy "Anyone can view active locations"
  on locations for select
  using (is_active = true);

-- Admin can manage all locations
create policy "Admin can manage locations"
  on locations for all
  using (auth.jwt() ->> 'role' = 'admin');
```

## API Functions

### Public API
```typescript
// Fetch active locations for public use
getLocations(): Promise<Location[]>
```

### Admin API
```typescript
// Fetch all locations (including inactive)
getAllLocations(): Promise<Location[]>

// Create new location
createLocation(location: {
  value: string;
  label: string;
  display_order?: number;
  is_active?: boolean;
}): Promise<Location>

// Update existing location
updateLocation(locationId: string, updates: Partial<Location>): Promise<Location>

// Delete location
deleteLocation(locationId: string): Promise<void>
```

## Frontend Integration

### Dynamic Loading
All pages that use locations now fetch them dynamically from the database:
- **HomePage**: Search location filter
- **SearchPage**: Location filter in search results
- **AllStoresPage**: Store location filter
- **AccountPage**: User profile location selector
- **StoreManagementPage**: Store location selector

### Usage Example
```typescript
import { fetchLocations } from '@/lib/locations';

function MyComponent() {
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const locs = await fetchLocations();
      setLocations(locs);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  return (
    <Select>
      <SelectItem value="all">All Locations</SelectItem>
      {locations.map((location) => (
        <SelectItem key={location.value} value={location.value}>
          {location.label}
        </SelectItem>
      ))}
    </Select>
  );
}
```

## Initial Data
The system comes pre-seeded with 26 major US cities:
- New York, NY
- Los Angeles, CA
- Chicago, IL
- Houston, TX
- Phoenix, AZ
- Philadelphia, PA
- San Antonio, TX
- San Diego, CA
- Dallas, TX
- San Jose, CA
- Austin, TX
- Jacksonville, FL
- Fort Worth, TX
- Columbus, OH
- Charlotte, NC
- San Francisco, CA
- Indianapolis, IN
- Seattle, WA
- Denver, CO
- Boston, MA
- Nashville, TN
- Detroit, MI
- Portland, OR
- Las Vegas, NV
- Miami, FL
- Atlanta, GA

## Admin Workflow

### Adding a New Location
1. Navigate to `/admin/locations`
2. Click "Add Location" button
3. Fill in the form:
   - **Value**: Enter lowercase-hyphenated identifier (e.g., "chicago-il")
   - **Label**: Enter display name (e.g., "Chicago, IL")
   - **Display Order**: Enter numeric value (lower = higher priority)
   - **Active**: Toggle on/off
4. Click "Create Location"
5. Location immediately appears in all public-facing dropdowns (if active)

### Editing a Location
1. Navigate to `/admin/locations`
2. Click the edit (pencil) icon next to the location
3. Modify any fields
4. Click "Save Changes"
5. Changes reflect immediately across the platform

### Deleting a Location
1. Navigate to `/admin/locations`
2. Click the delete (trash) icon next to the location
3. Confirm deletion in the dialog
4. **Note**: Deletion may fail if the location is currently in use by stores or products

### Toggling Active Status
1. Navigate to `/admin/locations`
2. Use the switch toggle next to any location
3. Inactive locations are hidden from public-facing pages but remain in the database
4. Useful for temporarily hiding locations without deleting them

## Best Practices

### Display Order
- Use increments of 10 (0, 10, 20, 30...) to allow easy insertion of new locations
- Lower numbers appear first in dropdowns
- Alphabetical ordering can be achieved by setting display_order based on label

### Active/Inactive
- Use inactive status instead of deletion when:
  - Temporarily suspending service in a location
  - Testing new locations before public launch
  - Preserving historical data

### Value Naming Convention
- Format: `city-state` or `city-country`
- Examples: `new-york-ny`, `london-uk`, `tokyo-jp`
- Keep consistent across all locations
- Use official postal abbreviations when available

## Troubleshooting

### Location Not Appearing in Dropdown
- Check if location is marked as active
- Verify display_order is set correctly
- Refresh the page to reload locations

### Cannot Delete Location
- Location may be in use by stores or products
- Option 1: Mark as inactive instead
- Option 2: Update stores/products to use different location first

### Duplicate Value Error
- Each location value must be unique
- Check existing locations before creating new ones
- Consider using more specific identifiers (e.g., `new-york-manhattan-ny`)

## Future Enhancements
Potential improvements for the location system:
- Drag-and-drop reordering for display_order
- Bulk import/export (CSV, JSON)
- Location usage statistics (stores/products per location)
- Search and filter in admin page
- Location hierarchy (country > state > city)
- Geolocation integration for auto-detection
- Location-based analytics and reporting

## Technical Notes
- Locations are cached in component state after initial fetch
- No polling or real-time updates (refresh page to see admin changes)
- RLS policies ensure data security
- Indexes optimize query performance
- All CRUD operations include proper error handling and user feedback
