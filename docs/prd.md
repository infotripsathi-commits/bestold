# Requirements Document

## 1. Application Overview

- **Application Name:** BestOld
- **Description:** A second-hand goods selling platform where sellers can create their own stores, list products, and interact with customers via chat and phone calls. Customers can browse, search, and filter products and stores by location and category (including sub-categories), chat with sellers, call sellers, save products to a favorites list, and follow sellers. The location and search system follows the OLX.in model: a persistent city/region selector is displayed in the header across all pages, users have their location automatically detected via the browser's Geolocation API on first visit (with fallback to manual selection if detection fails or is denied), and all browsing and search results are automatically scoped to the detected or selected location by default, with the option to expand to all locations. The Recently Listed products section on the home page is automatically scoped to the user's currently active location. Shop owners (sellers) can set their store location using GPS-based auto-detection via the browser's Geolocation API during store creation and editing, in addition to manual selection from the admin-managed location list. A 「Sell Your Phone」 quick-sell button is prominently displayed on the platform, allowing any visitor to submit a phone sell inquiry form; the form includes a mandatory location selection field that is restricted to admin-configured pickup locations only; upon submission, the full form data including images is sent directly to the admin's WhatsApp number, the complete form details are also delivered to the admin within the platform via a dedicated Sell Your Phone Submissions section, and the submitter is automatically redirected to a dedicated chat page where a real-time chat session is immediately active between the submitter and the admin. The admin can close any Sell Your Phone chat at any time. All form fields and options, including the list of available pickup locations, are fully configurable by the admin via the Admin Panel. Sellers can gain followers from buyers. A persistent bottom navigation bar is present across all buyer and seller-facing pages for quick access to core sections. A horizontally auto-scrolling advertising banner strip featuring up to 5 paid store banners is displayed beneath the category section on the home page. New seller accounts require admin approval before their store and listings are visible to the public. Sellers can subscribe to a premium subscription plan from the Store Management Page by paying a specific subscription fee via UPI. Subscribed stores gain priority placement (top positioning in their location for stores and products), the ability to sell products online with integrated payment and third-party delivery, and unlimited product listings. Non-subscribed stores can only add up to 5 products and cannot sell online. The Admin Panel provides a comprehensive, user-friendly backend for managing all platform entities including seller approvals, users, stores, products, reviews, categories (with sub-categories), advertising banners, footer content, Sell Your Phone form configuration (including pickup location management), Sell Your Phone chat sessions, Popularise My Store promotions, subscription plans and subscription orders, coupon codes, UPI payment configuration, and email configuration. Location management is fully controlled by the admin via a dedicated Location Management section in the Admin Panel. There are no default or pre-seeded locations. The admin can add locations by entering a name manually, by using a GPS-based location picker to detect and pin a precise geographic coordinate, or by searching for a location by name via an integrated Google Maps search input that automatically populates the location name and GPS coordinates. A professional desktop footer is displayed across all public-facing pages and is fully managed by the admin. The Admin Panel is accessible via a dedicated shareable URL path, and the admin can create additional admin accounts directly from within the Admin Panel. Sellers can promote their store to appear at the top of store listings and be visually highlighted via the 「Popularise My Store」 feature, which requires a payment via UPI and supports admin-managed coupon codes for discounts. All monetary values across the platform are displayed in Indian Rupees (INR) using the ₹ symbol. Stores can be shared via a dedicated 「Share Store」 button available to both sellers and buyers on the Store Detail Page and within the seller's store management area. Users can authenticate via email OTP or Google social login: during registration, users can choose to register with email and receive an OTP via email from BestOld (containing the BestOld logo and name), verify the OTP, and log in; or users can choose to register/login directly using their Google account via Google OAuth. For password reset (email-registered users only), users receive an OTP via email, verify it, and can then set a new password. All platform emails (OTP verification, and any other transactional emails) are sent via a dedicated SMTP configuration managed by the admin. All emails sent from the platform include the BestOld logo and the BestOld name in the email header or body. The platform includes an App Icon Preview feature accessible via a dedicated Settings or About page, allowing users to preview the home screen icon before installation, view all icon sizes with device-specific labels, refresh the icon preview, compare the icon on different colored backgrounds, access reinstallation instructions, and reinstall the app with updated icons via a direct link.

---

## 2. Users & Use Cases

### 2.1 Target Users
- **Buyers:** Individuals looking to purchase second-hand goods, either via direct contact with sellers or via online purchase from subscribed stores.
- **Sellers:** Individuals or small businesses wanting to list and sell second-hand items. Sellers can choose to subscribe for premium features including online selling, unlimited listings, and priority placement, or remain non-subscribed with a 5-product listing limit and no online selling capability.
- **Admin:** Platform operator managing all backend operations including seller verification/approval, users, stores, products, reviews, categories (with sub-categories), locations, advertising banners, footer content, the Sell Your Phone form configuration (including pickup location management), Sell Your Phone chat sessions, Popularise My Store promotion settings, subscription plan management, subscription order management, coupon codes, admin account management, and email (SMTP) configuration.

### 2.2 Core Use Cases
- A first-time visitor lands on the platform; the browser's Geolocation API is automatically invoked to detect the visitor's current city/region. If a matching admin-managed location is found, it is set as the active location immediately and all browsing results — including the Recently Listed products section on the home page — are scoped to that location without any prompt. If detection fails, is denied, or returns no matching location, a location selection prompt is displayed as a fallback.
- A buyer registers with their email and phone number (both mandatory), receives an OTP via email from BestOld (containing the BestOld logo and name), verifies the OTP, and is automatically logged in; or a buyer registers/logs in directly using their Google account. The buyer then browses or searches for products/stores within their automatically detected or selected city, sees the Recently Listed products on the home page scoped to their active location, changes their location at any time via the persistent header location selector (which immediately refreshes the Recently Listed section and all other location-scoped content), filters by category and sub-category, chats with a seller or calls the seller, saves products to their favorites list, follows sellers, and leaves a review. For products from subscribed stores, the buyer can purchase online via integrated payment and receive the product via third-party delivery.
- A buyer or any visitor views a Store Detail Page and taps the 「Share Store」 button to share the store's URL via the device's native share sheet or by copying the link to clipboard.
- A visitor (guest or logged-in user) taps the 「Sell Your Phone」 button, views the list of admin-configured pickup locations displayed on the form, selects one available pickup location from the mandatory location dropdown, fills in the phone details form, submits the form, and is automatically redirected to a dedicated Sell Your Phone Chat Page where a real-time chat session is immediately active between the submitter and the admin.
- A seller registers with their email and phone number (both mandatory), receives an OTP via email from BestOld (containing the BestOld logo and name), verifies the OTP, is automatically logged in; or a seller registers/logs in directly using their Google account. The seller awaits admin approval, creates a store (setting their store location either via GPS auto-detection or manual selection), subscribes to a premium subscription plan from the Store Management Page by paying the subscription fee via UPI to gain unlimited product listings, online selling capability, and priority placement, or remains non-subscribed with a 5-product listing limit and no online selling, lists products, responds to buyer chats, and manages their listings. The seller can also tap the 「Popularise My Store」 button in their account section (My Account Page), the Seller Dashboard, or the Store Management Page to promote their store — selecting a promotion plan, optionally applying a coupon code, and completing payment via UPI to the admin's configured UPI ID. The seller can also tap the 「Share Store」 button on the Store Management Page or Store Detail Page to share their store link.
- A user who has forgotten their password (email-registered users only) taps the 「Forgot Password」 link on the Login Page, enters their registered email address, receives an OTP via email from BestOld (containing the BestOld logo and name), enters the OTP to verify their identity, and sets a new password. Users who registered via Google social login do not have a platform password and cannot use the forgot password flow; they must log in via Google.
- An admin logs into the Admin Panel, manages all platform content, configures the Popularise My Store promotion plans and pricing (in ₹ INR), configures subscription plans and pricing (in ₹ INR), manages subscription orders and activations, manages coupon codes, views all promotion orders and payment records, controls which stores are currently promoted and highlighted, configures the list of available pickup locations for the Sell Your Phone feature, and configures the platform's SMTP email settings.
- An admin adds a new location by typing the location name manually, by tapping a 「Detect Location」 button to use the browser's Geolocation API to pin the precise GPS coordinates of that location, or by using the Google Maps search input to search for a location by name and automatically populate the location name and GPS coordinates from the selected Google Maps result.
- An admin shares the dedicated Admin Panel URL with another trusted operator.
- A user (buyer or seller) navigates to the Settings or About page, views the current app icon preview, explores all icon sizes with device-specific labels, refreshes the icon preview to see the latest version, compares the icon on different colored backgrounds to ensure visibility, reads instructions on how to update the icon if they installed an old version, and taps a direct link to reinstall the app with updated icons.

---

## 3. Page Structure & Core Features

### 3.1 Page Overview

```
BestOld
├── Landing / Home Page
├── Auth Pages
│   ├── Register Page (Buyer / Seller)
│   ├── OTP Verification Page (Registration)
│   ├── Login Page
│   └── Forgot Password Flow (Email-Registered Users Only)
│       ├── Forgot Password Page (Email Entry)
│       ├── OTP Verification Page (Password Reset)
│       └── Reset Password Page
├── Buyer-Facing Pages
│   ├── Search Results Page
│   ├── All Categories Page
│   ├── All Stores Page
│   ├── Store Detail Page
│   ├── Product Detail Page
│   ├── Online Checkout Page (for subscribed store products)
│   ├── Order Confirmation Page
│   ├── My Orders Page
│   ├── Chat Page
│   ├── Sell Your Phone Chat Page (Submitter View)
│   ├── Favorites Page
│   ├── Following Page
│   ├── My Account Page
│   ├── Settings / About Page (with App Icon Preview)
│   ├── About Us Page
│   ├── Privacy Policy Page
│   └── Terms & Conditions Page
├── Seller-Facing Pages
│   ├── Seller Dashboard
│   ├── My Account Page (Seller)
│   ├── Store Management Page
│   ├── Subscribe to Premium Page
│   ├── Product Management Page
│   ├── Online Orders Management Page (subscribed sellers only)
│   ├── Chat Page (Seller View)
│   ├── Settings / About Page (with App Icon Preview)
│   └── Popularise My Store Page
└── Admin Panel
    ├── Dashboard (Overview)
    ├── Seller Approval Management
    ├── User Management
    ├── Store Management
    ├── Product Management
    ├── Review Management
    ├── Category Management (with Sub-Category Management)
    ├── Location Management
    ├── Advertising Banner Management
    ├── Sell Your Phone Form Management (including Pickup Location Management)
    ├── Sell Your Phone Submissions & Chat
    ├── Popularise My Store Management
    ├── Subscription Management
    ├── Footer Management
    ├── Email Configuration
    ├── App Icon Preview Analytics
    └── Admin Account Management
```

### 3.2 Location & Search System (OLX.in Model)

The location and search system is modelled after OLX.in, providing a city-scoped browsing and search experience throughout the platform.

**Automatic Location Detection on Page Load**
- When any visitor (guest or returning user without a saved location preference) lands on the platform, the browser's Geolocation API is automatically invoked in the background without displaying any prompt first.
- If the Geolocation API returns a position and the detected city/region matches an admin-managed location, that location is silently set as the active location and all browsing results — including the Recently Listed products section on the home page — are immediately scoped to it. No modal or prompt is shown.
- If the Geolocation API is denied by the user, times out, returns an error, or the detected city does not match any admin-managed location, the system falls back to the First-Visit Location Prompt (described below).
- For logged-in users who have a saved preferred location in their profile, the saved location takes precedence over auto-detection and is restored immediately on login without triggering the Geolocation API; the Recently Listed section and all location-scoped content on the home page are immediately scoped to the saved location.

**Persistent Header Location Selector**
- A location selector is displayed persistently in the global header across all public-facing and buyer/seller-facing pages (excluding the Admin Panel).
- The selector displays the currently active city/region name (e.g., 「Mumbai」).
- Clicking or tapping the location selector opens a location picker interface (modal or dropdown) where the user can:
  - Search for a city/region by typing in a search input field.
  - Browse and select from the full list of admin-managed locations.
  - Use an 「Auto-detect my location」 button to re-invoke the browser's Geolocation API; if the detected city matches an admin-managed location, it is selected automatically; if no match is found, the user is prompted to select manually.
- Once a location is selected, it is persisted for the session (and across sessions for logged-in users via their profile) and all browsing and search results — including the Recently Listed products section on the home page — are automatically scoped to that location and refreshed immediately.
- A 「All India」 or 「All Locations」 option is always available in the location picker, allowing the user to browse without any location restriction; selecting this option causes the Recently Listed section to display products from all locations.
- If no locations have been configured by the admin, the location selector shows a placeholder (e.g., 「No locations available」) and location-scoped filtering is disabled.

**First-Visit Location Prompt (Fallback Only)**
- The first-visit location prompt is displayed only as a fallback when automatic location detection fails, is denied, or returns no matching admin-managed location.
- The prompt asks the user to select their city/region before browsing.
- The prompt offers:
  - A search input to find and select a city.
  - An 「Auto-detect my location」 button.
  - A 「Browse All Locations」 or 「Skip」 option to dismiss the prompt and browse without a location filter.
- Once a location is selected or the prompt is dismissed, it is not shown again for that session.

**Location-Scoped Browsing & Search**
- All product listings, store listings, and search results displayed across the platform are automatically filtered to the user's currently selected location by default.
- Subscribed stores and their products are displayed at the top of all location-scoped listings (All Stores Page, Search Results Page, Recently Listed section) within their location, followed by non-subscribed stores and products.
- The currently active location is always visible in the header selector so the user is always aware of their active scope.
- On the Search Results Page, the active location filter is displayed as a visible filter chip or indicator at the top of results.
- The user can change the location filter directly on the Search Results Page without re-entering their search query; changing the location immediately refreshes results.
- A 「See results from all locations」 or 「Expand search」 option is displayed on the Search Results Page when the current location-scoped search returns zero results, allowing the user to broaden the scope to all locations with a single tap.
- Location filtering can be applied independently of keyword search; a user may select a location and browse all listings in that area without entering any keyword.

**Search Bar Behaviour**
- A prominent search bar is displayed in the header on all public-facing pages (consistent with OLX.in), alongside the persistent location selector.
- The search bar accepts free-text input and searches product titles/descriptions and store names simultaneously.
- Search suggestions or recent searches may be displayed as a dropdown beneath the search bar as the user types (autocomplete is limited to product titles and store names from the currently selected location scope).
- Submitting a search navigates to the Search Results Page with results scoped to the currently selected location.
- On the Search Results Page, the search query and active location are both displayed and independently editable.

**Location Display on Listings**
- Every product listing card and store listing card displays the location (city/region) of the listing.
- On the Product Detail Page and Store Detail Page, the location is displayed as a clickable element that, when tapped, navigates to the Search Results Page pre-filtered by that location.

### 3.3 Bottom Navigation Bar

A fixed bottom navigation bar is displayed across all buyer-facing and seller-facing pages (excluding the Admin Panel and Auth Pages). It contains exactly 5 tabs in the following order:

| Tab | Label | Icon | Tap Behavior |
|---|---|---|---|
| 1 | Home | Home icon | Navigates to the Landing / Home Page |
| 2 | All Categories | Categories icon | Navigates to the All Categories Page |
| 3 | Favorites | Favorites / Heart icon | Navigates to the Favorites Page (buyers); hidden or disabled for sellers |
| 4 | Stores | Stores icon | Navigates to the All Stores Page |
| 5 | Account | Account / Person icon | Navigates to My Account Page for buyers; navigates to My Account Page (Seller) for sellers |

- The active tab is visually highlighted to indicate the current page.
- The bottom navigation bar is always visible and does not scroll away.
- For guest (unauthenticated) users tapping Favorites or Account, they are redirected to the Login Page with a return URL.
- The Favorites tab is positioned in the middle of the bottom navigation bar, between All Categories and Stores.

### 3.4 Landing / Home Page
- **Persistent header** containing the search bar and the location selector (as described in Section 3.2).
- The platform logo displayed in the header uses the BestOld branding; the admin can update the logo image via the Admin Panel.
- **「Sell Your Phone」 Button:**
  - A clearly visible 「Sell Your Phone」 button is displayed prominently on the home page.
  - Tapping or clicking the button opens the Sell Your Phone Form as a modal overlay or a dedicated page.
  - The button label is configurable by the admin via the Sell Your Phone Form Management section.
  - The button is accessible to all visitors without requiring authentication.
- **「Browse by Location」 section on the home page displaying available cities/regions.**
  - Displays admin-managed locations as clickable city/region chips or cards.
  - Clicking a location sets it as the active location and navigates to the Search Results Page pre-filtered by that location.
  - If no locations have been configured, the section displays a placeholder or is hidden entirely.
- **「Browse by Category」 section displayed directly beneath the 「Browse by Location」 section.**
  - Displays all active top-level categories in a single horizontal scrollable row.
  - Exactly 5 category items are visible at a time; additional categories are accessible by scrolling horizontally.
  - Each category is represented by its name and associated category image.
  - The horizontal scroll row does not wrap to multiple lines.
  - Clicking a category navigates to the All Categories Page or Search Results Page pre-filtered by that category, scoped to the currently active location.
- **「Advertising Banners」 section displayed directly beneath the 「Browse by Category」 section.**
  - Displays up to 5 advertising banner slots, each linked to a paid store.
  - Banners auto-scroll horizontally in a continuous loop.
  - Each banner is fully clickable and navigates to the corresponding Store Detail Page.
  - If no advertising banners are active, the section is hidden entirely.
- Only stores and products belonging to admin-approved sellers are visible on the home page and throughout the platform.
- **「Recently Listed」 Products Section:**
  - Displays featured or recently listed products from approved sellers.
  - The section is automatically scoped to the user's currently active location by default. When a user's location is set (either via auto-detection or manual selection), only products listed in that city/region are displayed in this section.
  - Subscribed stores' products are displayed at the top of the Recently Listed section within the active location, followed by non-subscribed stores' products.
  - When the user changes their active location via the header location selector, the Recently Listed section immediately refreshes to display products from the newly selected location.
  - If the user selects 「All Locations」, the Recently Listed section displays products from all locations.
  - If no products are available in the currently active location, the section displays a 「No listings available in [City]」 message with an option to browse all locations.
  - Each product card displays the product thumbnail, price (₹ INR), location, and seller store name. Products from subscribed stores display a 「Premium」 or 「Subscribed」 badge.
  - **Responsive grid layout:**
    - Mobile (small screens): 2-column grid layout.
    - Tablet (medium screens): 3-column grid layout.
    - Desktop (large screens): 4-column grid layout.
  - Promoted stores (active Popularise My Store promotions) are displayed at the top of any store listing sections on the home page and are visually highlighted (e.g., with a distinct border, badge, or background colour) to distinguish them from non-promoted stores.
- Navigation links to Login and Register.
- **Professional desktop footer** is displayed at the bottom of the home page (and all public-facing pages); see Section 3.23 for full footer specification.

### 3.5 Sell Your Phone Form

**Form Trigger**
- The form is opened by tapping or clicking the 「Sell Your Phone」 button available on the home page.
- The form is accessible to all visitors without requiring authentication.
- The form opens as a modal overlay or a dedicated page.

**Image Storage**
- All images uploaded via the Sell Your Phone form (up to 6 phone images) must be stored in a dedicated, pre-configured backend storage bucket before the WhatsApp submission is assembled.
- The storage bucket must exist and be accessible prior to any form submission attempt.
- Image upload to the storage bucket is handled server-side.
- The implementation must validate bucket availability at application startup or at the time of the first upload attempt.

