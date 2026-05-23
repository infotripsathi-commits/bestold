# Sell Your Phone Feature Documentation

## Overview
BestOld now includes a comprehensive "Sell Your Phone" feature that allows customers to submit their phone details with images, which are automatically sent to your WhatsApp number. All options (brands, models, conditions, age) are fully customizable through the admin panel.

## Features

### Customer-Facing
1. **Sell Phone Button**: Prominent button on homepage
2. **Easy Form**: Simple dialog form with all required fields
3. **Image Upload**: Upload front and back images of the phone
4. **WhatsApp Integration**: Automatically sends submission to your WhatsApp
5. **Contact Details**: Customers provide name, phone, and email

### Admin-Facing
1. **Brand Management**: Add, edit, delete, activate/deactivate phone brands
2. **Model Management**: Manage phone models for each brand
3. **Condition Management**: Customize condition options with descriptions
4. **Age Options Management**: Manage "how old" options
5. **WhatsApp Settings**: Configure WhatsApp number for receiving submissions
6. **Submission Tracking**: All submissions saved in database

## How It Works

### For Customers

1. **Click "Sell Your Phone" Button**
   - Located on homepage below search bar
   - Opens a dialog form

2. **Fill in Phone Details**
   - Select Brand (e.g., Apple, Samsung)
   - Select Model (e.g., iPhone 15 Pro) - models filtered by brand
   - Select Condition (e.g., Like New, Good, Fair, Poor)
   - Select Age (e.g., Less than 6 months, 1-2 years)

3. **Upload Images**
   - Front image: Clear photo of phone front
   - Back image: Clear photo of phone back
   - Max 5MB per image
   - Preview before upload

4. **Provide Contact Details**
   - Name (optional)
   - Phone Number (required)
   - Email (optional)

5. **Submit**
   - Images uploaded to Supabase Storage
   - Data saved to database
   - WhatsApp message automatically sent with all details
   - Success notification shown

### For Admin

#### Access Admin Panel
Navigate to **Admin Panel → Sell Phone** (`/admin/sell-phone`)

#### Manage Brands
1. Click **"Add Brand"** button
2. Enter brand name (e.g., "Apple")
3. Set display order (lower numbers appear first)
4. Toggle active/inactive
5. Click **"Create Brand"**

**Edit/Delete**: Use pencil or trash icons in the table

#### Manage Models
1. Click **"Add Model"** button
2. Select brand from dropdown
3. Enter model name (e.g., "iPhone 15 Pro")
4. Set display order
5. Toggle active/inactive
6. Click **"Create Model"**

**Note**: Models are filtered by brand in the customer form

#### Manage Conditions
1. Click **"Add Condition"** button
2. Enter condition name (e.g., "Like New")
3. Add description (e.g., "Excellent condition, no visible scratches")
4. Set display order
5. Toggle active/inactive
6. Click **"Create Condition"**

**Tip**: Descriptions help customers choose the right condition

#### Manage Age Options
1. Click **"Add Age Option"** button
2. Enter age range (e.g., "Less than 6 months")
3. Set display order
4. Toggle active/inactive
5. Click **"Create Age Option"**

#### Configure WhatsApp Settings
1. Go to **Settings** tab
2. Enter country code (e.g., "+91")
3. Enter WhatsApp number without country code (e.g., "8167865019")
4. Click **"Save Settings"**

**Full number example**: +918167865019

## WhatsApp Message Format

When a customer submits, you receive a WhatsApp message like this:

```
*New Phone Submission*

📱 *Phone Details:*
Brand: Apple
Model: iPhone 15 Pro
Condition: Like New
Age: Less than 6 months

👤 *Customer Details:*
Name: John Doe
Phone: +91 9876543210
Email: john@example.com

📸 *Images:*
Front: https://your-storage-url/front-image.jpg
Back: https://your-storage-url/back-image.jpg

Submitted at: 2026-03-24 10:30:45
```

## Database Structure

### Tables Created

**phone_brands**
- id, name, display_order, is_active, timestamps

**phone_models**
- id, brand_id, name, display_order, is_active, timestamps

**phone_conditions**
- id, name, description, display_order, is_active, timestamps

**phone_age_options**
- id, name, display_order, is_active, timestamps

**phone_submissions**
- id, user_id, brand_name, model_name, condition_name, age_name
- front_image_url, back_image_url
- customer_name, customer_phone, customer_email
- whatsapp_sent, created_at

### Default Data

**Brands** (10 pre-seeded):
- Apple, Samsung, Google, OnePlus, Xiaomi, Oppo, Vivo, Realme, Motorola, Nokia

**Conditions** (4 pre-seeded):
- Like New, Good, Fair, Poor

**Age Options** (5 pre-seeded):
- Less than 6 months
- 6 months - 1 year
- 1 - 2 years
- 2 - 3 years
- More than 3 years

## Customization Guide

### Adding New Brands
1. Go to Admin Panel → Sell Phone → Brands tab
2. Click "Add Brand"
3. Enter brand name (e.g., "Huawei")
4. Set display order (e.g., 110 to appear after Nokia)
5. Ensure "Active" is toggled on
6. Save

