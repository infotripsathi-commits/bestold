# Location Configuration Guide

## Current Locations

The application currently uses **26 major US cities** as location options.

**File Location:** `src/lib/locations.ts`

## How to Change Locations

### Step 1: Open the locations file
```bash
src/lib/locations.ts
```

### Step 2: Edit the LOCATIONS array

Replace the existing array with your desired locations. Each location needs:
- `value`: URL-friendly identifier (lowercase, hyphenated, unique)
- `label`: Display name shown to users

### Format Example:
```typescript
export const LOCATIONS = [
  { value: 'city-name-state', label: 'City Name, State' },
  { value: 'another-city', label: 'Another City' },
  // Add more locations...
];
```

---

## Location Templates

Choose one of these templates or create your own:

### Template 1: Major US Cities (Current)
```typescript
export const LOCATIONS = [
  { value: 'new-york-ny', label: 'New York, NY' },
  { value: 'los-angeles-ca', label: 'Los Angeles, CA' },
  { value: 'chicago-il', label: 'Chicago, IL' },
  { value: 'houston-tx', label: 'Houston, TX' },
  { value: 'phoenix-az', label: 'Phoenix, AZ' },
  // ... (26 cities total)
];
```

### Template 2: US States
```typescript
export const LOCATIONS = [
  { value: 'alabama', label: 'Alabama' },
  { value: 'alaska', label: 'Alaska' },
  { value: 'arizona', label: 'Arizona' },
  { value: 'arkansas', label: 'Arkansas' },
  { value: 'california', label: 'California' },
  { value: 'colorado', label: 'Colorado' },
  { value: 'connecticut', label: 'Connecticut' },
  { value: 'delaware', label: 'Delaware' },
  { value: 'florida', label: 'Florida' },
  { value: 'georgia', label: 'Georgia' },
  // ... add all 50 states
];
```

### Template 3: International Cities
```typescript
export const LOCATIONS = [
  { value: 'london-uk', label: 'London, UK' },
  { value: 'paris-france', label: 'Paris, France' },
  { value: 'tokyo-japan', label: 'Tokyo, Japan' },
  { value: 'sydney-australia', label: 'Sydney, Australia' },
  { value: 'toronto-canada', label: 'Toronto, Canada' },
  { value: 'berlin-germany', label: 'Berlin, Germany' },
  { value: 'dubai-uae', label: 'Dubai, UAE' },
  { value: 'singapore', label: 'Singapore' },
  { value: 'hong-kong', label: 'Hong Kong' },
  { value: 'mumbai-india', label: 'Mumbai, India' },
];
```

### Template 4: UK Cities
```typescript
export const LOCATIONS = [
  { value: 'london', label: 'London' },
  { value: 'manchester', label: 'Manchester' },
  { value: 'birmingham', label: 'Birmingham' },
  { value: 'leeds', label: 'Leeds' },
  { value: 'glasgow', label: 'Glasgow' },
  { value: 'liverpool', label: 'Liverpool' },
  { value: 'edinburgh', label: 'Edinburgh' },
  { value: 'bristol', label: 'Bristol' },
  { value: 'cardiff', label: 'Cardiff' },
  { value: 'belfast', label: 'Belfast' },
];
```

### Template 5: Indian Cities
```typescript
export const LOCATIONS = [
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'delhi', label: 'Delhi' },
  { value: 'bangalore', label: 'Bangalore' },
  { value: 'hyderabad', label: 'Hyderabad' },
  { value: 'chennai', label: 'Chennai' },
  { value: 'kolkata', label: 'Kolkata' },
  { value: 'pune', label: 'Pune' },
  { value: 'ahmedabad', label: 'Ahmedabad' },
  { value: 'jaipur', label: 'Jaipur' },
  { value: 'surat', label: 'Surat' },
];
```

### Template 6: Australian Cities
```typescript
export const LOCATIONS = [
  { value: 'sydney-nsw', label: 'Sydney, NSW' },
  { value: 'melbourne-vic', label: 'Melbourne, VIC' },
  { value: 'brisbane-qld', label: 'Brisbane, QLD' },
  { value: 'perth-wa', label: 'Perth, WA' },
  { value: 'adelaide-sa', label: 'Adelaide, SA' },
  { value: 'gold-coast-qld', label: 'Gold Coast, QLD' },
  { value: 'canberra-act', label: 'Canberra, ACT' },
  { value: 'hobart-tas', label: 'Hobart, TAS' },
];
```