**Form Fields**
All form fields and their options are fully configurable by the admin via the Sell Your Phone Form Management section. The default field configuration is as follows:

1. **Pickup Location** — Select dropdown; mandatory; populated exclusively from the admin-configured list of available pickup locations; only locations marked as active for Sell Your Phone pickup are displayed.
2. **Brand Name** — Select dropdown; mandatory.
3. **Model Name** — Select dropdown; filtered based on selected brand; mandatory.
4. **Variant** — Select dropdown; filtered based on selected model; mandatory.
5. **Condition** — Select dropdown; mandatory.
6. **How Much Old (Age of Device)** — Select dropdown; mandatory.
7. **Add Images** — Image upload field; up to 6 images; at least 1 mandatory; slots labeled Front Side, Back Side, Left Side, Right Side, Top Side, Bottom Side; supported formats: JPG, PNG, WEBP.

**Pickup Location Field Behavior**
- The Pickup Location dropdown is displayed as the first field in the Sell Your Phone form.
- The dropdown is populated exclusively from the list of locations that the admin has marked as available for Sell Your Phone pickup in the Sell Your Phone Form Management section.
- If no pickup locations have been configured by the admin, the Pickup Location dropdown displays an empty state or a placeholder message such as 「No pickup locations available」, and the form cannot be submitted.
- The selected pickup location is included in the form submission data sent to the admin's WhatsApp number and saved in the platform submission record.
- A brief informational message is displayed above or below the Pickup Location dropdown, such as: 「We currently offer phone pickup service in the following locations. Please select your location to proceed.」

**Form Submission**
- Upon tapping Submit, all uploaded images are first saved to the backend storage bucket.
- Once all images are successfully stored, the following two actions occur simultaneously:
  1. **WhatsApp Delivery:** All form data (including the selected pickup location) and uploaded images are sent to the admin's WhatsApp number.
  2. **Platform-Side Submission Record:** The complete form submission (including the selected pickup location) is saved as a submission record in the platform backend.
- **Post-Submission Redirect to Chat:** After a successful form submission, the submitter is automatically redirected to the Sell Your Phone Chat Page where a real-time chat session is immediately active.
- After successful submission, a confirmation message is briefly displayed before the redirect.
- If submission fails, an inline error message is displayed and form data is retained.

### 3.6 Auth Pages

**Register Page**
- User selects account type at registration: Buyer or Seller.
- **Two registration methods are available:**
  1. **Email Registration:** Required fields: Full name, email address (mandatory), phone number (mandatory), password, confirm password. After submitting the registration form, the user receives an OTP via email from BestOld; the email contains the BestOld logo and the BestOld name in the header or body. The user is navigated to the OTP Verification Page (Registration) where they enter the OTP received by email. After successful OTP verification, seller accounts enter a 「Pending Approval」 state; buyer accounts are immediately logged in and can access platform features.
  2. **Google Social Login:** A clearly visible 「Sign up with Google」 button is displayed on the Register Page. Tapping this button initiates the Google OAuth flow. Upon successful Google authentication, the user's Google account information (name, email, profile picture) is retrieved and used to create a new account on the platform. Phone number is collected as an additional mandatory field after Google authentication completes. After phone number is provided, seller accounts enter a 「Pending Approval」 state; buyer accounts are immediately logged in and can access platform features. No OTP verification is required for Google-registered accounts.
- Email and phone number fields are both mandatory for email registration; form submission is blocked if either field is left empty.
- Sellers in 「Pending Approval」 state see a clear on-screen message after login.

**OTP Verification Page (Registration)**
- **This page is only displayed for users who registered via email.**
- The user enters the OTP received in their email.
- The OTP is a numeric code.
- The OTP has a defined expiry window (e.g., 10 minutes); if expired, the user is prompted to request a new OTP.
- A 「Resend OTP」 option is available; tapping it sends a new OTP to the same email address from BestOld (containing the BestOld logo and name) and resets the expiry timer.
- If the OTP entered is correct and not expired, the user is logged in automatically (buyers) or enters Pending Approval state (sellers).
- If the OTP entered is incorrect, an inline error message is displayed: 「Invalid OTP. Please try again.」
- If the OTP has expired, an inline error message is displayed: 「OTP has expired. Please request a new one.」
- A 「Back」 link returns the user to the Register Page.

**Login Page**
- **Two login methods are available:**
  1. **Email Login:** Login via email and password. A 「Forgot Password?」 link is displayed on the Login Page; tapping it navigates the user to the Forgot Password Page (only available for email-registered users).
  2. **Google Social Login:** A clearly visible 「Sign in with Google」 button is displayed on the Login Page. Tapping this button initiates the Google OAuth flow. Upon successful Google authentication, the user is logged in immediately if their Google account is already registered on the platform. If the Google account is not registered, the user is redirected to the Register Page with their Google account information pre-filled.
- Redirect to respective dashboard based on account type after login.
- Sellers with 「Pending Approval」 status are shown the pending message.
- Sellers whose accounts have been rejected are shown a 「Your account was not approved」 message.

**Forgot Password Flow (Email-Registered Users Only)**

The forgot password flow consists of three sequential steps and is only available to users who registered via email. Users who registered via Google social login do not have a platform password and cannot use this flow; they must log in via Google.

1. **Forgot Password Page (Email Entry)**
  - The user enters their registered email address and taps a 「Send OTP」 button.
  - The system validates that the email exists in the platform and was registered via email (not Google).
  - If the email is registered via email, an OTP is sent to that email address from BestOld; the email contains the BestOld logo and the BestOld name in the header or body.
  - The user is navigated to the OTP Verification Page (Password Reset).
  - If the email is not found or was registered via Google, an inline error message is displayed: 「No account found with this email address, or this account uses Google login.」
  - A 「Back to Login」 link is available.

2. **OTP Verification Page (Password Reset)**
  - The user enters the OTP received in their email.
  - The OTP is a numeric code.
  - The OTP has a defined expiry window (e.g., 10 minutes); if expired, the user is prompted to request a new OTP.
  - A 「Resend OTP」 option is available; tapping it sends a new OTP to the same email address from BestOld (containing the BestOld logo and name) and resets the expiry timer.
  - If the OTP entered is correct and not expired, the user is navigated to the Reset Password Page.
  - If the OTP entered is incorrect, an inline error message is displayed: 「Invalid OTP. Please try again.」
  - If the OTP has expired, an inline error message is displayed: 「OTP has expired. Please request a new one.」
  - A 「Back」 link returns the user to the Forgot Password Page.

3. **Reset Password Page**
  - The user enters a new password and confirms it in a second field.
  - Password must meet the platform's minimum requirements (at least 8 characters).
  - If the two password fields do not match, an inline error message is displayed and form submission is blocked.
  - If the password is shorter than 8 characters, an inline error message is displayed and form submission is blocked.
  - Upon successful password reset, a success message is displayed and the user is redirected to the Login Page.
  - The OTP is invalidated immediately after a successful password reset and cannot be reused.

### 3.7 All Categories Page
- Displays all active top-level categories in a grid or list layout.
- Each category shows its name and category image.
- Tapping a category expands or navigates to a sub-category view.
- Tapping a sub-category navigates to the Search Results Page pre-filtered by that sub-category, scoped to the currently active location.
- Tapping a category without selecting a sub-category navigates to the Search Results Page pre-filtered by that top-level category, scoped to the currently active location.

### 3.8 All Stores Page
- Displays all active stores belonging to approved sellers, scoped to the currently active location by default.
- Subscribed stores are displayed at the top of the store list within the active location and are visually highlighted with a 「Premium」 or 「Subscribed」 badge.
- A location filter is available at the top of the page, pre-populated with the currently active location; the user can change it to any admin-managed location or select 「All Locations」.
- Promoted stores (active Popularise My Store promotions) are displayed at the top of the store list and are visually highlighted (e.g., with a distinct badge, border, or background) to distinguish them from non-promoted stores.
- Each store entry shows: store name, location, number of listings, average review rating, follower count. Subscribed stores display a 「Premium」 or 「Subscribed」 badge. Promoted stores additionally display a 「Featured」 or 「Promoted」 badge.
- Search by store name and filter by location simultaneously.
- Tapping a store navigates to the Store Detail Page.

### 3.9 Search Results Page
- Displays combined results for products and stores matching the search query (approved sellers only), scoped to the currently active location by default.
- Subscribed stores and their products are displayed at the top of search results within the active location, followed by non-subscribed stores and products.
- Header search bar and location selector remain visible and functional on this page, consistent with the OLX.in model.
- The active search query and active location are both displayed at the top of the results page and are independently editable inline.
- Promoted stores appear at the top of store results and are visually highlighted.
- **Location filter** is always visible at the top of the results as a prominent filter control, pre-populated with the currently active location. The user can change the location directly on this page without re-entering the search query.
- **「See results from all locations」 prompt:** When the current location-scoped search returns zero results, a prompt is displayed offering the user the option to expand the search to all locations with a single tap.
- Filter options: Result type (Products / Stores), Location, Category, Sub-Category.
- Active filter indicators (chips or tags) are displayed at the top of results; each active filter can be individually removed.
- Each product result shows: thumbnail, price (displayed as ₹ amount in INR), seller store name, location, a 「Chat with Seller」 button, and a 「Contact Seller」 button. Products from subscribed stores display a 「Premium」 or 「Subscribed」 badge and a 「Buy Now」 button for online purchase.
  - The product listing title/name field is replaced by the action buttons; the product name is not displayed on the search result card.
  - Tapping 「Chat with Seller」 initiates or opens a chat with the seller (logged-in buyers only; unauthenticated users are redirected to the Login Page with a return URL).
  - Tapping 「Contact Seller」 displays the seller's phone number and triggers the device's native phone dialer. If no phone number is provided by the seller, the 「Contact Seller」 button is hidden or shown as disabled.
  - Tapping 「Buy Now」 (subscribed store products only) navigates the buyer to the Online Checkout Page for that product.
- Each store result shows: store name, location, number of listings, average review rating, follower count. Subscribed stores display a 「Premium」 or 「Subscribed」 badge. Promoted stores display a 「Featured」 or 「Promoted」 badge.
- **Sort options** are available on the Search Results Page, including: Most Recent, Price: Low to High, Price: High to Low.

### 3.10 Store Detail Page
- Store name, description, location, average review rating, and follower count.
- If the store has an active subscription, a 「Premium」 or 「Subscribed」 badge is displayed prominently on the Store Detail Page.
- If the store has an active Popularise My Store promotion, a 「Featured」 or 「Promoted」 badge is displayed prominently on the Store Detail Page.
- Follow / Unfollow button visible to logged-in buyers.
- Store location is displayed as a clickable link that navigates to the Search Results Page pre-filtered by that location.
- List of all active product listings from that store; each listing displays the price in ₹ INR. Products from subscribed stores display a 「Buy Now」 button for online purchase.
- Seller reviews section.
- Button to initiate chat with the seller.
- No social media links or icons are displayed on the Store Detail Page.
- **「Share Store」 Button:**
  - A clearly visible 「Share Store」 button is displayed on the Store Detail Page, accessible to all visitors (guests, logged-in buyers, and logged-in sellers) without requiring authentication.
  - Tapping or clicking the 「Share Store」 button triggers the device's native share sheet (Web Share API) if supported by the browser/device, allowing the user to share the store's direct URL via any available sharing channel (e.g., WhatsApp, SMS, email, copy link).
  - If the native share sheet is not supported by the browser/device, tapping the button copies the store's direct URL to the clipboard and displays a brief confirmation message such as 「Link copied to clipboard」.
  - The shared URL is the direct, publicly accessible URL of the Store Detail Page for that store.

### 3.11 Product Detail Page
- Product images, title, description, price (displayed as ₹ amount in INR), condition, category, and sub-category (if assigned).
- Product location displayed as a clickable link that navigates to the Search Results Page pre-filtered by that location.
- Seller store name (linked to Store Detail Page).
- 「Add to Favorites」 button for logged-in buyers.
- 「Chat with Seller」 button.
- 「Call Seller」 button.
- **「Buy Now」 button (subscribed store products only): Tapping this button navigates the buyer to the Online Checkout Page for that product.**
- Related products from the same store.

### 3.12 Online Checkout Page (Buyer)

**Access**
- Accessible only for products from subscribed stores.
- Navigated to by tapping the 「Buy Now」 button on a product card or Product Detail Page.
- Only logged-in buyers can access this page; unauthenticated users are redirected to the Login Page with a return URL.

**Page Content**
- Product summary: thumbnail, title, price (₹ INR), quantity selector.
- Delivery address form: full name, phone number, address line 1, address line 2, city, state, pincode.
- Order summary: product price, delivery charge (if applicable), total amount (₹ INR).
- Payment method selection: UPI, Card, Net Banking, Cash on Delivery (if enabled by admin).
- 「Place Order」 button.

**Order Placement**
- Upon tapping 「Place Order」, the order is created and saved in the platform backend.
- Payment is processed via the selected payment method.
- Upon successful payment, the buyer is redirected to the Order Confirmation Page.
- If payment fails, an inline error message is displayed and the buyer can retry.
- The order is assigned a unique order ID and is immediately visible to the buyer in the My Orders Page and to the seller in the Online Orders Management Page.

### 3.13 Order Confirmation Page (Buyer)
- Displays a success message confirming the order has been placed.
- Order summary: order ID, product details, delivery address, total amount paid (₹ INR), estimated delivery date.
- A 「View My Orders」 button navigates the buyer to the My Orders Page.
- A 「Continue Shopping」 button navigates the buyer back to the home page.

### 3.14 My Orders Page (Buyer)
- Displays a list of all orders placed by the buyer, sorted by most recent first.
- Each order entry shows: order ID, product thumbnail, product title, seller store name, order date, order status (Pending, Confirmed, Shipped, Delivered, Cancelled), total amount (₹ INR).
- Tapping an order entry navigates to a detailed Order Detail View showing full order information, delivery address, payment method, and order status history.
- Buyers can view the delivery tracking information (if provided by the seller or third-party delivery system).

### 3.15 Chat Page (Buyer View)
- List of all active conversations with sellers.
- Real-time messaging interface per conversation.
- Chat history saved persistently.

### 3.16 Sell Your Phone Chat Page (Submitter View)
- The submitter is automatically redirected to this page immediately after a successful Sell Your Phone form submission.
- Displays the real-time chat interface between the submitter and the admin, active immediately upon arrival.
- Chat history is persistently stored.
- If the admin has closed the chat, the submitter sees a 「Chat Closed」 indicator and cannot send further messages.
- The submitter can view the full details of their original form submission (including the selected pickup location) within this page.

### 3.17 Favorites Page (Buyer)
- Displays all products the buyer has saved to their favorites list.
- Each favorites item shows: product thumbnail, title, price (displayed as ₹ amount in INR), seller store name. Products from subscribed stores display a 「Buy Now」 button.
- Buyer can remove a product from the favorites list directly from this page.
- Sold or removed products are shown with a 「No longer available」 indicator.

### 3.18 Following Page (Buyer)
- Displays all seller stores the buyer is currently following.
- Each entry shows: store name, location, number of listings, average review rating, follower count. Subscribed stores display a 「Premium」 or 「Subscribed」 badge.
- Buyer can unfollow a store directly from this page.

### 3.19 My Account Page (Buyer)
- View and edit profile details (name, email, phone number, location).
- The location field in the buyer's profile corresponds to their preferred city/region and is used as the default active location when they log in; the Recently Listed section on the home page is immediately scoped to this saved location upon login.
- View chat history.
- View submitted reviews.
- Quick links to Favorites Page, Following Page, My Orders Page, and Settings / About Page.
- **For Google-registered buyers, the email field is read-only and cannot be edited.**

### 3.20 Seller Dashboard
- Only accessible to sellers with 「Approved」 status.
- Overview: total listings, total messages, store review rating, follower count, subscription status (Active / Inactive), subscription expiry date (if active), total online orders (if subscribed).
- Quick links to Store Management, Product Management, Online Orders Management (if subscribed), and Settings / About Page.
- **「Subscribe to Premium」 button prominently displayed** if the seller does not have an active subscription. Tapping this button navigates the seller to the Subscribe to Premium Page.
- **「Popularise My Store」 button prominently displayed** in the Seller Dashboard as a clear call-to-action. Tapping this button navigates the seller to the Popularise My Store Page.

### 3.21 My Account Page (Seller)
- View and edit profile details (name, email, phone number, location).
- Subscription status display: Active / Inactive, subscription plan name, expiry date (if active).
- **「Subscribe to Premium」 button prominently displayed** if the seller does not have an active subscription. Tapping this button navigates the seller to the Subscribe to Premium Page.
- **「Popularise My Store」 button prominently displayed** in the seller's My Account Page as a clear call-to-action. Tapping this button navigates the seller to the Popularise My Store Page.
- Quick links to Seller Dashboard, Store Management Page, Product Management Page, and Settings / About Page.
- **For Google-registered sellers, the email field is read-only and cannot be edited.**

### 3.22 Store Management Page (Seller)
- Create store: store name, description, contact info.
- **Store Location Field (GPS-Enabled):**
  - The store location field is displayed during store creation and editing.
  - A 「Detect My Location」 button is available alongside the location dropdown; tapping it invokes the browser's Geolocation API to detect the seller's current GPS coordinates and automatically match them to the nearest admin-managed location.
  - If a matching admin-managed location is found via GPS, it is automatically selected in the location dropdown.
  - If GPS detection fails, is denied, or returns no matching admin-managed location, the seller is prompted to select their location manually from the admin-managed location list.
  - The seller can also manually select or change the location at any time from the dropdown, regardless of whether GPS detection was used.
- **Trade Licence Upload (Mandatory).**
- **Banner Images (Mandatory):** at least 1, up to 3.
- Edit store details.
- View store review rating and individual buyer reviews.
- View current follower count.
- Subscription status display: Active / Inactive, subscription plan name, expiry date (if active).
- **「Subscribe to Premium」 button** is displayed within the Store Management Page if the seller does not have an active subscription, providing a secondary access point to the Subscribe to Premium Page.
- **「Popularise My Store」 button** is also displayed within the Store Management Page, providing a secondary access point to the Popularise My Store Page.
- No social media link fields are present on the Store Management Page.
- **「Share Store」 Button:**
  - A 「Share Store」 button is displayed on the Store Management Page, allowing the seller to share their store's direct URL.
  - Tapping or clicking the button triggers the device's native share sheet if supported; otherwise, the store URL is copied to the clipboard and a brief confirmation message is displayed.
  - The shared URL is the direct, publicly accessible URL of the Store Detail Page for that store.

### 3.23 Subscribe to Premium Page (Seller)

This page is accessible to approved sellers via the 「Subscribe to Premium」 button in the Seller Dashboard, the My Account Page (Seller), and the Store Management Page.

**Subscription Plan Selection**
- The page displays all active subscription plans configured by the admin, each showing:
  - Plan name (e.g., Monthly, Quarterly, Yearly)
  - Duration
  - Price (displayed as ₹ amount in INR)
  - Features: Unlimited product listings, Online selling capability, Priority placement (top positioning in location for stores and products)
- The seller selects one subscription plan.

**Order Summary**
- Displays: selected plan name, duration, price (₹ INR), and total payable amount (₹ INR).

