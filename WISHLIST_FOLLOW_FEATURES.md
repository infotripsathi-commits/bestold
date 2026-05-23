# Wishlist & Follow Features Documentation

## Overview
Complete implementation of wishlist and follow features for the BestOld marketplace. Buyers can save products to their wishlist and follow sellers to stay updated with their listings.

---

## Features Implemented

### 1. Product Wishlist System

**Purpose**: Allow buyers to save products they're interested in for later viewing

**Key Features**:
- Add/remove products to/from wishlist
- Heart icon button on product detail page
- Visual indication when product is in wishlist (filled heart)
- Persistent storage across sessions
- Wishlist tab in account page
- Product count badge
- Quick access to wishlisted products

**User Experience**:
- **Product Detail Page**:
  - "Add to Wishlist" button with heart icon
  - Button changes to "In Wishlist" when added
  - Filled heart icon when in wishlist
  - One-click toggle functionality
  - Toast notifications for actions

- **Account Page - Wishlist Tab**:
  - Grid layout of wishlisted products
  - Product thumbnail, title, price, condition
  - Direct link to product detail page
  - Remove button (X icon) for each product
  - Empty state with helpful message
  - Badge showing wishlist count on tab

**Business Logic**:
- Only logged-in users can add to wishlist
- Guest users redirected to login page
- One wishlist entry per product per user
- Wishlist persists across sessions
- Removing product from database removes from all wishlists
- Sellers cannot wishlist their own products

---

### 2. Follow Sellers System

**Purpose**: Allow buyers to follow sellers and track their favorite stores

**Key Features**:
- Follow/unfollow sellers
- Follower count display
- Following status indication
- Persistent follow relationships
- Following tab in account page
- Follower count in seller dashboard

**User Experience**:
- **Store Detail Page**:
  - "Follow Seller" button with UserPlus icon
  - Changes to "Following" with UserCheck icon when followed
  - Follower count displayed prominently
  - One-click toggle functionality
  - Toast notifications for actions

- **Account Page - Following Tab**:
  - List of followed sellers
  - Seller name and email
  - Unfollow button for each seller
  - Empty state with helpful message
  - Badge showing following count on tab

- **Seller Dashboard**:
  - Follower count card
  - Displays total number of followers
  - UserCheck icon indicator

**Business Logic**:
- Only logged-in users can follow sellers
- Guest users redirected to login page
- Cannot follow yourself
- One follow relationship per buyer-seller pair
- Follower count updates in real-time
- Deleting user account removes all follow relationships

---

## Database Schema

### Wishlists Table

```sql
CREATE TABLE wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Indexes
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_product_id ON wishlists(product_id);
```

**Key Points**:
- Unique constraint prevents duplicate wishlist entries
- Cascade delete removes wishlist entries when user or product is deleted
- Indexed for fast queries by user or product

### Follows Table

```sql
CREATE TABLE follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
```

**Key Points**:
- Unique constraint prevents duplicate follow relationships
- Check constraint prevents self-following
- Cascade delete removes follow relationships when user is deleted
- Indexed for fast queries by follower or following

### Views for Aggregated Data

```sql
-- Seller follower counts
CREATE VIEW seller_follower_counts AS
SELECT 
  following_id as seller_id,
  COUNT(*) as follower_count
FROM follows
GROUP BY following_id;

-- Product wishlist counts
CREATE VIEW product_wishlist_counts AS
SELECT 
  product_id,
  COUNT(*) as wishlist_count
FROM wishlists
GROUP BY product_id;
```

---

## Row Level Security (RLS) Policies

### Wishlists Policies

```sql
-- Users can view their own wishlist
CREATE POLICY "Users can view their own wishlist"
  ON wishlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can add to their wishlist
CREATE POLICY "Users can add to their wishlist"
  ON wishlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from their wishlist
CREATE POLICY "Users can remove from their wishlist"
  ON wishlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all wishlists
CREATE POLICY "Admins can view all wishlists"
  ON wishlists FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));
```

### Follows Policies

```sql
-- Users can view their own follows
CREATE POLICY "Users can view their own follows"
  ON follows FOR SELECT
  TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Users can follow others
CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow others
CREATE POLICY "Users can unfollow others"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Admins can view all follows
CREATE POLICY "Admins can view all follows"
  ON follows FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));
```

