# Seller Performance Feature

## Overview
Added a comprehensive seller performance tracking section to the Admin Product Approvals page, helping admins identify trusted sellers and those needing guidance.

## Features Implemented

### 1. Seller Performance Table
A detailed table displaying key performance metrics for all active sellers:

#### Columns:
1. **Seller** - Seller's full name
2. **Store** - Store name
3. **Total** - Total products submitted (badge)
4. **Approved** - Number of approved products (green text)
5. **Rejected** - Number of rejected products (red text)
6. **Approval Rate** - Percentage with color-coded badges:
   - 🟢 Green (≥90%): Excellent performance with trending up icon
   - 🔵 Blue (70-89%): Good performance
   - 🟠 Orange (50-69%): Needs improvement
   - 🔴 Red (<50%): Requires guidance with trending down icon
7. **Avg Time** - Average approval time in hours

### 2. Performance Insights
The table helps admins:
- **Identify Trusted Sellers**: High approval rates (≥90%) indicate reliable sellers
- **Spot Issues Early**: Low approval rates (<70%) flag sellers needing guidance
- **Track Efficiency**: Average approval times show processing speed
- **Make Data-Driven Decisions**: Use metrics for seller verification programs

### 3. Visual Design
- **Color-Coded Badges**: Instant visual feedback on approval rates
- **Icons**: CheckCircle, XCircle, Clock for quick recognition
- **Responsive Table**: Horizontal scroll on mobile devices
- **Loading States**: Skeleton animations during data fetch
- **Empty State**: Friendly message when no data available

## Technical Implementation

### Database Function
Created `get_seller_performance_stats()` PostgreSQL function:
```sql
- Joins stores, profiles, and products tables
- Calculates approval rate: (approved / (approved + rejected)) * 100
- Calculates average approval time in hours
- Filters to only approved stores with products
- Returns top 20 sellers ordered by approval rate
- Uses SECURITY DEFINER for admin access
```

### API Layer
- `getSellerPerformanceStats()` function in `/src/db/api.ts`
- `SellerPerformanceStats` TypeScript interface
- Returns array of seller performance metrics

### UI Components
- **SellerPerformanceTable Component**: 
  - Reusable table component with all performance metrics
  - Color-coded approval rate badges
  - Icons for visual clarity
  - Loading and empty states
  - Responsive design with horizontal scroll

### Page Integration
- Added to `AdminProductApprovalsPage.tsx`
- Displayed below the pending products section
- Loads automatically on page mount
- Independent loading state

## Files Created/Modified

### Created:
1. `/src/components/SellerPerformanceTable.tsx` - Performance table component

### Modified:
1. `/src/db/api.ts` - Added getSellerPerformanceStats() and SellerPerformanceStats interface
2. `/src/pages/admin/AdminProductApprovalsPage.tsx` - Added seller performance section

### Database:
1. Migration: `add_seller_performance_stats_function` - Created get_seller_performance_stats() function

## Testing Results
- ✅ Lint check passed: 203 files, 0 errors
- ✅ Database function tested successfully
- ✅ Real data verification:
  - 1 seller tracked
  - Store: "BESTOLD"
  - 31 total products
  - 26 approved products
  - 0 rejected products
  - 5 pending products
  - 100% approval rate
  - 0h average approval time (instant approvals)

## Use Cases

### 1. Identify Top Performers
Admins can quickly see sellers with high approval rates (≥90%) for:
- Fast-track approval programs
- Featured seller badges
- Reduced review requirements
- Partnership opportunities

### 2. Provide Guidance
Sellers with low approval rates (<70%) may need:
- Product quality guidelines
- Photography tips
- Description writing help
- Category selection assistance

### 3. Monitor Trends
Track seller performance over time to:
- Identify improving sellers
- Spot declining quality
- Adjust approval processes
- Allocate admin resources

### 4. Fair Treatment
Objective metrics ensure:
- Consistent evaluation standards
- Data-driven decisions
- Transparent seller rankings
- Equal opportunities

## Benefits
1. **Efficiency**: Quickly identify trusted sellers for faster approvals
2. **Quality Control**: Spot problematic sellers early
3. **Seller Development**: Provide targeted guidance to improve quality
4. **Resource Allocation**: Focus admin time where it's most needed
5. **Transparency**: Clear, objective performance metrics
6. **Scalability**: Automated tracking as platform grows