**Payment via UPI**
- A 「Pay Now」 button initiates the UPI payment flow.
- Payment is made directly to the admin's UPI ID configured in the Admin Panel.
- The UPI payment flow presents the seller with the admin's UPI ID and the exact payable amount in ₹ INR, allowing the seller to complete the payment using any UPI-compatible app (e.g., Google Pay, PhonePe, Paytm, BHIM).
- After initiating payment, the seller is prompted to confirm payment completion. Upon the seller confirming payment, a subscription request is submitted to the admin for manual verification and activation.
- The admin reviews the payment confirmation and manually activates the subscription from the Subscription Management section in the Admin Panel.
- Upon admin activation:
  - The subscription is activated for the seller's store.
  - The seller gains immediate access to unlimited product listings, online selling capability, and priority placement.
  - The store and its products are moved to the top of all location-scoped listings (All Stores Page, Search Results Page, Recently Listed section) within their location.
  - A success confirmation message is displayed to the seller: 「Your subscription has been successfully activated.」
  - The subscription record (plan, duration, start date, end date, amount paid in ₹ INR, UPI reference if provided by seller) is saved in the platform backend and visible to the admin.
- If no UPI ID has been configured by the admin, the 「Pay Now」 button is disabled and sellers see a 「Payment not available at this time」 message.

**Active Subscription Status**
- If the seller's store already has an active subscription, the Subscribe to Premium Page displays the current subscription details: plan name, start date, end date, and remaining duration.
- The seller can choose to renew or upgrade their subscription; if a new plan is purchased while an existing subscription is still active, the new subscription period begins immediately after the current subscription expires, or extends it — as configured by the admin.

### 3.24 Product Management Page (Seller)
- Add new product: title, description, price (entered and displayed in ₹ INR), condition, category, sub-category (optional), up to 5 images.
- Non-subscribed sellers can add a maximum of 5 product listings. Subscribed sellers have no limit on the total number of product listings.
- When a non-subscribed seller attempts to add a 6th product, the system blocks the action and displays a clear message: 「You have reached the maximum limit of 5 products. Subscribe to Premium to add unlimited products and enable online selling.」
- Edit or delete existing listings.
- Mark product as sold.

### 3.25 Online Orders Management Page (Seller)

**Access**
- Only accessible to sellers with an active subscription.
- Navigated to via a quick link in the Seller Dashboard or a dedicated menu item in the seller navigation.

**Page Content**
- Displays a searchable, paginated list of all online orders placed for the seller's products.
- Each order entry shows: order ID, product thumbnail, product title, buyer name, buyer phone number, delivery address, order date, order status (Pending, Confirmed, Shipped, Delivered, Cancelled), total amount (₹ INR).
- Tapping an order entry navigates to a detailed Order Detail View.

**Order Management Actions**
- Seller can update the order status: Confirm Order, Mark as Shipped, Mark as Delivered, Cancel Order.
- Seller can enter delivery tracking information (tracking number, courier name) which is immediately visible to the buyer in the My Orders Page.
- Seller can view the buyer's delivery address and contact information.

### 3.26 Chat Page (Seller View)
- List of all conversations with buyers.
- Real-time messaging interface per conversation.
- Chat history saved persistently.

### 3.27 Popularise My Store Page (Seller)

This page is accessible to approved sellers via the 「Popularise My Store」 button in the Seller Dashboard, the My Account Page (Seller), and the Store Management Page.

**Promotion Plan Selection**
- The page displays all active promotion plans configured by the admin, each showing:
  - Plan name (e.g., 1 Week, 1 Month)
  - Duration
  - Original price (displayed as ₹ amount in INR)
  - Discounted price (displayed as ₹ amount in INR, if a valid coupon code has been applied)
- The seller selects one promotion plan.

**Coupon Code**
- A text input field labeled 「Coupon Code」 is displayed below the plan selection.
- The seller can enter a coupon code and tap an 「Apply」 button to validate it.
- If the coupon code is valid and active, the discounted price is immediately reflected in the plan display and in the order summary.
- If the coupon code is invalid, expired, or already used (if single-use), an inline error message is displayed: 「Invalid or expired coupon code.」
- Only one coupon code can be applied per order.
- The applied coupon code and the resulting discount amount (in ₹ INR) are shown in the order summary before payment.

**Order Summary**
- Displays: selected plan name, duration, original price (₹ INR), discount amount (₹ INR, if coupon applied), and final payable amount (₹ INR).

**Payment via UPI**
- A 「Pay Now」 button initiates the UPI payment flow.
- Payment is made directly to the admin's UPI ID configured in the Admin Panel.
- The UPI payment flow presents the seller with the admin's UPI ID and the exact payable amount in ₹ INR, allowing the seller to complete the payment using any UPI-compatible app (e.g., Google Pay, PhonePe, Paytm, BHIM).
- The payment amount presented is the final payable amount in ₹ INR after any coupon discount.
- After initiating payment, the seller is prompted to confirm payment completion. Upon the seller confirming payment, a promotion request is submitted to the admin for manual verification and activation.
- The admin reviews the payment confirmation and manually activates the promotion from the Popularise My Store Management section in the Admin Panel.
- Upon admin activation:
  - The promotion is activated for the seller's store.
  - The store is moved to the top of store listings and visually highlighted across the platform (All Stores Page, Search Results Page store results, Home Page store sections).
  - A success confirmation message is displayed to the seller: 「Your store has been successfully promoted.」
  - The promotion record (plan, duration, start date, end date, amount paid in ₹ INR, coupon used if any, UPI reference if provided by seller) is saved in the platform backend and visible to the admin.
- If no UPI ID has been configured by the admin, the 「Pay Now」 button is disabled and sellers see a 「Payment not available at this time」 message.

**Active Promotion Status**
- If the seller's store already has an active promotion, the Popularise My Store Page displays the current promotion details: plan name, start date, end date, and remaining duration.
- The seller can choose to purchase a new promotion plan; if a new plan is purchased while an existing promotion is still active, the new promotion period begins immediately and replaces the existing one, or extends it — as configured by the admin.

### 3.28 About Us Page

- A dedicated full-page view accessible via the About Us link in the footer.
- Displays the About Us content as entered and managed by the admin in the Footer Management section.
- If no content has been entered by the admin, the page displays a placeholder message such as 「Content coming soon.」
- The page is publicly accessible without requiring authentication.
- The page includes the standard desktop footer and bottom navigation bar (where applicable).

### 3.29 Privacy Policy Page

- A dedicated full-page view accessible via the Privacy Policy link in the footer.
- Displays the Privacy Policy content as entered and managed by the admin in the Footer Management section.
- **Default Privacy Policy content is pre-populated** with a standard, platform-appropriate policy covering the following sections:
  1. **Introduction** — Brief overview of BestOld and the purpose of the Privacy Policy.
  2. **Information We Collect** — Personal information (name, email, phone number), usage data, and device information collected during registration and platform use. For users who register via Google social login, we collect the information provided by Google (name, email, profile picture) in addition to the phone number provided by the user.
  3. **How We Use Your Information** — To operate the platform, facilitate buyer-seller communication, process store promotion payments via UPI, process subscription payments via UPI, process online product orders and payments, send WhatsApp notifications for Sell Your Phone submissions, send OTP verification emails, authenticate users via Google OAuth, and improve platform services.
  4. **Information Sharing** — BestOld does not sell or rent personal information to third parties. Seller contact details (phone number) are shared with buyers solely to facilitate direct communication. Sell Your Phone form data (including the selected pickup location) is shared with the admin via WhatsApp for the purpose of processing phone sale inquiries. Buyer delivery address and contact information are shared with subscribed sellers solely to fulfill online orders. When users authenticate via Google social login, their Google account information is shared with BestOld solely for the purpose of account creation and authentication.
  5. **Data Storage & Security** — User data and uploaded images are stored securely in the platform backend. Reasonable technical measures are in place to protect data from unauthorised access.
  6. **User Rights** — Users may request access to, correction of, or deletion of their personal data by contacting the platform admin.
  7. **Cookies** — The platform may use cookies or similar technologies to maintain session state and improve user experience.
  8. **Third-Party Services** — The platform integrates with WhatsApp for Sell Your Phone notifications and UPI payment apps (Google Pay, PhonePe, Paytm, BHIM) for store promotion payments and subscription payments and online product purchases. The platform integrates with third-party delivery systems for order fulfillment. The platform integrates with Google OAuth for social login authentication. Use of these services is subject to their respective privacy policies.
  9. **Changes to This Policy** — BestOld reserves the right to update this Privacy Policy at any time. Users are encouraged to review this page periodically.
  10. **Contact** — For privacy-related queries, users may contact the platform admin via the contact information provided in the footer.
- The admin can edit and replace the default content at any time via the Footer Management section; changes are immediately reflected.
- The page is publicly accessible without requiring authentication.
- The page includes the standard desktop footer and bottom navigation bar (where applicable).

### 3.30 Terms & Conditions Page

- A dedicated full-page view accessible via the Terms & Conditions link in the footer.
- Displays the Terms & Conditions content as entered and managed by the admin in the Footer Management section.
- **Default Terms & Conditions content is pre-populated** with a standard, platform-appropriate set of terms covering the following sections:
  1. **Acceptance of Terms** — By accessing or using BestOld, users agree to be bound by these Terms & Conditions.
  2. **Platform Role** — BestOld is a listing and communication platform. For non-subscribed stores, BestOld does not participate in, guarantee, or take responsibility for any transaction between buyers and sellers. All transactions are conducted directly between the parties. For subscribed stores, BestOld facilitates online transactions and order fulfillment via integrated payment and third-party delivery systems.
  3. **User Accounts** — Users must provide accurate information during registration. Users can authenticate via email OTP or Google social login. Users are responsible for maintaining the confidentiality of their account credentials. BestOld reserves the right to suspend or terminate accounts that violate these terms.
  4. **Seller Obligations** — Sellers must obtain admin approval before their store and listings are visible. Sellers are responsible for the accuracy of their listings, including descriptions, prices (in ₹ INR), and images. Sellers must upload a valid trade licence during store creation. Sellers must not list prohibited, counterfeit, or illegal items. Non-subscribed sellers are limited to a maximum of 5 product listings and cannot sell products online. Subscribed sellers have unlimited product listings and can sell products online; subscribed sellers are responsible for fulfilling online orders in a timely manner and providing accurate delivery tracking information.
  5. **Buyer Obligations** — Buyers must use the platform in good faith. Buyers are responsible for verifying the condition and authenticity of items before completing any transaction with a seller. For online purchases from subscribed stores, buyers must provide accurate delivery address and contact information.
  6. **Prohibited Content** — Users must not post false, misleading, offensive, or illegal content. Listings for prohibited goods (including stolen goods, weapons, or illegal items) are strictly not permitted and will be removed.
  7. **Sell Your Phone Feature** — The Sell Your Phone feature is provided as a convenience for users wishing to sell their phones directly to the platform admin. The feature is available only in locations where the admin has configured pickup service. Submission of the form does not constitute a binding sale agreement. The admin reserves the right to decline any submission.
  8. **Subscription Model** — Sellers can subscribe to a premium subscription plan by paying a specific subscription fee via UPI. Subscribed sellers gain unlimited product listings, online selling capability, and priority placement (top positioning in their location for stores and products). Subscription activation is subject to manual verification by the admin. Subscription fees are non-refundable. Subscriptions are valid for the duration specified in the selected plan and must be renewed upon expiry.
  9. **Popularise My Store Payments** — Promotion payments are made directly to the admin via UPI. All payments are in Indian Rupees (₹ INR). Promotion activation is subject to manual verification by the admin. No refunds are issued for cancelled or expired promotions.
  10. **Online Purchases** — Online purchases are only available for products from subscribed stores. Payment is processed via UPI, Card, Net Banking, or Cash on Delivery (if enabled). Orders are fulfilled by the seller via third-party delivery systems. BestOld is not responsible for delays, damages, or disputes arising from order fulfillment or delivery. Buyers may contact the seller directly for order-related queries.
  11. **Intellectual Property** — All platform content, branding, and design elements are the property of BestOld. Users retain ownership of content they upload but grant BestOld a non-exclusive licence to display such content on the platform.
  12. **Limitation of Liability** — BestOld is not liable for any loss, damage, or dispute arising from transactions between buyers and sellers, or from the use of third-party services (WhatsApp, UPI payment apps, third-party delivery systems, Google OAuth).
  13. **Modifications** — BestOld reserves the right to modify these Terms & Conditions at any time. Continued use of the platform constitutes acceptance of the updated terms.
  14. **Governing Law** — These Terms & Conditions are governed by the laws of India.
  15. **Contact** — For queries regarding these terms, users may contact the platform admin via the contact information provided in the footer.
- The admin can edit and replace the default content at any time via the Footer Management section; changes are immediately reflected.
- The page is publicly accessible without requiring authentication.
- The page includes the standard desktop footer and bottom navigation bar (where applicable).

### 3.31 Settings / About Page (with App Icon Preview)

This page is accessible to all logged-in users (buyers and sellers) via a quick link in the My Account Page or a dedicated menu item in the account navigation.

**Page Content**
- **Current App Icon Display:**
  - A large, prominent preview of the current home screen icon is displayed at the top of the page.
  - The icon is rendered at a size that clearly shows all visual details.
  - A label beneath the icon states: 「This is how BestOld will appear on your home screen.」

- **All Icon Sizes with Device Labels:**
  - A grid or list view displays all available icon sizes configured for the platform.
  - Each icon size entry shows:
    - The icon image rendered at the corresponding size.
    - A label indicating the size (e.g., 192x192, 512x512).
    - A description of which devices or contexts use that size (e.g., 「Used on Android home screens」, 「Used on iOS home screens」, 「Used for splash screens」).
  - The grid or list is scrollable if the number of icon sizes exceeds the viewport.

- **Refresh Icon Preview Button:**
  - A clearly visible 「Refresh Icon Preview」 button is displayed below the current app icon display.
  - Tapping this button reloads the icon preview from the server, ensuring the user sees the latest version if icons were recently updated by the admin.
  - A brief loading indicator is shown while the refresh is in progress.
  - After a successful refresh, a brief confirmation message is displayed: 「Icon preview updated.」

- **Icon Comparison View:**
  - A dedicated section labeled 「Icon Visibility Test」 is displayed below the icon size grid.
  - This section shows the current app icon rendered on multiple colored backgrounds to ensure visibility and contrast.
  - Background colors include: white, black, light gray, dark gray, and a primary brand color.
  - Each background is labeled (e.g., 「White Background」, 「Black Background」).
  - The icon is rendered at a consistent size across all backgrounds for easy comparison.

- **How to Update the Icon (Instructions):**
  - A collapsible or expandable section labeled 「How to Update Your Icon」 is displayed below the comparison view.
  - When expanded, this section displays step-by-step instructions for users who installed an old version of the app and want to update to the latest icon.
  - Instructions include:
    1. 「If you installed BestOld before [date], your home screen icon may be outdated.」
    2. 「To update the icon, tap the Reinstall App button below.」
    3. 「Follow the prompts to add BestOld to your home screen again.」
    4. 「The new icon will replace the old one automatically.」
  - The instructions are written in clear, user-friendly language.

- **Reinstall App Button:**
  - A prominently displayed 「Reinstall App with Updated Icon」 button is positioned below the update instructions.
  - Tapping this button triggers the browser's native Add to Home Screen prompt (if supported) or displays a modal with manual installation instructions.
  - The button is styled to stand out and encourage user action.
  - If the Add to Home Screen API is not supported by the browser, the button displays a fallback message: 「Please use your browser's menu to add BestOld to your home screen.」

- **Additional Information:**
  - A brief informational section at the bottom of the page explains the purpose of the App Icon Preview feature.
  - Example text: 「We want to ensure BestOld looks great on your home screen. Use this page to preview the icon, check visibility on different backgrounds, and update to the latest version if needed.」

**Analytics Tracking**
- Every time a user views the Settings / About Page (with App Icon Preview), a view event is logged in the platform backend.
- The logged event includes: user ID (if logged in), timestamp, and page view type (Settings / About Page).
- The admin can view aggregated analytics for icon preview views in the Admin Panel under a dedicated App Icon Preview Analytics section.

### 3.32 Admin Panel

The Admin Panel is a dedicated, professional backend interface accessible only to admin accounts via a dedicated, shareable URL path.

**Admin Panel URL & Access**
- Accessible via a dedicated URL path separate from the main buyer/seller-facing application.
- Accessing the Admin Panel URL presents a login screen that only accepts admin credentials.
- After successful login, the user is directed to the Admin Panel Dashboard.

**Admin Panel Layout**
- Persistent left sidebar navigation listing all management sections.
- Top header displaying the current section name and the logged-in admin's name.
- Main content area with data tables, forms, and action controls.
- All data tables support search, sorting, and pagination.

**Admin Dashboard (Overview)**
- Summary statistics displayed as cards:
  - Total registered users (buyers + sellers)
  - Total pending seller approvals
  - Total active stores
  - Total subscribed stores
  - Total active product listings
  - Total reviews
  - Total Sell Your Phone submissions
  - Total open Sell Your Phone chats
  - Total active store promotions
  - Total active subscriptions
  - Total pending subscription orders
  - Total online orders (all subscribed stores)
  - Total App Icon Preview views (last 30 days)
- Quick-access links to Seller Approval Management, Sell Your Phone Submissions & Chat, Popularise My Store Management, Subscription Management, and App Icon Preview Analytics.

**Logo Management**
- Admin can upload and replace the platform logo.
- Supported formats: JPG, PNG, WEBP, SVG.
- Updated logo is immediately reflected across all pages.

**Seller Approval Management**
- Lists all seller accounts with registration details and current status.
- Approve, Reject, filter by status, search by name or email.
- Badge count of pending approvals on sidebar.

**User Management**
- View all registered buyers and sellers.
- Add Seller manually (auto-approved).
- Suspend, Reactivate, Delete user accounts.
- Search and filter.
- User records display the registration method (Email or Google) for each user.

**Store Management**
- View all stores; suspend, reactivate, remove stores.
- View subscription status for each store (Active / Inactive, plan name, expiry date).
- Read-only detail view including trade licence image.

**Product Management**
- View all product listings; remove listings.
- All prices displayed in ₹ INR.
- Search and filter.

**Review Management**
- View all reviews; remove reviews.

**Category Management (with Sub-Category Management)**
- Add, edit, delete top-level categories with name and image (device gallery picker).
- Sub-category management nested within each category.
- Changes immediately reflected across the platform.

**Location Management**

- No default or pre-seeded locations.
- The admin adds a new location via a form that provides three input methods:
  1. **Manual Text Entry:** A plain text input field where the admin types the location name (city/region) directly.
  2. **GPS-Based Location Detection:** A 「Detect Location」 button is displayed alongside the text input. Tapping this button invokes the browser's Geolocation API to detect the admin's current GPS coordinates. The detected coordinates are stored alongside the location name and are used as the reference point for GPS-based matching when customers and sellers use auto-detection. The admin can review the detected coordinates (displayed as latitude/longitude or as a resolved place name) before saving. If GPS detection fails or is denied, the admin falls back to manual text entry.
  3. **Google Maps Search:** A Google Maps search input field is displayed within the Location Management add/edit form. The admin can type a location name (e.g., India, Mumbai, Aurangabad) into this search field; as the admin types, Google Maps place autocomplete suggestions are displayed in a dropdown beneath the input. When the admin selects a suggestion from the dropdown, the location name field is automatically populated with the selected place name and the corresponding GPS coordinates (latitude and longitude) from Google Maps are automatically populated and stored alongside the location name. The admin can review the auto-populated name and coordinates before saving. If the admin clears the Google Maps search input, the previously auto-populated name and coordinates are also cleared.
