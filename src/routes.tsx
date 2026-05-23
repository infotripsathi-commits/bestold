import { lazy, type ReactNode } from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';

// Helper component for legacy product URL redirects (/product/:id -> /products/:id)
function ProductLegacyRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/products/${id}`} replace />;
}

// Helper component for legacy store URL redirects (/store/:id -> /stores/:id)
function StoreLegacyRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/stores/${id}`} replace />;
}

// Helper component for legacy /products listing redirects with query params
function ProductsListingLegacyRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const subCategoryId = params.get('sub_category_id');
  const categoryId = params.get('category_id');

  const searchParams = new URLSearchParams();
  if (subCategoryId) searchParams.set('subcategory', subCategoryId);
  if (categoryId) searchParams.set('category', categoryId);
  if (params.get('q')) searchParams.set('q', params.get('q')!);

  const searchString = searchParams.toString();
  const to = searchString ? `/search?${searchString}` : '/search';
  return <Navigate to={to} replace />;
}

// ─── Auth Pages ────────────────────────────────────────────────────────────────
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const EmailVerificationPage = lazy(() => import('./pages/auth/EmailVerificationPage'));
const AuthCallbackPage = lazy(() => import('./pages/auth/AuthCallbackPage'));

// ─── Public Pages ──────────────────────────────────────────────────────────────
const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const StoreDetailPage = lazy(() => import('./pages/StoreDetailPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const AllCategoriesPage = lazy(() => import('./pages/AllCategoriesPage'));
const AllStoresPage = lazy(() => import('./pages/AllStoresPage'));
const StoreLocatorPage = lazy(() => import('./pages/StoreLocatorPage'));
const CityLandingPage = lazy(() => import('./pages/CityLandingPage'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsConditionsPage = lazy(() => import('./pages/TermsConditionsPage'));
const FranchiseListingPage = lazy(() => import('./pages/FranchiseListingPage'));
const BecomeFranchisePage = lazy(() => import('./pages/BecomeFranchisePage'));

// ─── User Pages ────────────────────────────────────────────────────────────────
const AccountPage = lazy(() => import('./pages/AccountPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const PhoneSubmissionChatPage = lazy(() => import('./pages/PhoneSubmissionChatPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const StorePickupCheckoutPage = lazy(() => import('./pages/StorePickupCheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// ─── Seller Pages ──────────────────────────────────────────────────────────────
const SellerDashboard = lazy(() => import('./pages/seller/SellerDashboard'));
const StoreManagementPage = lazy(() => import('./pages/seller/StoreManagementPage'));
const ProductManagementPage = lazy(() => import('./pages/seller/ProductManagementPage'));
const ProductFormPage = lazy(() => import('./pages/seller/ProductFormPage'));
const SellerOnlineOrdersPage = lazy(() => import('./pages/seller/SellerOnlineOrdersPage'));
const FranchisePayoutPage = lazy(() => import('./pages/seller/FranchisePayoutPage'));
const SellerAnalyticsPage = lazy(() => import('./pages/seller/SellerAnalyticsPage'));
const SellerInsightsPage = lazy(() => import('./pages/SellerInsightsPage'));
const ABTestManagementPage = lazy(() => import('./pages/ABTestManagementPage'));
const ABTestResultsPage = lazy(() => import('./pages/ABTestResultsPage'));
const SellerPayoutsPage = lazy(() => import('./pages/SellerPayoutsPage'));
const LocationManagementPage = lazy(() => import('./pages/seller/LocationManagementPage'));
const FeaturedStoreApplicationPage = lazy(() => import('./pages/seller/FeaturedStoreApplicationPage'));
const FeaturedStorePaymentPage = lazy(() => import('./pages/seller/FeaturedStorePaymentPage'));
const StorePosterPage = lazy(() => import('./pages/seller/StorePosterPage'));

// ─── Admin Pages ───────────────────────────────────────────────────────────────
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminInvitesPage = lazy(() => import('./pages/AdminInvitesPage'));
const AdminStoresPage = lazy(() => import('./pages/admin/AdminStoresPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminBannersPage = lazy(() => import('./pages/admin/AdminBannersPage'));
const AdminStoreApprovalsPage = lazy(() => import('./pages/admin/AdminStoreApprovalsPage'));
const AdminLocationsPage = lazy(() => import('./pages/admin/AdminLocationsPage'));
const AdminSiteSettingsPage = lazy(() => import('./pages/admin/AdminSiteSettingsPage'));
const AdminSellPhonePage = lazy(() => import('./pages/admin/AdminSellPhonePage'));
const AdminFranchisePage = lazy(() => import('./pages/admin/AdminFranchisePage'));
const FranchiseAnalyticsDashboard = lazy(() => import('./pages/admin/FranchiseAnalyticsDashboard'));
const AdminPayoutPage = lazy(() => import('./pages/admin/AdminPayoutPage'));
const AdminFranchiseAnalyticsPage = lazy(() => import('./pages/admin/AdminFranchiseAnalyticsPage'));
const AdminPayoutsPage = lazy(() => import('./pages/admin/AdminPayoutsPage'));
const PayoutAnalyticsDashboard = lazy(() => import('./pages/admin/PayoutAnalyticsDashboard'));
const ReturnPolicySettingsPage = lazy(() => import('./pages/admin/ReturnPolicySettingsPage'));
const ReturnPeriodAdjustmentsPage = lazy(() => import('./pages/admin/ReturnPeriodAdjustmentsPage'));
const NotificationPreferencesPage = lazy(() => import('./pages/admin/NotificationPreferencesPage'));
const NotificationTemplatesPage = lazy(() => import('./pages/admin/NotificationTemplatesPage'));
const NotificationAnalyticsPage = lazy(() => import('./pages/admin/NotificationAnalyticsPage'));
const AdminCarBrandsPage = lazy(() => import('./pages/admin/AdminCarBrandsPage'));
const AdminBikeBrandsPage = lazy(() => import('./pages/admin/AdminBikeBrandsPage'));
const AdminPhoneBrandsPage = lazy(() => import('./pages/admin/AdminPhoneBrandsPage'));
const AdminSellerApplicationsPage = lazy(() => import('./pages/admin/AdminSellerApplicationsPage'));
const AdminPromotionsPage = lazy(() => import('./pages/admin/AdminPromotionsPage'));
const MonitoringDashboard = lazy(() => import('./pages/admin/MonitoringDashboard'));
const RecoveryDashboard = lazy(() => import('./pages/admin/RecoveryDashboard'));
const SEOManagementPage = lazy(() => import('./pages/admin/SEOManagementPage'));
const AdminEmailConfigPage = lazy(() => import('./pages/admin/AdminEmailConfigPage'));
const AdminBackupPage = lazy(() => import('./pages/admin/AdminBackupPage'));
const AdminFeedbackPage = lazy(() => import('./pages/admin/AdminFeedbackPage'));
const AdminPaymentSettingsPage = lazy(() => import('./pages/admin/AdminPaymentSettingsPage'));
const AdminPlatformSettingsPage = lazy(() => import('./pages/admin/AdminPlatformSettingsPage'));
const AdminProductApprovalsPage = lazy(() => import('./pages/admin/AdminProductApprovalsPage'));
const AdminFeaturedStorePlansPage = lazy(() => import('./pages/admin/AdminFeaturedStorePlansPage'));
const AdminFeaturedStoreApplicationsPage = lazy(() => import('./pages/admin/AdminFeaturedStoreApplicationsPage'));
const AdminIconPreviewAnalyticsPage = lazy(() => import('./pages/admin/AdminIconPreviewAnalyticsPage'));
const AdminPersonalizationDashboard = lazy(() => import('./pages/AdminPersonalizationDashboard'));

// ─── Payment Pages ─────────────────────────────────────────────────────────────
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  // Auth Routes
  { name: 'Login', path: '/login', element: <LoginPage /> },
  { name: 'Register', path: '/register', element: <RegisterPage /> },
  { name: 'Forgot Password', path: '/forgot-password', element: <ForgotPasswordPage /> },
  { name: 'Reset Password', path: '/reset-password', element: <ResetPasswordPage /> },
  { name: 'Email Verification', path: '/verify-email', element: <EmailVerificationPage /> },
  { name: 'Auth Callback', path: '/auth/callback', element: <AuthCallbackPage /> },

  // Legacy Redirect Routes (fix Google Search Console 404 errors)
  { name: 'Lander Redirect', path: '/lander', element: <Navigate to="/" replace /> },
  { name: 'Privacy Policy Legacy', path: '/privacy-policy', element: <Navigate to="/privacy" replace /> },
  { name: 'Product Detail Legacy', path: '/product/:id', element: <ProductLegacyRedirect /> },
  { name: 'Products Listing Legacy', path: '/products', element: <ProductsListingLegacyRedirect /> },
  { name: 'Business Page Legacy', path: '/business-page/about', element: <Navigate to="/about" replace /> },
  { name: 'Vendor Registration Legacy', path: '/vendor/auth/registration/index', element: <Navigate to="/register" replace /> },
  { name: 'Contact Us Legacy', path: '/contact-us', element: <Navigate to="/" replace /> },
  { name: 'Refund Policy Legacy', path: '/refund', element: <Navigate to="/terms" replace /> },
  { name: 'Store Detail Legacy Singular', path: '/store/:id', element: <StoreLegacyRedirect /> },
  { name: 'Category Detail Legacy', path: '/category/:id', element: <Navigate to="/categories" replace /> },
  { name: 'Terms of Service Legacy', path: '/terms-of-service', element: <Navigate to="/terms" replace /> },
  { name: 'Return Policy Legacy', path: '/return-policy', element: <Navigate to="/terms" replace /> },

  // Public Routes
  { name: 'Home', path: '/', element: <HomePage /> },
  { name: 'Search', path: '/search', element: <SearchPage /> },
  { name: 'All Categories', path: '/categories', element: <AllCategoriesPage /> },
  { name: 'All Stores', path: '/stores', element: <AllStoresPage /> },
  { name: 'Store Locator', path: '/store-locator', element: <StoreLocatorPage /> },
  { name: 'City Landing Page', path: '/location/:citySlug', element: <CityLandingPage /> },
  { name: 'Store Detail', path: '/stores/:id', element: <StoreDetailPage /> },
  { name: 'Product Detail', path: '/products/:id', element: <ProductDetailPage /> },
  { name: 'Franchise Listing', path: '/elite-partners', element: <FranchiseListingPage /> },
  { name: 'Become Franchise', path: '/become-elite-partner', element: <BecomeFranchisePage /> },
  { name: 'Franchises Legacy', path: '/franchises', element: <Navigate to="/elite-partners" replace /> },
  { name: 'Become Franchise Legacy', path: '/become-franchise', element: <Navigate to="/become-elite-partner" replace /> },
  { name: 'About Us', path: '/about', element: <AboutUsPage /> },
  { name: 'Privacy Policy', path: '/privacy', element: <PrivacyPolicyPage /> },
  { name: 'Terms and Conditions', path: '/terms', element: <TermsConditionsPage /> },

  // User Routes
  { name: 'Account', path: '/account', element: <AccountPage /> },
  { name: 'Settings', path: '/settings', element: <SettingsPage /> },
  { name: 'Favorites', path: '/favorites', element: <FavoritesPage /> },
  { name: 'Chat', path: '/chat', element: <ChatPage /> },
  { name: 'Phone Submission Chat', path: '/phone-submission-chat/:submissionId', element: <PhoneSubmissionChatPage /> },
  { name: 'Checkout', path: '/checkout/:productId', element: <CheckoutPage /> },
  { name: 'Store Pickup', path: '/store-pickup/:productId', element: <StorePickupCheckoutPage /> },
  { name: 'Order Confirmation', path: '/order-confirmation/:orderId', element: <OrderConfirmationPage /> },
  { name: 'My Orders', path: '/my-orders', element: <MyOrdersPage /> },
  { name: 'Notifications', path: '/notifications', element: <NotificationsPage /> },

  // Seller Routes
  { name: 'Seller Dashboard', path: '/seller/dashboard', element: <SellerDashboard /> },
  { name: 'Store Management', path: '/seller/store', element: <StoreManagementPage /> },
  { name: 'Location Management', path: '/seller/locations', element: <LocationManagementPage /> },
  { name: 'Product Management', path: '/seller/products', element: <ProductManagementPage /> },
  { name: 'Add Product', path: '/seller/products/new', element: <ProductFormPage /> },
  { name: 'Edit Product', path: '/seller/products/:id/edit', element: <ProductFormPage /> },
  { name: 'Online Orders', path: '/seller/online-orders', element: <SellerOnlineOrdersPage /> },
  { name: 'Order Analytics', path: '/seller/analytics', element: <SellerAnalyticsPage /> },
  { name: 'Product Insights', path: '/seller/insights', element: <SellerInsightsPage /> },
  { name: 'A/B Testing', path: '/seller/ab-tests', element: <ABTestManagementPage /> },
  { name: 'A/B Test Results', path: '/seller/ab-tests/:id/results', element: <ABTestResultsPage /> },
  { name: 'Seller Payouts', path: '/seller/payouts', element: <SellerPayoutsPage /> },
  { name: 'Franchise Payouts Old', path: '/seller/franchise-payouts', element: <FranchisePayoutPage /> },
  { name: 'Featured Store Application', path: '/seller/featured-store-apply', element: <FeaturedStoreApplicationPage /> },
  { name: 'Featured Store Payment', path: '/seller/featured-store-payment/:applicationId', element: <FeaturedStorePaymentPage /> },
  { name: 'Store Poster', path: '/seller/poster', element: <StorePosterPage /> },

  // Admin Routes
  { name: 'Admin Dashboard', path: '/admin', element: <AdminDashboardPage /> },
  { name: 'Admin Users', path: '/admin/users', element: <AdminUsersPage /> },
  { name: 'Admin Invites', path: '/admin/invites', element: <AdminInvitesPage /> },
  { name: 'Admin Store Approvals', path: '/admin/approvals', element: <AdminStoreApprovalsPage /> },
  { name: 'Admin Product Approvals', path: '/admin/product-approvals', element: <AdminProductApprovalsPage /> },
  { name: 'Admin Stores', path: '/admin/stores', element: <AdminStoresPage /> },
  { name: 'Admin Products', path: '/admin/products', element: <AdminProductsPage /> },
  { name: 'Admin Reviews', path: '/admin/reviews', element: <AdminReviewsPage /> },
  { name: 'Admin Categories', path: '/admin/categories', element: <AdminCategoriesPage /> },
  { name: 'Admin Locations', path: '/admin/locations', element: <AdminLocationsPage /> },
  { name: 'Admin Banners', path: '/admin/banners', element: <AdminBannersPage /> },
  { name: 'Admin Site Settings', path: '/admin/settings', element: <AdminSiteSettingsPage /> },
  { name: 'Admin Payment Settings', path: '/admin/payment-settings', element: <AdminPaymentSettingsPage /> },
  { name: 'Admin Platform Settings', path: '/admin/platform-settings', element: <AdminPlatformSettingsPage /> },
  { name: 'Admin Featured Store Plans', path: '/admin/featured-store-plans', element: <AdminFeaturedStorePlansPage /> },
  { name: 'Admin Featured Store Applications', path: '/admin/featured-store-applications', element: <AdminFeaturedStoreApplicationsPage /> },
  { name: 'Admin Sell Phone', path: '/admin/sell-phone', element: <AdminSellPhonePage /> },
  { name: 'Admin Car Brands', path: '/admin/car-brands', element: <AdminCarBrandsPage /> },
  { name: 'Admin Bike Brands', path: '/admin/bike-brands', element: <AdminBikeBrandsPage /> },
  { name: 'Admin Phone Brands', path: '/admin/phone-brands', element: <AdminPhoneBrandsPage /> },
  { name: 'Admin Franchise', path: '/admin/franchise', element: <AdminFranchisePage /> },
  { name: 'Franchise Analytics', path: '/admin/franchise/analytics', element: <FranchiseAnalyticsDashboard /> },
  { name: 'Admin Payout Management', path: '/admin/payouts', element: <AdminPayoutsPage /> },
  { name: 'Admin Payout Analytics', path: '/admin/payout-analytics', element: <PayoutAnalyticsDashboard /> },
  { name: 'System Monitoring', path: '/admin/monitoring', element: <MonitoringDashboard /> },
  { name: 'Error Recovery', path: '/admin/recovery', element: <RecoveryDashboard /> },
  { name: 'SEO Management', path: '/admin/seo', element: <SEOManagementPage /> },
  { name: 'Admin Return Policy Settings', path: '/admin/return-policy-settings', element: <ReturnPolicySettingsPage /> },
  { name: 'Admin Return Period Adjustments', path: '/admin/return-period-adjustments', element: <ReturnPeriodAdjustmentsPage /> },
  { name: 'Admin Notification Preferences', path: '/admin/notification-preferences', element: <NotificationPreferencesPage /> },
  { name: 'Admin Notification Templates', path: '/admin/notification-templates', element: <NotificationTemplatesPage /> },
  { name: 'Admin Notification Analytics', path: '/admin/notification-analytics', element: <NotificationAnalyticsPage /> },
  { name: 'Admin Seller Applications', path: '/admin/seller-applications', element: <AdminSellerApplicationsPage /> },
  { name: 'Admin Franchise Payouts Old', path: '/admin/franchise-payouts', element: <AdminPayoutPage /> },
  { name: 'Admin Franchise Analytics', path: '/admin/franchise-analytics', element: <AdminFranchiseAnalyticsPage /> },
  { name: 'Admin Promotions', path: '/admin/promotions', element: <AdminPromotionsPage /> },
  { name: 'Admin Email Config', path: '/admin/email-config', element: <AdminEmailConfigPage /> },
  { name: 'Admin Backup', path: '/admin/backup', element: <AdminBackupPage /> },
  { name: 'Admin Feedback', path: '/admin/feedback', element: <AdminFeedbackPage /> },
  { name: 'Admin Icon Preview Analytics', path: '/admin/icon-preview-analytics', element: <AdminIconPreviewAnalyticsPage /> },
  { name: 'Admin Personalization Dashboard', path: '/admin/personalization', element: <AdminPersonalizationDashboard /> },

  // Payment Routes
  { name: 'Payment Success', path: '/payment-success', element: <PaymentSuccessPage /> },
];

export default routes;