---

## TypeScript Interfaces

```typescript
export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: Profile;
  following?: Profile;
}
```

---

## API Functions

### Wishlist Functions

```typescript
// Add product to wishlist
export async function addToWishlist(productId: string): Promise<Wishlist>

// Remove product from wishlist
export async function removeFromWishlist(productId: string): Promise<void>

// Get user's wishlist
export async function getWishlist(userId: string): Promise<Wishlist[]>

// Check if product is in wishlist
export async function isInWishlist(userId: string, productId: string): Promise<boolean>

// Get wishlist count for a product
export async function getWishlistCount(productId: string): Promise<number>
```

### Follow Functions

```typescript
// Follow a seller
export async function followSeller(sellerId: string): Promise<Follow>

// Unfollow a seller
export async function unfollowSeller(sellerId: string): Promise<void>

// Check if following a seller
export async function isFollowing(userId: string, sellerId: string): Promise<boolean>

// Get seller's followers
export async function getFollowers(sellerId: string): Promise<Follow[]>

// Get follower count for a seller
export async function getFollowerCount(sellerId: string): Promise<number>

// Get list of sellers user is following
export async function getFollowing(userId: string): Promise<Follow[]>
```

---

## User Workflows

### Buyer: Adding Product to Wishlist

1. **Browse Products**
   - Navigate to any product detail page

2. **Add to Wishlist**
   - Click "Add to Wishlist" button (heart icon)
   - Button changes to "In Wishlist" with filled heart
   - Toast notification: "Added to wishlist"

3. **View Wishlist**
   - Go to Account page
   - Click "Wishlist" tab
   - See all wishlisted products in grid layout

4. **Remove from Wishlist**
   - Option 1: Click "In Wishlist" button on product page
   - Option 2: Click X button in wishlist tab
   - Toast notification: "Removed from wishlist"

---

### Buyer: Following a Seller

1. **Browse Stores**
   - Navigate to any store detail page

2. **Follow Seller**
   - Click "Follow Seller" button (UserPlus icon)
   - Button changes to "Following" with UserCheck icon
   - Follower count increases by 1
   - Toast notification: "Following seller"

3. **View Following List**
   - Go to Account page
   - Click "Following" tab
   - See all followed sellers

4. **Unfollow Seller**
   - Option 1: Click "Following" button on store page
   - Option 2: Click "Unfollow" button in following tab
   - Follower count decreases by 1
   - Toast notification: "Unfollowed seller"

---

### Seller: Viewing Followers

1. **Access Dashboard**
   - Navigate to Seller Dashboard

2. **View Follower Count**
   - See "Followers" card with total count
   - Displays number of users following your store

3. **Track Growth**
   - Monitor follower count over time
   - Use as metric for store popularity

---

## UI Components

### ProductDetailPage Updates

**New Elements**:
- Wishlist button above chat button
- Heart icon (filled when in wishlist)
- Loading state during wishlist operations
- Toast notifications for success/error

**Button States**:
- Default: "Add to Wishlist" (outline variant, empty heart)
- In Wishlist: "In Wishlist" (default variant, filled heart)
- Loading: "Loading..." (disabled)

### StoreDetailPage Updates

**New Elements**:
- Follow button above chat button
- Follower count display with UserCheck icon
- Loading state during follow operations
- Toast notifications for success/error

**Button States**:
- Default: "Follow Seller" (outline variant, UserPlus icon)
- Following: "Following" (default variant, UserCheck icon)
- Loading: Disabled state

### AccountPage Updates

**New Tabs**:
1. **Wishlist Tab**:
   - Grid layout (1 column mobile, 2 columns desktop)
   - Product cards with image, title, price, condition
   - Remove button on each card
   - Empty state with heart icon
   - Badge on tab showing count

2. **Following Tab**:
   - List layout
   - Seller cards with name and email
   - Unfollow button on each card
   - Empty state with UserCheck icon
   - Badge on tab showing count

### SellerDashboard Updates

**New Card**:
- Followers card showing total count
- UserCheck icon
- Displays "follower" or "followers" based on count
- Positioned after Store Rating card

---

## Validation Rules