- All three input methods result in a location record containing a location name (text) and optionally GPS coordinates.
- Both the location name (text) and the GPS coordinates (if detected or populated via Google Maps) are saved together as a single location record.
- When GPS coordinates are stored for a location, the platform uses those coordinates as the reference point for matching against user and seller GPS detections (proximity-based matching). Locations without stored GPS coordinates are matched by name only.
- Admin can edit an existing location to update its name, re-detect its GPS coordinates via the GPS button, or re-search and re-select via the Google Maps search input.
- Admin can delete a location; it is immediately removed from all active location selectors.
- Changes are immediately reflected across all location selectors, the first-visit location prompt, and the GPS-based location matching for both customers and sellers.

**Advertising Banner Management**
- Up to 5 banner slots; add, edit, reorder, remove banners.
- Changes immediately reflected on the home page.

**Sell Your Phone Form Management**

A dedicated section in the Admin Panel sidebar labeled 「Sell Your Phone Form Management」 for controlling all aspects of the Sell Your Phone feature, including pickup location management.

- **General Settings:** button label, WhatsApp destination number, confirmation message.
- **Pickup Location Management:**
  - A dedicated sub-section within Sell Your Phone Form Management labeled 「Pickup Locations」.
  - Displays a searchable, paginated table listing all admin-managed locations (from the Location Management section) with an additional column indicating whether each location is enabled for Sell Your Phone pickup.
  - Each row shows: location name, GPS coordinates (if available), and a toggle switch or checkbox labeled 「Enable for Sell Your Phone Pickup」.
  - Admin can toggle the pickup availability status for any location; changes take effect immediately.
  - Only locations marked as enabled for Sell Your Phone pickup are displayed in the Pickup Location dropdown on the Sell Your Phone form.
  - If no locations are marked as enabled, the Pickup Location dropdown on the Sell Your Phone form displays an empty state and the form cannot be submitted.
  - A brief informational message is displayed at the top of the Pickup Location Management sub-section, such as: 「Select the locations where phone pickup service is available. Only enabled locations will be visible to customers on the Sell Your Phone form.」
- **Brand Name Options:** add, edit, delete, reorder.
- **Model Name Options per brand:** add, edit, delete, reorder.
- **Variant Options per model:** add, edit, delete, reorder.
- **Condition Options:** add, edit, delete, reorder.
- **How Much Old (Age) Options:** add, edit, delete, reorder.

**Sell Your Phone Submissions & Chat**
- Searchable, paginated submissions list.
- Each submission record displays the selected pickup location alongside other form data.
- Full submission detail view with real-time chat interface.
- Close Chat action available to admin.
- Closed chats accessible in read-only mode.
- Badge count of open chats on sidebar.

**Popularise My Store Management**

A dedicated section in the Admin Panel sidebar labeled 「Popularise My Store Management」 for controlling all aspects of the store promotion feature.

  **UPI Configuration**
  - A settings sub-section where the admin can enter and save the UPI ID to which promotion payments in ₹ INR are received.
  - A text input field labeled 「UPI ID」; the admin enters the UPI ID (e.g., adminname@upi) and saves with a 「Save」 button.
  - Changes take effect immediately for all subsequent promotion payment transactions.
  - If no UPI ID has been configured, the 「Pay Now」 button on the Popularise My Store Page is disabled and sellers see a 「Payment not available at this time」 message.

  **Promotion Plans**
  - A list of all current promotion plans displayed in a table; each row shows: plan name, duration, price (₹ INR), status (Active / Inactive).
  - **Add a new promotion plan:** Admin enters: plan name, duration (number of days), price (numeric value in ₹ INR). The plan is saved and immediately available for sellers.
  - **Edit an existing promotion plan:** Admin can update the plan name, duration, and price (₹ INR).
  - **Activate / Deactivate a promotion plan:** Admin can toggle a plan between Active and Inactive.
  - **Delete a promotion plan:** Admin can permanently delete a plan. Existing active promotions using the deleted plan are not affected.
  - No limit on the number of promotion plans.

  **Coupon Code Management**
  - A list of all current coupon codes displayed in a searchable, paginated table.
  - **Add a new coupon code:** Admin enters: coupon code (unique text string), discount type (percentage or fixed amount in ₹ INR), discount value, usage limit (unlimited or a specific maximum number of uses), expiry date (optional).
  - **Edit an existing coupon code:** Admin can update the discount type, discount value, usage limit, and expiry date.
  - **Activate / Deactivate a coupon code:** Admin can manually toggle a coupon between Active and Inactive.
  - **Delete a coupon code:** Admin can permanently delete a coupon code.
  - No limit on the number of coupon codes.
  - Coupon codes are case-insensitive during validation.

  **Promotion Orders & Payment Records**
  - A searchable, paginated table listing all promotion orders placed by sellers.
  - Admin can manually activate a pending promotion order after verifying the UPI payment.
  - Admin can manually cancel an active promotion from the order detail view.
  - Search by seller name or store name; filter by plan, status, and date range.

  **Active Promotions Overview**
  - A dedicated sub-section listing all currently active store promotions with remaining days.
  - Admin can cancel any active promotion directly from this list.

  **New Promotion Overlap Behaviour**
  - Admin can configure the behaviour when a seller purchases a new promotion while an existing one is still active: replace immediately or extend.
  - Default: replace immediately.

**Subscription Management**

A dedicated section in the Admin Panel sidebar labeled 「Subscription Management」 for controlling all aspects of the subscription feature.

  **UPI Configuration**
  - A settings sub-section where the admin can enter and save the UPI ID to which subscription payments in ₹ INR are received.
  - A text input field labeled 「UPI ID for Subscriptions」; the admin enters the UPI ID and saves with a 「Save」 button.
  - Changes take effect immediately for all subsequent subscription payment transactions.
  - If no UPI ID has been configured, the 「Pay Now」 button on the Subscribe to Premium Page is disabled and sellers see a 「Payment not available at this time」 message.

  **Subscription Plans**
  - A list of all current subscription plans displayed in a table; each row shows: plan name, duration (in days or months), price (₹ INR), status (Active / Inactive).
  - **Add a new subscription plan:** Admin enters: plan name, duration (number of days or months), price (numeric value in ₹ INR). The plan is saved and immediately available for sellers.
  - **Edit an existing subscription plan:** Admin can update the plan name, duration, and price (₹ INR).
  - **Activate / Deactivate a subscription plan:** Admin can toggle a plan between Active and Inactive.
  - **Delete a subscription plan:** Admin can permanently delete a plan. Existing active subscriptions using the deleted plan are not affected.
  - No limit on the number of subscription plans.

  **Subscription Orders & Payment Records**
  - A searchable, paginated table listing all subscription orders placed by sellers.
  - Each row shows: order ID, seller name, store name, subscription plan, amount paid (₹ INR), payment date, subscription status (Pending Activation, Active, Expired, Cancelled), start date, end date.
  - Admin can manually activate a pending subscription order after verifying the UPI payment.
  - Admin can manually cancel an active subscription from the order detail view; upon cancellation, the seller's subscription status is immediately set to Inactive and all subscription benefits are revoked.
  - Search by seller name or store name; filter by plan, status, and date range.

  **Active Subscriptions Overview**
  - A dedicated sub-section listing all currently active subscriptions with remaining days.
  - Admin can cancel any active subscription directly from this list.

  **Subscription Renewal Behaviour**
  - Admin can configure the behaviour when a seller purchases a new subscription while an existing one is still active: start immediately (replace) or start after current subscription expires (extend).
  - Default: start after current subscription expires.

  **Product Limit Enforcement**
  - The admin can view and enforce the 5-product limit for non-subscribed sellers.
  - When a seller's subscription expires, the system automatically enforces the 5-product limit; if the seller has more than 5 products, the excess products are automatically hidden from public view until the seller renews their subscription or manually removes products to comply with the limit.

**Footer Management**
- About Us text, Contact Information, Social Links, and footer page content (About Us page, Privacy Policy page, Terms & Conditions page).
- Rich text or plain text editor for each footer content page.
- Default content for Privacy Policy and Terms & Conditions is pre-populated as specified in Sections 3.29 and 3.30.
- All changes are immediately reflected in the footer and on the corresponding dedicated full-page views.

**Email Configuration**

A dedicated section in the Admin Panel sidebar labeled 「Email Configuration」 for managing the platform's outgoing email (SMTP) settings.

- **SMTP Settings Form:** SMTP Host, SMTP Port, Encryption/Security (None / SSL / TLS), SMTP Username, SMTP Password, Sender Name, Sender Email Address — all mandatory.
- **Save Button:** Changes take effect immediately.
- **Send Test Email:** Sends a test email to the logged-in admin's email address; success or failure message displayed.
- **Configuration Status Indicator:** Shows whether a valid SMTP configuration is currently active or not set.
- If no SMTP configuration has been saved, a prominent warning banner is displayed in the Email Configuration section and on the Admin Dashboard.

**App Icon Preview Analytics**

A dedicated section in the Admin Panel sidebar labeled 「App Icon Preview Analytics」 for tracking user engagement with the App Icon Preview feature.

- **Total Views (All Time):** Displays the total number of times the Settings / About Page (with App Icon Preview) has been viewed by all users since the feature was launched.
- **Views (Last 30 Days):** Displays the total number of views in the last 30 days.
- **Views (Last 7 Days):** Displays the total number of views in the last 7 days.
- **Daily View Trend Chart:** A line chart or bar chart showing the number of views per day over the last 30 days.
- **User Breakdown:** A table or list showing the number of views by user type (Buyer / Seller) and registration method (Email / Google).
- **Refresh Icon Preview Button Clicks:** Displays the total number of times users have tapped the 「Refresh Icon Preview」 button.
- **Reinstall App Button Clicks:** Displays the total number of times users have tapped the 「Reinstall App with Updated Icon」 button.
- All analytics data is updated in real time or with a short delay (e.g., every 5 minutes).
- The admin can export the analytics data as a CSV file for further analysis.

**Admin Account Management**
- Displays the full Admin Panel URL with a 「Copy Link」 button.
- Create new admin accounts (full name, email, password min 8 characters).
- List of all existing admin accounts.
- Delete any other admin account (cannot delete own account).

### 3.33 Footer (Desktop)
- A professional footer displayed at the bottom of all public-facing pages on desktop view.
- Four columns: About Us, Quick Links, Contact Us, Follow Us (Social Links).
- All content sourced exclusively from the admin-managed Footer Management section.
- Footer displayed in desktop mode only.
- Quick Links column includes links to: About Us Page, Privacy Policy Page, and Terms & Conditions Page.

---

## 4. Business Rules & Logic

