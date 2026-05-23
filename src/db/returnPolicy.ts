import { supabase } from './supabase';

export interface ReturnPolicySettings {
  id: string;
  global_default_days: number;
  category_settings: Record<string, number>;
  seller_exceptions: Record<string, number>;
  product_exceptions: Record<string, number>;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CategorySetting {
  category: string;
  days: number;
}

export interface SellerException {
  seller_id: string;
  seller_name: string;
  seller_email: string;
  days: number;
}

export interface ProductException {
  product_id: string;
  product_name: string;
  days: number;
}

// Get return policy settings
export async function getReturnPolicySettings(): Promise<ReturnPolicySettings | null> {
  try {
    const { data, error } = await supabase
      .from('return_policy_settings')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get return policy settings:', error);
    return null;
  }
}

// Update return policy settings
export async function updateReturnPolicySettings(
  settings: Partial<ReturnPolicySettings>
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get existing settings ID
    const { data: existing } = await supabase
      .from('return_policy_settings')
      .select('id')
      .single();

    if (!existing) throw new Error('Settings not found');

    const { error } = await supabase
      .from('return_policy_settings')
      .update({
        ...settings,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update return policy settings:', error);
    return false;
  }
}

// Update global default days
export async function updateGlobalDefaultDays(days: number): Promise<boolean> {
  return updateReturnPolicySettings({ global_default_days: days });
}

// Update category settings
export async function updateCategorySettings(
  categorySettings: Record<string, number>
): Promise<boolean> {
  return updateReturnPolicySettings({ category_settings: categorySettings });
}

// Add/update seller exception
export async function updateSellerException(
  sellerId: string,
  days: number
): Promise<boolean> {
  try {
    const settings = await getReturnPolicySettings();
    if (!settings) return false;

    const updatedExceptions = {
      ...settings.seller_exceptions,
      [sellerId]: days,
    };

    return updateReturnPolicySettings({ seller_exceptions: updatedExceptions });
  } catch (error) {
    console.error('Failed to update seller exception:', error);
    return false;
  }
}

// Remove seller exception
export async function removeSellerException(sellerId: string): Promise<boolean> {
  try {
    const settings = await getReturnPolicySettings();
    if (!settings) return false;

    const updatedExceptions = { ...settings.seller_exceptions };
    delete updatedExceptions[sellerId];

    return updateReturnPolicySettings({ seller_exceptions: updatedExceptions });
  } catch (error) {
    console.error('Failed to remove seller exception:', error);
    return false;
  }
}

// Add/update product exception
export async function updateProductException(
  productId: string,
  days: number
): Promise<boolean> {
  try {
    const settings = await getReturnPolicySettings();
    if (!settings) return false;

    const updatedExceptions = {
      ...settings.product_exceptions,
      [productId]: days,
    };

    return updateReturnPolicySettings({ product_exceptions: updatedExceptions });
  } catch (error) {
    console.error('Failed to update product exception:', error);
    return false;
  }
}

// Remove product exception
export async function removeProductException(productId: string): Promise<boolean> {
  try {
    const settings = await getReturnPolicySettings();
    if (!settings) return false;

    const updatedExceptions = { ...settings.product_exceptions };
    delete updatedExceptions[productId];

    return updateReturnPolicySettings({ product_exceptions: updatedExceptions });
  } catch (error) {
    console.error('Failed to remove product exception:', error);
    return false;
  }
}

// Get applicable return period for a product
export async function getApplicableReturnPeriod(
  productId: string,
  sellerId: string,
  category: string
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_applicable_return_period', {
      p_product_id: productId,
      p_seller_id: sellerId,
      p_category: category,
    });

    if (error) throw error;
    return data || 7;
  } catch (error) {
    console.error('Failed to get applicable return period:', error);
    return 7; // Default fallback
  }
}

// Get all sellers for exception management
export async function getAllSellers(): Promise<{ id: string; full_name: string; email: string }[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'seller')
      .order('full_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get sellers:', error);
    return [];
  }
}

// Get all products for exception management
export async function getAllProducts(): Promise<{ id: string; name: string; category: string }[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, category')
      .order('name')
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get products:', error);
    return [];
  }
}

// Seller Performance Metrics and Dynamic Adjustments

export interface SellerPerformanceMetrics {
  id: string;
  seller_id: string;
  total_orders: number;
  total_returns: number;
  return_rate: number;
  avg_product_rating: number;
  account_age_days: number;
  performance_score: number;
  current_return_period: number;
  suggested_return_period: number;
  last_calculated_at: string;
}

export interface ReturnPeriodAdjustmentSuggestion {
  id: string;
  seller_id: string;
  seller?: {
    full_name: string;
    email: string;
  };
  current_return_period: number;
  suggested_return_period: number;
  adjustment_type: 'reduce' | 'increase' | 'maintain';
  reasoning: string;
  performance_metrics: {
    total_orders: number;
    return_rate: number;
    avg_rating: number;
    account_age_days: number;
    performance_score: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// Generate adjustment suggestions for all sellers
export async function generateAdjustmentSuggestions(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('generate_return_period_adjustment_suggestions');

    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Failed to generate adjustment suggestions:', error);
    return 0;
  }
}

// Get all adjustment suggestions
export async function getAdjustmentSuggestions(
  status?: 'pending' | 'approved' | 'rejected'
): Promise<ReturnPeriodAdjustmentSuggestion[]> {
  try {
    let query = supabase
      .from('return_period_adjustment_suggestions')
      .select('*, seller:profiles!return_period_adjustment_suggestions_seller_id_fkey(full_name, email)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get adjustment suggestions:', error);
    return [];
  }
}

// Approve adjustment suggestion
export async function approveAdjustmentSuggestion(suggestionId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get suggestion details
    const { data: suggestion, error: fetchError } = await supabase
      .from('return_period_adjustment_suggestions')
      .select('*')
      .eq('id', suggestionId)
      .single();

    if (fetchError) throw fetchError;
    if (!suggestion) throw new Error('Suggestion not found');

    // Update suggestion status
    const { error: updateError } = await supabase
      .from('return_period_adjustment_suggestions')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', suggestionId);

    if (updateError) throw updateError;

    // Apply the adjustment to seller exceptions
    const success = await updateSellerException(
      suggestion.seller_id,
      suggestion.suggested_return_period
    );

    return success;
  } catch (error) {
    console.error('Failed to approve adjustment suggestion:', error);
    return false;
  }
}

// Reject adjustment suggestion
export async function rejectAdjustmentSuggestion(suggestionId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('return_period_adjustment_suggestions')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', suggestionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to reject adjustment suggestion:', error);
    return false;
  }
}

// Bulk approve suggestions
export async function bulkApproveAdjustments(suggestionIds: string[]): Promise<number> {
  let successCount = 0;
  
  for (const id of suggestionIds) {
    const success = await approveAdjustmentSuggestion(id);
    if (success) successCount++;
  }
  
  return successCount;
}

// Bulk reject suggestions
export async function bulkRejectAdjustments(suggestionIds: string[]): Promise<number> {
  let successCount = 0;
  
  for (const id of suggestionIds) {
    const success = await rejectAdjustmentSuggestion(id);
    if (success) successCount++;
  }
  
  return successCount;
}

// Get seller performance metrics
export async function getSellerPerformanceMetrics(): Promise<SellerPerformanceMetrics[]> {
  try {
    const { data, error } = await supabase
      .from('seller_performance_metrics')
      .select('*')
      .order('performance_score', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get seller performance metrics:', error);
    return [];
  }
}