### Template 7: Canadian Cities
```typescript
export const LOCATIONS = [
  { value: 'toronto-on', label: 'Toronto, ON' },
  { value: 'vancouver-bc', label: 'Vancouver, BC' },
  { value: 'montreal-qc', label: 'Montreal, QC' },
  { value: 'calgary-ab', label: 'Calgary, AB' },
  { value: 'ottawa-on', label: 'Ottawa, ON' },
  { value: 'edmonton-ab', label: 'Edmonton, AB' },
  { value: 'winnipeg-mb', label: 'Winnipeg, MB' },
  { value: 'quebec-city-qc', label: 'Quebec City, QC' },
];
```

### Template 8: Regional (US Regions)
```typescript
export const LOCATIONS = [
  { value: 'northeast', label: 'Northeast' },
  { value: 'southeast', label: 'Southeast' },
  { value: 'midwest', label: 'Midwest' },
  { value: 'southwest', label: 'Southwest' },
  { value: 'west', label: 'West' },
  { value: 'pacific-northwest', label: 'Pacific Northwest' },
];
```

---

## Implementation Steps

### Option A: Replace Entire Array

1. Open `src/lib/locations.ts`
2. Select one of the templates above
3. Replace the entire `LOCATIONS` array
4. Save the file
5. Test the application

### Option B: Add Custom Locations

1. Open `src/lib/locations.ts`
2. Add your locations following this format:
```typescript
export const LOCATIONS = [
  { value: 'your-city-1', label: 'Your City 1' },
  { value: 'your-city-2', label: 'Your City 2' },
  { value: 'your-city-3', label: 'Your City 3' },
  // Add as many as needed
];
```

---

## Important Rules

### 1. Value Format
- Must be lowercase
- Use hyphens instead of spaces
- Must be unique
- No special characters except hyphens

✅ Good: `'new-york-ny'`, `'los-angeles'`, `'london-uk'`  
❌ Bad: `'New York'`, `'los_angeles'`, `'London, UK'`

### 2. Label Format
- Can include spaces, commas, uppercase
- Should be user-friendly and readable
- Can include state/country abbreviations

✅ Good: `'New York, NY'`, `'Los Angeles'`, `'London, UK'`

### 3. Array Structure
- Each location is an object with `value` and `label`
- Separate locations with commas
- Keep the array inside square brackets `[]`

---

## Where Locations Are Used

Locations appear in these places:
1. **Home Page** - Location selector in search bar
2. **Search Results Page** - Location filter dropdown
3. **All Stores Page** - Location filter
4. **Store Creation/Edit** - Seller selects store location
5. **User Registration** - User selects their location
6. **Account Settings** - User can update location

---

## Testing Your Changes

After updating locations:

1. **Home Page**: Check the location dropdown in the search section
2. **Search Page**: Verify location filter shows new locations
3. **Store Creation**: Ensure sellers can select from new locations
4. **Registration**: Confirm location selector works during signup

---

## Example: Changing to Your Own Cities

Let's say you want to use cities in Texas only:

```typescript
export const LOCATIONS = [
  { value: 'houston', label: 'Houston' },
  { value: 'dallas', label: 'Dallas' },
  { value: 'austin', label: 'Austin' },
  { value: 'san-antonio', label: 'San Antonio' },
  { value: 'fort-worth', label: 'Fort Worth' },
  { value: 'el-paso', label: 'El Paso' },
  { value: 'arlington', label: 'Arlington' },
  { value: 'corpus-christi', label: 'Corpus Christi' },
];
```

---

## Need Help?

If you need a custom location set not listed here, you can:
1. Follow the format examples above
2. Ensure each location has a unique `value`
3. Make labels user-friendly
4. Test thoroughly after changes

---

## Quick Reference

| Field | Purpose | Example |
|-------|---------|---------|
| `value` | URL-friendly ID | `'new-york-ny'` |
| `label` | Display name | `'New York, NY'` |

**File to Edit:** `src/lib/locations.ts`  
**Array to Modify:** `LOCATIONS`  
**No Database Changes Needed:** Locations are frontend-only