1. **Account Types:** A user registers as either a Buyer or a Seller. A Seller account can also browse and purchase as a buyer, but a Buyer account cannot create a store or list products.
2. **Mandatory Email and Phone Number at Registration:** All users must provide a valid email address and a valid phone number during registration. Both fields are mandatory for email registration; form submission is blocked if either field is left empty. For Google social login, phone number is collected as an additional mandatory field after Google authentication completes.
3. **Email OTP Verification Required (Email Registration Only):** After registration via email, all users must verify their email address via an OTP sent by email before accessing platform features. A verification OTP is sent from BestOld; the email contains the BestOld logo and the BestOld name prominently displayed in the header or body. After successful OTP verification, buyer accounts are immediately logged in; seller accounts enter 「Pending Approval」 status. Users who register via Google social login do not require OTP verification.
4. **Google Social Login:** Users can register and log in using their Google account via Google OAuth. Upon successful Google authentication, the user's Google account information (name, email, profile picture) is retrieved and used to create or authenticate the account. Phone number is collected as an additional mandatory field after Google authentication. No OTP verification is required for Google-registered accounts. Google-registered users do not have a platform password and cannot use the forgot password flow; they must log in via Google.
5. **Seller Approval Workflow:** After OTP verification (email registration) or after providing phone number (Google registration), seller accounts enter 「Pending Approval」 status. Only approved sellers' stores and listings are visible to the public.
6. **Seller Visibility:** Stores and product listings belonging to sellers with 「Pending Approval」 or 「Rejected」 status are not visible to buyers.
7. **Store Creation:** A seller must be approved and must complete store creation (name, description, location, mandatory trade licence image, and at least one mandatory banner image) before listing any products.
8. **Trade Licence — Mandatory:** The trade licence image upload is required during store creation.
9. **Store Banner Images — Mandatory:** At least 1 banner image is required when creating a store; up to 3 banner images allowed; at least 1 must remain at all times after store creation.
10. **Subscription Model:** Sellers can subscribe to a premium subscription plan by paying a specific subscription fee via UPI. Subscribed sellers gain unlimited product listings, online selling capability, and priority placement (top positioning in their location for stores and products). Non-subscribed sellers are limited to a maximum of 5 product listings and cannot sell products online.
11. **Product Listing Limit for Non-Subscribed Sellers:** Non-subscribed sellers can add a maximum of 5 product listings. When a non-subscribed seller attempts to add a 6th product, the system blocks the action and displays a clear message prompting the seller to subscribe to Premium.
12. **Unlimited Product Listings for Subscribed Sellers:** Subscribed sellers have no upper limit on the number of product listings.
13. **Online Selling Capability:** Only subscribed sellers can sell their products online. Products from subscribed stores display a 「Buy Now」 button on product cards and the Product Detail Page, allowing buyers to purchase online via integrated payment and third-party delivery. Non-subscribed sellers' products do not display a 「Buy Now」 button and cannot be purchased online.
14. **Priority Placement for Subscribed Stores:** Subscribed stores and their products are displayed at the top of all location-scoped listings (All Stores Page, Search Results Page, Recently Listed section on the home page) within their location, followed by non-subscribed stores and products. Subscribed stores are visually highlighted with a 「Premium」 or 「Subscribed」 badge.
15. **Subscription Activation:** Subscription activation is subject to manual verification by the admin. After the seller confirms payment completion, the admin reviews the payment and manually activates the subscription from the Subscription Management section in the Admin Panel.
16. **Subscription Expiry:** Subscriptions are valid for the duration specified in the selected plan. Upon expiry, the seller's subscription status is automatically set to Inactive and all subscription benefits are revoked. If the seller has more than 5 products at the time of expiry, the excess products are automatically hidden from public view until the seller renews their subscription or manually removes products to comply with the 5-product limit.
17. **Subscription Renewal:** Sellers can renew or upgrade their subscription at any time. The admin can configure the renewal behaviour: start immediately (replace current subscription) or start after current subscription expires (extend).
18. **Currency — Indian Rupees (INR):** All monetary values across the platform are displayed and entered exclusively in Indian Rupees (INR) using the ₹ symbol.
19. **Review Eligibility:** Only registered buyers can submit a review for a seller. One review per buyer per seller store.
20. **Review Rating:** 1–5 star rating scale with optional text comment.
21. **Chat Initiation:** Only logged-in buyers can initiate a chat with a seller.
22. **Call Seller / Contact Seller:** Displays the seller's phone number and triggers the device's native phone dialer. If no phone number is provided, the button is hidden or disabled.
23. **Favorites:** Only logged-in buyers can add products to their favorites list.
24. **Follow / Unfollow:** Only logged-in buyers can follow or unfollow a seller's store. Follower count updates in real time.
25. **Follower Count Visibility:** Visible on the Store Detail Page, Seller Dashboard, and Store Management Page.
26. **Location System — Automatic Detection + OLX.in Model:** On first visit, the browser's Geolocation API is automatically invoked to detect the visitor's city/region. If a matching admin-managed location is found, it is silently set as the active location and all browsing results — including the Recently Listed products section on the home page — are immediately scoped to it. If detection fails or returns no match, the first-visit location prompt is shown as a fallback. A persistent location selector is displayed in the header across all pages. All browsing and search results are automatically scoped to the user's currently selected location. The user can change their active location at any time via the header selector; changing the location immediately refreshes the Recently Listed section and all other location-scoped content. An 「All Locations」 option is always available.
27. **Recently Listed Products — Location Scoping:** The Recently Listed products section on the home page is always scoped to the user's currently active location. Subscribed stores' products are displayed at the top of the Recently Listed section within the active location, followed by non-subscribed stores' products. When the active location changes (via auto-detection, manual selection, or login with a saved location preference), the Recently Listed section refreshes immediately to display only products from the new active location. If 「All Locations」 is selected, the section displays products from all locations.
28. **Seller GPS Location Setting:** During store creation and editing, sellers can use a 「Detect My Location」 button to automatically detect their GPS coordinates and match them to the nearest admin-managed location. If no match is found or GPS is denied, the seller selects manually from the admin-managed location list.
29. **Location Persistence:** The selected location is persisted for the session. For logged-in users, the preferred location is saved to their profile and restored on subsequent logins (takes precedence over auto-detection); the Recently Listed section on the home page is immediately scoped to the restored location.
30. **Location-Only Browse:** A user may select a location without entering any search keyword.
31. **Location Management — No Defaults, Fully Manual:** All locations managed exclusively by the admin. Platform launches with no pre-seeded locations. When adding a location, the admin can type the name manually, use the 「Detect Location」 GPS button to capture and store GPS coordinates alongside the location name, or use the Google Maps search input to search for a location by name and automatically populate both the location name and GPS coordinates from the selected Google Maps result. GPS matching for both customers and sellers is performed against this admin-managed location list, using stored GPS coordinates for proximity-based matching where available, and name-based matching otherwise.
32. **Location Management — Google Maps Search Input:** The Google Maps search input in the Location Management form provides place autocomplete suggestions as the admin types. Selecting a suggestion automatically populates the location name field and the GPS coordinates (latitude and longitude) for that place. The admin can review and confirm the populated values before saving. Clearing the Google Maps search input also clears the auto-populated name and coordinates.
33. **Search Scope:** Queries both product titles/descriptions and store names simultaneously, scoped to the currently active location by default. Subscribed stores and their products are displayed at the top of search results within the active location, followed by non-subscribed stores and products.
34. **Search Results — Zero Results Expansion:** When a location-scoped search returns zero results, the user is offered the option to expand the search to all locations.
35. **Search Results — Sort:** Results can be sorted by Most Recent, Price: Low to High, and Price: High to Low.
36. **Product Status:** Active, Sold, or Removed.
37. **Email OTP Verification (Email Registration Only):** New accounts registered via email must verify their email via an OTP sent by email before accessing platform features. Google-registered accounts do not require OTP verification.
38. **Persistent Chat History:** All chat messages stored in the backend.
39. **Category Management:** Only admins can create, edit, or delete categories and sub-categories.
40. **Sub-Category Assignment on Products:** Optional; sub-category selector only enabled after a top-level category is selected.
41. **Sub-Category Filtering:** Only shown on Search Results Page when a top-level category filter is active.
42. **Category Image Selection:** Admin selects image via device gallery picker; previewed before saving.
43. **Category Filtering:** Lists only active top-level categories; one category at a time.
44. **Category Display on Home Page:** Single horizontal scrollable row; maximum 5 items visible simultaneously.
45. **Bottom Navigation Bar — Account Tab Behavior:** Buyers → My Account Page; Sellers → My Account Page (Seller); Unauthenticated → Login Page.
46. **Bottom Navigation Bar — Favorites Tab:** Available to buyers; hidden or disabled for sellers. Positioned in the middle of the bottom navigation bar, between All Categories and Stores.
47. **All Stores Page — Dual Search:** Name search and location filter can be applied simultaneously. Subscribed stores are displayed at the top of the store list within the active location and are visually highlighted with a 「Premium」 or 「Subscribed」 badge.
48. **Advertising Banners — Slot Limit:** Maximum 5 advertising banner slots.
49. **Advertising Banners — Auto-Scroll:** Continuous horizontal loop.
50. **Advertising Banners — Clickable:** Navigates to the Store Detail Page of the linked store.
51. **Advertising Banners — Empty State:** Section hidden entirely if no banners are configured.
52. **Advertising Banners — Management:** Only admins can manage advertising banners.
53. **Admin-Added Sellers:** Automatically set to 「Approved」 status; phone number mandatory.
54. **Trade Licence — Admin Visibility:** Visible to admin in Store Management read-only detail view.
55. **Logo Management:** Admin can update the platform logo at any time; immediately reflected across all pages.
56. **Footer Management — Admin Control:** All footer content managed exclusively by the admin; changes immediately reflected.
57. **Footer Social Links — Conditional Display:** Social icon only displayed if the corresponding URL has been entered.
58. **Footer — Desktop Only:** Footer displayed in desktop mode only.
59. **Footer Content Pages:** About Us, Privacy Policy, and Terms & Conditions links navigate to dedicated full-page views with admin-managed content.
60. **Footer Content Pages — Default Content:** Privacy Policy and Terms & Conditions pages are pre-populated with default platform-appropriate content as specified in Sections 3.29 and 3.30.
61. **Sell Your Phone — Open Access:** Accessible to all visitors without authentication.
62. **Sell Your Phone — Mandatory Fields:** Pickup Location, Brand Name, Model Name, Variant, Condition, How Much Old, and at least 1 image are mandatory.
63. **Sell Your Phone — Pickup Location Restriction:** The Pickup Location dropdown is populated exclusively from locations marked as enabled for Sell Your Phone pickup by the admin. If no pickup locations are enabled, the dropdown displays an empty state and the form cannot be submitted.
64. **Sell Your Phone — Model Dependency:** Model Name dropdown populated based on selected Brand Name.
65. **Sell Your Phone — Variant Dependency:** Variant dropdown populated based on selected Model Name.
66. **Sell Your Phone — Image Storage:** All uploaded images must be saved to the backend storage bucket before WhatsApp message is assembled.
67. **Sell Your Phone — Dual Delivery on Submission:** Field values (including selected pickup location) and images sent to WhatsApp and saved as a platform submission record simultaneously.
68. **Sell Your Phone — Post-Submission Redirect to Chat:** Submitter automatically redirected to Sell Your Phone Chat Page after successful submission.
69. **Sell Your Phone — Direct Chat Between Submitter and Admin:** Real-time messaging between submitter and admin.
70. **Sell Your Phone — Admin Closes Chat:** Admin can close any chat at any time; closed chats are read-only.
71. **Sell Your Phone — Guest Submitter Identification:** Minimal identifier (name and phone number or email) collected for guest submitters.
72. **Sell Your Phone — Admin Configuration:** All form field options, button label, WhatsApp number, confirmation message, and pickup location availability are fully configurable by the admin.
73. **Sell Your Phone — Image Formats:** Only JPG, PNG, and WEBP accepted.
74. **Sell Your Phone — Image Count:** Up to 6 images; at least 1 required.
75. **Sell Your Phone — Submissions Record:** All submissions (including selected pickup location) stored persistently in the platform backend.
76. **Sell Your Phone — Chat Badge:** Open chat count displayed as a real-time badge on the sidebar.
77. **Sell Your Phone — Pickup Location Management:** Admin controls which locations are available for phone pickup via a dedicated Pickup Location Management sub-section in the Sell Your Phone Form Management section. Only locations marked as enabled are displayed in the Pickup Location dropdown on the form.
78. **Admin Panel URL — Shareable:** Dedicated URL with one-click copy function in Admin Account Management.
79. **Admin Account Creation:** Requires full name, email, and password of at least 8 characters; immediately active.
80. **Admin Account Deletion:** Cannot delete own account; confirmation prompt shown before deletion.
81. **Admin Login Isolation:** Only admin-role credentials accepted at the Admin Panel login screen.
82. **Popularise My Store — Access:** The 「Popularise My Store」 button is displayed in the Seller Dashboard, the My Account Page (Seller), and the Store Management Page. Only approved sellers can access the Popularise My Store Page.
83. **Popularise My Store — Plan Selection:** The seller selects one active promotion plan configured by the admin.
84. **Popularise My Store — Coupon Code Validation:** A coupon is valid if it is Active, not expired, and has not exceeded its usage limit. Only one coupon code can be applied per order.
85. **Popularise My Store — Payment via UPI:** Payment is made directly to the admin's UPI ID. After completing payment, the seller confirms payment completion within the platform, submitting a promotion request for manual admin verification and activation.
86. **Popularise My Store — Promotion Activation:** Upon admin manual activation, the store is moved to the top of store listings and visually highlighted with a 「Featured」 or 「Promoted」 badge across the platform.
87. **Popularise My Store — Promotion Duration:** The promotion remains active for the duration specified in the selected plan. Upon expiry, the store's promoted status is automatically removed.
88. **Popularise My Store — Promotion Record:** Each promotion order is recorded in the platform backend with full details.
89. **Popularise My Store — Multiple Active Promotions:** A seller can only have one active promotion at a time. Overlap behaviour (replace or extend) is determined by admin configuration.
90. **Popularise My Store — Admin Cancellation:** The admin can manually cancel any active promotion at any time; the store's promoted status is immediately removed.
91. **Popularise My Store — UPI ID Configuration:** The admin sets the UPI ID in the Popularise My Store Management section. Changes take effect immediately.
92. **Popularise My Store — Coupon Discount Types:** Percentage or fixed amount in ₹ INR.
93. **Popularise My Store — Coupon Usage Limit:** Unlimited or a specific maximum number of uses.
94. **Popularise My Store — Coupon Expiry:** Optional expiry date; after expiry the coupon is automatically invalid.
95. **Search Results Page — Product Card Buttons:** Each product result card displays a 「Chat with Seller」 button and a 「Contact Seller」 button; the product name is not shown on the search result card. Products from subscribed stores additionally display a 「Buy Now」 button.
96. **Search Results Page — Chat with Seller Button:** Only accessible to logged-in buyers; unauthenticated users are redirected to the Login Page with a return URL.
97. **Search Results Page — Contact Seller Button:** Tapping 「Contact Seller」 displays the seller's phone number and triggers the device's native phone dialer. If the seller has not provided a phone number, the button is hidden or shown as disabled.
98. **Search Results Page — Buy Now Button:** Tapping 「Buy Now」 (subscribed store products only) navigates the buyer to the Online Checkout Page for that product. Only logged-in buyers can access the Online Checkout Page; unauthenticated users are redirected to the Login Page with a return URL.
99. **Store Social Media Links — Removed:** No social media link fields available on the Store Management Page; no social media icons or links displayed on the Store Detail Page.
100. **Share Store — Open Access:** The 「Share Store」 button is accessible to all visitors on the Store Detail Page without requiring authentication.
101. **Share Store — Seller Access:** The 「Share Store」 button is also available to the seller on the Store Management Page.
102. **Share Store — Native Share Sheet:** Tapping the 「Share Store」 button triggers the device's native share sheet (Web Share API) if supported.
103. **Share Store — Clipboard Fallback:** If the native share sheet is not supported, the store's direct URL is copied to the clipboard and a brief confirmation message is displayed.
104. **Share Store — Shared URL:** The shared URL is always the direct, publicly accessible URL of the Store Detail Page for that store.
105. **Forgot Password — OTP via Email (Email-Registered Users Only):** Users who registered via email and have forgotten their password can initiate a password reset by entering their registered email address. An OTP is sent to that email address from BestOld; the email contains the BestOld logo and the BestOld name. Users who registered via Google social login do not have a platform password and cannot use the forgot password flow; they must log in via Google.
106. **Forgot Password — OTP Expiry:** The OTP has a defined expiry window. After expiry, the OTP is no longer valid.
107. **Forgot Password — OTP Single Use:** Each OTP is valid for a single use only.
108. **Forgot Password — Resend OTP:** The user can request a new OTP; each resend resets the expiry timer and invalidates any previously issued OTP for that session. The resent OTP email is sent from BestOld and contains the BestOld logo and name.
109. **Forgot Password — Email Not Found or Google-Registered:** If the entered email is not associated with any registered account or was registered via Google, an inline error message is displayed and no OTP is sent.
110. **Forgot Password — New Password Requirements:** At least 8 characters; mismatched confirmation fields block form submission.
111. **Forgot Password — Applies to Email-Registered Users Only:** Available to buyers and sellers who registered via email. Not available to Google-registered users or admin accounts.
112. **Email Configuration — SMTP Required:** All platform transactional emails are sent exclusively via the SMTP configuration defined in the Email Configuration section.
113. **Email Configuration — Immediate Effect:** Changes to SMTP settings take effect immediately upon saving.
114. **Email Configuration — No Config Warning:** If no SMTP configuration has been saved, a prominent warning is displayed and all email-dependent features are blocked.
115. **Email Configuration — Test Email:** The admin can send a test email to verify the current SMTP configuration.
116. **Email Branding — BestOld Logo and Name:** All emails sent from the platform (OTP verification, and any other transactional emails) include the BestOld logo and the BestOld name prominently displayed in the email header or body.
117. **Recently Listed Products Grid Layout:** 2 columns on mobile, 3 columns on tablet, 4 columns on desktop.
118. **GPS Location — Customer Auto-Detection:** On page load, the Geolocation API is invoked automatically; if a matching admin-managed location is found, it is set silently without any prompt and the Recently Listed section on the home page is immediately scoped to that location. The first-visit prompt is shown only as a fallback.
119. **GPS Location — Seller Store Location:** Sellers can use the 「Detect My Location」 GPS button during store creation and editing to auto-populate the store location field with the nearest matching admin-managed location.
120. **GPS Location — No Match Fallback:** If GPS detection returns coordinates that do not match any admin-managed location, the user or seller is prompted to select a location manually.
121. **GPS Location — Admin-Managed List as Source of Truth:** All GPS matching (for both customers and sellers) is performed exclusively against the admin-managed location list. Locations with stored GPS coordinates are matched by proximity; locations without GPS coordinates are matched by name only. No external geocoding database or hardcoded location list is used.
122. **Admin Location GPS Detection:** When adding or editing a location in the Admin Panel, the admin can tap a 「Detect Location」 button to invoke the browser's Geolocation API and capture the GPS coordinates of that location. The captured coordinates are stored alongside the location name and serve as the reference point for proximity-based GPS matching for customers and sellers.
123. **Admin Location Google Maps Search:** When adding or editing a location in the Admin Panel, the admin can use the Google Maps search input to search for a location by name. Place autocomplete suggestions are shown as the admin types. Selecting a suggestion automatically populates the location name and GPS coordinates. The admin reviews the populated values before saving. Clearing the search input clears the auto-populated values.
124. **Online Order Fulfillment:** Online orders are fulfilled by the seller via third-party delivery systems. The seller is responsible for updating the order status (Confirm, Ship, Deliver, Cancel) and providing delivery tracking information. Buyers can view order status and tracking information in the My Orders Page.
125. **Online Order Payment:** Payment for online orders is processed via UPI, Card, Net Banking, or Cash on Delivery (if enabled by the admin). Payment processing is handled by integrated payment gateways.
126. **Online Order Visibility:** Online orders are visible to the buyer in the My Orders Page and to the seller in the Online Orders Management Page. The admin can view all online orders across all subscribed stores in the Admin Panel.
127. **Registration OTP Verification (Email Registration Only):** After submitting the registration form via email, the user receives an OTP via email from BestOld (containing the BestOld logo and name), enters the OTP on the OTP Verification Page (Registration), and upon successful verification, buyer accounts are immediately logged in and seller accounts enter Pending Approval state. Google-registered users do not require OTP verification.
128. **OTP Resend During Registration (Email Registration Only):** On the OTP Verification Page (Registration), the user can tap 「Resend OTP」 to receive a new OTP via email from BestOld (containing the BestOld logo and name); the expiry timer resets and the previously issued OTP is invalidated.
129. **OTP Expiry During Registration (Email Registration Only):** If the OTP entered on the OTP Verification Page (Registration) has expired, an inline error message is displayed and the user is prompted to request a new OTP.
130. **Invalid OTP During Registration (Email Registration Only):** If the OTP entered on the OTP Verification Page (Registration) is incorrect, an inline error message is displayed and the user can retry.
131. **Google OAuth Integration:** The platform integrates with Google OAuth for social login authentication. Users can register and log in using their Google account. Upon successful Google authentication, the user's Google account information (name, email, profile picture) is retrieved and used to create or authenticate the account. Phone number is collected as an additional mandatory field after Google authentication.
132. **Google-Registered User Email Field:** For users who registered via Google social login, the email field in the My Account Page is read-only and cannot be edited, as the email is managed by Google.
133. **Google-Registered User Password Reset:** Users who registered via Google social login do not have a platform password and cannot use the forgot password flow. They must log in via Google. The 「Forgot Password?」 link on the Login Page is not applicable to Google-registered users.
134. **App Icon Preview — View Tracking:** Every time a user views the Settings / About Page (with App Icon Preview), a view event is logged in the platform backend with user ID (if logged in), timestamp, and page view type.
135. **App Icon Preview — Analytics Visibility:** The admin can view aggregated analytics for icon preview views in the Admin Panel under the App Icon Preview Analytics section, including total views (all time), views (last 30 days), views (last 7 days), daily view trend chart, user breakdown by type and registration method, refresh button clicks, and reinstall button clicks.
136. **App Icon Preview — Refresh Button:** Tapping the 「Refresh Icon Preview」 button reloads the icon preview from the server and displays a brief confirmation message after a successful refresh.
137. **App Icon Preview — Reinstall Button:** Tapping the 「Reinstall App with Updated Icon」 button triggers the browser's native Add to Home Screen prompt (if supported) or displays a modal with manual installation instructions.
138. **App Icon Preview — Icon Comparison View:** The icon is displayed on multiple colored backgrounds (white, black, light gray, dark gray, primary brand color) to ensure visibility and contrast.
139. **App Icon Preview — All Icon Sizes Display:** All available icon sizes are displayed in a grid or list with labels indicating size and device usage context.
140. **App Icon Preview — Update Instructions:** A collapsible section provides step-by-step instructions for users who installed an old version and want to update to the latest icon.

---

## 5. Edge Cases & Boundary Conditions

