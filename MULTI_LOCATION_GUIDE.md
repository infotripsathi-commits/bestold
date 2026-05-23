# 🏢 Multi-Location Management System

## Overview

The BESTOLD platform now supports **multi-location management** for store owners who operate multiple physical locations. This enterprise-level feature enables comprehensive management of locations, inventory, staff, and analytics across all your stores.

---

## ✅ What's Implemented

### 1. Location Management Dashboard
**URL**: `/seller/locations`

- ✅ Add unlimited physical locations
- ✅ Edit location details
- ✅ Delete locations
- ✅ Set primary location
- ✅ Activate/deactivate locations
- ✅ Manage location-specific information

### 2. Location Information
Each location includes:
- ✅ Location name (e.g., "Downtown Branch", "Mall Location")
- ✅ Complete address (street, city, state, ZIP)
- ✅ GPS coordinates (latitude/longitude)
- ✅ Contact information (phone, email)
- ✅ Manager details (name, phone, email)
- ✅ Business hours (JSON format)
- ✅ Status (active/inactive)
- ✅ Primary location flag

### 3. Location-Specific Inventory
- ✅ Assign products to specific locations
- ✅ Track quantity per location
- ✅ Reserved quantity for pending orders
- ✅ Available quantity (auto-calculated)
- ✅ Low stock threshold alerts
- ✅ Last restocked date tracking

### 4. Staff Management
- ✅ Assign staff to locations
- ✅ Track staff roles (Manager, Sales Associate, etc.)
- ✅ Staff contact information
- ✅ Hire date tracking
- ✅ Active/inactive status

### 5. Location Analytics
- ✅ Daily performance metrics per location
- ✅ Visits tracking
- ✅ Product views
- ✅ Orders and revenue
- ✅ Items sold
- ✅ Average order value

---

## 🚀 Quick Start

### Step 1: Access Location Management

1. Log in as a seller
2. Go to `/seller/locations`
3. Click "Add Location"

### Step 2: Add Your First Location

Fill in the required information:

```
Location Name: Downtown Branch
Street Address: 123 Main Street
City: New York
State: NY
ZIP Code: 10001
Phone: (212) 555-0123
Email: downtown@yourstore.com
```

**Optional but Recommended**:
- GPS Coordinates (for maps and directions)
- Manager Information
- Business Hours
- Notes

### Step 3: Set Primary Location

- Check "Primary Location" for your main store
- This location will be shown by default
- Only one location can be primary

### Step 4: Add More Locations

Repeat the process for each physical location you operate.

---

## 📊 Database Schema

### store_locations Table