### Adding Models for a Brand
1. Go to Admin Panel → Sell Phone → Models tab
2. Click "Add Model"
3. Select brand (e.g., "Apple")
4. Enter model name (e.g., "iPhone 16 Pro Max")
5. Set display order
6. Save

**Tip**: Add popular models first with lower display orders

### Customizing Conditions
1. Go to Admin Panel → Sell Phone → Conditions tab
2. Edit existing conditions or add new ones
3. Update descriptions to match your grading standards
4. Reorder by changing display_order values

### Changing WhatsApp Number
1. Go to Admin Panel → Sell Phone → Settings tab
2. Update country code if needed
3. Update WhatsApp number
4. Click "Save Settings"
5. Test by submitting a phone

## Best Practices

### For Admins

1. **Keep Options Relevant**
   - Only activate brands you're interested in buying
   - Add models for popular phones in your market
   - Keep condition descriptions clear and specific

2. **Display Order Strategy**
   - Popular brands: 10, 20, 30...
   - Popular models: 10, 20, 30...
   - Conditions: Best to worst (10, 20, 30, 40)
   - Age: Newest to oldest (10, 20, 30...)

3. **Regular Updates**
   - Add new phone models as they release
   - Deactivate discontinued models instead of deleting
   - Update condition descriptions based on feedback

4. **WhatsApp Setup**
   - Use a business WhatsApp number
   - Enable notifications for instant alerts
   - Set up quick replies for common responses

### For Customers

1. **Image Quality**
   - Use good lighting
   - Show all sides clearly
   - Include any damage or scratches
   - Clean the phone before photos

2. **Accurate Information**
   - Select correct condition honestly
   - Provide working phone number
   - Double-check model selection

## Troubleshooting

### Images Not Uploading
- **Issue**: "Image size must be less than 5MB"
- **Solution**: Compress images before upload or use phone camera instead of high-res camera

### WhatsApp Not Opening
- **Issue**: WhatsApp link doesn't work
- **Solution**: 
  - Verify WhatsApp number in admin settings
  - Ensure WhatsApp is installed on device
  - Check country code is correct

### Models Not Showing
- **Issue**: Model dropdown is empty
- **Solution**:
  - Select a brand first
  - Verify brand has active models in admin panel
  - Check models are marked as active

### Submission Not Saved
- **Issue**: Form submits but data not saved
- **Solution**:
  - Check all required fields are filled
  - Verify both images are uploaded
  - Check browser console for errors

## API Functions

### Public API (Customer-Facing)
```typescript
// Get active brands
getPhoneBrands(): Promise<PhoneBrand[]>

// Get models for a brand
getPhoneModelsByBrand(brandId: string): Promise<PhoneModel[]>

// Get active conditions
getPhoneConditions(): Promise<PhoneCondition[]>

// Get active age options
getPhoneAgeOptions(): Promise<PhoneAgeOption[]>

// Submit phone details
createPhoneSubmission(submission: PhoneSubmissionData): Promise<PhoneSubmission>
```

### Admin API
```typescript
// Brands
getAllPhoneBrands(): Promise<PhoneBrand[]>
createPhoneBrand(brand: BrandData): Promise<PhoneBrand>
updatePhoneBrand(id: string, updates: Partial<PhoneBrand>): Promise<PhoneBrand>
deletePhoneBrand(id: string): Promise<void>

// Models
getAllPhoneModels(): Promise<PhoneModel[]>
createPhoneModel(model: ModelData): Promise<PhoneModel>
updatePhoneModel(id: string, updates: Partial<PhoneModel>): Promise<PhoneModel>
deletePhoneModel(id: string): Promise<void>

// Conditions
getAllPhoneConditions(): Promise<PhoneCondition[]>
createPhoneCondition(condition: ConditionData): Promise<PhoneCondition>
updatePhoneCondition(id: string, updates: Partial<PhoneCondition>): Promise<PhoneCondition>
deletePhoneCondition(id: string): Promise<void>

// Age Options
getAllPhoneAgeOptions(): Promise<PhoneAgeOption[]>
createPhoneAgeOption(option: AgeOptionData): Promise<PhoneAgeOption>
updatePhoneAgeOption(id: string, updates: Partial<PhoneAgeOption>): Promise<PhoneAgeOption>
deletePhoneAgeOption(id: string): Promise<void>

// Submissions
getAllPhoneSubmissions(): Promise<PhoneSubmission[]>
```

## Security & Privacy

- **RLS Policies**: Row Level Security enabled on all tables
- **Public Access**: Only active options visible to customers
- **Admin Only**: Full CRUD operations require admin role
- **Image Storage**: Images stored in Supabase Storage with public URLs
- **Data Retention**: All submissions saved for admin review
- **Anonymous Submissions**: Users don't need to be logged in

## Future Enhancements

Potential improvements:
- Price estimation based on phone details
- Email notifications to admin
- SMS notifications
- Submission status tracking (pending, reviewed, offer sent, accepted, rejected)
- Bulk import of brands/models from CSV
- Image quality validation
- Automatic price suggestions
- Customer submission history
- Admin dashboard with submission statistics
- Export submissions to Excel/CSV

## Support

For issues or questions:
- Check admin panel for correct configuration
- Verify WhatsApp number format
- Test with a sample submission
- Check browser console for errors
- Review database RLS policies
- Ensure Supabase Storage bucket exists