| Scenario | Handling |
|---|---|
| User searches with no results in the selected location | Display a 「No results found in [City]」 message with a 「See results from all locations」 option |
| User expands search to all locations and still finds no results | Display a 「No results found」 message with a suggestion to broaden the search |
| User browses by location with no listings in that area | Display a 「No listings available in [City]」 message with an option to browse all locations |
| Recently Listed section has no products in the currently active location | Display a 「No listings available in [City]」 message with an option to browse all locations |
| User browses by category with no listings in that category | Display a 「No listings available in [Category]」 message |
| User browses by sub-category with no listings in that sub-category | Display a 「No listings available in [Sub-Category]」 message |
| Geolocation API is invoked on page load and returns a matching admin-managed location | Location is silently set as the active location; Recently Listed section immediately scoped to that location; no prompt is shown |
| Geolocation API is invoked on page load and the detected city does not match any admin-managed location | Fall back to the first-visit location prompt |
| Geolocation API is denied by the user on page load | Fall back to the first-visit location prompt |
| Geolocation API times out or returns an error on page load | Fall back to the first-visit location prompt |
| First-time visitor lands on the platform and auto-detection fails | Location selection prompt or modal is displayed; user can select a city, auto-detect manually, or skip |
| User dismisses the first-visit location prompt without selecting a location | Platform defaults to 「All Locations」 scope; Recently Listed section displays products from all locations; prompt is not shown again for that session |
| No locations have been configured by the admin | Location selector shows a placeholder; location-scoped filtering is disabled; GPS matching returns no results; first-visit prompt shows an empty state; Recently Listed section displays products from all locations or an empty state |
| Platform is launched for the first time with no locations added | All location selectors and 「Browse by Location」 section display an empty state; GPS auto-detection silently fails and no prompt is shown until locations are added |
| Admin deletes a location that is assigned to existing stores | Stores retain the location label; the location no longer appears as an active option in selectors |
| Admin edits a location name | All stores and products referencing this location are updated |
| Admin taps 「Detect Location」 in the Location Management form and GPS returns a valid position | GPS coordinates are captured and displayed (as latitude/longitude or resolved place name) for admin review before saving alongside the location name |
| Admin taps 「Detect Location」 in the Location Management form and GPS is denied or fails | GPS detection is aborted; admin is prompted to enter the location name manually; no coordinates are stored |
| Admin saves a location without using GPS detection or Google Maps search | Location is saved with the manually entered name only; no GPS coordinates stored; matching for this location falls back to name-based matching |
| Admin edits an existing location and re-detects GPS coordinates | New coordinates replace the previously stored coordinates upon saving |
| Admin uses the Google Maps search input and selects a place suggestion | Location name field and GPS coordinates are automatically populated with the selected place data; admin reviews before saving |
| Admin uses the Google Maps search input but no matching suggestions appear | Admin falls back to manual text entry or GPS detection; no coordinates are auto-populated |
| Admin clears the Google Maps search input after a suggestion was already selected | The previously auto-populated location name and GPS coordinates are cleared |
| Admin uses the Google Maps search input and then also taps 「Detect Location」 | The GPS-detected coordinates overwrite the Google Maps-populated coordinates; admin reviews before saving |
| Google Maps place autocomplete service is unavailable or returns an error | An inline error message is displayed in the Location Management form; admin falls back to manual text entry or GPS detection |
| Seller taps 「Detect My Location」 during store creation and GPS returns a matching location | Location field is auto-populated with the matched admin-managed location |
| Seller taps 「Detect My Location」 during store creation and GPS returns no matching location | Seller is prompted to select location manually from the admin-managed list |
| Seller taps 「Detect My Location」 during store creation and GPS is denied | Seller is prompted to select location manually from the admin-managed list |
| Seller has no active listings | Store detail page shows an empty listings section with a placeholder message |
| Buyer submits a duplicate review for the same store | System prevents submission and notifies the buyer they have already reviewed this store |
| User attempts to chat without being logged in | Redirect to login page with a return URL |
| User attempts to add to favorites without being logged in | Redirect to login page with a return URL |
| User attempts to follow a store without being logged in | Redirect to login page with a return URL |
| Guest user taps Favorites or Account in bottom navigation bar | Redirect to login page with a return URL |
| Seller deletes a product that has an active chat referencing it | Chat remains accessible; product context shows 「Listing no longer available」 |
| Seller deletes a product that is in one or more buyers' favorites lists | Product remains in favorites lists with a 「No longer available」 indicator |
| Seller has not provided a phone number in store contact info | 「Call Seller」 and 「Contact Seller」 buttons are hidden or shown as disabled |
| Admin suspends a seller account | All store listings are hidden from public view; seller cannot log in |
| Image upload exceeds limit | Display an error message: maximum 5 images per product |
| Admin deletes a category that has products assigned to it | Products retain the category label; the category and all its sub-categories are removed from all filter options |
| Admin deletes a sub-category that has products assigned to it | Products retain the sub-category label; the sub-category is removed from all filter options |
| Admin selects a category or sub-category image in an unsupported format | Display an inline error message; the image is not applied |
| Total categories exceed 5 on the home page row | The row remains a single horizontal line; excess categories accessible via horizontal scroll |
| Seller uploads a banner image in an unsupported format | Display an error message indicating accepted image formats |
| Seller attempts to upload more than 3 banner images | System prevents the upload and displays an error message |
| Seller attempts to remove the last remaining banner image after store creation | System prevents the removal and displays an error message |
| Seller attempts to submit store creation form without uploading a trade licence image | Form submission is blocked; inline error message displayed |
| Seller uploads a trade licence image in an unsupported format | Display an inline error message; the image is not applied |
| Seller attempts to submit store creation form without uploading any banner image | Form submission is blocked; inline error message displayed |
| Seller selects a top-level category for a product but does not select a sub-category | Product is saved with only the top-level category assigned |
| Seller selects a top-level category and then changes it | The sub-category selector resets and repopulates |
| All Stores Page search returns no matching store name | Display a 「No stores found matching [name]」 message |
| All Stores Page location filter returns no stores in that area | Display a 「No stores available in [City]」 message |
| No advertising banners are configured by the admin | The advertising banner section is hidden entirely on the home page |
| Admin attempts to add more than 5 advertising banners | System prevents the addition and displays an error message |
| Admin uploads an advertising banner image in an unsupported format | Display an error message indicating accepted image formats |
| The store linked to an advertising banner is suspended or removed | The advertising banner is automatically hidden from the home page |
| Admin opens gallery picker but dismisses without selecting an image (during add) | No image is applied; admin is prompted to select an image before saving |
| Admin opens gallery picker but dismisses without selecting an image (during edit) | The existing category image is retained unchanged |
| Seller logs in while account is in 「Pending Approval」 state | Seller sees a pending message and cannot access seller features |
| Seller logs in after account has been rejected | Seller sees a 「Your account was not approved」 message |
| Admin approves a seller who has already set up a store | Store and listings become immediately visible to the public |
| Pending seller approval count changes | Badge count on sidebar updates in real time |
| User attempts to submit the registration form without entering an email address (email registration) | Form submission is blocked; inline error message displayed |
| User attempts to submit the registration form without entering a phone number (email registration) | Form submission is blocked; inline error message displayed |
| User registers via Google but does not provide phone number | Phone number collection prompt is displayed; registration cannot complete until phone number is provided |
| Admin attempts to manually add a seller without entering a phone number | Form submission is blocked; inline error message displayed |
| Admin saves Footer Management fields with all social link URLs left empty | No social icons are displayed in the footer |
| Admin enters only some social link URLs | Only the configured social icons are displayed |
| Admin saves Footer Management with no About Us text entered | The About Us column displays a placeholder or is left blank |
| Admin saves Footer Management with no contact information entered | The Contact Us column displays a placeholder or is left blank |
| Admin navigates to the About Us page before any content has been entered | The page displays a placeholder message such as 「Content coming soon」 |
| Admin navigates to the Privacy Policy page before editing the default content | The page displays the pre-populated default Privacy Policy content |
| Admin navigates to the Terms & Conditions page before editing the default content | The page displays the pre-populated default Terms & Conditions content |
| Admin enters an invalid URL format in a social link field | An inline validation error is displayed; the invalid URL is not saved |
| User submits the Sell Your Phone form without completing all mandatory fields | Form submission is blocked; inline error messages displayed |
| User submits the Sell Your Phone form without selecting a pickup location | Form submission is blocked; inline error message displayed |
| User submits the Sell Your Phone form without uploading any image | Form submission is blocked; inline error message displayed |
| User uploads an unsupported image format for any phone image slot | An inline error message is displayed; the image is not applied |
| User changes the Brand Name selection after already selecting a Model Name or Variant | Model Name and Variant dropdowns reset and repopulate |
| User changes the Model Name selection after already selecting a Variant | Variant dropdown resets and repopulates |
| Image upload to the storage bucket fails during Sell Your Phone form submission | Submission is halted; inline error message displayed; form data retained |
| Storage bucket is not found or misconfigured | Submission is blocked; clear error message displayed |
| Admin deletes a brand name option that is the only brand in the list | Brand Name dropdown shows an empty state |
| Admin deletes a model name option | Model removed from dropdown immediately; all associated variant options also deleted |
| Admin deletes a variant option | Variant removed from dropdown immediately |
| WhatsApp submission fails due to a network error | Inline error message displayed; form data retained |
| Admin sets an invalid or empty WhatsApp destination number | Inline validation error displayed; invalid number not saved |
| Admin leaves all condition options or all age options empty | Corresponding dropdown shows an empty state |
| Admin leaves all variant options empty for a model | Variant dropdown shows an empty state when that model is selected |
| Submitter (guest) attempts to access the Sell Your Phone Chat Page without providing identification | System prompts the guest to provide a minimal identifier |
| Admin closes a Sell Your Phone chat while the submitter is actively viewing it | Submitter's chat interface immediately shows a 「Chat Closed」 indicator |
| Submitter attempts to send a message after the admin has closed the chat | Message is not sent; 「Chat Closed」 indicator shown; input field disabled |
| Admin attempts to reopen a closed Sell Your Phone chat | Not supported in this release; closed chats are read-only |
| Sell Your Phone submission is received but WhatsApp delivery fails | Submission record and chat session are still created; error surfaced to admin |
| Admin views a submission with no chat messages yet | Chat interface displayed in an empty state with a prompt to start the conversation |
| Submitter is redirected to the Sell Your Phone Chat Page but the chat session has not yet been created | Loading indicator displayed; error message shown if session creation fails |
| Admin attempts to create a new admin account with an email already in use | Inline error message displayed; account not created |
| Admin attempts to create a new admin account with mismatched password fields | Form submission is blocked; inline error message displayed |
| Admin attempts to create a new admin account with a password shorter than 8 characters | Form submission is blocked; inline error message displayed |
| Admin attempts to delete their own admin account | Action is blocked; error message displayed |
| A buyer or seller attempts to access the Admin Panel URL | Admin Panel login screen displayed; buyer/seller credentials result in authentication error |
| Admin copies the Admin Panel URL using the 「Copy Link」 button | URL copied to clipboard; brief confirmation indicator shown |
| Seller taps 「Popularise My Store」 button but no promotion plans are active | The Popularise My Store Page displays a message: 「No promotion plans are currently available. Please check back later.」 |
| Seller enters an invalid coupon code | Inline error message displayed: 「Invalid or expired coupon code.」; no discount applied |
| Seller enters a coupon code that has reached its usage limit | Inline error message displayed: 「This coupon code has reached its usage limit.」; no discount applied |
| Seller enters a coupon code that has expired | Inline error message displayed: 「Invalid or expired coupon code.」; no discount applied |
| No UPI ID has been configured by the admin | 「Pay Now」 button is disabled; seller sees 「Payment not available at this time」 message |
| Seller confirms payment completion but admin has not yet verified the UPI payment | Promotion remains in Pending Activation status; seller is informed that activation is pending admin verification |
| Seller purchases a new promotion while an existing one is still active | Behaviour determined by admin configuration (replace immediately or extend); applied accordingly |
| Admin manually cancels an active promotion | Store's promoted status is immediately removed; store returns to standard listing position |
| A promotion expires naturally | Store's promoted status is automatically removed upon expiry |
| Admin attempts to add a promotion plan with a duplicate name | Inline error message displayed; duplicate plan not saved |
| Admin attempts to add a coupon code with a duplicate code string | Inline error message displayed: 「This coupon code already exists.」; duplicate not saved |
| Admin deletes a promotion plan that has active promotions using it | Existing active promotions are not affected; the plan is removed from the selection list for new orders |
| Seller views the Popularise My Store Page while their store already has an active promotion | Current promotion details (plan name, start date, end date, remaining duration) are displayed; seller can still purchase a new plan |
| Unauthenticated user taps 「Chat with Seller」 on a Search Results Page product card | Redirected to the Login Page with a return URL |
| Seller has not provided a phone number and user taps 「Contact Seller」 on a Search Results Page product card | 「Contact Seller」 button is hidden or shown as disabled |
| User taps 「Share Store」 on a browser/device that supports the Web Share API | Native share sheet is triggered with the store's direct URL |
| User taps 「Share Store」 on a browser/device that does not support the Web Share API | Store URL is copied to clipboard; brief confirmation message 「Link copied to clipboard」 is displayed |
| Seller taps 「Share Store」 on the Store Management Page | Same share behaviour as on the Store Detail Page |
| Store is suspended or removed and a user attempts to access the shared store URL | Standard not-found or store-unavailable page is displayed |
| User enters an email address not registered on the platform in the Forgot Password Page | Inline error message displayed: 「No account found with this email address, or this account uses Google login.」; no OTP is sent |
| User who registered via Google attempts to use the Forgot Password flow | Inline error message displayed: 「No account found with this email address, or this account uses Google login.」; no OTP is sent |
| User enters an incorrect OTP on the OTP Verification Page (Password Reset) | Inline error message displayed: 「Invalid OTP. Please try again.」 |
| User's OTP expires before they enter it (Password Reset) | Inline error message displayed: 「OTP has expired. Please request a new one.」; Resend OTP option presented |
| User taps 「Resend OTP」 (Password Reset) | A new OTP is sent to the registered email from BestOld (containing the BestOld logo and name); the expiry timer resets; the previously issued OTP is invalidated |
| User attempts to use an already-used OTP (Password Reset) | OTP is rejected; inline error message displayed |
| User enters mismatched passwords on the Reset Password Page | Form submission is blocked; inline error message displayed |
| User enters a new password shorter than 8 characters on the Reset Password Page | Form submission is blocked; inline error message displayed |
| User successfully resets their password | Success message displayed; user redirected to the Login Page; used OTP is immediately invalidated |
| User enters an incorrect OTP on the OTP Verification Page (Registration) | Inline error message displayed: 「Invalid OTP. Please try again.」 |
| User's OTP expires before they enter it (Registration) | Inline error message displayed: 「OTP has expired. Please request a new one.」; Resend OTP option presented |
| User taps 「Resend OTP」 (Registration) | A new OTP is sent to the registered email from BestOld (containing the BestOld logo and name); the expiry timer resets; the previously issued OTP is invalidated |
| User attempts to use an already-used OTP (Registration) | OTP is rejected; inline error message displayed |
| User successfully verifies OTP during registration (Buyer) | User is immediately logged in and can access platform features |
| User successfully verifies OTP during registration (Seller) | User enters Pending Approval state; sees pending message upon login |
| Admin saves SMTP settings with an invalid host or port | Inline validation error displayed; settings not saved |
| Admin saves SMTP settings with an empty mandatory field | Form submission is blocked; inline error message displayed for each empty mandatory field |
| Admin sends a test email and the SMTP server rejects the credentials | Clear inline error message displayed describing the failure |
| Admin sends a test email and the connection to the SMTP host times out | Clear inline error message displayed indicating a connection timeout |
| Admin sends a test email successfully | Brief success confirmation message displayed |
| No SMTP configuration has been saved and a new user attempts to register via email | OTP cannot be sent; user is shown an error message indicating that email delivery is currently unavailable |
| No SMTP configuration has been saved and a user attempts to use the forgot password flow | OTP cannot be sent; user is shown an error message indicating that email delivery is currently unavailable |
| Admin updates SMTP settings while a transactional email is in the process of being sent | The in-flight email uses the previous settings; all subsequent emails use the updated settings |
| User registers via email but does not receive the OTP email | User can request a resend of the OTP from the OTP Verification Page (Registration) |
| OTP email is sent but the email contains no BestOld logo or name | This is a configuration error; the admin must ensure the email template includes the BestOld logo and name |
| Non-subscribed seller attempts to add a 6th product | System blocks the action and displays a clear message: 「You have reached the maximum limit of 5 products. Subscribe to Premium to add unlimited products and enable online selling.」 |
| Non-subscribed seller attempts to access the Online Orders Management Page | Access is denied; seller is redirected to the Seller Dashboard with a message prompting them to subscribe to Premium. |
| Subscribed seller's subscription expires while they have more than 5 products | Subscription status is set to Inactive; all products beyond the 5th are automatically hidden from public view; seller is notified and prompted to renew subscription or manually remove excess products. |
| Subscribed seller's subscription expires and they have 5 or fewer products | Subscription status is set to Inactive; all products remain visible; online selling capability is revoked; 「Buy Now」 buttons are removed from all products. |
| Buyer attempts to tap 「Buy Now」 on a product from a non-subscribed store | 「Buy Now」 button is not displayed on products from non-subscribed stores. |
| Unauthenticated user taps 「Buy Now」 on a product from a subscribed store | Redirected to the Login Page with a return URL. |
| Buyer completes online checkout but payment fails | Order is not created; inline error message displayed; buyer can retry payment. |
| Buyer completes online checkout and payment succeeds | Order is created and saved; buyer is redirected to the Order Confirmation Page; order is immediately visible in My Orders Page and seller's Online Orders Management Page. |
| Seller attempts to update order status for an order that has already been delivered | System prevents the update and displays an error message. |
| Seller attempts to cancel an order that has already been shipped | System allows cancellation but displays a warning message; buyer is notified. |
| Buyer views an order in My Orders Page and the seller has not yet provided tracking information | Tracking information section displays 「Tracking information not yet available」. |
| Admin views Subscription Management and no subscription plans are configured | Subscription plan list displays an empty state; sellers see 「No subscription plans are currently available」 on the Subscribe to Premium Page. |
| Seller taps 「Subscribe to Premium」 button but no subscription plans are active | The Subscribe to Premium Page displays a message: 「No subscription plans are currently available. Please check back later.」 |
| Seller confirms subscription payment but admin has not yet verified the payment | Subscription remains in Pending Activation status; seller is informed that activation is pending admin verification. |
| Admin manually activates a subscription | Seller's subscription status is immediately set to Active; seller gains unlimited product listings, online selling capability, and priority placement; success confirmation displayed to seller. |
| Admin manually cancels an active subscription | Seller's subscription status is immediately set to Inactive; all subscription benefits are revoked; if seller has more than 5 products, excess products are hidden. |
| Seller purchases a new subscription while an existing one is still active | Behaviour determined by admin configuration: start immediately (replace) or start after current subscription expires (extend). |
| No UPI ID has been configured for subscriptions | 「Pay Now」 button on Subscribe to Premium Page is disabled; seller sees 「Payment not available at this time」 message. |
| Admin attempts to add a subscription plan with a duplicate name | Inline error message displayed; duplicate plan not saved. |
| Admin deletes a subscription plan that has active subscriptions using it | Existing active subscriptions are not affected; the plan is removed from the selection list for new orders. |
| User registers via Google and Google OAuth returns an error | Registration fails; inline error message displayed; user can retry or use email registration. |
| User logs in via Google and Google OAuth returns an error | Login fails; inline error message displayed; user can retry or use email login (if registered via email). |
| User registers via Google but the Google account email is already registered via email | System detects duplicate email; inline error message displayed; user is prompted to log in via email instead. |
| User registers via email but the email is already registered via Google | System detects duplicate email; inline error message displayed; user is prompted to log in via Google instead. |
| Google-registered user attempts to edit their email in My Account Page | Email field is read-only; inline message displayed: 「Email is managed by Google and cannot be edited.」 |
| Google-registered user taps 「Forgot Password?」 on the Login Page | Not applicable; Google-registered users do not have a platform password and must log in via Google. |
| No pickup locations have been enabled by the admin | Pickup Location dropdown on the Sell Your Phone form displays an empty state or placeholder message; form cannot be submitted. |
| Admin disables all pickup locations after some Sell Your Phone submissions have already been received | Existing submissions retain the selected pickup location; new submissions cannot be made until at least one pickup location is re-enabled. |
| Admin enables a new pickup location | The new location is immediately available in the Pickup Location dropdown on the Sell Your Phone form. |
| Admin disables a pickup location that was previously selected in existing submissions | Existing submissions retain the selected pickup location; the location is removed from the dropdown for new submissions. |
| User opens the Sell Your Phone form and no pickup locations are available | A clear message is displayed: 「Phone pickup service is currently unavailable. Please check back later.」; the form cannot be submitted. |
| User navigates to the Settings / About Page and the icon preview fails to load | A placeholder image or error message is displayed; the 「Refresh Icon Preview」 button is available to retry. |
| User taps 「Refresh Icon Preview」 and the refresh fails | An inline error message is displayed; the user can retry. |
| User taps 「Reinstall App with Updated Icon」 on a browser that does not support the Add to Home Screen API | A fallback message is displayed: 「Please use your browser's menu to add BestOld to your home screen.」 |
| Admin views App Icon Preview Analytics and no views have been recorded | All analytics metrics display zero; a placeholder message is shown: 「No icon preview views recorded yet.」 |
| Admin exports App Icon Preview Analytics as CSV and the export fails | An inline error message is displayed; the admin can retry. |

---

## 6. Acceptance Criteria

