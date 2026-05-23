export type UserRole = 'buyer' | 'seller' | 'admin';
export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair';
export type ProductStatus = 'active' | 'sold' | 'removed';
export type StoreApprovalStatus = 'pending' | 'approved' | 'rejected' | 'paused';
export type BusinessType = 'retail' | 'wholesale' | 'both';

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  value: string;
  label: string;
  state: string;
  display_order: number;
  is_active: boolean;
  phone_pickup_available: boolean;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  location?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  image_url?: string;
  display_order: number;
  created_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface CategoryWithSubcategories extends Category {
  subcategories?: Subcategory[];
}

export interface Store {
  id: string;
  seller_id: string;
  name: string;
  description?: string;
  location: string;
  contact_info?: string;
  contact_phone?: string;
  banner_image_url?: string;
  shop_images: string[];
  trade_license_url?: string;
  latitude?: number;
  longitude?: number;
  phone_number?: string;
  youtube_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  average_rating: number;
  total_reviews: number;
  approval_status: StoreApprovalStatus;
  rejection_reason?: string;
  rejected_at?: string;
  approved_at?: string;
  approved_by?: string;
  resubmission_count?: number;
  last_resubmitted_at?: string;
  is_promoted: boolean;
  promotion_expires_at?: string;
  is_franchise: boolean;
  online_selling_enabled?: boolean;
  store_pickup_enabled?: boolean;
  pickup_qr_code_url?: string;
  pickup_upi_id?: string;
  business_type: BusinessType;
  created_at: string;
  updated_at: string;
  seller?: Profile;
}

export interface CarDetails {
  brand: string;
  year: number;
  fuel: string;
  transmission: 'automatic' | 'manual';
  km_driven: number;
  no_of_owners?: number;
}

