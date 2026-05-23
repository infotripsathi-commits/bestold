# Signup Fix Documentation

## Issue
Users were encountering "Database error saving new user" when trying to sign up.

## Root Cause
The database trigger function `handle_new_user()` was failing to insert profiles due to Row Level Security (RLS) policies. The trigger was running without proper permissions to bypass RLS checks.

## Solution Applied

### 1. Updated Trigger Function with SECURITY DEFINER
Modified the `handle_new_user()` function to run with `SECURITY DEFINER`, which allows it to execute with the function owner's privileges (typically postgres), bypassing RLS policies.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- Key fix: Run with elevated privileges
SET search_path = public
LANGUAGE plpgsql
```

### 2. Added Error Handling
Added exception handling to prevent user creation from failing even if profile creation encounters an issue:

```sql
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
```

### 3. First User Auto-Admin
Enhanced the function to automatically make the first registered user an admin:

```sql
-- Check if this is the first user
SELECT COUNT(*) INTO user_count FROM public.profiles;

IF user_count = 0 THEN
  user_role := 'admin';
ELSE
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'buyer');
END IF;
```

### 4. Granted Necessary Permissions
Ensured all necessary schema and table permissions are granted:

```sql
GRANT USAGE ON SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
```

## What Was Fixed

✅ **Profile Creation**: Trigger now successfully creates profiles for new users
✅ **RLS Bypass**: Function runs with elevated privileges to bypass RLS
✅ **Error Handling**: User creation won't fail even if profile creation has issues
✅ **First User Admin**: First registered user automatically becomes admin
✅ **Permissions**: All necessary database permissions granted

## Testing

To verify the fix works:

1. **New User Signup**:
   - Go to `/register`
   - Fill in all required fields (email, password, full name, phone number)
   - Select role (buyer or seller)
   - Click "Create Account"
   - Should successfully create account and redirect

2. **First User Check**:
   - If no users exist, first signup should create an admin user
   - Check profile role in database or admin panel

3. **Subsequent Users**:
   - Additional signups should create users with their selected role (buyer/seller)

## Database Changes

**Migration**: `fix_profile_creation_trigger.sql`
- Dropped and recreated `handle_new_user()` function with SECURITY DEFINER
- Added exception handling
- Granted necessary permissions

**Migration**: `ensure_first_user_is_admin.sql`
- Enhanced function to auto-promote first user to admin
- Maintains role selection for subsequent users

## Technical Details

### Why SECURITY DEFINER?
- Trigger functions run in the context of the trigger event
- During `AFTER INSERT ON auth.users`, the auth context may not be fully established
- RLS policies check `auth.uid()` which may not match during trigger execution
- SECURITY DEFINER allows the function to run with postgres privileges, bypassing RLS

### Why Exception Handling?
- Prevents user creation from failing if profile creation encounters unexpected issues
- Logs warnings for debugging while allowing auth.users record to be created
- User can still authenticate even if profile creation partially fails

### First User Admin Logic
- Counts existing profiles before inserting new one
- If count is 0, assigns 'admin' role regardless of signup selection
- Ensures platform always has at least one admin user

## Rollback (if needed)

If issues occur, you can rollback by removing SECURITY DEFINER:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
-- Remove SECURITY DEFINER
LANGUAGE plpgsql
AS $$
-- ... function body ...
$$;
```

However, this will reintroduce the original issue.

## Related Files

- `supabase/migrations/fix_profile_creation_trigger.sql` - Main fix
- `supabase/migrations/ensure_first_user_is_admin.sql` - First user admin logic
- `src/contexts/AuthContext.tsx` - Signup flow
- `src/pages/auth/RegisterPage.tsx` - Registration UI

## Future Improvements

Consider:
- Add retry logic in AuthContext if profile creation fails
- Implement profile creation verification after signup
- Add admin notification when first user is created
- Consider separate admin invitation system instead of auto-admin