1. A new user can register as a Buyer or Seller using their email address and phone number (both mandatory) and receive an OTP via email from BestOld, or register/login directly using their Google account via Google OAuth.
2. The OTP email sent from BestOld contains the BestOld logo and the BestOld name prominently displayed in the email header or body.
3. The registration form includes mandatory email and phone number fields for email registration; the form cannot be submitted if either field is left empty.
4. After submitting the registration form via email, the user is navigated to the OTP Verification Page (Registration) where they enter the OTP received by email.
5. After successful OTP verification, buyer accounts are immediately logged in; seller accounts enter 「Pending Approval」 status and cannot access seller features until approved by an admin.
6. A clearly visible 「Sign up with Google」 button is displayed on the Register Page; tapping it initiates the Google OAuth flow.
7. Upon successful Google authentication, the user's Google account information (name, email, profile picture) is retrieved and used to create a new account; phone number is collected as an additional mandatory field after Google authentication.
8. After phone number is provided, seller accounts enter 「Pending Approval」 state; buyer accounts are immediately logged in.
9. A clearly visible 「Sign in with Google」 button is displayed on the Login Page; tapping it initiates the Google OAuth flow for login.
10. A seller in 「Pending Approval」 state sees a clear pending message upon login and cannot access the Seller Dashboard, Store Management, or Product Management.
11. The Admin Panel displays a dedicated Seller Approval Management section listing all pending, approved, and rejected seller accounts.
12. The Seller Approval Management section shows a badge count of pending approvals in the sidebar navigation.
13. Admin can approve a pending seller; upon approval, the seller gains immediate access to seller features and their store/listings become publicly visible.
14. Admin can reject a pending seller; the seller sees a rejection message upon login.
15. Admin can manually add a new seller account from the User Management section with mandatory email and phone number fields; the account is automatically set to 「Approved」 status.
16. The Admin Panel provides a clear overview dashboard with summary statistics including total pending seller approvals, total Sell Your Phone submissions, total open Sell Your Phone chats, total active store promotions, total subscribed stores, total active subscriptions, total pending subscription orders, total online orders, and total App Icon Preview views (last 30 days).
17. All Admin Panel data tables support search, filtering, and pagination.
18. When a visitor lands on the platform for the first time, the browser's Geolocation API is automatically invoked; if a matching admin-managed location is found, it is silently set as the active location without displaying any prompt, and the Recently Listed products section on the home page is immediately scoped to that detected location.
19. If the Geolocation API is denied, times out, or returns no matching admin-managed location, the first-visit location prompt is displayed as a fallback.
20. A persistent location selector is displayed in the global header across all public-facing and buyer/seller-facing pages, showing the currently active city/region.
21. Clicking or tapping the header location selector opens a location picker where the user can search for a city, browse the full admin-managed location list, or use auto-detect.
22. An 「All Locations」 option is always available in the location picker, allowing the user to browse without any location restriction; selecting 「All Locations」 causes the Recently Listed section to display products from all locations.
23. When the first-visit prompt is shown (fallback), it offers city search, auto-detect, and a skip/browse-all option.
24. Once a location is selected or the first-visit prompt is dismissed, the prompt is not shown again for that session.
25. All product listings, store listings, search results, and the Recently Listed products section on the home page are automatically scoped to the user's currently selected location by default. Subscribed stores and their products are displayed at the top of all location-scoped listings within the active location, followed by non-subscribed stores and products.
26. The active location is always visible in the header selector so the user is always aware of their active scope.
27. The user can change the location filter directly on the Search Results Page without re-entering their search query; changing the location immediately refreshes results.
28. When a location is changed via the header location selector on the home page, the Recently Listed products section immediately refreshes to display only products from the newly selected location, with subscribed stores' products at the top.
29. When a location-scoped search returns zero results, a 「See results from all locations」 option is displayed; tapping it expands the search scope to all locations.
30. When the Recently Listed section has no products in the currently active location, a 「No listings available in [City]」 message is displayed with an option to browse all locations.
31. The selected location is persisted for the session; for logged-in users, the preferred location is saved to their profile and restored on subsequent logins (taking precedence over auto-detection), and the Recently Listed section is immediately scoped to the restored location.
32. Search results can be sorted by Most Recent, Price: Low to High, and Price: High to Low.
33. The search bar in the header is persistent across all public-facing pages and searches product titles/descriptions and store names simultaneously.
34. The store creation form includes a 「Detect My Location」 GPS button in the location field; tapping it invokes the Geolocation API and auto-populates the location field with the nearest matching admin-managed location.
35. If GPS detection during store creation returns no matching admin-managed location or is denied, the seller is prompted to select their location manually from the admin-managed list.
36. A logged-in Seller (approved) can create a store, add product listings with images, and edit or delete them. Non-subscribed sellers can add a maximum of 5 product listings. Subscribed sellers have unlimited product listings.
37. When a non-subscribed seller attempts to add a 6th product, the system blocks the action and displays a clear message: 「You have reached the maximum limit of 5 products. Subscribe to Premium to add unlimited products and enable online selling.」
38. The store creation form includes a mandatory trade licence image upload field; the form cannot be submitted without a valid trade licence image.
39. A preview of the uploaded trade licence image is displayed immediately after selection.
40. Uploading a trade licence image in an unsupported format triggers a clear inline error message.
41. During store editing, the seller can replace the existing trade licence image; if no new image is selected, the existing image is retained.
42. The trade licence image uploaded by a seller is visible to the admin in the Store Management read-only detail view.
43. The store creation form includes a mandatory banner image upload field; the form cannot be submitted without at least 1 banner image.
44. A logged-in Seller can upload up to 3 banner images for their store; banners are displayed at the top of the Store Detail Page.
45. A logged-in Seller can replace or remove individual banner images, provided at least 1 banner image remains at all times after store creation.
46. Attempting to remove the last remaining banner image after store creation triggers a clear error message.
47. Uploading more than 3 banner images or using an unsupported image format for a banner triggers a clear error message.
48. A logged-in Buyer can search for products and stores by keyword and filter results by location, category, and sub-category. Subscribed stores and their products are displayed at the top of search results within the active location.
49. A user can select a city or region from the home page 「Browse by Location」 section and be taken to a pre-filtered Search Results Page.
50. A user can apply or change the location filter directly on the Search Results Page without re-entering their search query.
51. A user can browse all products and stores in a selected location without entering any search keyword.
52. The home page displays a 「Browse by Category」 section directly beneath the 「Browse by Location」 section, showing all active top-level categories in a single horizontal scrollable row with exactly 5 items visible at a time.
53. When more than 5 categories exist, the remaining categories are accessible by scrolling horizontally; the row does not wrap to a second line.
54. Clicking a category on the home page navigates to the Search Results Page or All Categories Page pre-filtered by that category, scoped to the currently active location.
55. The Search Results Page includes a category filter; selecting a category filters results and displays a visible active filter indicator.
56. The Search Results Page displays a sub-category filter when a top-level category is selected; selecting a sub-category further filters results.
57. The sub-category filter is hidden on the Search Results Page when no top-level category is selected.
58. The All Categories Page displays all active top-level categories; tapping a category reveals its sub-categories; tapping a sub-category navigates to the Search Results Page pre-filtered by that sub-category.
59. The Admin Panel Category Management page allows the admin to manage sub-categories nested within each category.
60. Admin can add a sub-category with a name and optional image; immediately reflected across the platform.
61. Admin can edit a sub-category name and image; if the gallery picker is dismissed without selection during edit, the existing image is retained.
62. Admin can delete a sub-category; products assigned to the deleted sub-category retain the label but the sub-category no longer appears as an active filter option.
63. Deleting a top-level category also deletes all its sub-categories.
64. When adding a product, the seller can optionally select a sub-category after selecting a top-level category; the sub-category selector resets when the top-level category is changed.
65. The Admin Panel includes a dedicated Location Management section where the admin can add, edit, and delete cities/regions with no pre-populated values.
66. The Location Management add/edit form provides three input methods: a plain text input for the location name, a 「Detect Location」 GPS button that invokes the browser's Geolocation API to capture and store GPS coordinates alongside the location name, and a Google Maps search input that provides place autocomplete suggestions and automatically populates the location name and GPS coordinates upon selection.
67. When the admin types in the Google Maps search input, place autocomplete suggestions are displayed in a dropdown; selecting a suggestion automatically populates the location name field and GPS coordinates.
68. When the admin taps 「Detect Location」 in the Location Management form and GPS detection succeeds, the detected coordinates are displayed for review before saving.
69. When the admin taps 「Detect Location」 in the Location Management form and GPS detection fails or is denied, the admin is prompted to enter the location name manually; no coordinates are stored.
70. When the admin clears the Google Maps search input after a suggestion was already selected, the previously auto-populated location name and GPS coordinates are cleared.
71. If the Google Maps place autocomplete service is unavailable or returns an error, an inline error message is displayed and the admin can fall back to manual text entry or GPS detection.
72. Locations saved with GPS coordinates (whether from GPS detection or Google Maps search) use those coordinates as the reference point for proximity-based GPS matching for customers and sellers; locations saved without GPS coordinates fall back to name-based matching.
73. The platform launches with no default or pre-seeded locations; all locations must be explicitly created by the admin.
74. Locations added by the admin are immediately available in all location selectors across the platform, including the header location selector, the first-visit location prompt, and the GPS matching logic for both customers and sellers.
75. Editing a location name updates all references to that location across the platform.
76. Deleting a location removes it from all active location selectors; stores and products previously assigned retain the label.
77. The store creation and edit forms present location as a searchable dropdown populated exclusively from the admin-managed location list.
78. When no locations have been configured, location selectors show an empty list or placeholder.
79. When adding a new category, the admin can open a device gallery picker to select an image; a preview is displayed before saving.
80. When editing an existing category, the admin can open a device gallery picker to replace the current image; if the picker is dismissed without selection, the existing image is retained.
81. Selecting an unsupported image format via the gallery picker triggers an inline error message and the image is not applied.
82. Category additions, edits, and deletions are immediately reflected on the home page, the All Categories Page, and in the Search Results Page category filter.
83. The home page displays an advertising banner strip directly beneath the 「Browse by Category」 section, showing up to 5 auto-scrolling banners linked to paid stores.
84. Each advertising banner on the home page is clickable and navigates the user to the corresponding Store Detail Page.
85. The advertising banner strip auto-scrolls continuously in a loop without user interaction.
86. If no advertising banners are configured, the advertising banner section is hidden entirely on the home page.
87. The Admin Panel allows the admin to add (up to 5), edit, reorder, and remove advertising banners; changes are immediately reflected on the home page.
88. Attempting to add more than 5 advertising banners triggers a clear error message.
89. A logged-in Buyer can open a chat with a Seller, send messages, and view the full chat history on return visits.
90. The Product Detail Page displays a 「Call Seller」 button that shows the seller's phone number and triggers the device's native dialer; if no phone number is provided, the button is hidden or disabled.
91. The Product Detail Page displays a 「Buy Now」 button for products from subscribed stores; tapping this button navigates the buyer to the Online Checkout Page. The 「Buy Now」 button is not displayed for products from non-subscribed stores.
92. A logged-in Buyer can add a product to their favorites list and view all favorited products on the Favorites Page. Products from subscribed stores display a 「Buy Now」 button on the Favorites Page.
93. A logged-in Buyer can remove a product from their favorites list at any time.
94. Favorited products that are sold or removed display a 「No longer available」 indicator.
95. A logged-in Buyer can follow a seller's store from the Store Detail Page; the follower count updates immediately.
96. A logged-in Buyer can unfollow a store from the Store Detail Page or the Following Page.
97. The Following Page displays all stores the buyer currently follows. Subscribed stores display a 「Premium」 or 「Subscribed」 badge.
98. The Seller Dashboard and Store Management Page display the current follower count for the seller's store.
99. A logged-in Buyer can submit a star rating and optional text review for a Seller store, limited to one review per store.
100. Reviews are visible on the Store Detail Page with the average rating displayed.
101. The location filter correctly narrows search results to the selected city or region.
102. The Admin Panel allows the admin to view, suspend, and remove users, stores, products, and reviews.
103. A Seller cannot list products until their store profile is created.
104. Suspended accounts cannot log in and their listings are hidden from public view.
105. A fixed bottom navigation bar with 5 tabs (Home, All Categories, Favorites, Stores, Account) is visible on all buyer-facing and seller-facing pages.
106. Tapping 「Home」 navigates to the Landing / Home Page.
107. Tapping 「All Categories」 navigates to the All Categories Page.
108. Tapping 「Favorites」 navigates to the Favorites Page for logged-in buyers; unauthenticated users are redirected to the Login Page.
109. Tapping 「Stores」 navigates to the All Stores Page.
110. Tapping 「Account」 navigates to My Account Page for logged-in buyers and to My Account Page (Seller) for logged-in sellers; unauthenticated users are redirected to the Login Page.
111. The active tab in the bottom navigation bar is visually highlighted.
112. The Favorites tab is positioned in the middle of the bottom navigation bar, between All Categories and Stores.
113. Only stores and products belonging to admin-approved sellers are visible in public-facing pages.
114. The My Account Page allows buyers to view and edit their email address and phone number. Buyers can view their order history via a quick link to the My Orders Page. Buyers can access the Settings / About Page via a quick link. For Google-registered buyers, the email field is read-only and cannot be edited.
115. The Admin Panel includes a Logo Management setting; the updated logo is immediately reflected across all pages.
116. Uploading a logo image in an unsupported format triggers a clear inline error message.
117. If the admin dismisses the logo gallery picker without selecting an image, the existing logo is retained.
118. No hardcoded location array exists anywhere in the application; all location data is sourced exclusively from the database records created by the admin.
119. GPS matching for both customer auto-detection and seller store location detection is performed exclusively against the admin-managed location list stored in the database, using stored GPS coordinates for proximity-based matching where available.
120. The Admin Panel includes a dedicated Footer Management section with sub-sections for About Us text, Contact Information, Social Links, and footer page content (About Us, Privacy Policy, Terms & Conditions).
121. Admin can enter and save About Us text; immediately reflected in the footer.
122. Admin can enter and save a contact address and phone number; immediately reflected in the footer.
123. Admin can enter and save URLs for Instagram, YouTube, and Facebook; only social icons with a configured URL are displayed.
124. If a social link URL field is left empty, the corresponding social icon is not displayed.
125. Admin can enter and save full content for the About Us page, Privacy Policy page, and Terms & Conditions page; immediately reflected on the corresponding dedicated full-page views.
126. Clicking the About Us, Privacy Policy, or Terms & Conditions links in the footer navigates to the corresponding dedicated full-page view.
127. The footer is displayed in desktop mode across all public-facing pages and contains four columns: About Us, Quick Links, Contact Us, and Follow Us.
128. All footer content is sourced exclusively from the admin-managed Footer Management section; no footer text is hardcoded.
129. Entering an invalid URL format in a social link field triggers an inline validation error and the invalid URL is not saved.
130. The Privacy Policy page is pre-populated with default platform-appropriate content; the admin can edit and replace this content at any time.
131. The Terms & Conditions page is pre-populated with default platform-appropriate content; the admin can edit and replace this content at any time.
132. When the About Us page has no admin-entered content, the page displays a 「Content coming soon」 placeholder.
133. A clearly visible 「Sell Your Phone」 button is displayed on the home page and is accessible to all visitors without requiring authentication.
134. Tapping or clicking the 「Sell Your Phone」 button opens the Sell Your Phone form.
135. The Sell Your Phone form contains exactly 7 fields: Pickup Location, Brand Name, Model Name, Variant, Condition, How Much Old, and image upload for up to 6 phone images.
136. The Pickup Location dropdown is displayed as the first field in the Sell Your Phone form and is populated exclusively from locations marked as enabled for Sell Your Phone pickup by the admin.
137. If no pickup locations have been enabled by the admin, the Pickup Location dropdown displays an empty state or placeholder message, and the form cannot be submitted.
138. A brief informational message is displayed above or below the Pickup Location dropdown, such as: 「We currently offer phone pickup service in the following locations. Please select your location to proceed.」
139. The Model Name dropdown is populated based on the selected Brand Name; changing the Brand Name resets and repopulates the Model Name and Variant dropdowns.
140. The Variant dropdown is populated based on the selected Model Name; changing the Model Name resets and repopulates the Variant dropdown.
141. All 6 image upload slots are clearly labeled and display a visual example or placeholder illustration.
142. A preview of each uploaded phone image is displayed immediately after selection.
143. Uploading an unsupported image format for any phone image slot triggers an inline error message.
144. The Sell Your Phone form cannot be submitted unless the Pickup Location field, all five dropdown fields (Brand Name, Model Name, Variant, Condition, How Much Old), and at least one image are completed.
145. Upon tapping Submit, all uploaded images are first saved to the backend storage bucket; if image storage fails, the submission is halted and an inline error message is displayed.
146. Upon successful image storage, all field values (including the selected pickup location) and images are sent to the admin's WhatsApp number and simultaneously saved as a complete submission record in the platform backend.
147. The complete submission record (including the selected pickup location) is immediately visible to the admin in the Sell Your Phone Submissions & Chat section.
148. After successful form submission, the submitter is automatically redirected to the Sell Your Phone Chat Page where a real-time chat session is immediately active.
149. The admin can view and respond to the Sell Your Phone chat from the Admin Panel.
150. The admin can close any Sell Your Phone chat at any time; once closed, no further messages can be sent by either party.
151. The submitter sees a clear 「Chat Closed」 indicator when the admin closes the chat; the message input is disabled.
152. Closed Sell Your Phone chats remain accessible in read-only mode.
153. The total count of open Sell Your Phone chats is displayed as a badge on the sidebar, updating in real time.
154. After successful submission, a confirmation message is displayed as configured by the admin, followed immediately by the redirect to the Sell Your Phone Chat Page.
155. If the WhatsApp submission fails, an inline error message is displayed and the form data is retained.
156. If the storage bucket is not found or misconfigured, a clear error is surfaced and the submission is blocked.
157. The Admin Panel includes a dedicated 「Sell Your Phone Form Management」 section.
158. Admin can update the 「Sell Your Phone」 button label; the change is immediately reflected on the home page.
159. Admin can update the WhatsApp destination number; the change takes effect immediately.
160. Admin can update the confirmation message text; the change is immediately reflected after form submission.
161. The Sell Your Phone Form Management section includes a dedicated 「Pickup Locations」 sub-section displaying a searchable, paginated table listing all admin-managed locations with a toggle switch or checkbox for enabling/disabling each location for Sell Your Phone pickup.
162. Admin can toggle the pickup availability status for any location; changes take effect immediately and are reflected in the Pickup Location dropdown on the Sell Your Phone form.
163. Only locations marked as enabled for Sell Your Phone pickup are displayed in the Pickup Location dropdown on the form.
164. A brief informational message is displayed at the top of the Pickup Location Management sub-section, such as: 「Select the locations where phone pickup service is available. Only enabled locations will be visible to customers on the Sell Your Phone form.」
165. Admin can add, edit, delete, and reorder Brand Name options; changes are immediately reflected in the form dropdown.
166. Admin can add, edit, delete, and reorder Model Name options per brand; changes are immediately reflected.
167. When a brand is deleted, all associated model name options and their variant options are also deleted.
168. Admin can add, edit, delete, and reorder Variant options per model; changes are immediately reflected.
169. When a model is deleted, all associated variant options are also deleted.
170. Admin can add, edit, delete, and reorder Condition options; changes are immediately reflected.
171. Admin can add, edit, delete, and reorder How Much Old (age) options; changes are immediately reflected.
172. The Admin Panel is accessible via a dedicated, shareable URL path.
173. The Admin Account Management section displays the full Admin Panel URL with a 「Copy Link」 button; clicking the button copies the URL to the clipboard and shows a brief confirmation indicator.
174. Admin can create a new admin account with a full name, email address, and a password of at least 8 characters; the new account is immediately active.
175. The Admin Account Management section displays a list of all existing admin accounts.
176. Admin can delete any other admin account; a confirmation prompt is shown before deletion.
177. An admin cannot delete their own account; attempting to do so displays a clear error message.
178. Attempting to create a new admin account with an email already in use displays an inline error message.
179. Attempting to create a new admin account with mismatched password fields blocks form submission and displays an inline error message.
180. Attempting to create a new admin account with a password shorter than 8 characters blocks form submission and displays an inline error message.
181. Buyer and seller credentials are rejected at the Admin Panel login screen.
182. A 「Subscribe to Premium」 button is prominently displayed in the Seller Dashboard, the My Account Page (Seller), and the Store Management Page if the seller does not have an active subscription; tapping the button from any of these locations navigates the seller to the Subscribe to Premium Page.
183. The Subscribe to Premium Page displays all active subscription plans configured by the admin, each showing the plan name, duration, price (₹ INR), and features (unlimited product listings, online selling capability, priority placement).
184. The seller can select one subscription plan and view an order summary showing the plan name, duration, price (₹ INR), and total payable amount (₹ INR).
185. Tapping 「Pay Now」 on the Subscribe to Premium Page presents the seller with the admin's configured UPI ID and the exact payable amount in ₹ INR, allowing the seller to complete payment via any UPI-compatible app.
186. After completing UPI payment, the seller can confirm payment completion within the platform; this submits a subscription request to the admin for manual verification and activation.
187. Upon admin manual activation of the subscription, the seller's store gains unlimited product listings, online selling capability, and priority placement (top positioning in location for stores and products).
188. A success confirmation message is displayed to the seller upon successful subscription activation by the admin.
189. If no UPI ID has been configured by the admin for subscriptions, the 「Pay Now」 button on the Subscribe to Premium Page is disabled and the seller sees a 「Payment not available at this time」 message.
190. If no active subscription plans exist, the Subscribe to Premium Page displays a 「No subscription plans are currently available」 message.
191. If the seller's store already has an active subscription, the Subscribe to Premium Page displays the current subscription details including plan name, start date, end date, and remaining duration.
192. The Admin Panel includes a dedicated 「Subscription Management」 section in the sidebar.
193. Admin can enter and save the UPI ID for subscriptions in the Subscription Management section; the change takes effect immediately for all subsequent subscription payment transactions.
194. Admin can add, edit, activate/deactivate, and delete subscription plans (with prices in ₹ INR) from the Subscription Management section; active plans are immediately available to sellers.
195. The Subscription Management section displays a searchable, paginated table of all subscription orders with full details including plan, amount paid (₹ INR), payment date, subscription status (Pending Activation, Active, Expired, Cancelled), start date, and end date.
196. Admin can manually activate a pending subscription order after verifying the UPI payment from the Subscription Management section.
197. Admin can manually cancel any active subscription from the Subscription Management section; the seller's subscription status is immediately set to Inactive and all subscription benefits are revoked.
198. The Subscription Management section includes an Active Subscriptions Overview listing all currently active subscriptions with remaining duration.
199. Admin can configure the subscription renewal behaviour (start immediately or start after current subscription expires) when a seller purchases a new subscription while an existing one is active.
200. When a seller's subscription expires and they have more than 5 products, the system automatically hides all products beyond the 5th from public view and notifies the seller.
201. When a seller's subscription expires and they have 5 or fewer products, all products remain visible but online selling capability is revoked and 「Buy Now」 buttons are removed.
202. A 「Popularise My Store」 button is prominently displayed in the Seller Dashboard, the My Account Page (Seller), and the Store Management Page; tapping the button from any of these locations navigates the seller to the Popularise My Store Page.
203. The Popularise My Store Page displays all active promotion plans configured by the admin, each showing the plan name, duration, and price in ₹ INR.
204. The seller can select one promotion plan and view an order summary showing the plan name, duration, original price (₹ INR), and final payable amount (₹ INR).
205. The seller can enter a coupon code and tap 「Apply」; if valid, the discounted price (₹ INR) is immediately reflected in the order summary; if invalid or expired, an inline error message is displayed.
206. Only one coupon code can be applied per promotion order.
207. The applied coupon code and discount amount (₹ INR) are shown in the order summary before payment.
208. Tapping 「Pay Now」 presents the seller with the admin's configured UPI ID and the exact final payable amount in ₹ INR, allowing the seller to complete payment via any UPI-compatible app.
209. After completing UPI payment, the seller can confirm payment completion within the platform; this submits a promotion request to the admin for manual verification and activation.
210. Upon admin manual activation of the promotion, the store is moved to the top of store listings and visually highlighted with a 「Featured」 or 「Promoted」 badge across the All Stores Page, Search Results Page store results, and Home Page store sections.
211. A success confirmation message is displayed to the seller upon successful promotion activation by the admin.
212. If no UPI ID has been configured by the admin, the 「Pay Now」 button on the Popularise My Store Page is disabled and the seller sees a 「Payment not available at this time」 message.
213. If no active promotion plans exist, the Popularise My Store Page displays a 「No promotion plans are currently available」 message.
214. If the seller's store already has an active promotion, the Popularise My Store Page displays the current promotion details including plan name, start date, end date, and remaining duration.
215. The Admin Panel includes a dedicated 「Popularise My Store Management」 section in the sidebar.
216. Admin can enter and save the UPI ID in the Popularise My Store Management section; the change takes effect immediately for all subsequent promotion payment transactions.
217. Admin can add, edit, activate/deactivate, and delete promotion plans (with prices in ₹ INR) from the Popularise My Store Management section; active plans are immediately available to sellers.
218. Admin can add, edit, activate/deactivate, and delete coupon codes from the Popularise My Store Management section; changes take effect immediately.
219. Coupon codes support percentage and fixed amount (₹ INR) discount types, configurable usage limits, and optional expiry dates.
220. The Popularise My Store Management section displays a searchable, paginated table of all promotion orders with full details including plan, amount paid (₹ INR), coupon used, UPI reference (if provided), and promotion status.
221. Admin can manually activate a pending promotion order after verifying the UPI payment from the Popularise My Store Management section.
222. Admin can manually cancel any active promotion from the Popularise My Store Management section; the store's promoted status is immediately removed upon cancellation.
223. The Popularise My Store Management section includes an Active Promotions Overview listing all currently active promotions with remaining duration.
224. Admin can configure the overlap behaviour (replace immediately or extend) when a seller purchases a new promotion while an existing one is active.
225. Attempting to add a coupon code with a duplicate code string displays an inline error message and the duplicate is not saved.
226. The My Account Page (Seller) displays a prominently visible 「Subscribe to Premium」 button if the seller does not have an active subscription; tapping it navigates the seller to the Subscribe to Premium Page.
227. The My Account Page (Seller) displays the seller's current subscription status (Active / Inactive), subscription plan name, and expiry date (if active).
228. All product prices are entered and displayed in Indian Rupees (INR) using the ₹ symbol throughout the platform.
229. All subscription plan prices, promotion plan prices, discount amounts, and payment totals are displayed in ₹ INR.
230. No currency symbol other than ₹ (INR) appears anywhere on the platform.
231. Each product result card on the Search Results Page displays a 「Chat with Seller」 button and a 「Contact Seller」 button; the product name is not displayed on the search result card. Products from subscribed stores additionally display a 「Buy Now」 button.
232. Tapping 「Chat with Seller」 on a Search Results Page product card initiates or opens a chat with the seller for logged-in buyers; unauthenticated users are redirected to the Login Page with a return URL.
233. Tapping 「Contact Seller」 on a Search Results Page product card displays the seller's phone number and triggers the device's native phone dialer.
234. If the seller has not provided a phone number, the 「Contact Seller」 button on the Search Results Page product card is hidden or shown as disabled.
235. Tapping 「Buy Now」 on a Search Results Page product card (subscribed store products only) navigates the buyer to the Online Checkout Page for that product. Only logged-in buyers can access the Online Checkout Page; unauthenticated users are redirected to the Login Page with a return URL.
236. No social media link input fields are present on the Store Management Page; sellers cannot configure any social media links for their store.
237. No social media icons or links are displayed on the Store Detail Page.
238. A 「Share Store」 button is displayed on the Store Detail Page and is accessible to all visitors without requiring authentication.
239. A 「Share Store」 button is displayed on the Store Management Page, accessible to the seller who owns the store.
240. Tapping the 「Share Store」 button on a browser/device that supports the Web Share API triggers the native share sheet with the store's direct URL.
241. Tapping the 「Share Store」 button on a browser/device that does not support the Web Share API copies the store's direct URL to the clipboard and displays a brief confirmation message such as 「Link copied to clipboard」.
242. The URL shared or copied via the 「Share Store」 button is always the direct, publicly accessible URL of the Store Detail Page for that store.
243. A 「Forgot Password?」 link is displayed on the Login Page; tapping it navigates the user to the Forgot Password Page (only available for email-registered users).
244. On the Forgot Password Page, the user enters their registered email address and taps 「Send OTP」; if the email is registered via email, an OTP is sent to that email address from BestOld (containing the BestOld logo and name) and the user is navigated to the OTP Verification Page (Password Reset).
245. If the email entered on the Forgot Password Page is not associated with any registered account or was registered via Google, an inline error message is displayed and no OTP is sent.
246. On the OTP Verification Page (Password Reset), the user enters the OTP received by email; if correct and not expired, the user is navigated to the Reset Password Page.
247. If the OTP entered is incorrect, an inline error message is displayed: 「Invalid OTP. Please try again.」
248. If the OTP has expired, an inline error message is displayed: 「OTP has expired. Please request a new one.」; a 「Resend OTP」 option is presented.
249. Tapping 「Resend OTP」 sends a new OTP to the registered email from BestOld (containing the BestOld logo and name), resets the expiry timer, and invalidates any previously issued OTP for that session.
250. On the Reset Password Page, the user enters and confirms a new password; the password must be at least 8 characters and both fields must match.
251. If the new password fields do not match or the password is shorter than 8 characters, form submission is blocked and an inline error message is displayed.
252. Upon successful password reset, a success message is displayed, the user is redirected to the Login Page, and the used OTP is immediately invalidated.
253. The forgot password flow is available to buyers and sellers who registered via email. Not available to Google-registered users.
254. The Admin Panel includes a dedicated 「Email Configuration」 section in the sidebar navigation.
255. The Email Configuration section provides a form with the following mandatory fields: SMTP Host, SMTP Port, Encryption/Security (None / SSL / TLS), SMTP Username, SMTP Password, Sender Name, and Sender Email Address.
256. Admin can save the SMTP configuration using a 「Save」 button; the configuration takes effect immediately for all subsequent outgoing platform emails.
257. After saving, a 「Send Test Email」 button is available; tapping it sends a test email to the logged-in admin's email address using the current SMTP configuration.
258. If the test email is sent successfully, a brief success confirmation message is displayed.
259. If the test email fails (e.g., authentication error, connection timeout), a clear inline error message is displayed describing the failure reason.
260. The Email Configuration section displays a status indicator showing whether a valid SMTP configuration is currently saved and active, or whether no configuration has been set.
261. If no SMTP configuration has been saved, a prominent warning banner is displayed in the Email Configuration section and on the Admin Dashboard.
262. If no SMTP configuration has been saved and a user attempts to register via email or use the forgot password flow, a clear error message is shown to the user indicating that email delivery is currently unavailable.
263. Attempting to save the SMTP configuration with any mandatory field left empty blocks form submission and displays an inline error message for each empty field.
264. The Recently Listed products section on the home page renders in a 2-column grid on mobile screens, a 3-column grid on tablet screens, and a 4-column grid on desktop screens.
265. All transactional emails sent from the platform (OTP verification, and any other emails) include the BestOld logo and the BestOld name prominently displayed in the email header or body.
266. The Online Checkout Page is accessible only for products from subscribed stores; only logged-in buyers can access this page.
267. The Online Checkout Page displays a product summary, delivery address form, order summary (product price, delivery charge, total amount in ₹ INR), and payment method selection (UPI, Card, Net Banking, Cash on Delivery if enabled).
268. Upon tapping 「Place Order」 on the Online Checkout Page, the order is created and saved; payment is processed via the selected payment method; upon successful payment, the buyer is redirected to the Order Confirmation Page.
269. If payment fails on the Online Checkout Page, an inline error message is displayed and the buyer can retry.
270. The Order Confirmation Page displays a success message, order summary (order ID, product details, delivery address, total amount paid in ₹ INR, estimated delivery date), a 「View My Orders」 button, and a 「Continue Shopping」 button.
271. The My Orders Page displays a list of all orders placed by the buyer, sorted by most recent first; each order entry shows order ID, product thumbnail, product title, seller store name, order date, order status, and total amount (₹ INR).
272. Tapping an order entry on the My Orders Page navigates to a detailed Order Detail View showing full order information, delivery address, payment method, and order status history.
273. Buyers can view delivery tracking information (if provided by the seller) in the Order Detail View.
274. The Online Orders Management Page is accessible only to sellers with an active subscription.
275. The Online Orders Management Page displays a searchable, paginated list of all online orders placed for the seller's products; each order entry shows order ID, product thumbnail, product title, buyer name, buyer phone number, delivery address, order date, order status, and total amount (₹ INR).
276. Tapping an order entry on the Online Orders Management Page navigates to a detailed Order Detail View.
277. Sellers can update the order status (Confirm Order, Mark as Shipped, Mark as Delivered, Cancel Order) from the Online Orders Management Page.
278. Sellers can enter delivery tracking information (tracking number, courier name) which is immediately visible to the buyer in the My Orders Page.
279. Sellers can view the buyer's delivery address and contact information in the Order Detail View.
280. Subscribed stores and their products are visually highlighted with a 「Premium」 or 「Subscribed」 badge across the All Stores Page, Search Results Page, Recently Listed section, Store Detail Page, and Following Page.
281. Products from subscribed stores display a 「Buy Now」 button on product cards (Search Results Page, Favorites Page) and the Product Detail Page.
282. Non-subscribed stores' products do not display a 「Buy Now」 button and cannot be purchased online.
283. On the OTP Verification Page (Registration), the user can tap 「Resend OTP」 to receive a new OTP via email from BestOld (containing the BestOld logo and name); the expiry timer resets and the previously issued OTP is invalidated.
284. If the OTP entered on the OTP Verification Page (Registration) has expired, an inline error message is displayed and the user is prompted to request a new OTP.
285. If the OTP entered on the OTP Verification Page (Registration) is incorrect, an inline error message is displayed and the user can retry.
286. After successful OTP verification during registration, buyer accounts are immediately logged in and can access platform features; seller accounts enter Pending Approval state and see a pending message upon login.
287. User records in the Admin Panel User Management section display the registration method (Email or Google) for each user.
288. For users who registered via Google social login, the email field in the My Account Page is read-only and cannot be edited.
289. Users who registered via Google social login do not have a platform password and cannot use the forgot password flow; they must log in via Google.
290. The 「Forgot Password?」 link on the Login Page is available to all users, but only email-registered users can successfully complete the flow; Google-registered users receive an error message if they attempt to use it.
291. Google OAuth integration is functional and allows users to register and log in using their Google account.
292. Upon successful Google authentication, the user's Google account information (name, email, profile picture) is retrieved and used to create or authenticate the account.
293. Phone number is collected as an additional mandatory field after Google authentication completes.
294. The Privacy Policy page default content includes a section on Google OAuth integration and information sharing with Google.
295. The Terms & Conditions page default content includes a section on Google OAuth authentication and user obligations.
296. The Sell Your Phone form includes a mandatory Pickup Location field displayed as the first field, populated exclusively from admin-configured pickup locations.
297. If no pickup locations have been enabled by the admin, the Pickup Location dropdown displays an empty state and the form cannot be submitted.
298. A brief informational message is displayed above or below the Pickup Location dropdown on the Sell Your Phone form.
299. The selected pickup location is included in the form submission data sent to the admin's WhatsApp number and saved in the platform submission record.
300. The Admin Panel Sell Your Phone Form Management section includes a dedicated Pickup Location Management sub-section where the admin can enable or disable locations for phone pickup.
301. Only locations marked as enabled for Sell Your Phone pickup are displayed in the Pickup Location dropdown on the form.
302. Admin can toggle the pickup availability status for any location; changes take effect immediately.
303. The Pickup Location Management sub-section displays a searchable, paginated table listing all admin-managed locations with a toggle switch or checkbox for enabling/disabling each location.
304. A brief informational message is displayed at the top of the Pickup Location Management sub-section.
305. Each Sell Your Phone submission record in the Admin Panel displays the selected pickup location alongside other form data.
306. The submitter can view the full details of their original form submission (including the selected pickup location) within the Sell Your Phone Chat Page.
307. A Settings / About Page is accessible to all logged-in users (buyers and sellers) via a quick link in the My Account Page or a dedicated menu item in the account navigation.
308. The Settings / About Page displays a large, prominent preview of the current home screen icon at the top of the page with a label: 「This is how BestOld will appear on your home screen.」
309. The Settings / About Page displays a grid or list view of all available icon sizes, each showing the icon image, size label, and device usage description.
310. A 「Refresh Icon Preview」 button is displayed on the Settings / About Page; tapping it reloads the icon preview from the server and displays a brief confirmation message after a successful refresh.
311. The Settings / About Page includes an Icon Visibility Test section showing the current app icon rendered on multiple colored backgrounds (white, black, light gray, dark gray, primary brand color) with labels for each background.
312. The Settings / About Page includes a collapsible 「How to Update Your Icon」 section with step-by-step instructions for users who installed an old version and want to update to the latest icon.
313. A 「Reinstall App with Updated Icon」 button is displayed on the Settings / About Page; tapping it triggers the browser's native Add to Home Screen prompt (if supported) or displays a modal with manual installation instructions.
314. If the Add to Home Screen API is not supported by the browser, the 「Reinstall App with Updated Icon」 button displays a fallback message: 「Please use your browser's menu to add BestOld to your home screen.」
315. Every time a user views the Settings / About Page (with App Icon Preview), a view event is logged in the platform backend with user ID (if logged in), timestamp, and page view type.
316. The Admin Panel includes a dedicated 「App Icon Preview Analytics」 section in the sidebar navigation.
317. The App Icon Preview Analytics section displays total views (all time), views (last 30 days), views (last 7 days), a daily view trend chart, user breakdown by type and registration method, refresh button clicks, and reinstall button clicks.
318. All analytics data in the App Icon Preview Analytics section is updated in real time or with a short delay.
319. The admin can export the App Icon Preview Analytics data as a CSV file for further analysis.
320. The Admin Dashboard displays a summary statistic card showing total App Icon Preview views (last 30 days).