export interface CarBrand {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BikeDetails {
  brand: string;
  year: number;
  km_driven: number;
  engine_cc?: number;
  fuel?: string;
  no_of_owners?: number;
}

export interface BikeBrand {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  title: string;
  description?: string;
  price: number;
  condition: ProductCondition;
  category_id?: string;
  subcategory_id?: string;
  images: string[];
  status: ProductStatus;
  car_details?: CarDetails | null;
  bike_details?: BikeDetails | null;
  phone_details?: PhoneDetails | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  store?: Store;
  category?: Category;
  subcategory?: Subcategory;
}

export interface Review {
  id: string;
  store_id: string;
  buyer_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  buyer?: Profile;
  store?: Store;
}

export interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  store_id?: string;
  product_id?: string;
  phone_submission_id?: string;
  last_message_at: string;
  created_at: string;
  buyer?: Profile;
  seller?: Profile;
  store?: Store;
  product?: Product;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  read_at?: string;
  created_at: string;
  sender?: Profile;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: Profile;
  following?: Profile;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface PhoneDetails {
  brand: string;
  storage?: string;
  ram?: string;
}

export interface PhoneBrand {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PhoneModel {
  id: string;
  brand_id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  brand?: PhoneBrand;
}

export interface PhoneCondition {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PhoneAgeOption {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PhoneVariant {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PhoneSubmission {
  id: string;
  user_id?: string;
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
  status?: string;
  chat_closed_at?: string;
  chat_closed_by?: string;
  whatsapp_sent: boolean;
  created_at: string;
}

export interface StoreBanner {
  id: string;
  store_id: string;
  banner_image_url: string;
  title?: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  store?: Store;
}

export interface SearchFilters {
  query?: string;
  type?: 'all' | 'products' | 'stores';
  location?: string;
  category_id?: string;
  subcategory_id?: string;
  category_ids?: string[];
  subcategory_ids?: string[];
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export interface AdminInvite {
  id: string;
  token: string;
  email?: string;
  role: UserRole;
  expires_at: string;
  used_at?: string;
  used_by?: string;
  created_by: string;
  created_at: string;
  revoked_at?: string;
  revoked_by?: string;
  creator?: Profile;
  user?: Profile;
}

// Store Promotion System Types
export type PromotionStatus = 'pending' | 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type DiscountType = 'percentage' | 'fixed';

export interface PromotionCoupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  used_count: number;
  active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface StorePromotion {
  id: string;
  store_id: string;
  store?: Store;
  duration_days: number;
  start_date?: string;
  end_date?: string;
  status: PromotionStatus;
  original_price: number;
  discount_amount: number;
  final_price: number;
  coupon_code?: string;
  payment_status: PaymentStatus;
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PromotionPayment {
  id: string;
  promotion_id: string;
  promotion?: StorePromotion;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  payment_data?: any;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export type EmailProvider = 'resend' | 'sendgrid' | 'aws_ses' | 'custom';

export interface EmailConfiguration {
  id: string;
  provider: EmailProvider;
  api_key: string;
  sender_email: string;
  sender_name: string;
  is_active: boolean;
  test_email_sent: boolean;
  last_tested_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod';
export type OrderType = 'delivery' | 'store_pickup';

export interface DeliveryAddress {
  full_name: string;
  phone_number: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  seller_id: string;
  store_id: string;
  product_id: string;
  quantity: number;
  product_price: number;
  delivery_charge: number;
  total_amount: number;
  delivery_address: DeliveryAddress;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  order_type: OrderType;
  advance_amount?: number;
  advance_paid?: boolean;
  advance_payment_reference?: string;
  pickup_deadline?: string;
  pickup_completed?: boolean;
  advance_non_refundable?: boolean;
  tracking_number: string | null;
  courier_name: string | null;
  return_period_ends_at?: string;
  payout_status?: 'pending' | 'eligible' | 'released' | 'refunded';
  return_requested?: boolean;
  return_reason?: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    title: string;
    images: string[];
    price: number;
  };
  stores?: {
    id: string;
    name: string;
    location?: string;
  };
  buyer?: {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
  };
}

// Franchise System Types
export interface FranchisePlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  features: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export type FranchiseApplicationStatus = 'pending' | 'approved' | 'rejected';
export type FranchisePaymentStatus = 'pending' | 'completed' | 'failed';

export interface FranchiseApplication {
  id: string;
  store_id: string;
  plan_id: string;
  payment_status: FranchisePaymentStatus;
  approval_status: FranchiseApplicationStatus;
  payment_reference?: string;
  rejection_reason?: string;
  applied_at: string;
  approved_at?: string;
  rejected_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  franchise_plans?: FranchisePlan;
  stores?: {
    id: string;
    name: string;
    seller_id: string;
    online_selling_enabled: boolean;
  };
}

export type PayoutStatus = 'pending' | 'released' | 'cancelled';

export interface FranchisePayout {
  id: string;
  store_id: string;
  order_id: string;
  amount: number;
  status: PayoutStatus;
  requested_at: string;
  released_at?: string;
  released_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  stores?: {
    id: string;
    name: string;
  };
  orders?: {
    id: string;
    order_number: string;
  };
}

export interface PlatformSettings {
  id: string;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
  updated_by?: string;
}

export interface PaymentSettings {
  id: string;
  qr_code_url?: string;
  upi_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  order_updates: boolean;
  payout_notifications: boolean;
  return_reminders: boolean;
  promotional_emails: boolean;
  created_at: string;
  updated_at: string;
}

export type FeaturedStoreTargetType = 'location' | 'state' | 'nationwide';
export type FeaturedStoreApplicationStatus = 'pending' | 'payment_submitted' | 'approved' | 'rejected' | 'expired';

export interface FeaturedStorePlan {
  id: string;
  name: string;
  target_type: FeaturedStoreTargetType;
  duration_days: number;
  price: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeaturedStoreApplication {
  id: string;
  store_id: string;
  seller_id: string;
  plan_id: string;
  location_id: string;
  payment_reference?: string;
  payment_amount: number;
  status: FeaturedStoreApplicationStatus;
  start_date?: string;
  end_date?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  store?: Store;
  plan?: FeaturedStorePlan;
  location?: Location;
}

export interface FeaturedStoreDisplay {
  store_id: string;
  store_name: string;
  store_description?: string;
  store_logo_url?: string;
  store_latitude?: number;
  store_longitude?: number;
  banner_url?: string;
  target_type: FeaturedStoreTargetType;
  location_name?: string;
  location_id?: string;
  distance_km?: number;
}

export interface IconPreviewView {
  id: string;
  user_id: string;
  view_type: 'page_view' | 'refresh_click' | 'reinstall_click';
  created_at: string;
}

// Franchise Analytics
export interface FranchiseStoreAnalytics {
  store_id: string;
  store_name: string;
  total_products: number;
  total_sales: number;
  revenue_generated: number;
  average_order_value: number;
  average_rating: number;
  total_reviews: number;
  active_orders: number;
  completed_orders: number;
  cancelled_orders: number;
}

export interface FranchisePerformanceTrend {
  date: string;
  total_orders: number;
  revenue: number;
  average_order_value: number;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  user_agent?: string;
  created_at: string;
}