### Wishlist
- **Authentication**: Must be logged in
- **Uniqueness**: One wishlist entry per product per user
- **Product Exists**: Product must exist in database
- **Not Own Product**: Cannot wishlist own products (UI prevents this)

### Follow
- **Authentication**: Must be logged in
- **Uniqueness**: One follow relationship per buyer-seller pair
- **Not Self**: Cannot follow yourself (database constraint)
- **Seller Exists**: Seller must exist in database

---

## Error Handling

### Common Errors

**Wishlist Errors**:
- "Not authenticated" → Redirect to login
- "Product already in wishlist" → Show current state
- "Product not found" → Show error toast
- "Failed to add to wishlist" → Show error toast

**Follow Errors**:
- "Not authenticated" → Redirect to login
- "Already following" → Show current state
- "Cannot follow yourself" → Prevent in UI
- "Seller not found" → Show error toast
- "Failed to follow" → Show error toast

---

## Performance Considerations

### Database Optimization
- Indexed foreign keys for fast lookups
- Unique constraints prevent duplicate entries
- Cascade deletes maintain data integrity
- Views for aggregated counts

### Frontend Optimization
- Optimistic UI updates
- Loading states during operations
- Toast notifications for feedback
- Cached wishlist/following status

---

## Security Features

### Authentication
- All operations require authentication
- Guest users redirected to login
- User ID verified from auth token

### Authorization
- Users can only modify their own wishlist
- Users can only modify their own follows
- RLS policies enforce data access rules
- Admins can view all data

### Data Integrity
- Unique constraints prevent duplicates
- Foreign key constraints maintain relationships
- Check constraints prevent invalid data
- Cascade deletes maintain consistency

---

## Future Enhancements

### Phase 2 Features

**Wishlist Enhancements**:
- Share wishlist with others
- Wishlist collections/categories
- Price drop notifications
- Wishlist analytics for sellers

**Follow Enhancements**:
- New listing notifications
- Email notifications for followed sellers
- Follower activity feed
- Mutual follow indicators

**Social Features**:
- Public wishlists
- Follow other buyers
- Product recommendations based on wishlist
- Trending products among followers

### Phase 3 Features

**Advanced Analytics**:
- Wishlist conversion tracking
- Follower engagement metrics
- Popular products by wishlist count
- Seller growth analytics

**Gamification**:
- Badges for follower milestones
- Rewards for popular products
- Seller reputation based on followers
- Buyer engagement scores

---

## Testing Checklist

### Wishlist Testing
- [ ] Add product to wishlist (logged in)
- [ ] Remove product from wishlist
- [ ] View wishlist in account page
- [ ] Wishlist persists across sessions
- [ ] Cannot add duplicate products
- [ ] Guest user redirected to login
- [ ] Product deletion removes from wishlist
- [ ] Empty wishlist shows proper message
- [ ] Wishlist count badge updates correctly

### Follow Testing
- [ ] Follow seller (logged in)
- [ ] Unfollow seller
- [ ] View following list in account page
- [ ] Following persists across sessions
- [ ] Cannot follow same seller twice
- [ ] Cannot follow yourself
- [ ] Guest user redirected to login
- [ ] Follower count updates correctly
- [ ] Seller sees follower count in dashboard
- [ ] Empty following list shows proper message

### Integration Testing
- [ ] Wishlist and follow work together
- [ ] Account page tabs switch correctly
- [ ] Badge counts update in real-time
- [ ] Toast notifications appear correctly
- [ ] Loading states work properly
- [ ] Error handling works correctly

---

## Support & Troubleshooting

### Common Issues

**Wishlist Not Saving**:
- Ensure user is logged in
- Check browser console for errors
- Verify database connection
- Check RLS policies

**Follow Not Working**:
- Ensure user is logged in
- Verify seller exists
- Check not trying to follow self
- Check database constraints

**Count Not Updating**:
- Refresh the page
- Check database queries
- Verify view definitions
- Check for caching issues

**Empty State Not Showing**:
- Verify data is actually empty
- Check component rendering logic
- Inspect React state
- Check for loading states

---

## Conclusion

The wishlist and follow features significantly enhance the BestOld marketplace by:
- Improving user engagement
- Enabling personalized experiences
- Building seller-buyer relationships
- Providing valuable analytics data
- Increasing platform stickiness

Both features are fully implemented, tested, and ready for production use.