---

## 7. Out of Scope for This Release

- Push or email notifications for new messages, reviews, new listings from followed sellers, seller approval status changes, promotion expiry, subscription expiry, or order status updates.
- Mobile native application (iOS / Android).
- Multi-language support.
- Promotional or advertising features for sellers beyond the Popularise My Store feature and the subscription model (self-serve advertising banners are managed by admin only).
- Order tracking or shipping integration beyond manual tracking information entry by sellers.
- Footer display on mobile or tablet viewports.
- In-app storage or logging of Sell Your Phone form submissions beyond the platform submission record and chat.
- Reopening a closed Sell Your Phone chat session.
- Sell Your Phone chat notifications (push or email) for new messages.
- Role-based permission levels within the Admin Panel (all admin accounts have full access to all sections).
- Refund processing for cancelled or expired Popularise My Store promotions or subscription cancellations.
- Seller self-serve management of advertising banners (all advertising banners are managed by admin only).
- Promotion performance analytics or impression/click tracking for promoted stores.
- Subscription performance analytics or revenue tracking for subscribed stores.
- Multi-currency support or currency conversion.
- Automated payment verification for UPI transactions (all UPI payment verification and promotion/subscription activation is performed manually by the admin).
- Store social media links (YouTube, Facebook, Instagram) for seller stores — not configurable by sellers and not displayed to buyers or any other users.
- Share Store analytics or tracking of how many times a store link has been shared.
- Rate limiting or lockout mechanism for repeated failed OTP attempts.
- SMS-based OTP delivery (OTP is delivered via email only).
- Bulk email or marketing email campaigns via the configured SMTP settings.
- Map-based location browsing or visual map integration (location browsing is list/chip-based only).
- Neighbourhood-level or pincode-level location granularity (location scope is city/region level only, as managed by the admin).
- Reverse geocoding to a specific street address (GPS detection resolves to city/region level only, matched against the admin-managed location list).
- Automated third-party delivery system integration (delivery is managed manually by sellers via tracking information entry).
- Automated payment gateway integration for online orders (payment processing is handled via standard UPI/Card/Net Banking flows; no custom gateway integration in this release).
- Buyer-initiated order cancellation or return/refund flow (all order modifications are seller-initiated).
- Inventory management or stock tracking for products.
- Automated subscription renewal reminders or auto-renewal functionality.
- Social login via platforms other than Google (e.g., Facebook, Apple, Twitter).
- Two-factor authentication (2FA) for admin accounts.
- Account linking (merging email-registered and Google-registered accounts with the same email).
- OAuth token refresh or session management beyond standard Google OAuth flow.
- Admin-side management of Google OAuth client credentials (assumed to be configured at deployment).
- Dynamic pricing or location-based pricing for Sell Your Phone pickup service.
- Automated routing or assignment of Sell Your Phone submissions to specific admin users or teams.
- Pickup scheduling or calendar integration for Sell Your Phone submissions.
- Real-time pickup location availability status (e.g., temporarily unavailable due to capacity).
- Pickup location-specific pricing or service fees.
- Automated icon update notifications or push notifications when a new icon version is available.
- Icon version history or rollback functionality.
- A/B testing for different icon designs.
- User feedback collection on icon design or visibility.
- Icon preview for non-logged-in users (icon preview is only accessible to logged-in users via the Settings / About Page).
- Icon preview on the home page or other public-facing pages (icon preview is only available on the dedicated Settings / About Page).
- Automated icon generation or optimization tools within the Admin Panel.
- Icon preview for different device orientations (portrait vs. landscape).
- Icon preview for different operating systems or browser versions beyond the standard icon sizes.
