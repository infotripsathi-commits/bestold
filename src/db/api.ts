import { supabase } from './supabase';
import type {
  Profile,
  Category,
  Store,
  Product,
  Review,
  Conversation,
  Message,
  Follow,
  StoreBanner,
  SearchFilters,
  ProductCondition,
  ProductStatus,
  StoreApprovalStatus,
  Location,
  SiteSetting,
  PhoneBrand,
  PhoneModel,
  PhoneCondition,
  PhoneAgeOption,
  PhoneVariant,
  EmailConfiguration,
  EmailProvider,
  FeaturedStorePlan,
  FeaturedStoreApplication,
  FeaturedStoreDisplay,
  CarDetails,
  CarBrand,
  BikeDetails,
  BikeBrand,
} from '@/types';

// Export supabase client for direct use
export { supabase };

// ============ Profiles ============
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Profile | null;
}

export async function createProfileIfNotExists(userId: string, email: string, fullName?: string) {
  const { data, error } = await supabase.rpc('create_profile_if_not_exists', {
    p_user_id: userId,
    p_email: email,
    p_full_name: fullName || '',
    p_role: 'buyer',
  });

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Profile;
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function updateUserRole(userId: string, role: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Profile;
}

export async function deleteUser(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  
  if (error) throw error;
}

// ============ Categories ============
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order')
    .order('name');
  
  if (error) {
    console.error('getCategories error:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function getCategoriesWithSubcategories() {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      subcategories(*)
    `)
    .order('display_order')
    .order('name');
  
  if (error) {
    console.error('getCategoriesWithSubcategories error:', error);
    return [];
  }
  
  // Sort subcategories within each category
  const categoriesWithSortedSubs = (Array.isArray(data) ? data : []).map(cat => ({
    ...cat,
    subcategories: Array.isArray(cat.subcategories) 
      ? cat.subcategories.sort((a: any, b: any) => a.display_order - b.display_order)
      : []
  }));
  
  return categoriesWithSortedSubs;
}

export async function getAllCategories() {
  return getCategories();
}

export async function createCategory(category: {
  name: string;
  image_url?: string;
  display_order?: number;
}) {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(categoryId: string, updates: Partial<Category>) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(categoryId: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);
  
  if (error) throw error;
}

// ============ Subcategories ============
export async function getSubcategories(categoryId?: string) {
  let query = supabase
    .from('subcategories')
    .select('*')
    .order('display_order', { ascending: true });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createSubcategory(subcategory: {
  category_id: string;
  name: string;
  display_order?: number;
}) {
  const { data, error } = await supabase
    .from('subcategories')
    .insert([subcategory])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateSubcategory(id: string, updates: { name?: string; display_order?: number }) {
  const { data, error } = await supabase
    .from('subcategories')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteSubcategory(id: string) {
  const { error } = await supabase
    .from('subcategories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ Stores ============
export async function getStore(storeId: string) {
  const { data, error } = await supabase
    .from('stores')
    .select('*, seller:profiles!seller_id(*)')
    .eq('id', storeId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Store | null;
}

export async function getStoreByUserId(userId: string) {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('seller_id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Store | null;
}

export async function getSellerStores(userId: string) {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('seller_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Store[];
}

export async function createStore(store: {
  name: string;
  description?: string;
  location: string;
  contact_info?: string;
  banner_image_url?: string;
  shop_images?: string[];
  trade_license_url?: string;
  latitude?: number;
  longitude?: number;
  phone_number?: string;
  youtube_url?: string;
  facebook_url?: string;
  instagram_url?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('stores')
    .insert({
      ...store,
      seller_id: user.id,
      approval_status: 'pending', // Explicitly set to pending
      shop_images: store.shop_images || [],
    })
    .select()
    .maybeSingle();
  
  if (error) {
    console.error('Store creation error:', error);
    throw new Error(error.message || 'Failed to create store');
  }
  return data as Store;
}

export async function updateStore(storeId: string, updates: Partial<Store>) {
  // Strip non-column fields that come from joined queries
  const { seller: _seller, ...safeUpdates } = updates as Partial<Store> & { seller?: unknown };

  const { data, error } = await supabase
    .from('stores')
    .update(safeUpdates)
    .eq('id', storeId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Update failed: store not found or permission denied. Please refresh and try again.');
  return data as Store;
}

export async function deleteStore(storeId: string) {
  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', storeId);
  
  if (error) throw error;
}

export async function pauseStore(storeId: string) {
  const { error } = await supabase
    .from('stores')
    .update({ approval_status: 'paused' })
    .eq('id', storeId);
  
  if (error) throw error;
}

export async function unpauseStore(storeId: string) {
  const { error } = await supabase
    .from('stores')
    .update({ approval_status: 'approved' })
    .eq('id', storeId);
  
  if (error) throw error;
}

export async function getAllStores(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('stores')
    .select('*, seller:profiles!seller_id(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ============ Products ============
export async function getProduct(productId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, store:stores!store_id(*, seller:profiles!seller_id(*)), category:categories!category_id(*)')
    .eq('id', productId)
    .is('deleted_at', null)
    .maybeSingle();
  
  if (error) throw error;
  return data as Product | null;
}

export async function getProductsByStore(storeId: string, limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories!category_id(*)')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getProductsByStoreForSeller(storeId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories!category_id(*)')
    .eq('store_id', storeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createProduct(product: {
  store_id: string;
  title: string;
  description?: string;
  price: number;
  condition: ProductCondition;
  category_id?: string;
  subcategory_id?: string;
  images?: string[];
  car_details?: CarDetails | null;
  bike_details?: BikeDetails | null;
}) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...product,
      status: 'pending_approval', // All new products require admin approval
    })
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(productId: string, updates: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(productId: string) {
  // Use soft delete to preserve order history
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', productId);
  
  if (error) {
    // If soft delete fails, provide helpful error message
    if (error.message.includes('foreign key')) {
      throw new Error('Cannot delete product with existing orders. Product has been archived instead.');
    }
    throw error;
  }
}

export async function getFeaturedProducts(limit = 12, location?: string) {
  try {
    let query = supabase
      .from('products')
      .select('*, store:stores!store_id(name, location, latitude, longitude, is_franchise, online_selling_enabled, store_pickup_enabled, approval_status), category:categories!category_id(*)')
      .eq('status', 'active')
      .is('deleted_at', null);

    let products: any[] = [];

    // Filter by location if provided
    if (location && location !== 'all') {
      // First get stores in the exact location that are approved (not paused)
      const { data: storesInLocation } = await supabase
        .from('stores')
        .select('id, latitude, longitude')
        .eq('location', location)
        .eq('approval_status', 'approved');
      
      if (storesInLocation && storesInLocation.length > 0) {
        const storeIds = storesInLocation.map(s => s.id);
        const { data } = await query.in('store_id', storeIds)
          .order('created_at', { ascending: false })
          .limit(limit * 2);
        
        products = Array.isArray(data) ? data : [];
      }

      // If no products found in exact location, search within 300km radius
      if (products.length === 0 && storesInLocation && storesInLocation.length > 0) {
        const referenceStore = storesInLocation[0];
        
        if (referenceStore.latitude && referenceStore.longitude) {
          // Get all stores with coordinates that are approved (not paused)
          const { data: allStores } = await supabase
            .from('stores')
            .select('id, latitude, longitude')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .eq('approval_status', 'approved');
          
          if (allStores) {
            // Calculate distance and filter stores within 300km
            const nearbyStores = allStores.filter(store => {
              if (!store.latitude || !store.longitude) return false;
              
              const distance = calculateDistance(
                parseFloat(referenceStore.latitude),
                parseFloat(referenceStore.longitude),
                parseFloat(store.latitude),
                parseFloat(store.longitude)
              );
              
              return distance <= 300; // 300km radius
            });

            if (nearbyStores.length > 0) {
              const nearbyStoreIds = nearbyStores.map(s => s.id);
              const { data } = await supabase
                .from('products')
                .select('*, store:stores!store_id(name, location, latitude, longitude, is_franchise, online_selling_enabled, store_pickup_enabled, approval_status), category:categories!category_id(*)')
                .eq('status', 'active')
                .in('store_id', nearbyStoreIds)
                .order('created_at', { ascending: false })
                .limit(limit * 2);
              
              products = Array.isArray(data) ? data : [];
              console.log(`Found ${products.length} products within 300km of ${location}`);
            }
          }
        }
      }
    } else {
      // No location filter - show all products from approved stores only
      const { data: approvedStores } = await supabase
        .from('stores')
        .select('id')
        .eq('approval_status', 'approved');
      
      if (approvedStores && approvedStores.length > 0) {
        const storeIds = approvedStores.map(s => s.id);
        const { data, error } = await query
          .in('store_id', storeIds)
          .order('created_at', { ascending: false })
          .limit(limit * 2);
        
        if (error) {
          console.error('getFeaturedProducts error:', error);
          return [];
        }
        
        products = Array.isArray(data) ? data : [];
      }
    }

    // Additional safety filter: exclude products from paused stores
    const filteredProducts = products.filter(p => 
      p.store?.approval_status === 'approved'
    );

    // Sort by created_at (newest first)
    const sorted = filteredProducts.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return sorted.slice(0, limit);
  } catch (error) {
    console.error('getFeaturedProducts error:', error);
    return [];
  }
}

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function getAllProducts(limit = 20, offset = 0) {
  // Get approved stores only (exclude paused stores)
  const { data: approvedStores } = await supabase
    .from('stores')
    .select('id')
    .eq('approval_status', 'approved');
  
  if (!approvedStores || approvedStores.length === 0) {
    return [];
  }
  
  const storeIds = approvedStores.map(s => s.id);
  
  const { data, error } = await supabase
    .from('products')
    .select('*, store:stores!store_id(name, seller_id, is_franchise, online_selling_enabled, store_pickup_enabled, approval_status), category:categories!category_id(*)')
    .is('deleted_at', null)
    .in('store_id', storeIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ============ Search ============
export async function searchProducts(filters: SearchFilters, limit = 20, offset = 0) {
  // Get approved stores only (exclude paused stores)
  const { data: approvedStores } = await supabase
    .from('stores')
    .select('id')
    .eq('approval_status', 'approved');
  
  if (!approvedStores || approvedStores.length === 0) {
    return [];
  }
  
  const storeIds = approvedStores.map(s => s.id);
  
  let query = supabase
    .from('products')
    .select('*, store:stores!store_id(name, location, latitude, longitude, is_franchise, online_selling_enabled, store_pickup_enabled, approval_status), category:categories!category_id(*), subcategory:subcategories!subcategory_id(*)')
    .eq('status', 'active')
    .is('deleted_at', null)
    .in('store_id', storeIds);

  if (filters.query) {
    query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
  }

  // Multi-select filtering (new)
  if (filters.subcategory_ids && filters.subcategory_ids.length > 0) {
    query = query.in('subcategory_id', filters.subcategory_ids);
  } else if (filters.category_ids && filters.category_ids.length > 0) {
    query = query.in('category_id', filters.category_ids);
  }
  // Single-select filtering (backward compatibility)
  else if (filters.subcategory_id) {
    query = query.eq('subcategory_id', filters.subcategory_id);
  } else if (filters.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;

  let products = Array.isArray(data) ? data : [];

  // Filter by coordinates and radius if specified
  if (filters.latitude && filters.longitude && filters.radiusKm) {
    products = products.filter(product => {
      if (!product.store?.latitude || !product.store?.longitude) return false;

      const lat = parseFloat(product.store.latitude);
      const lng = parseFloat(product.store.longitude);

      if (isNaN(lat) || isNaN(lng)) return false;

      const distance = calculateDistance(
        filters.latitude!,
        filters.longitude!,
        lat,
        lng
      );

      return distance <= filters.radiusKm!;
    });

    // Sort by distance (nearest first) when using coordinate search
    products = products.sort((a, b) => {
      const distA = calculateDistance(
        filters.latitude!,
        filters.longitude!,
        parseFloat(a.store!.latitude!),
        parseFloat(a.store!.longitude!)
      );
      const distB = calculateDistance(
        filters.latitude!,
        filters.longitude!,
        parseFloat(b.store!.latitude!),
        parseFloat(b.store!.longitude!)
      );
      return distA - distB;
    });
  } else if (filters.location) {
    // Filter by location name if specified (fallback to text-based search)
    products = products.filter(product => 
      product.store?.location?.toLowerCase().includes(filters.location!.toLowerCase())
    );

    // Sort by created_at (newest first)
    products = products.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  } else {
    // Sort by created_at (newest first)
    products = products.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  // Apply pagination after sorting
  return products.slice(offset, offset + limit);
}

export async function searchStores(filters: SearchFilters, limit = 20, offset = 0) {
  let query = supabase
    .from('stores')
    .select('*, seller:profiles!seller_id(*)');

  if (filters.query) {
    query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
  }

  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;

  const stores = Array.isArray(data) ? data : [];

  // Sort by created_at (newest first)
  const sorted = stores.sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Apply pagination after sorting
  return sorted.slice(offset, offset + limit);
}

// ============ Reviews ============
export async function getReviewsByStore(storeId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, buyer:profiles!buyer_id(*)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getReviewByBuyerAndStore(buyerId: string, storeId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('buyer_id', buyerId)
    .eq('store_id', storeId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Review | null;
}

export async function createReview(review: {
  store_id: string;
  rating: number;
  comment?: string;
}) {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Review;
}

export async function updateReview(reviewId: string, updates: { rating: number; comment?: string }) {
  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', reviewId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Review;
}

export async function deleteReview(reviewId: string) {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);
  
  if (error) throw error;
}

export async function getAllReviews(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, buyer:profiles!buyer_id(*), store:stores!store_id(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ============ Conversations ============
export async function getConversationsByUser(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, buyer:profiles!buyer_id(*), seller:profiles!seller_id(*), store:stores!store_id(*), product:products!product_id(*)')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getOrCreateConversation(params: {
  buyer_id: string;
  seller_id: string;
  store_id: string;
  product_id?: string;
}) {
  // Try to find existing conversation
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('*')
    .eq('buyer_id', params.buyer_id)
    .eq('seller_id', params.seller_id)
    .eq('store_id', params.store_id)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing as Conversation;

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert(params)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Conversation;
}

// ============ Messages ============
export async function getMessagesByConversation(conversationId: string, limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function sendMessage(message: {
  conversation_id: string;
  content: string;
  sender_id?: string;
}) {
  // If sender_id not provided, get from auth
  if (!message.sender_id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    message.sender_id = user.id;
  }

  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select()
    .maybeSingle();
  
  if (error) throw error;

  // Update conversation last_message_at
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', message.conversation_id);

  return data as Message;
}

// ============ Image Upload ============
export async function uploadProductImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('app-ahn8efyun8ch_products_images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('app-ahn8efyun8ch_products_images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteProductImage(imageUrl: string) {
  const path = imageUrl.split('/').slice(-2).join('/');
  
  const { error } = await supabase.storage
    .from('app-ahn8efyun8ch_products_images')
    .remove([path]);

  if (error) throw error;
}

// ============ Follows ============
export async function followSeller(sellerId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id: sellerId })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Follow;
}

export async function unfollowSeller(sellerId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', sellerId);

  if (error) throw error;
}

export async function isFollowing(userId: string, sellerId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', userId)
    .eq('following_id', sellerId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function getFollowers(sellerId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      *,
      follower:profiles!follows_follower_id_fkey(*)
    `)
    .eq('following_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getFollowerCount(sellerId: string) {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', sellerId);

  if (error) throw error;
  return count || 0;
}

export async function getFollowing(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      *,
      following:profiles!follows_following_id_fkey(*)
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ============ Store Banners ============
export async function getActiveBanners() {
  const { data, error } = await supabase
    .from('store_banners')
    .select(`
      *,
      store:stores(*)
    `)
    .eq('is_active', true)
    .order('display_order')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAllBanners() {
  const { data, error } = await supabase
    .from('store_banners')
    .select(`
      *,
      store:stores(*)
    `)
    .order('display_order')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createBanner(banner: {
  store_id: string;
  banner_image_url: string;
  title?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
}) {
  const { data, error } = await supabase
    .from('store_banners')
    .insert(banner)
    .select(`
      *,
      store:stores(*)
    `)
    .maybeSingle();

  if (error) throw error;
  return data as StoreBanner;
}

export async function updateBanner(bannerId: string, updates: Partial<StoreBanner>) {
  const { data, error } = await supabase
    .from('store_banners')
    .update(updates)
    .eq('id', bannerId)
    .select(`
      *,
      store:stores(*)
    `)
    .maybeSingle();

  if (error) throw error;
  return data as StoreBanner;
}

export async function deleteBanner(bannerId: string) {
  const { error } = await supabase
    .from('store_banners')
    .delete()
    .eq('id', bannerId);

  if (error) throw error;
}

// ============ Store Approval ============
export async function approveStore(storeId: string, adminId: string) {
  const { error } = await supabase.rpc('approve_store', {
    store_id_param: storeId,
    admin_id_param: adminId,
  });

  if (error) throw error;
}

export async function rejectStore(storeId: string, adminId: string, reason: string) {
  const { error } = await supabase.rpc('reject_store', {
    store_id_param: storeId,
    admin_id_param: adminId,
    reason_param: reason,
  });

  if (error) throw error;
}

export async function getPendingStores() {
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      seller:profiles!stores_seller_id_fkey(*)
    `)
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAllStoresForAdmin() {
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      seller:profiles!stores_seller_id_fkey(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ============ Locations ============
export async function getLocations() {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  
  if (error) throw error;
  return Array.isArray(data) ? (data as Location[]) : [];
}

export async function getAllLocations() {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('display_order');
  
  if (error) throw error;
  return Array.isArray(data) ? (data as Location[]) : [];
}

export async function createLocation(location: {
  value: string;
  label: string;
  display_order?: number;
  is_active?: boolean;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
}) {
  const { data, error } = await supabase
    .from('locations')
    .insert(location)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Location;
}

// Auto-create location if it doesn't exist (for seller store creation)
export async function getOrCreateLocation(locationData: {
  label: string;
  latitude: number;
  longitude: number;
}): Promise<Location> {
  // Check if location already exists
  const { data: existing } = await supabase
    .from('locations')
    .select()
    .ilike('label', locationData.label)
    .maybeSingle();

  if (existing) {
    return existing as Location;
  }

  // Create new location with auto-generated value
  const value = locationData.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  // Get max display_order
  const { data: maxOrderData } = await supabase
    .from('locations')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const display_order = maxOrderData ? maxOrderData.display_order + 10 : 10;

  const newLocation = {
    value,
    label: locationData.label,
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    radius_km: 10, // Default 10km for auto-created locations
    display_order,
    is_active: true,
  };

  const { data, error } = await supabase
    .from('locations')
    .insert(newLocation)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Location;
}

export async function updateLocation(locationId: string, updates: Partial<Location>) {
  const { data, error } = await supabase
    .from('locations')
    .update(updates)
    .eq('id', locationId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Location;
}

export async function deleteLocation(locationId: string) {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId);
  
  if (error) throw error;
}

// ============ Site Settings ============
export async function getSiteSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('key');
  
  if (error) throw error;
  return Array.isArray(data) ? (data as SiteSetting[]) : [];
}

export async function getSiteSettingsByCategory(category: string) {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('category', category)
    .order('key');
  
  if (error) throw error;
  return Array.isArray(data) ? (data as SiteSetting[]) : [];
}

export async function getSiteSetting(key: string) {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', key)
    .maybeSingle();
  
  if (error) throw error;
  return data as SiteSetting | null;
}

export async function updateSiteSetting(key: string, value: string) {
  const { data, error } = await supabase
    .from('site_settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as SiteSetting;
}

export async function updateMultipleSiteSettings(settings: { key: string; value: string }[]) {
  const promises = settings.map(setting => updateSiteSetting(setting.key, setting.value));
  return Promise.all(promises);
}

// ============ Sell Phone System ============

// Phone Brands
export async function getPhoneBrands() {
  const { data, error } = await supabase
    .from('phone_brands')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAllPhoneBrands() {
  const { data, error } = await supabase
    .from('phone_brands')
    .select('*')
    .order('display_order');
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createPhoneBrand(brand: { name: string; display_order?: number; is_active?: boolean }) {
  const { data, error } = await supabase
    .from('phone_brands')
    .insert({
      name: brand.name,
      display_order: brand.display_order || 0,
      is_active: brand.is_active !== undefined ? brand.is_active : true,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updatePhoneBrand(brandId: string, updates: Partial<PhoneBrand>) {
  const { data, error } = await supabase
    .from('phone_brands')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', brandId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function deletePhoneBrand(brandId: string) {
  const { error } = await supabase
    .from('phone_brands')
    .delete()
    .eq('id', brandId);
  
  if (error) throw error;
}

// Phone Models
export async function getPhoneModelsByBrand(brandId: string) {
  const { data, error } = await supabase
    .from('phone_models')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .order('display_order');
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAllPhoneModels() {
  const { data, error } = await supabase
    .from('phone_models')
    .select('*, brand:phone_brands(*)')
    .order('display_order');
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createPhoneModel(model: { brand_id: string; name: string; display_order?: number; is_active?: boolean }) {
  const { data, error } = await supabase
    .from('phone_models')
    .insert({
      brand_id: model.brand_id,
      name: model.name,
      display_order: model.display_order || 0,
      is_active: model.is_active !== undefined ? model.is_active : true,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updatePhoneModel(modelId: string, updates: Partial<PhoneModel>) {
  const { data, error } = await supabase
    .from('phone_models')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', modelId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function deletePhoneModel(modelId: string) {
  const { error } = await supabase
    .from('phone_models')
    .delete()
    .eq('id', modelId);
  
  if (error) throw error;
}

// Phone Conditions
export async function getPhoneConditions() {
  const { data, error } = await supabase
    .from('phone_conditions')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAllPhoneConditions() {
  const { data, error } = await supabase
    .from('phone_conditions')
    .select('*')
    .order('display_order');
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createPhoneCondition(condition: { name: string; description?: string; display_order?: number; is_active?: boolean }) {
  const { data, error } = await supabase
    .from('phone_conditions')
    .insert({
      name: condition.name,
      description: condition.description,
      display_order: condition.display_order || 0,
      is_active: condition.is_active !== undefined ? condition.is_active : true,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updatePhoneCondition(conditionId: string, updates: Partial<PhoneCondition>) {
  const { data, error } = await supabase
    .from('phone_conditions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', conditionId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function deletePhoneCondition(conditionId: string) {
  const { error } = await supabase
    .from('phone_conditions')
    .delete()
    .eq('id', conditionId);
  
  if (error) throw error;
}

// Phone Age Options
export async function getPhoneAgeOptions() {
  const { data, error } = await supabase
    .from('phone_age_options')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAllPhoneAgeOptions() {
  const { data, error } = await supabase
    .from('phone_age_options')
    .select('*')
    .order('display_order');
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createPhoneAgeOption(option: { name: string; display_order?: number; is_active?: boolean }) {
  const { data, error } = await supabase
    .from('phone_age_options')
    .insert({
      name: option.name,
      display_order: option.display_order || 0,
      is_active: option.is_active !== undefined ? option.is_active : true,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updatePhoneAgeOption(optionId: string, updates: Partial<PhoneAgeOption>) {
  const { data, error } = await supabase
    .from('phone_age_options')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', optionId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function deletePhoneAgeOption(optionId: string) {
  const { error } = await supabase
    .from('phone_age_options')
    .delete()
    .eq('id', optionId);
  
  if (error) throw error;
}

// Phone Submissions
export async function createPhoneSubmission(submission: {
  brand_name: string;
  model_name: string;
  variant_name?: string;
  condition_name: string;
  age_name: string;
  front_image_url: string;
  back_image_url: string;
  image_1_url?: string;
  image_2_url?: string;
  image_3_url?: string;
  image_4_url?: string;
  image_5_url?: string;
  image_6_url?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  latitude?: number;
  longitude?: number;
  location_address?: string;
  location_city?: string;
  location_country?: string;
}) {
  const { data, error } = await supabase
    .from('phone_submissions')
    .insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      ...submission,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAllPhoneSubmissions() {
  const { data, error } = await supabase
    .from('phone_submissions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// Phone Variants
export async function getPhoneVariants() {
  const { data, error } = await supabase
    .from('phone_variants')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAllPhoneVariants() {
  const { data, error } = await supabase
    .from('phone_variants')
    .select('*')
    .order('display_order');
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createPhoneVariant(variant: { name: string; display_order?: number; is_active?: boolean }) {
  const { data, error } = await supabase
    .from('phone_variants')
    .insert({
      name: variant.name,
      display_order: variant.display_order || 0,
      is_active: variant.is_active !== undefined ? variant.is_active : true,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updatePhoneVariant(variantId: string, updates: Partial<PhoneVariant>) {
  const { data, error } = await supabase
    .from('phone_variants')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', variantId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function deletePhoneVariant(variantId: string) {
  const { error } = await supabase
    .from('phone_variants')
    .delete()
    .eq('id', variantId);
  
  if (error) throw error;
}

// Phone Submission Chat Functions
export async function createPhoneSubmissionConversation(phoneSubmissionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('create_phone_submission_conversation', {
    p_phone_submission_id: phoneSubmissionId,
    p_user_id: user.id,
  });

  if (error) throw error;
  return data;
}

export async function getPhoneSubmissionConversation(phoneSubmissionId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      buyer:profiles!conversations_buyer_id_fkey(*),
      seller:profiles!conversations_seller_id_fkey(*)
    `)
    .eq('phone_submission_id', phoneSubmissionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function closePhoneSubmissionChat(phoneSubmissionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('phone_submissions')
    .update({
      status: 'closed',
      chat_closed_at: new Date().toISOString(),
      chat_closed_by: user.id,
    })
    .eq('id', phoneSubmissionId);

  if (error) throw error;
}

export async function updatePhoneSubmissionStatus(phoneSubmissionId: string, status: string) {
  const { error } = await supabase
    .from('phone_submissions')
    .update({ status })
    .eq('id', phoneSubmissionId);

  if (error) throw error;
}

export async function deletePhoneSubmission(phoneSubmissionId: string) {
  const { error } = await supabase
    .from('phone_submissions')
    .delete()
    .eq('id', phoneSubmissionId);

  if (error) throw error;
}

// ============ Unread Message Tracking ============
export async function getUnreadMessageCount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data, error } = await supabase.rpc('get_unread_message_count', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }
  return data as number;
}

export async function getUnreadByConversation() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc('get_unread_by_conversation', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('Failed to get unread by conversation:', error);
    return [];
  }
  return data as Array<{ conversation_id: string; unread_count: number }>;
}

export async function markConversationAsRead(conversationId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.rpc('mark_conversation_as_read', {
    p_conversation_id: conversationId,
    p_user_id: user.id,
  });

  if (error) throw error;
}

// ============ Admin Invite System ============
export async function generateAdminInvite(email?: string, role: 'admin' | 'seller' | 'buyer' = 'admin', expiresInHours: number = 168) {
  const { data, error } = await supabase.rpc('generate_admin_invite', {
    p_email: email || null,
    p_role: role,
    p_expires_in_hours: expiresInHours,
  });

  if (error) throw error;
  return data as {
    id: string;
    token: string;
    email?: string;
    role: string;
    expires_at: string;
    invite_url: string;
  };
}

export async function validateAdminInvite(token: string) {
  const { data, error } = await supabase.rpc('validate_admin_invite', {
    p_token: token,
  });

  if (error) throw error;
  return data as {
    valid: boolean;
    email?: string;
    role?: string;
    expires_at?: string;
    error?: string;
  };
}

export async function markInviteUsed(token: string, userId: string) {
  const { error } = await supabase.rpc('mark_invite_used', {
    p_token: token,
    p_user_id: userId,
  });

  if (error) throw error;
}

export async function revokeAdminInvite(inviteId: string) {
  const { error } = await supabase.rpc('revoke_admin_invite', {
    p_invite_id: inviteId,
  });

  if (error) throw error;
}

export async function getAllAdminInvites() {
  const { data, error } = await supabase
    .from('admin_invites')
    .select(`
      *,
      creator:profiles!admin_invites_created_by_fkey(id, full_name, email),
      user:profiles!admin_invites_used_by_fkey(id, full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ============ Conversation Management ============
export async function getFirstAdminUser() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('role', 'admin')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function closeConversation(conversationId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('conversations')
    .update({ status: 'closed' })
    .eq('id', conversationId);

  if (error) throw error;
}

export async function reopenConversation(conversationId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('conversations')
    .update({ status: 'active' })
    .eq('id', conversationId);

  if (error) throw error;
}

// ============================================
// STORE PROMOTION SYSTEM
// ============================================

// Coupon Management
export async function getPromotionCoupons() {
  const { data, error } = await supabase
    .from('promotion_coupons')
    .select('*')
    .order('created_at', { ascending: false});

  if (error) throw error;
  return data || [];
}

export async function validateCoupon(code: string) {
  const { data, error } = await supabase
    .from('promotion_coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Invalid coupon code');

  const now = new Date();
  const validFrom = new Date(data.valid_from);
  const validUntil = new Date(data.valid_until);

  if (now < validFrom) throw new Error('Coupon not yet valid');
  if (now > validUntil) throw new Error('Coupon has expired');
  if (data.usage_limit && data.used_count >= data.usage_limit) {
    throw new Error('Coupon usage limit reached');
  }

  return data;
}

export async function createPromotionCoupon(coupon: {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
}) {
  const { data, error } = await supabase
    .from('promotion_coupons')
    .insert({
      ...coupon,
      code: coupon.code.toUpperCase(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePromotionCoupon(id: string, updates: Partial<{
  discount_value: number;
  valid_until: string;
  usage_limit: number;
  active: boolean;
}>) {
  const { data, error } = await supabase
    .from('promotion_coupons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePromotionCoupon(id: string) {
  const { error } = await supabase
    .from('promotion_coupons')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Store Promotion Management
export async function getStorePromotions(storeId?: string) {
  let query = supabase
    .from('store_promotions')
    .select(`
      *,
      store:stores(id, name, location, seller_id)
    `)
    .order('created_at', { ascending: false });

  if (storeId) {
    query = query.eq('store_id', storeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createStorePromotion(promotion: {
  store_id: string;
  duration_days: number;
  original_price: number;
  coupon_code?: string;
}) {
  let discount_amount = 0;
  let final_price = promotion.original_price;

  // Apply coupon if provided
  if (promotion.coupon_code) {
    try {
      const coupon = await validateCoupon(promotion.coupon_code);
      if (coupon.discount_type === 'percentage') {
        discount_amount = (promotion.original_price * coupon.discount_value) / 100;
      } else {
        discount_amount = coupon.discount_value;
      }
      final_price = Math.max(0, promotion.original_price - discount_amount);
    } catch (error) {
      throw error;
    }
  }

  const { data, error } = await supabase
    .from('store_promotions')
    .insert({
      store_id: promotion.store_id,
      duration_days: promotion.duration_days,
      original_price: promotion.original_price,
      discount_amount,
      final_price,
      coupon_code: promotion.coupon_code?.toUpperCase(),
      status: 'pending',
      payment_status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePromotionStatus(
  promotionId: string,
  status: 'pending' | 'active' | 'expired' | 'cancelled'
) {
  const updates: any = { status };

  // Set start and end dates when activating
  if (status === 'active') {
    const { data: promotion } = await supabase
      .from('store_promotions')
      .select('duration_days')
      .eq('id', promotionId)
      .maybeSingle();

    if (promotion) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + promotion.duration_days);

      updates.start_date = startDate.toISOString();
      updates.end_date = endDate.toISOString();
    }
  }

  const { data, error } = await supabase
    .from('store_promotions')
    .update(updates)
    .eq('id', promotionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePromotionPaymentStatus(
  promotionId: string,
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded',
  transactionId?: string
) {
  const { data, error} = await supabase
    .from('store_promotions')
    .update({
      payment_status: paymentStatus,
      transaction_id: transactionId,
    })
    .eq('id', promotionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Payment Management
export async function createPromotionPayment(payment: {
  promotion_id: string;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  payment_data?: any;
}) {
  const { data, error } = await supabase
    .from('promotion_payments')
    .insert(payment)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPromotionPayments(promotionId?: string) {
  let query = supabase
    .from('promotion_payments')
    .select(`
      *,
      promotion:store_promotions(
        id,
        store_id,
        duration_days,
        final_price,
        store:stores(name)
      )
    `)
    .order('created_at', { ascending: false });

  if (promotionId) {
    query = query.eq('promotion_id', promotionId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Get promoted stores (for displaying at top)
export async function getPromotedStores() {
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      seller:profiles!stores_seller_id_fkey(id, full_name, email)
    `)
    .eq('is_promoted', true)
    .eq('approval_status', 'approved')
    .gte('promotion_expires_at', new Date().toISOString())
    .order('promotion_expires_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
// Email Configuration API functions

// ============ Email Configuration ============
export async function getActiveEmailConfiguration() {
  const { data, error } = await supabase
    .from('email_configuration')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();
  
  if (error) throw error;
  return data as EmailConfiguration | null;
}

export async function getAllEmailConfigurations() {
  const { data, error } = await supabase
    .from('email_configuration')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? (data as EmailConfiguration[]) : [];
}

export async function createEmailConfiguration(config: {
  provider: EmailProvider;
  api_key: string;
  sender_email: string;
  sender_name: string;
  is_active?: boolean;
}) {
  const { data, error } = await supabase
    .from('email_configuration')
    .insert({
      provider: config.provider,
      api_key: config.api_key,
      sender_email: config.sender_email,
      sender_name: config.sender_name,
      is_active: config.is_active || false,
    })
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as EmailConfiguration;
}

export async function updateEmailConfiguration(configId: string, updates: Partial<EmailConfiguration>) {
  const { data, error } = await supabase
    .from('email_configuration')
    .update(updates)
    .eq('id', configId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as EmailConfiguration;
}

export async function deleteEmailConfiguration(configId: string) {
  const { error } = await supabase
    .from('email_configuration')
    .delete()
    .eq('id', configId);
  
  if (error) throw error;
}

export async function activateEmailConfiguration(configId: string) {
  // First, deactivate all configurations
  await supabase
    .from('email_configuration')
    .update({ is_active: false })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all
  
  // Then activate the selected one
  const { data, error } = await supabase
    .from('email_configuration')
    .update({ is_active: true })
    .eq('id', configId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as EmailConfiguration;
}

// ==================== Favorites Functions ====================

export async function addToFavorites(productId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, product_id: productId })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function removeFromFavorites(productId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId);

  if (error) throw error;
}

export async function getFavorites() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('favorites')
    .select(`
      id,
      product_id,
      created_at,
      products!inner (
        id,
        title,
        price,
        images,
        status,
        stores!inner (
          id,
          name
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function isInFavorites(productId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}


export async function checkProductLimit(storeId: string): Promise<{
  canAdd: boolean;
  currentCount: number;
  limit: number;
  isSubscribed: boolean;
}> {
  // No subscription model - unlimited products for all stores
  return {
    canAdd: true,
    currentCount: 0,
    limit: -1,
    isSubscribed: false
  };
}

// Order Management Functions

export async function createOrder(order: {
  product_id: string;
  quantity: number;
  delivery_address: {
    full_name: string;
    phone_number: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  payment_method: 'upi' | 'card' | 'netbanking' | 'cod';
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get product details
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*, stores!inner(id, seller_id)')
    .eq('id', order.product_id)
    .single();

  if (productError) throw productError;
  if (!product) throw new Error('Product not found');

  const deliveryCharge = 50; // Fixed delivery charge
  const totalAmount = (product.price * order.quantity) + deliveryCharge;

  const { data, error } = await supabase
    .from('orders')
    .insert({
      buyer_id: user.id,
      seller_id: product.stores.seller_id,
      store_id: product.store_id,
      product_id: order.product_id,
      quantity: order.quantity,
      product_price: product.price,
      delivery_charge: deliveryCharge,
      total_amount: totalAmount,
      delivery_address: order.delivery_address,
      payment_method: order.payment_method,
      payment_status: order.payment_method === 'cod' ? 'pending' : 'completed',
      order_status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const STORE_PICKUP_ADVANCE_AMOUNT = 500; // ₹500 non-refundable advance

export async function createStorePickupOrder(order: {
  product_id: string;
  payment_reference: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*, stores!inner(id, seller_id)')
    .eq('id', order.product_id)
    .single();

  if (productError) throw productError;
  if (!product) throw new Error('Product not found');

  // Pickup deadline: 3 days from now
  const pickupDeadline = new Date();
  pickupDeadline.setDate(pickupDeadline.getDate() + 3);

  const { data, error } = await supabase
    .from('orders')
    .insert({
      buyer_id: user.id,
      seller_id: product.stores.seller_id,
      store_id: product.store_id,
      product_id: order.product_id,
      quantity: 1,
      product_price: product.price,
      delivery_charge: 0,
      total_amount: STORE_PICKUP_ADVANCE_AMOUNT,
      delivery_address: {
        full_name: '',
        phone_number: '',
        address_line1: 'Store Pickup',
        city: '',
        state: '',
        pincode: ''
      },
      payment_method: 'upi',
      payment_status: 'completed',
      order_status: 'confirmed',
      order_type: 'store_pickup',
      advance_amount: STORE_PICKUP_ADVANCE_AMOUNT,
      advance_paid: true,
      advance_payment_reference: order.payment_reference,
      pickup_deadline: pickupDeadline.toISOString(),
      pickup_completed: false,
      advance_non_refundable: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markPickupCompleted(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ pickup_completed: true, order_status: 'delivered' })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getOrdersByBuyer() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      products (
        id,
        title,
        images,
        price
      ),
      stores (
        id,
        name
      )
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders by buyer:', error);
    throw error;
  }
  
  return Array.isArray(data) ? data : [];
}

export async function getOrdersBySeller() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      products (
        id,
        title,
        images,
        price
      ),
      stores (
        id,
        name
      )
    `)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders by seller:', error);
    throw error;
  }
  
  return Array.isArray(data) ? data : [];
}

export async function getOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      products (
        id,
        title,
        images,
        price
      ),
      stores (
        id,
        name
      )
    `)
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching order by ID:', error);
    throw error;
  }
  
  return data;
}

export async function updateOrderStatus(orderId: string, status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled') {
  // Get order details first
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select(`
      *,
      product_id,
      buyer_id,
      store_id
    `)
    .eq('id', orderId)
    .single();

  if (fetchError) throw fetchError;

  // Get related data
  const { data: product } = await supabase
    .from('products')
    .select('title')
    .eq('id', order.product_id)
    .single();

  const { data: buyer } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', order.buyer_id)
    .single();

  const { data: store } = await supabase
    .from('stores')
    .select('id, name')
    .eq('id', order.store_id)
    .single();

  // Update order status
  const { data, error } = await supabase
    .from('orders')
    .update({ order_status: status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;

  // Send email notification to buyer
  if (buyer) {
    try {
      await sendFranchiseNotification('order_status', buyer.email, {
        recipientName: buyer.full_name,
        orderNumber: order.order_number,
        orderStatus: status,
        storeName: store?.name || 'Store',
        productTitle: product?.title || 'Product',
        trackingNumber: order.tracking_number,
        courierName: order.courier_name
      }, buyer.id);
    } catch (emailError) {
      console.error('Failed to send order status email:', emailError);
      // Don't throw - order update succeeded
    }
  }

  return data;
}

export async function addTrackingInfo(orderId: string, trackingInfo: {
  tracking_number: string;
  courier_name: string;
}) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      tracking_number: trackingInfo.tracking_number,
      courier_name: trackingInfo.courier_name
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAllOrders(filters?: {
  order_status?: string;
  payment_status?: string;
  seller_id?: string;
}) {
  let query = supabase
    .from('orders')
    .select(`
      *,
      products (
        id,
        title,
        images,
        price
      ),
      stores (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (filters?.order_status) {
    query = query.eq('order_status', filters.order_status);
  }

  if (filters?.payment_status) {
    query = query.eq('payment_status', filters.payment_status);
  }

  if (filters?.seller_id) {
    query = query.eq('seller_id', filters.seller_id);
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ============ Franchise System ============

// Franchise Plans
export async function getFranchisePlans() {
  const { data, error } = await supabase
    .from('franchise_plans')
    .select('*')
    .eq('status', 'active')
    .order('price', { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAllFranchisePlans() {
  const { data, error } = await supabase
    .from('franchise_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createFranchisePlan(plan: {
  name: string;
  price: number;
  duration_days: number;
  features: string[];
  status: 'active' | 'inactive';
}) {
  const { data, error } = await supabase
    .from('franchise_plans')
    .insert(plan)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFranchisePlan(id: string, updates: Partial<{
  name: string;
  price: number;
  duration_days: number;
  features: string[];
  status: 'active' | 'inactive';
}>) {
  const { data, error } = await supabase
    .from('franchise_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFranchisePlan(id: string) {
  const { error } = await supabase
    .from('franchise_plans')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Franchise Applications
export async function submitFranchiseApplication(application: {
  store_id: string;
  plan_id: string;
  payment_reference: string;
}) {
  const { data, error } = await supabase
    .from('franchise_applications')
    .insert({
      ...application,
      payment_status: 'completed',
      approval_status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getFranchiseApplications(filters?: {
  store_id?: string;
  approval_status?: string;
}) {
  let query = supabase
    .from('franchise_applications')
    .select('*, franchise_plans(*), stores(id, name, seller_id, online_selling_enabled)')
    .order('created_at', { ascending: false });

  if (filters?.store_id) {
    query = query.eq('store_id', filters.store_id);
  }

  if (filters?.approval_status) {
    query = query.eq('approval_status', filters.approval_status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function approveFranchiseApplication(applicationId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get application details
  const { data: application, error: appError } = await supabase
    .from('franchise_applications')
    .select('store_id')
    .eq('id', applicationId)
    .single();

  if (appError) throw appError;

  // Update application status
  const { error: updateError } = await supabase
    .from('franchise_applications')
    .update({
      approval_status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user.id
    })
    .eq('id', applicationId);

  if (updateError) throw updateError;

  // Update store to franchise
  const { error: storeError } = await supabase
    .from('stores')
    .update({ is_franchise: true })
    .eq('id', application.store_id);

  if (storeError) throw storeError;

  return true;
}

export async function rejectFranchiseApplication(applicationId: string, reason: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('franchise_applications')
    .update({
      approval_status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejection_reason: reason
    })
    .eq('id', applicationId);

  if (error) throw error;
  return true;
}

// Toggle online selling for a store
export async function toggleStoreOnlineSelling(storeId: string, enabled: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('stores')
    .update({
      online_selling_enabled: enabled,
      updated_at: new Date().toISOString()
    })
    .eq('id', storeId);

  if (error) throw error;
  return true;
}

// Bulk toggle online selling for multiple stores
export async function bulkToggleStoreOnlineSelling(
  storeIds: string[], 
  enabled: boolean, 
  reason?: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  // Update stores in batch
  for (const storeId of storeIds) {
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          online_selling_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId);

      if (error) {
        results.failed++;
        results.errors.push(`Failed to update store ${storeId}: ${error.message}`);
      } else {
        results.success++;
      }
    } catch (err) {
      results.failed++;
      results.errors.push(`Error updating store ${storeId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // Log the bulk action for audit trail
  if (reason) {
    console.log(`Bulk toggle by ${user.id}: ${enabled ? 'enabled' : 'disabled'} ${results.success} stores. Reason: ${reason}`);
  }

  return results;
}

// Franchise Stores
export async function getFranchiseStores(filters?: {
  location?: string;
  query?: string;
}) {
  let query = supabase
    .from('stores')
    .select('*, seller:profiles!seller_id(*)')
    .eq('is_franchise', true)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false });

  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  if (filters?.query) {
    query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// Get all franchise stores for admin management
export async function getAllFranchiseStoresForAdmin() {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, location, online_selling_enabled, approval_status, created_at, seller_id')
    .eq('is_franchise', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// Get franchise store analytics
export async function getFranchiseStoreAnalytics(
  storeId?: string,
  startDate?: string,
  endDate?: string
) {
  const { data, error } = await supabase.rpc('get_franchise_store_analytics', {
    p_store_id: storeId || null,
    p_start_date: startDate || null,
    p_end_date: endDate || null
  });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// Get franchise performance trends
export async function getFranchisePerformanceTrends(
  storeId?: string,
  days: number = 30
) {
  const { data, error } = await supabase.rpc('get_franchise_performance_trends', {
    p_store_id: storeId || null,
    p_days: days
  });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function toggleFranchiseStatus(storeId: string, isFranchise: boolean) {
  const { error } = await supabase
    .from('stores')
    .update({ is_franchise: isFranchise })
    .eq('id', storeId);

  if (error) throw error;
  return true;
}

export async function toggleStorePickup(storeId: string, enabled: boolean) {
  const { error } = await supabase
    .from('stores')
    .update({ store_pickup_enabled: enabled })
    .eq('id', storeId);

  if (error) throw error;
  return true;
}

// Franchise Payouts
export async function getEligiblePayouts(storeId: string) {
  // Get orders that are delivered and past 7-day return period
  const { data, error } = await supabase
    .from('orders')
    .select('*, products(id, title), stores(id, name)')
    .eq('store_id', storeId)
    .eq('order_status', 'delivered')
    .eq('payout_status', 'eligible')
    .eq('return_requested', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function requestPayout(orderId: string) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('store_id, total_amount, delivery_charge')
    .eq('id', orderId)
    .single();

  if (orderError) throw orderError;

  // Calculate payout amount (total - delivery charge - platform commission if any)
  const payoutAmount = order.total_amount - order.delivery_charge;

  const { data, error } = await supabase
    .from('franchise_payouts')
    .insert({
      store_id: order.store_id,
      order_id: orderId,
      amount: payoutAmount,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;

  // Update order payout status
  await supabase
    .from('orders')
    .update({ payout_status: 'pending' })
    .eq('id', orderId);

  return data;
}

export async function getPayouts(filters?: {
  store_id?: string;
  status?: string;
}) {
  let query = supabase
    .from('franchise_payouts')
    .select('*, stores(id, name), orders(id, order_number)')
    .order('created_at', { ascending: false });

  if (filters?.store_id) {
    query = query.eq('store_id', filters.store_id);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function releasePayout(payoutId: string, notes?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get payout details with related data
  const { data: payout, error: payoutError } = await supabase
    .from('franchise_payouts')
    .select(`
      *,
      orders!inner(id, order_number, product_id),
      stores!inner(id, name, seller_id)
    `)
    .eq('id', payoutId)
    .single();

  if (payoutError) throw payoutError;

  // Get product and seller details separately
  const { data: product } = await supabase
    .from('products')
    .select('title')
    .eq('id', payout.orders.product_id)
    .single();

  const { data: seller } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', payout.stores.seller_id)
    .single();

  // Update payout status
  const { error: updateError } = await supabase
    .from('franchise_payouts')
    .update({
      status: 'released',
      released_at: new Date().toISOString(),
      released_by: user.id,
      notes
    })
    .eq('id', payoutId);

  if (updateError) throw updateError;

  // Update order payout status
  await supabase
    .from('orders')
    .update({ payout_status: 'released' })
    .eq('id', payout.order_id);

  // Send email notification to seller
  if (seller) {
    try {
      await sendFranchiseNotification('payout_released', seller.email, {
        recipientName: seller.full_name,
        orderNumber: payout.orders.order_number,
        storeName: payout.stores.name,
        productTitle: product?.title || 'Product',
        amount: payout.amount
      }, seller.id);
    } catch (emailError) {
      console.error('Failed to send payout release email:', emailError);
      // Don't throw - payout release succeeded
    }
  }

  return true;
}

// Order Return Request
export async function requestReturn(orderId: string, reason: string) {
  const { error } = await supabase
    .from('orders')
    .update({
      return_requested: true,
      return_reason: reason,
      payout_status: 'refunded'
    })
    .eq('id', orderId);

  if (error) throw error;
  return true;
}

// Check and update payout eligibility for orders past return period
export async function updatePayoutEligibility() {
  // First, get orders that will become eligible
  const { data: eligibleOrders, error: fetchError } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      total_amount,
      return_period_ends_at,
      product_id,
      store_id
    `)
    .eq('order_status', 'delivered')
    .eq('payout_status', 'pending')
    .not('return_period_ends_at', 'is', null)
    .lt('return_period_ends_at', new Date().toISOString());

  if (fetchError) throw fetchError;

  // Update payout eligibility
  const { error } = await supabase.rpc('update_payout_eligibility');
  
  if (error) throw error;

  // Send email notifications for newly eligible orders
  if (eligibleOrders && eligibleOrders.length > 0) {
    for (const order of eligibleOrders) {
      try {
        // Get related data
        const { data: product } = await supabase
          .from('products')
          .select('title')
          .eq('id', order.product_id)
          .single();

        const { data: store } = await supabase
          .from('stores')
          .select('id, name, seller_id')
          .eq('id', order.store_id)
          .single();

        const { data: seller } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', store?.seller_id)
          .single();

        if (seller) {
          await sendFranchiseNotification('payout_eligible', seller.email, {
            recipientName: seller.full_name,
            orderNumber: order.order_number,
            storeName: store?.name || 'Store',
            productTitle: product?.title || 'Product',
            amount: order.total_amount
          }, seller.id);
        }
      } catch (emailError) {
        console.error(`Failed to send payout eligible email for order ${order.order_number}:`, emailError);
        // Continue with other notifications
      }
    }
  }
  
  return true;
}

// Get orders with return period information
export async function getOrdersWithReturnPeriod(storeId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      products(id, title, images, price),
      buyer:buyer_id(id, email, full_name)
    `)
    .eq('store_id', storeId)
    .in('status', ['delivered', 'shipped'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// Send franchise notification email
export async function sendFranchiseNotification(
  type: 'order_status' | 'return_reminder' | 'payout_eligible' | 'payout_released',
  to: string,
  data: {
    recipientName?: string;
    orderNumber?: string;
    orderStatus?: string;
    storeName?: string;
    productTitle?: string;
    amount?: number;
    returnPeriodEnds?: string;
    daysRemaining?: number;
    trackingNumber?: string;
    courierName?: string;
  },
  userId?: string
) {
  // Check user notification preferences if userId is provided
  if (userId) {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefs) {
      // Check if user has opted out of this notification type
      if (type === 'order_status' && !prefs.order_updates) return true;
      if ((type === 'payout_eligible' || type === 'payout_released') && !prefs.payout_notifications) return true;
      if (type === 'return_reminder' && !prefs.return_reminders) return true;
    }
  }

  const { error } = await supabase.functions.invoke('send-franchise-notification', {
    body: { type, to, data }
  });

  if (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
  
  return true;
}

// Get user notification preferences
export async function getNotificationPreferences() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    // If preferences don't exist, create default ones
    if (error.code === 'PGRST116') {
      const { data: newPrefs, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({ user_id: user.id })
        .select()
        .single();
      
      if (insertError) throw insertError;
      return newPrefs;
    }
    throw error;
  }

  return data;
}

// Update user notification preferences
export async function updateNotificationPreferences(preferences: {
  order_updates?: boolean;
  payout_notifications?: boolean;
  return_reminders?: boolean;
  promotional_emails?: boolean;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notification_preferences')
    .update(preferences)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Send return period reminders for orders expiring soon
export async function sendReturnPeriodReminders() {
  // Get orders with return period ending in 1 day
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      total_amount,
      return_period_ends_at,
      product_id,
      store_id
    `)
    .eq('order_status', 'delivered')
    .eq('payout_status', 'pending')
    .gte('return_period_ends_at', tomorrow.toISOString())
    .lt('return_period_ends_at', dayAfterTomorrow.toISOString());

  if (error) throw error;

  // Send reminder emails
  if (orders && orders.length > 0) {
    for (const order of orders) {
      try {
        // Get related data
        const { data: product } = await supabase
          .from('products')
          .select('title')
          .eq('id', order.product_id)
          .single();

        const { data: store } = await supabase
          .from('stores')
          .select('id, name, seller_id')
          .eq('id', order.store_id)
          .single();

        const { data: seller } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', store?.seller_id)
          .single();

        if (seller) {
          await sendFranchiseNotification('return_reminder', seller.email, {
            recipientName: seller.full_name,
            orderNumber: order.order_number,
            storeName: store?.name || 'Store',
            productTitle: product?.title || 'Product',
            amount: order.total_amount,
            returnPeriodEnds: new Date(order.return_period_ends_at).toLocaleString(),
            daysRemaining: 1
          }, seller.id);
        }
      } catch (emailError) {
        console.error(`Failed to send return reminder for order ${order.order_number}:`, emailError);
        // Continue with other reminders
      }
    }
  }

  return { sent: orders?.length || 0 };
}

// ============ Seller Applications ============
export interface SellerApplication {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string | null;
  phone_number: string | null;
  location: string | null;
  banner_image_url: string | null;
  shop_images: string[];
  trade_license_url: string | null;
  latitude: number | null;
  longitude: number | null;
  business_type: 'retail' | 'wholesale' | 'both';
  youtube_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
  reviewer?: Profile;
}

export async function createSellerApplication(data: {
  user_id: string;
  business_name: string;
  business_description?: string;
  phone_number?: string;
  location?: string;
  banner_image_url?: string;
  shop_images?: string[];
  trade_license_url?: string;
  latitude?: number;
  longitude?: number;
  business_type?: 'retail' | 'wholesale' | 'both';
  youtube_url?: string;
  facebook_url?: string;
  instagram_url?: string;
}) {
  const { data: application, error } = await supabase
    .from('seller_applications')
    .insert({
      user_id: data.user_id,
      business_name: data.business_name,
      business_description: data.business_description || null,
      phone_number: data.phone_number || null,
      location: data.location || null,
      banner_image_url: data.banner_image_url || null,
      shop_images: data.shop_images || [],
      trade_license_url: data.trade_license_url || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      business_type: data.business_type || 'retail',
      youtube_url: data.youtube_url || null,
      facebook_url: data.facebook_url || null,
      instagram_url: data.instagram_url || null,
    })
    .select()
    .single();

  if (error) throw error;
  return application as SellerApplication;
}

export async function getSellerApplication(userId: string) {
  const { data, error } = await supabase
    .from('seller_applications')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as SellerApplication | null;
}

export async function getAllSellerApplications(status?: 'pending' | 'approved' | 'rejected') {
  let query = supabase
    .from('seller_applications')
    .select(`
      *,
      user:profiles!seller_applications_user_id_fkey(id, email, full_name, phone_number),
      reviewer:profiles!seller_applications_reviewed_by_fkey(id, email, full_name)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as SellerApplication[];
}

export async function approveSellerApplication(
  applicationId: string,
  adminId: string,
  adminNotes?: string
) {
  const { data, error } = await supabase.rpc('approve_seller_application', {
    p_application_id: applicationId,
    p_admin_id: adminId,
    p_admin_notes: adminNotes || null,
  });

  if (error) throw error;
  return data;
}

export async function rejectSellerApplication(
  applicationId: string,
  adminId: string,
  adminNotes: string
) {
  const { data, error } = await supabase.rpc('reject_seller_application', {
    p_application_id: applicationId,
    p_admin_id: adminId,
    p_admin_notes: adminNotes,
  });

  if (error) throw error;
  return data;
}

export async function resubmitSellerApplication(
  applicationId: string,
  userId: string,
  data: {
    business_name: string;
    business_description?: string;
    phone_number?: string;
    location?: string;
    banner_image_url?: string;
    shop_images?: string[];
    trade_license_url?: string;
    latitude?: number;
    longitude?: number;
    business_type?: 'retail' | 'wholesale' | 'both';
    youtube_url?: string;
    facebook_url?: string;
    instagram_url?: string;
  }
) {
  const { error } = await supabase.rpc('resubmit_seller_application', {
    p_application_id: applicationId,
    p_user_id: userId,
    p_business_name: data.business_name,
    p_business_description: data.business_description || null,
    p_phone_number: data.phone_number || null,
    p_location: data.location || null,
    p_banner_image_url: data.banner_image_url || null,
    p_shop_images: data.shop_images || [],
    p_trade_license_url: data.trade_license_url || null,
    p_latitude: data.latitude || null,
    p_longitude: data.longitude || null,
    p_business_type: data.business_type || 'retail',
    p_youtube_url: data.youtube_url || null,
    p_facebook_url: data.facebook_url || null,
    p_instagram_url: data.instagram_url || null,
  });
  if (error) throw error;
}

// ============ Payment Settings ============
export async function getPaymentSettings() {
  const { data, error } = await supabase
    .from('payment_settings')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function updatePaymentSettings(settings: {
  qr_code_url?: string;
  upi_id?: string;
}) {
  // Get the first (and should be only) payment settings record
  const { data: existing } = await supabase
    .from('payment_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('payment_settings')
      .update(settings)
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('payment_settings')
      .insert({ ...settings, is_active: true })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

// ============ Featured Store Advertising ============
export async function getFeaturedStorePlans() {
  const { data, error } = await supabase
    .from('featured_store_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });
  
  if (error) throw error;
  return data as FeaturedStorePlan[];
}

export async function getAllFeaturedStorePlans() {
  const { data, error } = await supabase
    .from('featured_store_plans')
    .select('*')
    .order('target_type', { ascending: true });
  
  if (error) throw error;
  return data as FeaturedStorePlan[];
}

export async function createFeaturedStorePlan(plan: Omit<FeaturedStorePlan, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('featured_store_plans')
    .insert(plan)
    .select()
    .single();
  
  if (error) throw error;
  return data as FeaturedStorePlan;
}

export async function updateFeaturedStorePlan(id: string, updates: Partial<FeaturedStorePlan>) {
  const { data, error } = await supabase
    .from('featured_store_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as FeaturedStorePlan;
}

export async function deleteFeaturedStorePlan(id: string) {
  const { error } = await supabase
    .from('featured_store_plans')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function createFeaturedStoreApplication(application: {
  store_id: string;
  seller_id: string;
  plan_id: string;
  location_id: string;
  payment_amount: number;
}) {
  const { data, error } = await supabase
    .from('featured_store_applications')
    .insert(application)
    .select()
    .single();
  
  if (error) throw error;
  return data as FeaturedStoreApplication;
}

export async function updateFeaturedStoreApplication(id: string, updates: Partial<FeaturedStoreApplication>) {
  const { data, error } = await supabase
    .from('featured_store_applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as FeaturedStoreApplication;
}

export async function getSellerFeaturedStoreApplications(sellerId: string) {
  const { data, error } = await supabase
    .from('featured_store_applications')
    .select(`
      *,
      store:stores(*),
      plan:featured_store_plans(*),
      location:locations(*)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as FeaturedStoreApplication[];
}

export async function getAllFeaturedStoreApplications() {
  const { data, error } = await supabase
    .from('featured_store_applications')
    .select(`
      *,
      store:stores(*),
      plan:featured_store_plans(*),
      location:locations(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as FeaturedStoreApplication[];
}

export async function approveFeaturedStoreApplication(
  applicationId: string,
  startDate: string,
  endDate: string,
  adminNotes?: string
) {
  const { data, error } = await supabase
    .from('featured_store_applications')
    .update({
      status: 'approved',
      start_date: startDate,
      end_date: endDate,
      admin_notes: adminNotes,
    })
    .eq('id', applicationId)
    .select()
    .single();
  
  if (error) throw error;
  return data as FeaturedStoreApplication;
}

export async function rejectFeaturedStoreApplication(applicationId: string, adminNotes?: string) {
  const { data, error } = await supabase
    .from('featured_store_applications')
    .update({
      status: 'rejected',
      admin_notes: adminNotes,
    })
    .eq('id', applicationId)
    .select()
    .single();
  
  if (error) throw error;
  return data as FeaturedStoreApplication;
}

export async function getFeaturedStoresByLocation(customerLat: number, customerLng: number, radiusKm: number = 50) {
  const { data, error } = await supabase.rpc('get_featured_stores_by_location', {
    p_customer_lat: customerLat,
    p_customer_lng: customerLng,
    p_radius_km: radiusKm,
  });
  
  if (error) throw error;
  return data as FeaturedStoreDisplay[];
}

// ============ Platform Settings ============
export interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
  updated_by?: string;
}

export async function getPlatformSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  
  if (error) throw error;
  return data?.value || null;
}

export async function getAllPlatformSettings(): Promise<PlatformSetting[]> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .order('key');
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function updatePlatformSetting(key: string, value: string): Promise<PlatformSetting> {
  const { data, error } = await supabase
    .from('platform_settings')
    .update({
      value,
      updated_at: new Date().toISOString(),
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('key', key)
    .select()
    .single();
  
  if (error) throw error;
  return data as PlatformSetting;
}

export async function getDeliveryCharge(): Promise<number> {
  const value = await getPlatformSetting('delivery_charge');
  return value ? parseFloat(value) : 50; // Default to 50 if not set
}

// ============ Product Approval System ============
export async function getPendingProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      store:stores(id, name, seller_id, is_franchise),
      category:categories(id, name)
    `)
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function approveProduct(productId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('products')
    .update({
      status: 'active',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      rejection_reason: null,
    })
    .eq('id', productId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function rejectProduct(productId: string, reason: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('products')
    .update({
      status: 'removed',
      rejection_reason: reason,
      approved_by: user.id,
    })
    .eq('id', productId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getPendingProductsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_approval');
  
  if (error) throw error;
  return count || 0;
}

export interface ProductApprovalStats {
  pending_count: number;
  avg_approval_hours: number;
  approved_today_count: number;
  rejected_week_count: number;
}

export async function getProductApprovalStats(): Promise<ProductApprovalStats> {
  const { data, error } = await supabase.rpc('get_product_approval_stats');
  
  if (error) throw error;
  return data as ProductApprovalStats;
}

export interface SellerPerformanceStats {
  seller_id: string;
  seller_name: string;
  store_id: string;
  store_name: string;
  total_products: number;
  approved_products: number;
  rejected_products: number;
  pending_products: number;
  approval_rate: number;
  avg_approval_hours: number;
}

export async function getSellerPerformanceStats(): Promise<SellerPerformanceStats[]> {
  const { data, error } = await supabase.rpc('get_seller_performance_stats');
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ============ Filter Suggestions ============
export interface FilterSuggestion {
  filter_id: string;
  filter_type: 'category' | 'subcategory';
  filter_name: string;
  reason: string;
  usage_count: number;
  relevance_score: number;
}

export interface UserCategoryPreference {
  out_category_id: string | null;
  out_subcategory_id: string | null;
  out_filter_type: 'category' | 'subcategory';
  out_preference_score: number;
  out_view_count: number;
  out_purchase_count: number;
  out_wishlist_count: number;
}

export async function getFilterSuggestions(
  categoryIds: string[] = [],
  subcategoryIds: string[] = [],
  userId?: string,
  limit: number = 5
): Promise<FilterSuggestion[]> {
  const { data, error } = await supabase.rpc('get_filter_suggestions', {
    current_category_ids: categoryIds,
    current_subcategory_ids: subcategoryIds,
    p_user_id: userId || null,
    suggestion_limit: limit
  });
  
  if (error) {
    console.error('getFilterSuggestions error:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function getUserCategoryPreferences(
  userId: string,
  limit: number = 10
): Promise<UserCategoryPreference[]> {
  const { data, error } = await supabase.rpc('get_user_category_preferences', {
    p_user_id: userId,
    preference_limit: limit
  });
  
  if (error) {
    console.error('getUserCategoryPreferences error:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function trackProductView(
  productId: string,
  categoryId: string,
  subcategoryId?: string
): Promise<void> {
  // Generate a session ID if not exists
  let sessionId = sessionStorage.getItem('view_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('view_session_id', sessionId);
  }

  const { error } = await supabase
    .from('product_views')
    .insert({
      session_id: sessionId,
      product_id: productId,
      category_id: categoryId,
      subcategory_id: subcategoryId || null
    });
  
  if (error) {
    console.error('trackProductView error:', error);
  }
}

export async function logFilterUsage(
  categoryIds: string[],
  subcategoryIds: string[],
  searchQuery?: string,
  location?: string
): Promise<void> {
  // Generate a session ID if not exists
  let sessionId = sessionStorage.getItem('filter_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('filter_session_id', sessionId);
  }

  const { error } = await supabase
    .from('filter_usage_logs')
    .insert({
      session_id: sessionId,
      category_ids: categoryIds,
      subcategory_ids: subcategoryIds,
      search_query: searchQuery || null,
      location: location || null
    });
  
  if (error) {
    console.error('logFilterUsage error:', error);
  }
}

// ============ Personalization Analytics ============
export interface PersonalizationOverviewStats {
  total_users_tracked: number;
  total_views: number;
  total_clicks: number;
  total_favorites: number;
  avg_views_per_user: number;
  overall_ctr: number;
  active_users_7d: number;
  active_users_30d: number;
}

export interface PreferenceDistribution {
  out_category_id: string;
  out_category_name: string;
  out_view_count: number;
  out_unique_users: number;
  out_click_count: number;
  out_favorite_count: number;
}

export interface TrendingCombination {
  category_ids: string[];
  category_names: string[];
  occurrence_count: number;
  unique_users: number;
  avg_session_views: number;
}

export interface EffectivenessMetric {
  metric_name: string;
  metric_value: number;
  metric_description: string;
}

export interface PersonalizationConfig {
  config_key: string;
  config_value: number;
  description: string;
  updated_at: string;
}

export interface UserPreferenceProfile {
  category_id: string | null;
  category_name: string | null;
  subcategory_id: string | null;
  subcategory_name: string | null;
  view_count: number;
  favorite_count: number;
  click_count: number;
  last_activity: string | null;
  preference_score: number;
}

export async function getPersonalizationStats(): Promise<PersonalizationOverviewStats | null> {
  const { data, error } = await supabase.rpc('get_personalization_overview_stats');
  
  if (error) {
    console.error('getPersonalizationStats error:', error);
    return null;
  }
  return data?.[0] || null;
}

export async function getPreferenceDistribution(
  timePeriod: string = '30 days'
): Promise<PreferenceDistribution[]> {
  const { data, error } = await supabase.rpc('get_preference_distribution', {
    time_period: timePeriod
  });
  
  if (error) {
    console.error('getPreferenceDistribution error:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function getTrendingCombinations(
  timePeriod: string = '7 days',
  minOccurrences: number = 2
): Promise<TrendingCombination[]> {
  const { data, error } = await supabase.rpc('get_trending_category_combinations', {
    time_period: timePeriod,
    min_occurrences: minOccurrences
  });
  
  if (error) {
    console.error('getTrendingCombinations error:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function getEffectivenessMetrics(
  timePeriod: string = '30 days'
): Promise<EffectivenessMetric[]> {
  const { data, error } = await supabase.rpc('get_personalization_effectiveness_metrics', {
    time_period: timePeriod
  });
  
  if (error) {
    console.error('getEffectivenessMetrics error:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function getPersonalizationConfig(): Promise<PersonalizationConfig[]> {
  const { data, error } = await supabase.rpc('get_personalization_config');
  
  if (error) {
    console.error('getPersonalizationConfig error:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function updatePersonalizationConfig(
  configKey: string,
  configValue: number,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('update_personalization_config', {
    p_config_key: configKey,
    p_config_value: configValue,
    p_user_id: userId
  });
  
  if (error) {
    console.error('updatePersonalizationConfig error:', error);
    throw error;
  }
  return data === true;
}

export async function getUserPreferenceProfile(
  userId: string
): Promise<UserPreferenceProfile[]> {
  const { data, error } = await supabase.rpc('get_user_preference_profile', {
    p_user_id: userId
  });
  
  if (error) {
    console.error('getUserPreferenceProfile error:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function trackSuggestionClick(
  filterId: string,
  filterType: 'category' | 'subcategory',
  filterName: string,
  suggestionReason: string
): Promise<void> {
  // Generate a session ID if not exists
  let sessionId = sessionStorage.getItem('filter_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('filter_session_id', sessionId);
  }

  const { error } = await supabase
    .from('suggestion_clicks')
    .insert({
      session_id: sessionId,
      filter_id: filterId,
      filter_type: filterType,
      filter_name: filterName,
      suggestion_reason: suggestionReason
    });
  
  if (error) {
    console.error('trackSuggestionClick error:', error);
  }
}

// ─── Push Subscription API ──────────────────────────────────────────────────

export async function savePushSubscription(subscription: PushSubscription): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const json = subscription.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id:   user.id,
      endpoint:  subscription.endpoint,
      p256dh:    json.keys?.p256dh ?? '',
      auth_key:  json.keys?.auth ?? '',
      user_agent: navigator.userAgent.slice(0, 200),
    },
    { onConflict: 'user_id,endpoint' }
  );
  if (error) throw error;
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);
  if (error) throw error;
}

export async function getUserPushSubscriptions() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, user_agent, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function updatePushPreferences(prefs: {
  push_enabled?: boolean;
  push_new_messages?: boolean;
  push_order_updates?: boolean;
  push_new_orders?: boolean;
  push_return_requests?: boolean;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('notification_preferences')
    .update(prefs)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function sendPushNotification(params: {
  user_id: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push-notification', {
    body: params,
  });
  if (error) {
    const msg = await error?.context?.text?.();
    throw new Error(msg || error.message);
  }
}

// ============ Car Brands ============
export async function getCarBrands(): Promise<CarBrand[]> {
  const { data, error } = await supabase
    .from('car_brands')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAllCarBrands(): Promise<CarBrand[]> {
  const { data, error } = await supabase
    .from('car_brands')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createCarBrand(brand: { name: string; display_order?: number; is_active?: boolean }): Promise<CarBrand> {
  const { data, error } = await supabase
    .from('car_brands')
    .insert({
      name: brand.name,
      display_order: brand.display_order ?? 0,
      is_active: brand.is_active !== undefined ? brand.is_active : true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as CarBrand;
}

export async function updateCarBrand(brandId: string, updates: Partial<CarBrand>): Promise<CarBrand> {
  const { data, error } = await supabase
    .from('car_brands')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', brandId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as CarBrand;
}

export async function deleteCarBrand(brandId: string): Promise<void> {
  const { error } = await supabase
    .from('car_brands')
    .delete()
    .eq('id', brandId);
  if (error) throw error;
}


// ============ Bike Brands ============
export async function getBikeBrands(): Promise<BikeBrand[]> {
  const { data, error } = await supabase
    .from('bike_brands')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAllBikeBrands(): Promise<BikeBrand[]> {
  const { data, error } = await supabase
    .from('bike_brands')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createBikeBrand(brand: { name: string; display_order?: number; is_active?: boolean }): Promise<BikeBrand> {
  const { data, error } = await supabase
    .from('bike_brands')
    .insert({
      name: brand.name,
      display_order: brand.display_order ?? 0,
      is_active: brand.is_active !== undefined ? brand.is_active : true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as BikeBrand;
}

export async function updateBikeBrand(brandId: string, updates: Partial<BikeBrand>): Promise<BikeBrand> {
  const { data, error } = await supabase
    .from('bike_brands')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', brandId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as BikeBrand;
}

export async function deleteBikeBrand(brandId: string): Promise<void> {
  const { error } = await supabase
    .from('bike_brands')
    .delete()
    .eq('id', brandId);
  if (error) throw error;
}

