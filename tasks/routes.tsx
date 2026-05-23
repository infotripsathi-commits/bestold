import type { ReactNode } from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';

// Helper component for legacy product URL redirects (/product/:id -> /products/:id)
function ProductLegacyRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/products/${id}`} replace />;
}

// Helper component for legacy /products listing redirects with query params
function ProductsListingLegacyRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const subCategoryId = params.get('sub_category_id');
  const categoryId = params.get('category_id');

  // Build search URL preserving relevant query params
  const searchParams = new URLSearchParams();
  if (subCategoryId) searchParams.set('subcategory', subCategoryId);
  if (categoryId) searchParams.set('category', categoryId);
  if (params.get('q')) searchParams.set('q', params.get('q')!);

  const searchString = searchParams.toString();
  const to = searchString ? `/search?${searchString}` : '/search';
  return <Navigate to={to} replace />;
}

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import EmailVerificationPage from './pages/auth/EmailVerificationPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';

// Public Pages
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import StoreDetailPage from './pages/StoreDetailPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AllCategoriesPage from './pages/AllCategoriesPage';
import AllStoresPage from './pages/AllStoresPage';
import StoreLocatorPage from './pages/StoreLocatorPage';
import CityLandingPage from './pages/CityLandingPage';
import AboutUsPage from './pages/AboutUsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsConditionsPage from './pages/TermsConditionsPage';
import FranchiseListingPage from './pages/FranchiseListingPage';
import BecomeFranchisePage from './pages/BecomeFranchisePage';

// User Pages
import AccountPage from './pages/AccountPage';
import ChatPage from './pages/ChatPage';
import PhoneSubmissionChatPage from './pages/PhoneSubmissionChatPage';
import FavoritesPage from './pages/FavoritesPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import MyOrdersPage from './pages/MyOrdersPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';

// Seller Pages
import SellerDashboard from './pages/seller/SellerDashboard';
import StoreManagementPage from './pages/seller/StoreManagementPage';
import ProductManagementPage from './pages/seller/ProductManagementPage';
import ProductFormPage from './pages/seller/ProductFormPage';
import SellerOnlineOrdersPage from './pages/seller/SellerOnlineOrdersPage';
import FranchisePayoutPage from './pages/seller/FranchisePayoutPage';
import SellerAnalyticsPage from './pages/seller/SellerAnalyticsPage';
import SellerInsightsPage from './pages/SellerInsightsPage';
import ABTestManagementPage from './pages/ABTestManagementPage';
import ABTestResultsPage from './pages/ABTestResultsPage';
import SellerPayoutsPage from './pages/SellerPayoutsPage';
import LocationManagementPage from './pages/seller/LocationManagementPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminInvitesPage from './pages/AdminInvitesPage';
import AdminStoresPage from './pages/admin/AdminStoresPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminBannersPage from './pages/admin/AdminBannersPage';
import AdminStoreApprovalsPage from './pages/admin/AdminStoreApprovalsPage';
import AdminLocationsPage from './pages/admin/AdminLocationsPage';
import AdminSiteSettingsPage from './pages/admin/AdminSiteSettingsPage';
import AdminSellPhonePage from './pages/admin/AdminSellPhonePage';
import AdminFranchisePage from './pages/admin/AdminFranchisePage';
import FranchiseAnalyticsDashboard from './pages/admin/FranchiseAnalyticsDashboard';
import AdminPayoutPage from './pages/admin/AdminPayoutPage';
import AdminFranchiseAnalyticsPage from './pages/admin/AdminFranchiseAnalyticsPage';
import AdminPayoutsPage from './pages/admin/AdminPayoutsPage';
import PayoutAnalyticsDashboard from './pages/admin/PayoutAnalyticsDashboard';
import ReturnPolicySettingsPage from './pages/admin/ReturnPolicySettingsPage';
import ReturnPeriodAdjustmentsPage from './pages/admin/ReturnPeriodAdjustmentsPage';
import NotificationPreferencesPage from './pages/admin/NotificationPreferencesPage';
import NotificationTemplatesPage from './pages/admin/NotificationTemplatesPage';
import NotificationAnalyticsPage from './pages/admin/NotificationAnalyticsPage';
import AdminSellerApplicationsPage from './pages/admin/AdminSellerApplicationsPage';
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage';
import MonitoringDashboard from './pages/admin/MonitoringDashboard';
import RecoveryDashboard from './pages/admin/RecoveryDashboard';
import SEOManagementPage from './pages/admin/SEOManagementPage';
import AdminEmailConfigPage from './pages/admin/AdminEmailConfigPage';
import AdminBackupPage from './pages/admin/AdminBackupPage';
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage';
import AdminPaymentSettingsPage from './pages/admin/AdminPaymentSettingsPage';
import AdminPlatformSettingsPage from './pages/admin/AdminPlatformSettingsPage';
import AdminProductApprovalsPage from './pages/admin/AdminProductApprovalsPage';
import AdminFeaturedStorePlansPage from './pages/admin/AdminFeaturedStorePlansPage';
import AdminFeaturedStoreApplicationsPage from './pages/admin/AdminFeaturedStoreApplicationsPage';
import AdminIconPreviewAnalyticsPage from './pages/admin/AdminIconPreviewAnalyticsPage';
import AdminPersonalizationDashboard from './pages/AdminPersonalizationDashboard';

// Payment Pages
import PaymentSuccessPage from './pages/PaymentSuccessPage';

// Seller Pages - Featured Store
import FeaturedStoreApplicationPage from './pages/seller/FeaturedStoreApplicationPage';
import FeaturedStorePaymentPage from './pages/seller/FeaturedStorePaymentPage';

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

  // Public Routes
  { name: 'Home', path: '/', element: <HomePage /> },
  { name: 'Search', path: '/search', element: <SearchPage /> },
  { name: 'All Categories', path: '/categories', element: <AllCategoriesPage /> },
  { name: 'All Stores', path: '/stores', element: <AllStoresPage /> },
  { name: 'Store Locator', path: '/store-locator', element: <StoreLocatorPage /> },
  { name: 'City Landing Page', path: '/location/:citySlug', element: <CityLandingPage /> },
  { name: 'Store Detail', path: '/stores/:id', element: <StoreDetailPage /> },
  { name: 'Product Detail', path: '/products/:id', element: <ProductDetailPage /> },
  { name: 'Franchise Listing', path: '/franchises', element: <FranchiseListingPage /> },
  { name: 'Become Franchise', path: '/become-franchise', element: <BecomeFranchisePage /> },
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

  // Admin Routes
  { name: 'Admin Dashboard', path: '/admin', element: <AdminDashboardPage /> },
  { name: 'Admin Users', path: '/admin/users', element: <AdminUsersPage /> },
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