```sql
CREATE TABLE store_locations (
  id uuid PRIMARY KEY,
  store_id uuid REFERENCES stores(id),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  country text DEFAULT 'US',
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  phone text,
  email text,
  is_primary boolean DEFAULT false,
  is_active boolean DEFAULT true,
  business_hours jsonb,
  manager_name text,
  manager_phone text,
  manager_email text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### location_inventory Table

```sql
CREATE TABLE location_inventory (
  id uuid PRIMARY KEY,
  product_id uuid REFERENCES products(id),
  location_id uuid REFERENCES store_locations(id),
  quantity integer DEFAULT 0,
  reserved_quantity integer DEFAULT 0,
  available_quantity integer GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  low_stock_threshold integer DEFAULT 5,
  last_restocked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, location_id)
);
```

### location_staff Table

```sql
CREATE TABLE location_staff (
  id uuid PRIMARY KEY,
  location_id uuid REFERENCES store_locations(id),
  user_id uuid REFERENCES profiles(id),
  name text NOT NULL,
  role text NOT NULL,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  hire_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### location_analytics Table

```sql
CREATE TABLE location_analytics (
  id uuid PRIMARY KEY,
  location_id uuid REFERENCES store_locations(id),
  date date NOT NULL,
  visits integer DEFAULT 0,
  product_views integer DEFAULT 0,
  orders integer DEFAULT 0,
  revenue numeric(10, 2) DEFAULT 0,
  items_sold integer DEFAULT 0,
  avg_order_value numeric(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(location_id, date)
);
```

---

## 🎯 Use Cases

### 1. Retail Chain

**Scenario**: You operate 5 thrift stores across different cities.

**Solution**:
- Add all 5 locations to your store
- Set your flagship store as primary
- Track inventory separately for each location
- Assign managers to each location
- Compare performance across locations

**Benefits**:
- Centralized management
- Location-specific inventory
- Performance comparison
- Staff accountability

### 2. Franchise Operation

**Scenario**: You have franchise locations in multiple states.

**Solution**:
- Create location for each franchise
- Assign franchise managers
- Track sales per location
- Monitor inventory levels
- Identify top-performing locations

**Benefits**:
- Franchise oversight
- Performance benchmarking
- Inventory optimization
- Data-driven expansion

### 3. Pop-Up Stores

**Scenario**: You operate temporary locations at events and markets.

**Solution**:
- Add pop-up locations as needed
- Deactivate when event ends
- Track performance per event
- Compare event profitability
- Plan future events

**Benefits**:
- Flexible location management
- Event performance tracking
- Historical data retention
- Strategic planning

---

## 📍 Location Management Features

### Primary Location

**What it means**:
- Shown by default on your store page
- Used for store-level contact information
- Featured in search results
- Default for new products

**How to set**:
1. Edit any location
2. Check "Primary Location"
3. Save changes
4. Other locations automatically become non-primary

### Active/Inactive Status

**Active Locations**:
- Visible to customers
- Accept orders
- Show in store locator
- Included in analytics

**Inactive Locations**:
- Hidden from customers
- No new orders
- Not in store locator
- Historical data preserved

**Use Cases**:
- Temporarily closed locations
- Seasonal stores
- Locations under renovation
- Discontinued locations

### GPS Coordinates

**Why they're important**:
- Accurate map display
- Distance calculations
- "Near me" searches
- Directions to store

**How to get them**:
1. Find your location on Google Maps
2. Right-click on the exact spot
3. Click the coordinates to copy
4. Paste into location form

**Example**: 40.7128, -74.0060

---

## 📦 Inventory Management

### Location-Specific Inventory

**How it works**:
- Each product can have different quantities at different locations
- Customers see combined availability
- Can choose pickup location
- Inventory tracked separately

**Example**:
```
Product: iPhone 13 Pro

Location A (Downtown): 5 units
Location B (Mall): 3 units
Location C (Airport): 2 units

Total Available: 10 units
```

### Reserved Quantity

**What it is**:
- Quantity held for pending orders
- Automatically calculated
- Prevents overselling
- Released when order completes/cancels

**Formula**:
```
Available Quantity = Total Quantity - Reserved Quantity
```

### Low Stock Alerts

**How it works**:
- Set threshold per product per location
- Get notified when stock is low
- Restock before running out
- Prevent lost sales

**Example**:
```
Product: Vintage Jacket
Location: Downtown Branch
Quantity: 3 units
Threshold: 5 units
Status: ⚠️ Low Stock - Restock Needed
```

---

## 👥 Staff Management

### Staff Roles

**Common Roles**:
- Store Manager
- Assistant Manager
- Sales Associate
- Inventory Clerk
- Cashier
- Security

**Custom Roles**:
- Define your own roles
- Match your organization
- Track responsibilities

### Staff Information

**What to track**:
- Full name
- Role/position
- Contact information (phone, email)
- Hire date
- Active status
- Notes

**Benefits**:
- Staff directory
- Contact management
- Performance tracking
- Scheduling support

---

## 📊 Location Analytics

### Metrics Tracked

**Daily Metrics**:
- Visits (store page views)
- Product views
- Orders placed
- Revenue generated
- Items sold
- Average order value

**How to use**:
- Compare locations
- Identify trends
- Optimize operations
- Allocate resources

### Performance Comparison

**Compare by**:
- Revenue
- Orders
- Conversion rate
- Average order value
- Items per order

**Identify**:
- Top performers
- Underperformers
- Growth opportunities
- Problem areas

---

## 🎯 Best Practices

### 1. Location Naming

**Good Names**:
- "Downtown Manhattan Store"
- "Brooklyn Mall Location"
- "Queens Pop-Up Shop"
- "Bronx Warehouse Outlet"

**Bad Names**:
- "Store 1"
- "Location A"
- "Shop"

**Why it matters**:
- Customer clarity
- Internal organization
- Search optimization
- Professional appearance

### 2. Complete Information

**Always include**:
- ✅ Full address
- ✅ Phone number
- ✅ GPS coordinates
- ✅ Business hours
- ✅ Manager contact

**Benefits**:
- Better customer experience
- Accurate directions
- Local SEO boost
- Professional image

### 3. Regular Updates

**Keep current**:
- Business hours
- Manager information
- Phone numbers
- Special notes

**Update when**:
- Hours change
- Manager changes
- Phone changes
- Temporary closures

### 4. Inventory Accuracy

**Maintain accuracy**:
- Update quantities regularly
- Set realistic thresholds
- Track restocking
- Monitor reserved items

**Prevents**:
- Overselling
- Customer disappointment
- Negative reviews
- Lost sales

---

## 🔧 Technical Implementation

### Adding a Location

```typescript
const locationData = {
  store_id: 'your-store-id',
  name: 'Downtown Branch',
  address: '123 Main Street',
  city: 'New York',
  state: 'NY',
  zip_code: '10001',
  country: 'US',
  latitude: 40.7128,
  longitude: -74.0060,
  phone: '(212) 555-0123',
  email: 'downtown@store.com',
  is_primary: true,
  is_active: true,
  manager_name: 'John Doe',
  manager_phone: '(212) 555-0124',
  manager_email: 'john@store.com',
};

await supabase
  .from('store_locations')
  .insert([locationData]);
```

### Querying Locations

```typescript
// Get all active locations for a store
const { data: locations } = await supabase
  .from('store_locations')
  .select('*')
  .eq('store_id', storeId)
  .eq('is_active', true)
  .order('is_primary', { ascending: false });

// Get primary location
const { data: primary } = await supabase
  .from('store_locations')
  .select('*')
  .eq('store_id', storeId)
  .eq('is_primary', true)
  .single();
```

### Managing Inventory

```typescript
// Add inventory for a location
await supabase
  .from('location_inventory')
  .insert([{
    product_id: 'product-id',
    location_id: 'location-id',
    quantity: 10,
    low_stock_threshold: 3,
  }]);

// Update quantity
await supabase
  .from('location_inventory')
  .update({ quantity: 15 })
  .eq('product_id', productId)
  .eq('location_id', locationId);

// Check availability
const { data: inventory } = await supabase
  .from('location_inventory')
  .select('available_quantity')
  .eq('product_id', productId)
  .eq('location_id', locationId)
  .single();
```

---

## 🎯 Future Enhancements

### Coming Soon

1. **Bulk Operations**
   - Update hours across all locations
   - Post announcements to all locations
   - Bulk inventory updates

2. **Location Comparison Reports**
   - Side-by-side performance
   - Trend analysis
   - Benchmarking

3. **Location Expansion Planner**
   - Market analysis
   - Demand forecasting
   - Optimal location suggestions

4. **Google My Business Integration**
   - Auto-create GMB profiles
   - Sync information
   - Manage reviews

5. **Advanced Analytics**
   - Customer demographics per location
   - Product performance by location
   - Seasonal trends
   - Predictive analytics

---

## 📚 Resources

### Documentation
- **This Guide**: MULTI_LOCATION_GUIDE.md
- **Local SEO**: LOCAL_SEO_GUIDE.md
- **SEO Guide**: SEO_GUIDE.md

### Database
- Migration: `00040_add_multi_location_support.sql`
- Tables: store_locations, location_inventory, location_staff, location_analytics

### UI Components
- Location Management Page: `/seller/locations`
- Component: `src/pages/seller/LocationManagementPage.tsx`

---

## ✅ Checklist

### Initial Setup
- [ ] Access location management dashboard
- [ ] Add first location
- [ ] Set as primary location
- [ ] Add GPS coordinates
- [ ] Add manager information
- [ ] Set business hours

### For Each Additional Location
- [ ] Add location details
- [ ] Add GPS coordinates
- [ ] Assign manager
- [ ] Set business hours
- [ ] Activate location
- [ ] Add staff members

### Inventory Setup
- [ ] Assign products to locations
- [ ] Set quantities per location
- [ ] Set low stock thresholds
- [ ] Track restocking dates

### Ongoing Management
- [ ] Update business hours
- [ ] Monitor inventory levels
- [ ] Review location analytics
- [ ] Update manager information
- [ ] Maintain accurate data

---

## 🎉 Benefits

### For Store Owners

**Operational Efficiency**:
- Centralized management
- Real-time inventory tracking
- Staff accountability
- Performance insights

**Growth Support**:
- Easy expansion
- Location comparison
- Data-driven decisions
- Scalable infrastructure

**Cost Savings**:
- Optimized inventory
- Reduced stockouts
- Better resource allocation
- Improved efficiency

### For Customers

**Better Experience**:
- Choose pickup location
- Accurate availability
- Store information
- Easy directions

**Convenience**:
- Multiple locations
- Local pickup options
- Nearby stores
- Flexible shopping

---

## 🆘 Troubleshooting

### "Can't add location"

**Check**:
1. ✅ Are you logged in as seller?
2. ✅ Do you have a store created?
3. ✅ Are all required fields filled?

**Solution**: Ensure store exists and all required fields are completed.

### "Primary location not updating"

**Reason**: Only one location can be primary at a time.

**Solution**: System automatically updates other locations when you set a new primary.

### "Inventory not showing"

**Check**:
1. ✅ Is location active?
2. ✅ Is inventory added for this location?
3. ✅ Is quantity greater than 0?

**Solution**: Activate location and add inventory records.

---

## 📞 Support

Need help? Contact support or refer to:
- Documentation: MULTI_LOCATION_GUIDE.md
- Database Schema: 00040_add_multi_location_support.sql
- Component Code: src/pages/seller/LocationManagementPage.tsx

---

*Last Updated: 2026-03-24*
*Version: 1.0.0*
*Status: Production Ready*
